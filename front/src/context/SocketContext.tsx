import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

// Tipos de notificaciones
interface Notification {
	type: string;
	payload: any;
}

interface SocketContextType {
	socket: WebSocket | null;
	lastNotification: Notification | null; // Lo usaremos para reaccionar en componentes
}

//para que no se joda la conexion al cambiar entre paginas
const SocketContext = createContext<SocketContextType>({ socket: null, lastNotification: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [lastNotification, setLastNotification] = useState<Notification | null>(null);
	const reconnectTimeout = useRef<number | null>(null);

	// Función para conectar
	const connect = () => {
		const token = localStorage.getItem('auth_token'); // O localStorage según decidimos
		if (!token)
			return;

		// Evitar dobles conexiones
		if (socket && socket.readyState === WebSocket.OPEN)
			return;

		console.log("🔌 Connecting to WebSocket...");
		const ws = new WebSocket(`ws://localhost:3000/api/ws?token=${token}`);

		ws.onopen = () => {
			console.log("✅ WebSocket Connected");
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log("🔔 Notification received:", data);
				setLastNotification(data);

				// Hack: Limpiar la notificacion tras 1ms para permitir recibir otra igual
				// Opcional, depende de cómo lo consumas.
			} catch (err) {
				console.error("WS Parse Error", err);
			}
		};

		ws.onclose = () => {
			console.log("❌ WebSocket Disconnected");
			setSocket(null);
			// Reintento básico de conexión si sigue logueado
			if (localStorage.getItem('auth_token')) {
				reconnectTimeout.current = setTimeout(connect, 3000);
			}
		};

		setSocket(ws);
	};

	// Efecto de montaje
	useEffect(() => {
		connect();

		return () => {
			if (socket)
				socket.close();
			if (reconnectTimeout.current)
				clearTimeout(reconnectTimeout.current);
		};
	}, []); // Dependencia vacía para cargar al inicio. Podrías poner [user] si tienes el user en otro context.

	return (
		<SocketContext.Provider value={{ socket, lastNotification }}>
			{children}
		</SocketContext.Provider>
	);
};