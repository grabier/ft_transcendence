import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
	type: string;
	payload: any;
}

interface SocketContextType {
	socket: WebSocket | null;
	lastNotification: Notification | null;
	unreadCount: number;
	markAsRead: () => void;
}

const SocketContext = createContext<SocketContextType>({
	socket: null,
	lastNotification: null,
	unreadCount: 0,
	markAsRead: () => { }
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const { user } = useAuth();

	// UI State (lo que usa React para pintar)
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [lastNotification, setLastNotification] = useState<Notification | null>(null);
	const [unreadCount, setUnreadCount] = useState(0);

	// Refs (Control interno para romper el bucle)
	// Usamos esto para saber SIEMPRE el estado real sin esperar al re-render de React
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectTimeout = useRef<number | null>(null);

	const markAsRead = () => setUnreadCount(0);

	// Función estable (No depende de 'socket' estado, sino de 'socketRef')
	const connect = useCallback(() => {
		const token = localStorage.getItem('auth_token');
		if (!token) return;

		// 🛑 PREVENCIÓN DE BUCLE:
		// Si ya existe y está Conectando (0) o Abierto (1), no hagas nada.
		if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
			console.log("🔌 Socket already active or connecting. Skipping.");
			return;
		}

		if (socketRef.current) {
			// Si hay uno viejo cerrado o cerrándose, lo limpiamos bien antes
			socketRef.current.close();
		}

		console.log("🔌 Connecting to WebSocket...");
		const ws = new WebSocket(`ws://localhost:3000/api/ws?token=${token}`);

		// Asignamos inmediatamente a la referencia
		socketRef.current = ws;

		ws.onopen = () => {
			console.log("✅ WebSocket Connected");
			setSocket(ws); // Actualizamos estado para la UI
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log(`MENSAJE RECIBIDO: ${data.message}`);
				setLastNotification(data);
				setUnreadCount(prev => prev + 1);
			} catch (err) {
				console.error("WS Parse Error", err);
			}
		};

		ws.onclose = () => {
			console.log("❌ WebSocket Disconnected");
			// Solo limpiamos si es EL MISMO socket (evita condiciones de carrera)
			if (socketRef.current === ws) {
				socketRef.current = null;
				setSocket(null);

				// Reintento solo si hay token
				if (localStorage.getItem('auth_token')) {
					reconnectTimeout.current = setTimeout(connect, 3000);
				}
			}
		};

	}, []);

	useEffect(() => {
		if (user) {
			connect();
		} else {
			// Logout: Cerrar socket limpiamente
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

		// Cleanup al desmontar el componente (cerrar pestaña)
		return () => {
			if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
			// Opcional: Cerrar socket aquí si quieres desconexión agresiva al salir de la página
		};
	}, [user, connect]); //necesitamos actualizar la conexion si user cambia, o si la conexxion se jode por lo que sea

	return (
		<SocketContext.Provider value={{ socket, lastNotification, unreadCount, markAsRead }}>
			{children}
		</SocketContext.Provider>
	);
};