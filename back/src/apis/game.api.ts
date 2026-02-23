import { FastifyPluginAsync } from 'fastify';
import { PongGame } from '../game/PongGame.js';
import { WebSocket } from '@fastify/websocket';
import jwt from 'jsonwebtoken';
import { gameSocketSchema } from '../schemas/game.schema.js';
import { pool } from '../../db/database.js';
import { socketManager } from '../websocket/connection-manager.js';

interface Player {
	id: number;
	username: string;
	socket: WebSocket;
	avatarUrl: string;
	side: 'left' | 'right' | 'spectator' | 'both'; // Añadimos 'both' para local
}

interface Room {
	id: string;
	game: PongGame;
	players: Player[];
	interval: NodeJS.Timeout | null;
	disconnectTimeout: NodeJS.Timeout | null;
	pauseTimeout: NodeJS.Timeout | null;
	pauseStartTime: number | null;
}

const gameRoutes: FastifyPluginAsync = async (fastify, opts) => {
	const rooms = new Map<string, Room>();
	const waitingQueue: { socket: WebSocket, score: number, userId: number, username: string, avatarUrl: string }[] = [];

	fastify.get('/', {
		websocket: true,
		schema: gameSocketSchema, // Documentamos el handshake del socket
		config: {
			rateLimit: false //Excluimos el juego del límite de peticiones
		}
	}, (connection: any, req: any) => {
		const socket = connection.socket || connection;

		// 1. AUTH
		const query = req.query as { mode?: string, score?: string, token?: string, roomId?: string }; // Añadimos roomId para desafíos futuros
		const token = query.token;

		if (!token) { socket.close(1008, "Token requerido"); return; }

		let user: { id: number, username: string, avatarUrl: string };
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret') as any;
			user = { id: decoded.id, username: decoded.username, avatarUrl: decoded.avatarUrl };
		} catch (e) { socket.close(1008, "Token inválido"); return; }

		// Leemos el modo. Si viene 'local', usaremos esa lógica.
		const mode = (query.mode === 'ai' || query.mode === 'local') ? query.mode : 'pvp';
		const scoreToWin = parseInt(query.score || '5', 10) || 5;

		console.log(`🔌 Conectado: ${user.username} -> Modo: ${mode}`);

		// 2. LOGICA DE SALAS
		let roomId = '';

		// --- GESTIÓN DE DOBLE-CONEXIÓN, ABANDONOS Y RECONEXIÓN ---
		const existingRoom = Array.from(rooms.values()).find(r =>
			r.game.state.status !== 'ended' &&
			r.players.some(p => p.id === user.id)
		);

		let shouldReconnect = false;
		if (existingRoom) {
			if (query.roomId && query.roomId === existingRoom.id) {
				// 1. Entra explícitamente a la MISMA partida (Click en la misma invitación o F5)
				shouldReconnect = true;
			} else if (!query.roomId && existingRoom.id.startsWith('room_') && !existingRoom.id.includes('LOCAL') && !existingRoom.id.includes('AI')) {
				// 2. Entra al 1v1 público y ya tenía un 1v1 público a medias
				shouldReconnect = true;
			}
		}

		// Si tenía sala pero NO cumple los requisitos de reconexión, significa que quiere jugar a otra cosa
		if (existingRoom && !shouldReconnect) {
			console.log(`🏃 ${user.username} abandona la sala ${existingRoom.id} para iniciar una nueva.`);
			const survivor = existingRoom.players.find(p => p.id !== user.id);
			if (survivor && survivor.socket.readyState === 1) {
				existingRoom.game.stopGame(survivor.side as 'left' | 'right');
				survivor.socket.send(JSON.stringify({ type: 'UPDATE', state: existingRoom.game.state }));
			}
			destroyRoom(existingRoom.id);
		}

		if (existingRoom && shouldReconnect) {
			console.log(`🔄 Reconexión/Toma de control: ${user.username} vuelve a ${existingRoom.id}`);
			roomId = existingRoom.id;

			if (existingRoom.disconnectTimeout) {
				clearTimeout(existingRoom.disconnectTimeout);
				existingRoom.disconnectTimeout = null;
			}

			const playerIndex = existingRoom.players.findIndex(p => p.id === user.id);
			const playerSide = existingRoom.players[playerIndex].side;

			// Pisamos el socket fantasma si existía
			const oldSocket = existingRoom.players[playerIndex].socket;
			if (oldSocket && oldSocket !== socket && oldSocket.readyState === 1) {
				oldSocket.close(1000, 'Replaced by new connection');
			}
			existingRoom.players[playerIndex].socket = socket;

			// Limpiar teclas atascadas
			if (playerSide === 'left') existingRoom.game.inputs.left = { up: false, down: false };
			if (playerSide === 'right') existingRoom.game.inputs.right = { up: false, down: false };

			const currentStatus = existingRoom.pauseTimeout ? 'paused' : 'playing';
			let pauseTimeLeft = 30;
			if (existingRoom.pauseTimeout && existingRoom.pauseStartTime) {
				const elapsed = Math.floor((Date.now() - existingRoom.pauseStartTime) / 1000);
				pauseTimeLeft = Math.max(0, 30 - elapsed);
			}
			const playersData = getRoomPlayersData(existingRoom);
			socket.send(JSON.stringify({ type: 'SIDE_ASSIGNED', side: playerSide, roomId: existingRoom.id, status: currentStatus, playersData }));

			const connectedOpponent = existingRoom.players.find(p => p.id !== user.id && p.socket.readyState === 1);

			if (connectedOpponent) {
				// Avisamos al rival mandándole también el status
				const playersData = getRoomPlayersData(existingRoom);
				connectedOpponent.socket.send(JSON.stringify({ type: 'OPPONENT_RECONNECTED', message: '¡El rival ha vuelto!', status: currentStatus, playersData }));

				// Si había pausa táctica, NO reanudamos. Si no, cuenta atrás normal.
				if (existingRoom.pauseTimeout) {
					socket.send(JSON.stringify({ type: 'STATUS', message: 'La partida sigue en pausa táctica.' }));
				} else {
					socket.send(JSON.stringify({ type: 'STATUS', message: 'Reanudando partida...' }));
					setTimeout(() => { existingRoom.game.resumeGame(); }, 3000);
				}
			} else {
				socket.send(JSON.stringify({ type: 'STATUS', message: 'Esperando a que tu rival se reconecte...' }));
				socket.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED', message: 'El rival está desconectado.' }));

				existingRoom.disconnectTimeout = setTimeout(() => {
					console.log(`💀 Fin del tiempo de gracia en sala ${existingRoom.id}.`);
					(async () => {
					try {
						const searchString = `%"id":"${roomId}"%`;
						const [msgRows]: any = await pool.execute(
							`SELECT * FROM messages WHERE type = 'game_invite' AND content LIKE ? LIMIT 1`,
							[searchString]
						);

						if (msgRows.length > 0) {
							const inviteMsg = msgRows[0];
							const finalResult = `${existingRoom.game.state.paddleLeft.score} - ${existingRoom.game.state.paddleRight.score}`;
							console.log(`scoreeeeee: ${finalResult}`);
							const newContent = JSON.stringify({ id: roomId, status: 'finished', result: finalResult });

							await pool.execute(
								`UPDATE messages SET content = ? WHERE id = ?`,
								[newContent, inviteMsg.id]
							);

							const updatedMessage = { ...inviteMsg, content: newContent };
							existingRoom.players.forEach(p => {
								socketManager.notifyUser(p.id, 'INVITE_UPDATED', updatedMessage);
							});
						}
					} catch (err) {
						console.error("Error actualizando invitación de chat:", err);
					}
				})();
					existingRoom.game.stopGame(playerSide as 'left' | 'right');
					socket.send(JSON.stringify({ type: 'UPDATE', state: existingRoom.game.state }));
					destroyRoom(existingRoom.id);
				}, 15000);
			}
		}
		// --- FIN INTENTO RECONEXIÓN ---

		else if (mode === 'local') {
			roomId = `room_${user.id}_LOCAL_${Date.now()}`;
			createRoom(roomId, scoreToWin, 'local');
			joinRoom(roomId, socket, 'both', user);
			startGame(roomId);
		}
		else if (mode === 'ai') {
			roomId = `room_${user.id}_AI_${Date.now()}`;
			createRoom(roomId, scoreToWin, 'ai');
			joinRoom(roomId, socket, 'left', user);
			startGame(roomId);
		}
		else {
			// --- MODO PVP (Remoto) ---
			if (query.roomId && !query.roomId.startsWith('room_')) {
				// 1. ES UN DESAFÍO DIRECTO (Amigo del Chat)
				roomId = query.roomId;
				const directRoom = rooms.get(roomId);

				if (directRoom) {
					if (directRoom.players.length === 1) {
						// ¡Llega el invitado! Entra y arrancamos el juego
						joinRoom(roomId, socket, 'right', user);
						startGame(roomId);
					} else {
						socket.send(JSON.stringify({ type: 'STATUS', message: 'La partida ya está llena o terminada.' }));
					}
				} else {
					// Soy el anfitrión, creo la sala y espero
					createRoom(roomId, scoreToWin, 'pvp');
					joinRoom(roomId, socket, 'left', user);
					socket.send(JSON.stringify({ type: 'STATUS', message: 'Esperando a tu rival...' }));
				}
			} else {
				// 2. ES MATCHMAKING ALEATORIO (Cola pública)
				const existingQueueIndex = waitingQueue.findIndex(item => item.userId === user.id);
				if (existingQueueIndex !== -1) {
					waitingQueue[existingQueueIndex].socket.close(1000, 'Replaced');
					waitingQueue.splice(existingQueueIndex, 1);
				}

				if (waitingQueue.length > 0) {
					const opponent = waitingQueue.shift();
					if (opponent && opponent.socket.readyState === 1) {
						roomId = `room_${opponent.userId}_vs_${user.id}_${Date.now()}`;
						createRoom(roomId, scoreToWin, 'pvp');
						joinRoom(roomId, opponent.socket, 'left', { id: opponent.userId, username: opponent.username, avatarUrl: opponent.avatarUrl });
						joinRoom(roomId, socket, 'right', user);
						startGame(roomId);
					} else {
						waitingQueue.push({ socket, score: scoreToWin, userId: user.id, username: user.username, avatarUrl: user.avatarUrl });
						socket.send(JSON.stringify({ type: 'STATUS', message: 'Esperando oponente...' }));
					}
				} else {
					waitingQueue.push({ socket, score: scoreToWin, userId: user.id, username: user.username, avatarUrl: user.avatarUrl });
					socket.send(JSON.stringify({ type: 'STATUS', message: 'Buscando partida...' }));
				}
			}
		}

		// 3. INPUTS
		socket.on('message', (rawData: any) => {
			const room = getRoomBySocket(socket);
			if (!room) return;
			try {
				const message = JSON.parse(rawData.toString());
				if (message.type === 'PAUSE') {
					if (room.game.gameMode === 'local' as any || room.game.gameMode === 'ai') {
						if (room.game.state.status === 'playing') room.game.pauseGame();
						else if (room.game.state.status === 'paused') room.game.resumeGame();
					} else {
						// --- MODO PVP ---
						const player = room.players.find(p => p.socket === socket);
						if (!player) return;

						if (room.game.state.status === 'playing') {
							// 1. Intentar pausar
							if (room.game.state.pauses[player.side as 'left' | 'right'] > 0) {
								room.game.state.pauses[player.side as 'left' | 'right']--;
								room.game.state.pausedBy = player.side as 'left' | 'right';
								room.game.pauseGame();
								room.pauseStartTime = Date.now();

								// Avisamos a todos
								room.players.forEach(p => p.socket.send(JSON.stringify({
									type: 'STATUS',
									message: `⏸️ Pausa táctica de ${player.username} (Máx 30s)`
								})));

								// Arrancamos el cronómetro de 30 segundos
								room.pauseTimeout = setTimeout(() => {
									if (room.game.state.status === 'paused') {
										room.game.state.pausedBy = null;
										room.game.resumeGame();
										room.pauseTimeout = null;
										room.pauseStartTime = null;
										room.players.forEach(p => p.socket.send(JSON.stringify({ type: 'STATUS', message: 'Reanudando partida...'})));
									}
								}, 30000);
							} else {
								// Si ya gastó su pausa, le avisamos solo a él
								socket.send(JSON.stringify({ type: 'STATUS', message: '❌ Ya has gastado tu pausa.' }));
							}
						} else if (room.game.state.status === 'paused' && room.game.state.pausedBy === player.side) {
							// 2. Quitar tu propia pausa antes de tiempo
							if (room.pauseTimeout) {
								clearTimeout(room.pauseTimeout);
								room.pauseTimeout = null;
								room.pauseStartTime = null;
							}
							room.game.state.pausedBy = null;
							room.game.resumeGame();
							room.players.forEach(p => p.socket.send(JSON.stringify({ type: 'STATUS', message: 'Reanudando partida...' })));
						}
					}
					return;
				}

				if (message.type === 'INPUT') {
					if (room.game.gameMode === 'local' as any) {
						room.game.handleInput(message.key, message.action);
					} else {
						const player = room.players.find(p => p.socket === socket);
						if (player) {
							const actionKey = `${player.side.toUpperCase()}_${message.key}`;
							room.game.handleInput(actionKey, message.action);
						}
					}
				}
			} catch (e) { console.error(e); }
		});

		socket.on('close', () => {
			const idx = waitingQueue.findIndex(item => item.socket === socket);
			if (idx !== -1) {
				waitingQueue.splice(idx, 1);
				return;
			}

			const room = getRoomBySocket(socket);
			if (!room || room.game.state.status === 'ended') return;

			console.log(`⚠️ Jugador desconectado de la sala ${room.id}`);

			if (room.game.gameMode === 'local' as any || room.game.gameMode === 'ai') {
				destroyRoom(room.id);
				return;
			}

			room.game.pauseGame();

			const survivor = room.players.find(p => p.socket !== socket && p.socket.readyState === 1);
			if (survivor) {
				survivor.socket.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED', message: 'El rival se ha desconectado. Esperando reconexión (15s)...' }));
			}

			if (!room.disconnectTimeout) {
				room.disconnectTimeout = setTimeout(() => {
					console.log(`💀 Fin del tiempo de gracia en sala ${room.id}.`);
					const connectedPlayer = room.players.find(p => p.socket.readyState === 1);
					if (connectedPlayer) {
						room.game.stopGame(connectedPlayer.side as 'left' | 'right');
						connectedPlayer.socket.send(JSON.stringify({ type: 'UPDATE', state: room.game.state }));
					} else {
						room.game.stopGame();
					}
					room.game.state.status = 'ended';
					destroyRoom(room.id);
				}, 15000);
			}
		});
	});

	// --- HELPER FUNCTIONS ---
	function createRoom(id: string, score: number, mode: 'pvp' | 'ai' | 'local') {
		const game = new PongGame();
		game.winningScore = score;
		game.gameMode = mode as any;
		rooms.set(id, { id, game, players: [], interval: null, disconnectTimeout: null, pauseTimeout: null, pauseStartTime: null });
	}

	function joinRoom(roomId: string, socket: WebSocket, side: any, userData: { id: number, username: string, avatarUrl: string }) {
		const room = rooms.get(roomId);
		if (room) {
			room.players.push({ id: userData.id, username: userData.username, avatarUrl: userData.avatarUrl, socket, side });
			// ❌ QUITAMOS el envío de SIDE_ASSIGNED de aquí para evitar que empiece la cuenta atrás prematura
		}
	}

	// Construye los perfiles dependiendo del modo de juego
	function getRoomPlayersData(room: Room) {
		let leftName = 'Player 1', leftAvatar = '';
		let rightName = 'Player 2', rightAvatar = '';

		if (room.game.gameMode === 'local' as any) {
			const p = room.players[0];
			leftName = `${p.username} (P1)`; leftAvatar = p.avatarUrl;
			rightName = `${p.username} (P2)`; rightAvatar = p.avatarUrl;
		} else if (room.game.gameMode === 'ai') {
			const p = room.players[0];
			leftName = p.username; leftAvatar = p.avatarUrl;
			rightName = 'Skynet 🤖'; rightAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=skynet';
		} else {
			const pLeft = room.players.find(p => p.side === 'left');
			const pRight = room.players.find(p => p.side === 'right');
			if (pLeft) { leftName = pLeft.username; leftAvatar = pLeft.avatarUrl; }
			if (pRight) { rightName = pRight.username; rightAvatar = pRight.avatarUrl; }
		}

		return {
			left: { username: leftName, avatarUrl: leftAvatar },
			right: { username: rightName, avatarUrl: rightAvatar }
		};
	}

	function startGame(roomId: string) {
		const room = rooms.get(roomId);
		if (!room) return;
		const playersData = getRoomPlayersData(room);

		// 1. Mandamos SIDE_ASSIGNED a ambos a la vez 
		room.players.forEach(p => {
			if (p.socket.readyState === 1) {
				// Aquí sí metemos el status: 'playing' para que el Front no se líe
				p.socket.send(JSON.stringify({ type: 'SIDE_ASSIGNED', side: p.side, roomId: room.id, status: 'playing', playersData }));
			}
		});

		room.game.startGame(room.game.gameMode, room.game.winningScore);

		// 2. Bucle de físicas (60 FPS)
		room.interval = setInterval(() => {
			const state = room.game.state;
			let currentPauseTimeLeft: number | undefined = undefined;
			if (state.status === 'paused' && room.pauseStartTime) {
				const elapsed = Math.floor((Date.now() - room.pauseStartTime) / 1000);
				currentPauseTimeLeft = Math.max(0, 30 - elapsed);
			}
			const updateMsg = JSON.stringify({ type: 'UPDATE', state, pauseTimeLeft: currentPauseTimeLeft });

			room.players.forEach(p => {
				if (p.socket.readyState === 1) {
					p.socket.send(updateMsg);
				}
			});

			if (state.status === 'ended') {
				console.log(`Partida terminada sala ${roomId}`);
				(async () => {
					try {
						const searchString = `%"id":"${roomId}"%`;
						const [msgRows]: any = await pool.execute(
							`SELECT * FROM messages WHERE type = 'game_invite' AND content LIKE ? LIMIT 1`,
							[searchString]
						);

						if (msgRows.length > 0) {
							const inviteMsg = msgRows[0];
							const finalResult = `${state.paddleLeft.score} - ${state.paddleRight.score}`;
							console.log(`scoreeeeee: ${finalResult}`);
							const newContent = JSON.stringify({ id: roomId, status: 'finished', result: finalResult });

							await pool.execute(
								`UPDATE messages SET content = ? WHERE id = ?`,
								[newContent, inviteMsg.id]
							);

							const updatedMessage = { ...inviteMsg, content: newContent };
							room.players.forEach(p => {
								socketManager.notifyUser(p.id, 'INVITE_UPDATED', updatedMessage);
							});
						}
					} catch (err) {
						console.error("Error actualizando invitación de chat:", err);
					}
				})();

				if (room.interval) {
					clearInterval(room.interval);
					room.interval = null;
				}
				destroyRoom(roomId);
				return;
			}
		}, 1000 / 60);
	}

	function destroyRoom(roomId: string) {
		const room = rooms.get(roomId);
		if (room) {
			if (room.interval) clearInterval(room.interval);
			rooms.delete(roomId);
		}
	}

	function getRoomBySocket(socket: WebSocket): Room | undefined {
		for (const room of rooms.values()) {
			if (room.players.some(p => p.socket === socket)) return room;
		}
		return undefined;
	}
};

export default gameRoutes;