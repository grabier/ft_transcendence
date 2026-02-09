import { useState, useEffect, useRef } from 'react';
import { Box, Paper, TextField, IconButton, Typography, Avatar, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import { useChat } from '../../context/ChatContext'; // <--- Ajusta esta ruta si te sale rojo
import { useAuth } from '../../context/AuthContext'; // <--- Ajusta esta ruta si te sale rojo
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // IMPORTAR ESTO

export const ChatWindow = () => {
	const { activeChat, messages, sendMessage, closeChat } = useChat();
	const { user } = useAuth();
	const [inputText, setInputText] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	if (!activeChat) return null;

	const handleSend = () => {
		if (!inputText.trim()) return;
		sendMessage(inputText, 'text');
		setInputText('');
	};
	const handleInvite = () => {
        const fakeGameId = 'game-' + Date.now(); 
        sendMessage(fakeGameId, 'game_invite');
    };

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%', // Ocupa todo el alto disponible
				bgcolor: 'background.paper'
			}}
		>
			{/* --- CABECERA FIJA (NO HACE SCROLL) --- */}
			<Box sx={{
				p: 1.5,
				bgcolor: 'primary.main',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				boxShadow: 1, // Sombra para separar del contenido
				zIndex: 10    // Asegura que esté por encima de los mensajes
			}}>
				<Stack direction="row" spacing={1} alignItems="center">
					{/* 👇 AQUÍ ESTÁ EL BOTÓN DE VOLVER INTEGRADO */}
					<IconButton size="small" onClick={closeChat} sx={{ color: 'white', mr: 1 }}>
						<ArrowBackIcon />
					</IconButton>

					<Avatar src={activeChat.otherUser.avatar_url} sx={{ width: 32, height: 32 }} />
					<Typography variant="subtitle2" color="white" fontWeight="bold">
						{activeChat.otherUser.username}
					</Typography>
				</Stack>

				{/* Opcional: Botón de cerrar chat completamente (la X) */}
				{/* <IconButton size="small" onClick={closeChat} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton> */}
			</Box>

			{/* --- CUERPO MENSAJES (ESTE ES EL ÚNICO QUE HACE SCROLL) --- */}
			<Box sx={{
				flexGrow: 1,       // Ocupa todo el espacio restante
				p: 2,
				overflowY: 'auto', // HABILITA EL SCROLL AQUÍ
				bgcolor: '#f5f5f5',
				display: 'flex',
				flexDirection: 'column'
			}}>
				{messages.map((msg) => {
					const isMe = msg.sender_id === user?.id;
					return (
						<Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 1 }}>
							{msg.type === 'game_invite' ? (
								<GameInviteBubble gameId={msg.content} isMe={isMe} />
							) : (
								<Paper sx={{
									p: 1, px: 2,
									maxWidth: '80%',
									bgcolor: isMe ? 'primary.light' : 'white',
									color: isMe ? 'white' : 'text.primary',
									borderRadius: 2
								}}>
									<Typography variant="body2">{msg.content}</Typography>
								</Paper>
							)}
						</Box>
					);
				})}
				<div ref={messagesEndRef} />
			</Box>

			{/* --- INPUT FIJO (TAMPOCO HACE SCROLL) --- */}
			<Box sx={{ p: 1, borderTop: '1px solid #ddd', display: 'flex', gap: 1, bgcolor: 'white' }}>
				<IconButton color="secondary" onClick={handleInvite}>
					<VideogameAssetIcon />
				</IconButton>
				<TextField
					fullWidth size="small" placeholder="Escribe..." value={inputText}
					onChange={(e) => setInputText(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSend()}
				/>
				<IconButton color="primary" onClick={handleSend}><SendIcon /></IconButton>
			</Box>
		</Box>
	);
};