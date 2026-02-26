import { WebSocket } from '@fastify/websocket';
import * as userRepository from '../data-access/user.repository.js';

class ConnectionManager {

	private connections: Map<number, Set<WebSocket>> = new Map();

	async addUser(userId: number, socket: WebSocket, username: string) {
		if (!this.connections.has(userId)) {
			this.connections.set(userId, new Set());
			await userRepository.updateOnlineStatus(userId, true);
		}
		this.connections.get(userId)?.add(socket);
	}

	async removeUser(userId: number, socket: WebSocket) {
		const userSockets = this.connections.get(userId);
		if (userSockets) {
			userSockets.delete(socket);
			if (userSockets.size === 0) {
				this.connections.delete(userId);
				await userRepository.updateOnlineStatus(userId, false);
			}
		}
	}

	notifyUser(userId: number, type: string, payload: any) {
		const userSockets = this.connections.get(userId);

		if (!userSockets) {
			return;
		}

		if (userSockets.size === 0) {
			return;
		}

		const message = JSON.stringify({ type, payload });

		console.log(`📨 Sending ${type} to User ${userId}`);

		userSockets.forEach(socket => {
			if (socket.readyState === socket.OPEN) {
				socket.send(message);
			}
		});
	}
}

export const socketManager = new ConnectionManager();