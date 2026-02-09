import { FastifyPluginAsync } from 'fastify';
import { socketManager } from '../websocket/connection-manager.js';
import { handleChatMessage } from '../websocket/chat.handler.js';

interface QueryParams {
	token: string;
}

const wsRoutes: FastifyPluginAsync = async (fastify, opts) => {

	fastify.get('/', { websocket: true }, (connection, req) => {
		// 🛡️ BLINDAJE: Detectamos qué es 'connection' exactamente
		// A veces llega como SocketStream ({ socket: ... }) y a veces como WebSocket directo
		const socket = (connection as any).socket || connection;

		const { token } = req.query as QueryParams;

		if (!token) {
			socket.close(1008, 'Token required');
			return;
		}

		try {
			// 1. Validamos el token
			const decoded: any = fastify.jwt.verify(token);
			const userId = decoded.id;
			const username = decoded.username;

			// 2. Registramos en la Centralita (Usamos la variable 'socket' que hemos detectado)
			socketManager.addUser(userId, socket, username);

			// 3. Manejo de cierre
			socket.on('close', () => {
				socketManager.removeUser(userId, socket);
			});

			// 4. Pong
			socket.on('message', async (rawMsg: any) => {
				const msgString = rawMsg.toString();

				// A. Mantener el Ping-Pong para que no se caiga la conexión
				if (msgString === 'ping') {
					socket.send('pong');
					return;
				}

				// B. Procesar Eventos Complejos (JSON)
				try {
					const data = JSON.parse(msgString);

					// Aquí actúa como un Router: ¿Qué quieres hacer?
					switch (data.type) {
						case 'SEND_MESSAGE':
							// Delegamos la lógica dura al handler que creamos antes
							// payload debe tener: { dmId, content, type }
							await handleChatMessage(userId, data.payload);
							break;

						// Aquí añadiremos más casos en el futuro:
						// case 'GAME_INVITE': ...
						// case 'BLOCK_USER': ...

						default:
							console.warn(`Event type unknown: ${data.type}`);
					}

				} catch (error) {
					console.error("WS Parse Error or Logic Error:", error);
					// No cerramos el socket por un error de parsing, solo lo logueamos
				}
			});

		} catch (error) {
			console.error("WS Auth Error:", error);
			// Usamos 'socket' aquí también para evitar el segundo crash del log
			if (socket && socket.close) {
				socket.close(1008, 'Invalid Token');
			}
		}
	});
};

export default wsRoutes;