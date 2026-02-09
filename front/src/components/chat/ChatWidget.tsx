import { useEffect, useState } from 'react';
import { Box, Fab, Badge, Paper, IconButton, Typography, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Importa tus componentes existentes
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { useChat } from '../../context/ChatContext';
import { useSocket } from "../../context/SocketContext";

export const ChatWidget = () => {
	const [isOpen, setIsOpen] = useState(false); // ¿Está el widget abierto?
	const { activeChat, closeChat, chats, refreshChats: fetchChats} = useChat();
	const { unreadMessages, markAsReadMessage } = useSocket();
	

	// Calculamos mensajes no leídos totales (opcional, para el globito rojo)
	// Por ahora sumamos 1 si hay chats, luego lo puedes refinar con un campo 'unread' real
	const totalUnread = 0;

	// Al cerrar el widget completo, también cerramos la conversación activa para volver a la lista
	const toggleOpen = () => {
		fetchChats();
		if (isOpen) {
			setIsOpen(false);
			markAsReadMessage();
			closeChat(); // Reseteamos al cerrar
		} else {
			setIsOpen(true);
		}
	};

	useEffect(() => {
		if (activeChat) {
			setIsOpen(true);
		}
	}, [activeChat]);

	return (
		<Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>

			{/* --- VENTANA DEL CHAT (SOLO SI ESTÁ ABIERTO) --- */}
			{isOpen && (
				<Paper
					elevation={10}
					sx={{
						width: 320,
						height: 450,
						mb: 2,
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
						borderRadius: 2
					}}
				>
					{/* Si hay un chat activo, mostramos la Ventana. Si no, la Lista */}
					{activeChat ? (
						
						<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
							<ChatWindow />
						</Box>
					) : (
						<ChatSidebar />
					)}
				</Paper>
			)}

			{/* --- BOTÓN FLOTANTE (FAB) --- */}
			<Tooltip title="Chat">
				<Fab
					color="primary"
					aria-label="chat"
					onClick={toggleOpen}
				>
					{isOpen ? (
						<CloseIcon />
					) : (
						<Badge badgeContent={unreadMessages} color="error">
							<ChatIcon />
						</Badge>
					)}
				</Fab>
			</Tooltip>
		</Box>
	);
};