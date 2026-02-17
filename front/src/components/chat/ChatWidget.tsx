import { useEffect, useState } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { useChat } from '../../context/ChatContext';
import { useSocket } from "../../context/SocketContext";
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
	Box, Paper, TextField, IconButton, Typography, Avatar, Stack, Button,
	Menu, MenuItem, ListItemIcon, ListItemText, Tooltip, Fab, Badge
} from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';


export const ChatWidget = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { activeChat, closeChat, chats, refreshChats: fetchChats} = useChat();
	const { unreadMessages, markAsReadMessage } = useSocket();
	const { user } = useAuth();
	

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

	if (!user)
		return null;

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