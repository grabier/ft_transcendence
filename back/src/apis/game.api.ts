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
	side: 'left' | 'right' | 'spectator' | 'both'; // Añadimos 'both' para local
}

interface Room {
	id: string;
	game: PongGame;
	players: Player[];
	interval: NodeJS.Timeout | null;
	disconnectTimeout: NodeJS.Timeout | null;
}

const gameRoutes: FastifyPluginAsync = async (fastify, opts) => {
	const rooms = new Map<string, Room>();
	const waitingQueue: { socket: WebSocket, score: number, userId: number, username: string }[] = [];

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

		let user: { id: number, username: string };
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret') as any;
			user = { id: decoded.id, username: decoded.username };
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

			socket.send(JSON.stringify({ type: 'SIDE_ASSIGNED', side: playerSide, roomId: existingRoom.id }));
			const connectedOpponent = existingRoom.players.find(p => p.id !== user.id && p.socket.readyState === 1);

			if (connectedOpponent) {
				connectedOpponent.socket.send(JSON.stringify({ type: 'OPPONENT_RECONNECTED', message: '¡El rival ha vuelto!' }));
				socket.send(JSON.stringify({ type: 'STATUS', message: 'Reanudando partida...' }));
				setTimeout(() => { existingRoom.game.resumeGame(); }, 3000);
			} else {
				socket.send(JSON.stringify({ type: 'STATUS', message: 'Esperando a que tu rival se reconecte...' }));
				socket.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED', message: 'El rival está desconectado.' }));

				existingRoom.disconnectTimeout = setTimeout(() => {
					console.log(`💀 Fin del tiempo de gracia en sala ${existingRoom.id}.`);
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
						joinRoom(roomId, opponent.socket, 'left', { id: opponent.userId, username: opponent.username });
						joinRoom(roomId, socket, 'right', user);
						startGame(roomId);
					} else {
						waitingQueue.push({ socket, score: scoreToWin, userId: user.id, username: user.username });
						socket.send(JSON.stringify({ type: 'STATUS', message: 'Esperando oponente...' }));
					}
				} else {
					waitingQueue.push({ socket, score: scoreToWin, userId: user.id, username: user.username });
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
		rooms.set(id, { id, game, players: [], interval: null, disconnectTimeout: null });
	}

	function joinRoom(roomId: string, socket: WebSocket, side: any, userData: { id: number, username: string }) {
		const room = rooms.get(roomId);
		if (room) {
			room.players.push({ id: userData.id, username: userData.username, socket, side });
			// ❌ QUITAMOS el envío de SIDE_ASSIGNED de aquí para evitar que empiece la cuenta atrás prematura
		}
	}

	function startGame(roomId: string) {
		const room = rooms.get(roomId);
		if (!room) return;

		// ✅ NUEVO: Mandamos SIDE_ASSIGNED a ambos a la vez, justo cuando la sala está llena.
		// Esto sincroniza la cuenta atrás en los dos ordenadores al milisegundo.
		room.players.forEach(p => {
			if (p.socket.readyState === 1) {
				p.socket.send(JSON.stringify({ type: 'SIDE_ASSIGNED', side: p.side, roomId: room.id }));
			}
		});

		room.game.startGame(room.game.gameMode, room.game.winningScore);

		room.interval = setInterval(() => {
			const state = room.game.state;
			const updateMsg = JSON.stringify({ type: 'UPDATE', state });

			room.players.forEach(p => {
				if (p.socket.readyState === 1) p.socket.send(updateMsg);
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