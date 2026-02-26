import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

import { useAuth } from '@/context/AuthContext';

interface Notification {
	type: string;
	payload: any;
}

interface SocketContextType {
	socket: WebSocket | null;
	lastNotification: Notification | null;
	unreadCount: number;
	unreadMessages: number;
	markAsRead: () => void;
	markAsReadMessage: () => void;
}

const SocketContext = createContext<SocketContextType>({
	socket: null,
	lastNotification: null,
	unreadCount: 0,
	unreadMessages: 0,
	markAsRead: () => { },
	markAsReadMessage: () => { }
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const { user } = useAuth();

	// UI State
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [lastNotification, setLastNotification] = useState<Notification | null>(null);
	const [unreadCount, setUnreadCount] = useState(0);
	const [unreadMessages, setUnreadMessages] = useState(0);

	// Refs
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectTimeout = useRef<number | null>(null);

	const markAsRead = () => setUnreadCount(0);
	const markAsReadMessage = () => setUnreadMessages(0);

	// Función estable para conectar
	const connect = useCallback(() => {
		const token = localStorage.getItem('auth_token');
		//if (!token) return;

		// Evitar reconexiones si ya está abierto o conectando
		if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
			console.log("🔌 Socket already active or connecting. Skipping.");
			return;
		}

		if (socketRef.current) {
			socketRef.current.close();
		}

		// --- 🛠️ CAMBIO CLAVE: URL DINÁMICA ---
		// Calcula la IP automáticamente (localhost o 10.13.x.x)
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const host = window.location.hostname;
		const port = '3000';
		const wsUrl = `${protocol}//${host}:${port}/api/ws?token=${token}`;

		console.log(`🔌 Connecting to WebSocket at ${wsUrl}...`);
		const ws = new WebSocket(wsUrl);

		socketRef.current = ws;

		ws.onopen = () => {
			console.log("✅ WebSocket Connected");
			setSocket(ws);
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log(`MENSAJE RECIBIDO: ${data.type}`);
				setLastNotification(data);
				if (data.type === 'FRIEND_REQUEST')
					setUnreadCount(prev => prev + 1);
				if (data.type === 'NEW_MESSAGE')
					setUnreadMessages(prev => prev + 1);
			} catch (err) {
				console.error("WS Parse Error", err);
			}
		};

		ws.onclose = () => {
			console.log("❌ WebSocket Disconnected");
			if (socketRef.current === ws) {
				socketRef.current = null;
				setSocket(null);

				// Reintento solo si hay token
				if (localStorage.getItem('auth_token')) {
					reconnectTimeout.current = window.setTimeout(connect, 3000);
				}
			}
		};

	}, []);

	// Efecto principal: conecta al loguearse, desconecta al desloguearse
	useEffect(() => {
		if (user) {
			connect();
		} else {
			if (socketRef.current) {
				console.log("🔌 Closing socket due to logout");
				socketRef.current.close();
				socketRef.current = null;
				setSocket(null);
			}
			if (reconnectTimeout.current) {
				clearTimeout(reconnectTimeout.current);
			}
		}

		return () => {
			if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
		};
	}, [user, connect]);

	return (
		<SocketContext.Provider value={{ socket, lastNotification, unreadCount, markAsRead, markAsReadMessage, unreadMessages }}>
			{children}
		</SocketContext.Provider>
	);
};