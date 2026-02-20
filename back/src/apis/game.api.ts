import { FastifyPluginAsync } from 'fastify';
import { PongGame } from '../game/PongGame.js';
import { WebSocket } from '@fastify/websocket';
import jwt from 'jsonwebtoken';
import { gameSocketSchema } from '../schemas/game.schema.js';

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

		if (mode === 'local') {
			// --- MODO LOCAL (1 PC, 2 Manos) ---
			roomId = `room_${user.id}_LOCAL`;
			createRoom(roomId, scoreToWin, 'local'); // 'local' no es 'pvp' ni 'ai', pero PongGame lo aceptará si lo tipamos o ignoramos
			// En local, el usuario controla "ambos" lados técnicamente
			joinRoom(roomId, socket, 'both', user);
			startGame(roomId);
		}
		else if (mode === 'ai') {
			// --- MODO IA ---
			roomId = `room_${user.id}_AI`;
			createRoom(roomId, scoreToWin, 'ai');
			joinRoom(roomId, socket, 'left', user);
			startGame(roomId);
		}
		else {
			// --- MODO PVP (Remoto) ---
			if (waitingQueue.length > 0) {
				const opponent = waitingQueue.shift();
				if (opponent && opponent.socket.readyState === 1) {
					roomId = `room_${opponent.userId}_vs_${user.id}`;
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

		// 3. INPUTS
		socket.on('message', (rawData: any) => {
			const room = getRoomBySocket(socket);
			if (!room) return;
			try {
				const message = JSON.parse(rawData.toString());
				if (message.type === 'INPUT') {
					// SI ES LOCAL: Confiamos en la key que manda el front (LEFT_UP, RIGHT_DOWN)
					// SI ES REMOTO: Forzamos el lado del jugador

					if (room.game.gameMode === 'local' as any) { // Cast as any si TS se queja del string 'local'
						room.game.handleInput(message.key, message.action);
					} else {
						// Lógica remota segura
						const player = room.players.find(p => p.socket === socket);
						if (player) {
							const sidePrefix = player.side.toUpperCase();
							// Si el jugador es 'LEFT', y manda 'UP', queda 'LEFT_UP'
							const actionKey = `${sidePrefix}_${message.key}`;
							room.game.handleInput(actionKey, message.action);
						}
					}
				}
			} catch (e) { console.error(e); }
		});

		socket.on('close', () => {
			const idx = waitingQueue.findIndex(item => item.socket === socket);
			if (idx !== -1) waitingQueue.splice(idx, 1);
			const room = getRoomBySocket(socket);
			if (room) destroyRoom(room.id);
		});
	});

	// --- HELPER FUNCTIONS ---
	function createRoom(id: string, score: number, mode: 'pvp' | 'ai' | 'local') {
		const game = new PongGame();
		game.winningScore = score;
		game.gameMode = mode as any; // Cast para calmar a TS si PongGame solo espera pvp/ai
		rooms.set(id, { id, game, players: [], interval: null });
	}

	function joinRoom(roomId: string, socket: WebSocket, side: any, userData: { id: number, username: string }) {
		const room = rooms.get(roomId);
		if (room) {
			room.players.push({ id: userData.id, username: userData.username, socket, side });
			socket.send(JSON.stringify({ type: 'SIDE_ASSIGNED', side }));
		}
	}

	function startGame(roomId: string) {
		const room = rooms.get(roomId);
		if (!room) return;

		room.game.startGame(room.game.gameMode, room.game.winningScore);

		room.interval = setInterval(() => {
			if (room.game.gameMode === 'ai') (room.game as any).updateAi();
			(room.game as any).update();

			const state = room.game.state;
			const updateMsg = JSON.stringify({ type: 'UPDATE', state });

			room.players.forEach(p => {
				if (p.socket.readyState === 1) p.socket.send(updateMsg);
			});

			if (state.status === 'ended') {
				console.log(`Partida terminada sala ${roomId}`);
				// Clear the interval IMMEDIATELY to prevent it from running again
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