import { useState, useEffect, useRef } from 'react';
import { Box, Paper, TextField, IconButton, Typography, Avatar, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import { useChat } from '../../context/ChatContext'; // <--- Ajusta esta ruta si te sale rojo
import { useAuth } from '../../context/AuthContext'; // <--- Ajusta esta ruta si te sale rojo

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

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%', // Ocupa todo el espacio que le de el Widget
				bgcolor: 'background.paper'
			}}
		>
			{/* CABECERA */}
			<Box sx={{ p: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<Stack direction="row" spacing={1} alignItems="center">
					<Avatar src={activeChat.otherUser.avatar_url} sx={{ width: 30, height: 30 }} />
					<Typography variant="subtitle2" color="white">{activeChat.otherUser.username}</Typography>
				</Stack>
				{/* Ya no necesitamos el botón de cerrar aquí porque lo controla el Widget, 
                    o puedes dejarlo para que haga lo mismo que "Volver" */}
			</Box>

			{/* MENSAJES */}
			<Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f5f5f5' }}>
				{messages.map((msg) => {
					const isMe = msg.sender_id === user?.id;
					return (
						<Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 1 }}>
							<Paper sx={{ p: 1, px: 2, maxWidth: '80%', bgcolor: isMe ? 'primary.light' : 'white', color: isMe ? 'white' : 'text.primary', borderRadius: 2 }}>
								<Typography variant="body2">{msg.content}</Typography>
							</Paper>
						</Box>
					);
				})}
				<div ref={messagesEndRef} />
			</Box>

			{/* INPUT */}
			<Box sx={{ p: 1, borderTop: '1px solid #ddd', display: 'flex', gap: 1, bgcolor: 'white' }}>
				<IconButton color="secondary" onClick={() => sendMessage('INVITE', 'game_invite')}>
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