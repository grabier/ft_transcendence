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
	side: 'left' | 'right' | 'spectator' | 'both';
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
		schema: gameSocketSchema,
		config: {
			rateLimit: false
		}
	}, (connection: any, req: any) => {
		const socket = connection.socket || connection;

		const query = req.query as { mode?: string, score?: string, token?: string, roomId?: string };
		const token = query.token;
		const mode = (query.mode === 'ai' || query.mode === 'local') ? query.mode : 'pvp';
		const scoreToWin = parseInt(query.score || '5', 10) || 5;

		if (!token) { socket.close(1008, "Token requerido"); return; }

		let user: { id: number, username: string, avatarUrl: string };
		if (token === 'GUEST' && (mode === 'local' || mode === 'ai')) {
			user = {
				id: -(Math.floor(Math.random() * 1000000) + 1),
				username: `Guest_${Math.floor(Math.random() * 1000)}`,
				avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'
			};
		} else {
			try {
				const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret') as any;
				user = { id: decoded.id, username: decoded.username, avatarUrl: decoded.avatarUrl };
			} catch (e) {
				socket.close(1008, "Invalid token or login required to play online");
				return;
			}
		}

		let roomId = '';
		const existingRoom = Array.from(rooms.values()).find(r =>
			r.game.state.status !== 'ended' &&
			r.players.some(p => p.id === user.id)
		);

		let shouldReconnect = false;
		if (existingRoom) {
			if (query.roomId && query.roomId === existingRoom.id) {
				shouldReconnect = true;
			} else if (!query.roomId && existingRoom.id.startsWith('room_') && !existingRoom.id.includes('LOCAL') && !existingRoom.id.includes('AI')) {
				shouldReconnect = true;
			}
		}

		if (existingRoom && !shouldReconnect) {
			const survivor = existingRoom.players.find(p => p.id !== user.id);
			if (survivor && survivor.socket.readyState === 1) {
				existingRoom.game.stopGame(survivor.side as 'left' | 'right');
				survivor.socket.send(JSON.stringify({ type: 'UPDATE', state: existingRoom.game.state }));
			}
			destroyRoom(existingRoom.id);
		}

		if (existingRoom && shouldReconnect) {
			roomId = existingRoom.id;

			if (existingRoom.disconnectTimeout) {
				clearTimeout(existingRoom.disconnectTimeout);
				existingRoom.disconnectTimeout = null;
			}

			const playerIndex = existingRoom.players.findIndex(p => p.id === user.id);
			const playerSide = existingRoom.players[playerIndex].side;

			const oldSocket = existingRoom.players[playerIndex].socket;
			if (oldSocket && oldSocket !== socket && oldSocket.readyState === 1) {
				oldSocket.close(1000, 'Replaced by new connection');
			}
			existingRoom.players[playerIndex].socket = socket;

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

			if (existingRoom.game.gameMode === 'local' as any || existingRoom.game.gameMode === 'ai') {
				existingRoom.game.state.status = 'countdown' as any;
				setTimeout(() => {
					existingRoom.game.state.status = 'playing';
					(existingRoom.game as any).lastTime = Date.now();
				}, 3500);
			} else {
				const connectedOpponent = existingRoom.players.find(p => p.id !== user.id && p.socket.readyState === 1);

				if (connectedOpponent) {
					connectedOpponent.socket.send(JSON.stringify({ type: 'OPPONENT_RECONNECTED', message: 'Rival is back', status: currentStatus, playersData }));

					if (existingRoom.pauseTimeout) {
						socket.send(JSON.stringify({ type: 'STATUS', message: 'Match in tactical pause' }));
					} else {
						socket.send(JSON.stringify({ type: 'STATUS', message: 'Loading match...' }));
						existingRoom.game.state.status = 'countdown' as any;
						setTimeout(() => {
							existingRoom.game.state.status = 'playing';
							(existingRoom.game as any).lastTime = Date.now();
						}, 3500);
					}
				} else {
					socket.send(JSON.stringify({ type: 'STATUS', message: 'Waiting for your oponent to reconnect...' }));
					socket.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED', message: 'Rival disconnected' }));

					existingRoom.disconnectTimeout = setTimeout(() => {
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
								console.error("Error loading invitation:", err);
							}
						})();
						existingRoom.game.stopGame(playerSide as 'left' | 'right');
						socket.send(JSON.stringify({ type: 'UPDATE', state: existingRoom.game.state }));
						destroyRoom(existingRoom.id);
					}, 15000);
				}
			}
		}

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
			if (query.roomId && !query.roomId.startsWith('room_')) {
				roomId = query.roomId;
				const directRoom = rooms.get(roomId);

				if (directRoom) {
					if (directRoom.players.length === 1) {
						joinRoom(roomId, socket, 'right', user);
						startGame(roomId);
					} else {
						socket.send(JSON.stringify({ type: 'STATUS', message: 'Match already full or finished' }));
					}
				} else {
					createRoom(roomId, scoreToWin, 'pvp');
					joinRoom(roomId, socket, 'left', user);
					socket.send(JSON.stringify({ type: 'STATUS', message: 'Waiting for rival...' }));
				}
			} else {
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
						socket.send(JSON.stringify({ type: 'STATUS', message: 'Waiting oponnent...' }));
					}
				} else {
					waitingQueue.push({ socket, score: scoreToWin, userId: user.id, username: user.username, avatarUrl: user.avatarUrl });
					socket.send(JSON.stringify({ type: 'STATUS', message: 'Searching match...' }));
				}
			}
		}

		socket.on('message', (rawData: any) => {
			const room = getRoomBySocket(socket);
			if (!room) return;
			try {
				const message = JSON.parse(rawData.toString());
				if (message.type === 'SURRENDER') {
					if (room.game.gameMode === 'pvp') {
						const player = room.players.find(p => p.socket === socket);
						if (player && room.game.state.status !== 'ended') {
							const winnerSide = player.side === 'left' ? 'right' : 'left';

							if (winnerSide === 'left') {
								room.game.state.paddleLeft.score = room.game.winningScore;
							} else {
								room.game.state.paddleRight.score = room.game.winningScore;
							}
							const updateMsg = JSON.stringify({ type: 'UPDATE', state: room.game.state });
							room.players.forEach(p => {
								if (p.socket.readyState === 1) p.socket.send(updateMsg);
							});

							room.game.stopGame(winnerSide);
						}
					}
					return;
				}
				if (message.type === 'PAUSE') {
					if (room.game.gameMode === 'local' as any || room.game.gameMode === 'ai') {
						if (room.game.state.status === 'playing') room.game.pauseGame();
						else if (room.game.state.status === 'paused') room.game.resumeGame();
					} else {
						const player = room.players.find(p => p.socket === socket);
						if (!player) return;

						if (room.game.state.status === 'playing') {
							if (room.game.state.pauses[player.side as 'left' | 'right'] > 0) {
								room.game.state.pauses[player.side as 'left' | 'right']--;
								room.game.state.pausedBy = player.side as 'left' | 'right';
								room.game.pauseGame();
								room.pauseStartTime = Date.now();

								room.players.forEach(p => p.socket.send(JSON.stringify({
									type: 'STATUS',
									message: `⏸️ Tactical pause from ${player.username} (Max 30s)`
								})));

								room.pauseTimeout = setTimeout(() => {
									if (room.game.state.status === 'paused') {
										room.game.state.pausedBy = null;
										room.game.resumeGame();
										room.pauseTimeout = null;
										room.pauseStartTime = null;
										room.players.forEach(p => p.socket.send(JSON.stringify({ type: 'STATUS', message: 'Reanudando partida...' })));
									}
								}, 30000);
							} else {
								socket.send(JSON.stringify({ type: 'STATUS', message: '❌ Youre out of pauses.' }));
							}
						} else if (room.game.state.status === 'paused' && room.game.state.pausedBy === player.side) {
							if (room.pauseTimeout) {
								clearTimeout(room.pauseTimeout);
								room.pauseTimeout = null;
								room.pauseStartTime = null;
							}
							room.game.state.pausedBy = null;
							room.game.resumeGame();
							room.players.forEach(p => p.socket.send(JSON.stringify({ type: 'STATUS', message: 'Loading match...' })));
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

			if (room.game.gameMode === 'local' as any || room.game.gameMode === 'ai') {
				room.game.pauseGame();
				if (!room.disconnectTimeout) {
					room.disconnectTimeout = setTimeout(() => {
						destroyRoom(room.id);
					}, 15000);
				}
				return;
			}

			room.game.pauseGame();

			const survivor = room.players.find(p => p.socket !== socket && p.socket.readyState === 1);
			if (survivor) {
				survivor.socket.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED', message: 'Rival disconnected, waiting for reconnection (15s)...' }));
			}

			if (!room.disconnectTimeout) {
				room.disconnectTimeout = setTimeout(() => {
					(async () => {
						try {
							const searchString = `%"id":"${roomId}"%`;
							const [msgRows]: any = await pool.execute(
								`SELECT * FROM messages WHERE type = 'game_invite' AND content LIKE ? LIMIT 1`,
								[searchString]
							);

							if (msgRows.length > 0) {
								const inviteMsg = msgRows[0];
								const finalResult = `${room.game.state.paddleLeft.score} - ${room.game.state.paddleRight.score}`;
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
							console.error("Error fetching chat invite", err);
						}
					})();
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
		}
	}

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
		room.players.forEach(p => {
			if (p.socket.readyState === 1) {
				p.socket.send(JSON.stringify({ type: 'SIDE_ASSIGNED', side: p.side, roomId: room.id, status: 'playing', playersData }));
			}
		});

		room.game.startGame(room.game.gameMode, room.game.winningScore);

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
						console.error("Error loading chat invite:", err);
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