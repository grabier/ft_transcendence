import { FastifyPluginAsync } from 'fastify';
import { socketManager } from '../websocket/connection-manager.js';

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
			socket.on('message', (msg: any) => {
				if (msg.toString() === 'ping') socket.send('pong');
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