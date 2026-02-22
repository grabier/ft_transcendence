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

		const existingRoom = Array.from(rooms.values()).find(r => 
			r.players.some(p => p.id === user.id) && r.disconnectTimeout !== null
		);

		if (existingRoom) {
			console.log(`🔄 Reconexión exitosa: ${user.username} vuelve a ${existingRoom.id}`);
			roomId = existingRoom.id; // Guardamos el ID para no romper el resto del código
			
			// Cancelamos la cuenta atrás de la muerte
			clearTimeout(existingRoom.disconnectTimeout!);
			existingRoom.disconnectTimeout = null;

			// Actualizamos el socket del jugador con el nuevo
			const playerIndex = existingRoom.players.findIndex(p => p.id === user.id);
			const playerSide = existingRoom.players[playerIndex].side;
			existingRoom.players[playerIndex].socket = socket;

			// ¡SÚPER IMPORTANTE! Limpiar teclas atascadas de cuando se desconectó
			if (playerSide === 'left') existingRoom.game.inputs.left = { up: false, down: false };
			if (playerSide === 'right') existingRoom.game.inputs.right = { up: false, down: false };

			// Le recordamos su lado
			socket.send(JSON.stringify({ type: 'SIDE_ASSIGNED', side: playerSide }));

			// Avisamos al rival de que ha vuelto
			const survivor = existingRoom.players.find(p => p.id !== user.id);
			if (survivor && survivor.socket.readyState === 1) {
				survivor.socket.send(JSON.stringify({ type: 'OPPONENT_RECONNECTED' }));
			}

			// Reanudamos la física a los 3 segundos (Para cuadrar con el 3, 2, 1, GO del Frontend)
			setTimeout(() => {
				existingRoom.game.resumeGame();
			}, 3000);
		}
		// --- FIN INTENTO RECONEXIÓN ---

		else if (mode === 'local') {
			// --- MODO LOCAL (1 PC, 2 Manos) ---
			roomId = `room_${user.id}_LOCAL`;
			createRoom(roomId, scoreToWin, 'local');
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
			// 1. Si estaba en la cola de espera, lo sacamos
			const idx = waitingQueue.findIndex(item => item.socket === socket);
			if (idx !== -1) {
				waitingQueue.splice(idx, 1);
				return;
			}

			// 2. Si estaba en una partida...
			const room = getRoomBySocket(socket);
			if (!room || room.game.state.status === 'ended') return;

			console.log(`⚠️ Jugador desconectado de la sala ${room.id}`);

			// Si es modo local o IA, destruimos la sala directamente (no hay a quien esperar)
			if (room.game.gameMode === 'local' as any || room.game.gameMode === 'ai') {
				destroyRoom(room.id);
				return;
			}

			// 3. MODO PVP: Iniciamos protocolo de gracia
			room.game.pauseGame(); // Congelamos la física
			
			// Avisamos al jugador que se ha quedado (el superviviente)
			const survivor = room.players.find(p => p.socket !== socket && p.socket.readyState === 1);
			if (survivor) {
				survivor.socket.send(JSON.stringify({ 
					type: 'OPPONENT_DISCONNECTED', 
					message: 'El rival se ha desconectado. Esperando reconexión (15s)...' 
				}));
			}

			// 4. Iniciar la cuenta atrás de la muerte (15 segundos)
			room.disconnectTimeout = setTimeout(() => {
				console.log(`💀 Fin del tiempo de gracia en sala ${room.id}. Gana el superviviente.`);
				
				// El que se fue pierde
				const disconnectedPlayer = room.players.find(p => p.socket === socket);
				if (disconnectedPlayer && survivor) {
					room.game.stopGame(survivor.side as 'left' | 'right');
					// Mandamos una última actualización para que el front vea el "WINS"
					survivor.socket.send(JSON.stringify({ type: 'UPDATE', state: room.game.state }));
				}
				
				destroyRoom(room.id);
			}, 15000); // 15 segundos
		});
	});

	// --- HELPER FUNCTIONS ---
	function createRoom(id: string, score: number, mode: 'pvp' | 'ai' | 'local') {
		const game = new PongGame();
		game.winningScore = score;
		game.gameMode = mode as any; // Cast para calmar a TS si PongGame solo espera pvp/ai
		rooms.set(id, { id, game, players: [], interval: null, disconnectTimeout: null });
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