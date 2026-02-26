import { FastifyPluginAsync } from 'fastify';
import { socketManager } from '../websocket/connection-manager.js';
import { handleChatMessage, handleTyping, handleMarkAsRead } from '../websocket/chat.handler.js';
import { mainSocketSchema } from '../schemas/ws.schema.js';

interface QueryParams {
	token: string;
}

const wsRoutes: FastifyPluginAsync = async (fastify, opts) => {

	fastify.get('/', {
		websocket: true,
		schema: mainSocketSchema,
		config: {
			rateLimit: false
		}
	}, (connection, req) => {
		const socket = (connection as any).socket || connection;

		const { token } = req.query as QueryParams;

		if (!token) {
			socket.close(1008, 'Token required');
			return;
		}

		try {
			const decoded: any = fastify.jwt.verify(token);
			const userId = parseInt(String(decoded.id), 10);
			const username = decoded.username;
			socketManager.addUser(userId, socket, username);

			socket.on('close', () => {
				socketManager.removeUser(userId, socket);
			});

			socket.on('message', async (rawMsg: any) => {
				const msgString = rawMsg.toString();

				if (msgString === 'ping') {
					socket.send('pong');
					return;
				}
				try {
					const data = JSON.parse(msgString);

					switch (data.type) {
						case 'SEND_MESSAGE':
							await handleChatMessage(userId, data.payload);
							break;

						case 'TYPING':
							await handleTyping(userId, data.payload);
							break;
							
						case 'MARK_AS_READ':
							await handleMarkAsRead(userId, data.payload);
							break;

						default:
							console.warn(`Event type unknown: ${data.type}`);
					}

				} catch (error) {
					console.error("WS Parse Error or Logic Error:", error);
				}
			});

		} catch (error) {
			console.error("WS Auth Error:", error);
			if (socket && socket.close) {
				socket.close(1008, 'Invalid Token');
			}
		}
	});
};

export default wsRoutes;