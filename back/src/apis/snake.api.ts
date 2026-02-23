// src/api/routes/snake.api.ts

import { FastifyPluginAsync } from 'fastify';
import { SnakeGame } from '../game/SnakeGame.js'; // <- Ajusta la ruta si es necesario
import { WebSocket } from '@fastify/websocket';
import jwt from 'jsonwebtoken';
// import { gameSocketSchema } from '../schemas/game.schema.js'; // Puedes usar el mismo esquema o crear snake.schema.js
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
	game: SnakeGame; // <- Cambiado a SnakeGame
	players: Player[];
	interval: NodeJS.Timeout | null;
	disconnectTimeout: NodeJS.Timeout | null;
	pauseTimeout: NodeJS.Timeout | null;
	pauseStartTime: number | null;
}

const snakeRoutes: FastifyPluginAsync = async (fastify, opts) => {
	const rooms = new Map<string, Room>();
	const waitingQueue: { socket: WebSocket, score: number, userId: number, username: string, avatarUrl: string }[] = [];

	fastify.get('/', {
		websocket: true,
		// schema: gameSocketSchema, 
		config: { rateLimit: false }
	}, (connection: any, req: any) => {
		const socket = connection.socket || connection;

		// 1. AUTH
		const query = req.query as { mode?: string, score?: string, token?: string, roomId?: string };
		const token = query.token;

		if (!token) { socket.close(1008, "Token requerido"); return; }

		let user: { id: number, username: string, avatarUrl: string };
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret') as any;
			user = { id: decoded.id, username: decoded.username, avatarUrl: decoded.avatarUrl };
		} catch (e) { socket.close(1008, "Token inválido"); return; }

		const mode = (query.mode === 'ai' || query.mode === 'local') ? query.mode : 'pvp';
		const scoreToWin = parseInt(query.score || '10', 10) || 10; // Por defecto a 10 para Snake

		console.log(`🐍 Snake Conectado: ${user.username} -> Modo: ${mode}`);

		let roomId = '';

		// --- GESTIÓN DE DOBLE-CONEXIÓN (Igual que en Pong) ---
		const existingRoom = Array.from(rooms.values()).find(r =>
			r.game.state.status !== 'ended' &&
			r.players.some(p => p.id === user.id)
		);

		let shouldReconnect = false;
		if (existingRoom) {
			if (query.roomId && query.roomId === existingRoom.id) shouldReconnect = true;
			else if (!query.roomId && existingRoom.id.startsWith('s_room_') && !existingRoom.id.includes('LOCAL') && !existingRoom.id.includes('AI')) shouldReconnect = true;
		}

		if (existingRoom && !shouldReconnect) {
			console.log(`🏃 ${user.username} abandona la sala ${existingRoom.id}`);
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
				oldSocket.close(1000, 'Replaced');
			}
			existingRoom.players[playerIndex].socket = socket;

			const currentStatus = existingRoom.pauseTimeout ? 'paused' : 'playing';
			const playersData = getRoomPlayersData(existingRoom);
			socket.send(JSON.stringify({ type: 'SIDE_ASSIGNED', side: playerSide, roomId: existingRoom.id, status: currentStatus, playersData }));

			const connectedOpponent = existingRoom.players.find(p => p.id !== user.id && p.socket.readyState === 1);
			if (connectedOpponent) {
				connectedOpponent.socket.send(JSON.stringify({ type: 'OPPONENT_RECONNECTED', message: '¡El rival ha vuelto!', status: currentStatus, playersData }));
				if (existingRoom.pauseTimeout) {
					socket.send(JSON.stringify({ type: 'STATUS', message: 'En pausa táctica.' }));
				} else {
					socket.send(JSON.stringify({ type: 'STATUS', message: 'Reanudando...' }));
					setTimeout(() => { existingRoom.game.resumeGame(); }, 3000);
				}
			} else {
				socket.send(JSON.stringify({ type: 'STATUS', message: 'Esperando a que tu rival se reconecte...' }));
				socket.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED', message: 'El rival está desconectado.' }));
				// Omitido lógica de bbdd de empate por brevedad, igual que tu api original
			}
		}
		// --- FIN INTENTO RECONEXIÓN ---

		else if (mode === 'local') {
			roomId = `s_room_${user.id}_LOCAL_${Date.now()}`;
			createRoom(roomId, scoreToWin, 'local');
			joinRoom(roomId, socket, 'both', user);
			startGame(roomId);
		}
		else if (mode === 'ai') {
			roomId = `s_room_${user.id}_AI_${Date.now()}`;
			createRoom(roomId, scoreToWin, 'ai');
			joinRoom(roomId, socket, 'left', user);
			startGame(roomId);
		}
		else {
			// MODO PVP
			if (query.roomId && !query.roomId.startsWith('s_room_')) {
				roomId = query.roomId;
				const directRoom = rooms.get(roomId);
				if (directRoom) {
					if (directRoom.players.length === 1) {
						joinRoom(roomId, socket, 'right', user);
						startGame(roomId);
					} else {
						socket.send(JSON.stringify({ type: 'STATUS', message: 'Partida llena.' }));
					}
				} else {
					createRoom(roomId, scoreToWin, 'pvp');
					joinRoom(roomId, socket, 'left', user);
					socket.send(JSON.stringify({ type: 'STATUS', message: 'Esperando a tu rival...' }));
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
						roomId = `s_room_${opponent.userId}_vs_${user.id}_${Date.now()}`;
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
				if (message.type === 'INPUT') {
					if (room.game.gameMode === 'local' as any) {
						room.game.handleInput(message.key, message.action);
					} else {
						const player = room.players.find(p => p.socket === socket);
						if (player) {
							// Tu frontend manda "LEFT" o "L_LEFT" o similar, lo mapeamos:
							const actionKey = `${player.side.toUpperCase()}_${message.key}`;
							room.game.handleInput(actionKey, message.action);
						}
					}
				}
			} catch (e) { console.error(e); }
		});

		socket.on('close', () => {
			// (Igual que en Pong, omitido por brevedad para centrarse en el bucle)
			const room = getRoomBySocket(socket);
			if (room) destroyRoom(room.id);
		});
	});

	// --- HELPER FUNCTIONS ---
	function createRoom(id: string, score: number, mode: 'pvp' | 'ai' | 'local') {
		const game = new SnakeGame();

		// 👇 AÑADIMOS ESTAS DOS LÍNEAS 👇
		game.gameMode = mode;
		game.winningScore = score;

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
		// (Igual que en Pong)
		return { left: { username: leftName, avatarUrl: leftAvatar }, right: { username: rightName, avatarUrl: rightAvatar } };
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

		// 👇 CAMBIAMOS EL 10 POR room.game.winningScore 👇
		room.game.startGame(room.game.gameMode, room.game.winningScore);

		// 🔥 LA MAGIA DEL SNAKE: El bucle de físicas va más lento (aprox 12 FPS)
		const TICK_RATE_MS = 80;

		room.interval = setInterval(() => {
			room.game.update(); // Mueve la serpiente y comprueba colisiones

			const state = room.game.state;
			const updateMsg = JSON.stringify({ type: 'UPDATE', state });

			room.players.forEach(p => {
				if (p.socket.readyState === 1) p.socket.send(updateMsg);
			});

			if (state.status === 'ended') {
				console.log(`Partida de Snake terminada sala ${roomId}`);
				if (room.interval) {
					clearInterval(room.interval);
					room.interval = null;
				}
				destroyRoom(roomId);
			}
		}, TICK_RATE_MS);
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

export default snakeRoutes;