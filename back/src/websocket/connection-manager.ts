import { WebSocket } from '@fastify/websocket';

class ConnectionManager {
    // Usamos un Set por si el usuario tiene 3 pestañas abiertas (3 sockets)
    private connections: Map<number, Set<WebSocket>> = new Map();

    /**
     * Registra un usuario conectado
     */
    addUser(userId: number, socket: WebSocket) {
        if (!this.connections.has(userId)) {
            this.connections.set(userId, new Set());
        }
        this.connections.get(userId)?.add(socket);
        
        console.log(`🔌 User ${userId} connected. Total sockets: ${this.connections.get(userId)?.size}`);
    }

    /**
     * Elimina un socket cuando se desconecta
     */
    removeUser(userId: number, socket: WebSocket) {
        const userSockets = this.connections.get(userId);
        if (userSockets) {
            userSockets.delete(socket);
            if (userSockets.size === 0) {
                this.connections.delete(userId);
                console.log(`❌ User ${userId} disconnected completely.`);
            }
        }
    }

    /**
     * Envía una notificación a un usuario específico
     */
    notifyUser(userId: number, type: string, payload: any) {
        const userSockets = this.connections.get(userId);
        
        if (!userSockets || userSockets.size === 0) {
            console.log(`📭 User ${userId} is offline. Notification saved/dropped.`);
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