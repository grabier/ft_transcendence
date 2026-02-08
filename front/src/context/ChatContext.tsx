import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { DM, Message } from '../types/chat';

interface ChatContextType {
	chats: DM[];
	activeChat: DM | null;
	messages: Message[];
	isLoading: boolean;
	selectChat: (targetUserId: number, targetUser?: any) => Promise<void>; // Actualizado
	sendMessage: (content: string, type?: 'text' | 'game_invite') => void;
	closeChat: () => void;
	refreshChats: () => void; // Para recargar la lista manual
}

const ChatContext = createContext<ChatContextType>({} as any);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
	const { socket } = useSocket();
	const { user } = useAuth();
	// 🛠️ FIX: Leemos el token directamente del almacén
	const token = localStorage.getItem('auth_token');

	const [chats, setChats] = useState<DM[]>([]);
	const [activeChat, setActiveChat] = useState<DM | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// 1. CARGAR LISTA DE CHATS (SIDEBAR)
	const fetchChats = useCallback(async () => {
		if (!token) return;
		try {
			const res = await fetch('http://localhost:3000/api/chat/me', { // Crearemos esto ahora
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok) {
				const data = await res.json();
				setChats(data);
			}
		} catch (error) {
			console.error("Error loading chats:", error);
		}
	}, [token]);

	// Cargar al inicio
	useEffect(() => {
		fetchChats();
	}, [fetchChats]);

	// 2. ABRIR UN CHAT
	// targetUser es opcional: si venimos de la lista de amigos, ya tenemos sus datos
	const selectChat = useCallback(async (targetUserId: number, targetUserData?: any) => {
		if (!token) return;
		setIsLoading(true);
		try {
			// A. Obtener ID del Chat
			const res = await fetch('http://localhost:3000/api/chat/dm', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
				body: JSON.stringify({ targetUserId })
			});
			const data = await res.json();

			if (!data.dmId) throw new Error("No DM ID returned");

			// B. Cargar historial
			const msgsRes = await fetch(`http://localhost:3000/api/chat/${data.dmId}/messages?limit=50`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const msgsData = await msgsRes.json();

			// C. Construir objeto DM activo
			const chatInfo = chats.find(c => c.id === data.dmId);
			let otherUser = chatInfo?.otherUser;

			// Si no estaba en la lista (chat nuevo), usamos los datos que nos pasan
			if (!otherUser && targetUserData) {
				otherUser = targetUserData;
			} else if (!otherUser) {
				// Fallback feo si no tenemos datos
				otherUser = { id: targetUserId, username: `User ${targetUserId}`, avatar_url: '' };
			}

			const activeDM: DM = {
				id: data.dmId,
				otherUser: otherUser!
			};

			setActiveChat(activeDM);
			setMessages(msgsData);

			// Recargamos la lista por si era un chat nuevo que ahora debe aparecer
			if (data.isNew) fetchChats();

		} catch (error) {
			console.error("Error opening chat:", error);
		} finally {
			setIsLoading(false);
		}
	}, [token, chats, fetchChats]);

	// 3. ENVIAR MENSAJE
	const sendMessage = useCallback((content: string, type: 'text' | 'game_invite' = 'text') => {
		if (!socket || !activeChat) return;

		const payload = {
			type: 'SEND_MESSAGE',
			payload: {
				dmId: activeChat.id,
				content,
				type
			}
		};
		socket.send(JSON.stringify(payload));
	}, [socket, activeChat]);

	// 4. ESCUCHAR MENSAJES (Sockets)
	useEffect(() => {
		if (!socket) return;

		const handleSocketMessage = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);

				if (data.type === 'NEW_MESSAGE' || data.type === 'MESSAGE_SENT_OK') {
					const newMsg = data.payload as Message;

					// Si tengo este chat abierto, lo pinto
					if (activeChat && newMsg.dm_id === activeChat.id) {
						setMessages(prev => [...prev, newMsg]);
					}

					// SIEMPRE actualizamos la lista lateral para poner el "Último mensaje"
					fetchChats();
				}
			} catch (e) { }
		};

		socket.addEventListener('message', handleSocketMessage);
		return () => socket.removeEventListener('message', handleSocketMessage);
	}, [socket, activeChat, fetchChats]);

	const closeChat = () => setActiveChat(null);

	return (
		<ChatContext.Provider value={{ chats, activeChat, messages, isLoading, selectChat, sendMessage, closeChat, refreshChats: fetchChats }}>
			{children}
		</ChatContext.Provider>
	);
};