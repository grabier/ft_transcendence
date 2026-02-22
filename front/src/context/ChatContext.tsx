import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

import { DM, Message } from '@/types/chat';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

const PROTOCOL = window.location.protocol;
const HOST = window.location.hostname;
const PORT = '3000';
const BASE_URL = `${PROTOCOL}//${HOST}:${PORT}`;// http://10.13.1.5:3000


interface ChatContextType {
	chats: DM[];
	activeChat: DM | null;
	messages: Message[];
	isLoading: boolean;
	selectChat: (targetUserId: number, targetUser?: any) => Promise<void>;
	sendMessage: (content: string, points: number, type?: 'text' | 'game_invite') => void;
	closeChat: () => void;
	refreshChats: () => void;
	typingChats: Record<number, boolean>;
	sendTyping: () => void;
	markAsRead: (dmId: number) => void;
}

const ChatContext = createContext<ChatContextType>({} as any);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
	const { socket } = useSocket();
	const { user } = useAuth();
	const token = localStorage.getItem('auth_token');
	const [chats, setChats] = useState<DM[]>([]);
	const [activeChat, setActiveChat] = useState<DM | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [typingChats, setTypingChats] = useState<Record<number, boolean>>({});
	const typingTimeouts = useRef<Record<number, NodeJS.Timeout>>({});

	const activeChatRef = useRef<DM | null>(null);
	useEffect(() => {
		activeChatRef.current = activeChat;
	}, [activeChat]);

	const sendTyping = useCallback(() => {
		if (!socket || !activeChat) return;
		socket.send(JSON.stringify({ type: 'TYPING', payload: { dmId: activeChat.id } }));
	}, [socket, activeChat]);

	const markAsRead = useCallback((dmId: number) => {
		if (!socket) return;
		socket.send(JSON.stringify({ type: 'MARK_AS_READ', payload: { dmId } }));

		// Actualización optimista: marcamos como leídos los que recibí yo
		setMessages(prev => prev.map(m => m.sender_id !== user?.id ? { ...m, is_read: true } : m));
	}, [socket, user]);

	// 1. CARGAR LISTA DE CHATS (SIDEBAR)
	const fetchChats = useCallback(async () => {
		if (!token)
			return;
		try {
			const res = await fetch(`${BASE_URL}/api/chat/me`, {
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
	}, [fetchChats, messages]);

	// 2. ABRIR UN CHAT
	// targetUser es opcional: si venimos de la lista de amigos, ya tenemos sus datos
	const selectChat = useCallback(async (targetUserId: number, targetUserData?: any) => {
		if (!token) return;
		setIsLoading(true);
		try {
			// A. Obtener ID del Chat
			const res = await fetch(`${BASE_URL}/api/chat/dm`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
				body: JSON.stringify({ targetUserId })
			});
			const data = await res.json();

			if (!data.dmId)
				throw new Error("No DM ID returned");

			// B. Cargar historial
			const msgsRes = await fetch(`${BASE_URL}/api/chat/${data.dmId}/messages?limit=50`, {
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
			//marrcamos leido
			markAsRead(data.dmId);

			// Recargamos la lista por si era un chat nuevo que ahora debe aparecer
			if (data.isNew)
				fetchChats();

		} catch (error) {
			console.error("Error opening chat:", error);
		} finally {
			setIsLoading(false);
		}
	}, [token, chats, fetchChats]);

	// 3. ENVIAR MENSAJE
	const sendMessage = useCallback((content: string, score: number, type: 'text' | 'game_invite' = 'text') => {
		if (!socket || !activeChat) return;

		const payload = {
			type: 'SEND_MESSAGE',
			payload: {
				dmId: activeChat.id,
				content,
				type,
				score
			}
		};
		socket.send(JSON.stringify(payload));
	}, [socket, activeChat]);

	// 4. ESCUCHAR MENSAJES (Sockets)
	useEffect(() => {
		if (!socket)
			return;

		const handleSocketMessage = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				const currentChat = activeChatRef.current;

				if (data.type === 'NEW_MESSAGE' || data.type === 'MESSAGE_SENT_OK') {
					const newMsg = data.payload as Message;

					// Si tengo este chat abierto, lo pinto
					if (currentChat && newMsg.dm_id === currentChat.id) {
						setMessages(prev => [...prev, newMsg]);

						// Si es un mensaje de la otra persona, le avisamos que lo leí
						if (data.type === 'NEW_MESSAGE') {
							markAsRead(currentChat.id);
						}
					}

					// SIEMPRE actualizamos la lista lateral para poner el "Último mensaje"
					fetchChats();
				}
				else if (data.type === 'TYPING') {
					const { dmId } = data.payload;
					setTypingChats(prev => ({ ...prev, [dmId]: true }));

					// Limpiar el "Escribiendo..." después de 3 segundos si deja de teclear
					if (typingTimeouts.current[dmId]) clearTimeout(typingTimeouts.current[dmId]);
					typingTimeouts.current[dmId] = setTimeout(() => {
						setTypingChats(prev => ({ ...prev, [dmId]: false }));
					}, 3000);
				}
				else if (data.type === 'MESSAGES_READ') {
					// El otro leyó mis mensajes, pongo los checks azules en mi UI
					if (currentChat && currentChat.id === data.payload.dmId) {
						setMessages(prev => prev.map(m => m.sender_id === user?.id ? { ...m, is_read: true } : m));
					}
				}
				else if (data.type === 'INVITE_UPDATED') {
					const updatedMsg = data.payload;
					if (currentChat && currentChat.id === updatedMsg.dm_id) {
						setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
					}
				}
			} catch (e) { }
		};

		socket.addEventListener('message', handleSocketMessage);
		return () => socket.removeEventListener('message', handleSocketMessage);
	}, [socket, fetchChats, markAsRead, user]);

	//limpieza
	useEffect(() => {
		if (!user) {
			console.log("🧹 Limpiando estado del chat (Logout detected)");
			setActiveChat(null);
			setMessages([]);
			setChats([]);
		}
	}, [user]);

	const closeChat = () => setActiveChat(null);

	return (
		<ChatContext.Provider value={{
			chats, activeChat, messages, isLoading, selectChat,
			sendMessage, closeChat, refreshChats: fetchChats,
			typingChats, sendTyping, markAsRead
		}}>
			{children}
		</ChatContext.Provider>
	);
};