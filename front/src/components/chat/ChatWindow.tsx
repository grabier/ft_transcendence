import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Paper, TextField, IconButton, Typography, Avatar, Stack, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'; // Icono para el invite
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

// --- COMPONENTE BURBUJA DE INVITACIÓN ---
const GameInviteBubble = ({ gameId, isMe }: { gameId: string, isMe: boolean }) => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	// Busca la función handleJoinGame y déjala así:
	const handleJoinGame = () => {
		// 👇 CAMBIO: Quitamos '/games'. Vamos a la raíz '/' con los parámetros.
		navigate(`/?mode=pvp&roomId=${gameId}&score=5`);
	};

	return (
		<Paper sx={{
			p: 2,
			maxWidth: '85%',
			bgcolor: isMe ? '#2c3e50' : '#f1c40f', // Azul oscuro para mí, Dorado para el rival
			color: isMe ? 'white' : 'black',
			borderRadius: 3,
			border: '2px solid',
			borderColor: isMe ? '#34495e' : '#f39c12',
			boxShadow: 3,
			overflow: 'hidden'
		}}>
			<Stack spacing={1} alignItems="center">
				<Stack direction="row" spacing={1} alignItems="center">
					<SportsEsportsIcon fontSize="large" />
					<Typography variant="subtitle1" fontWeight="bold">
						{isMe ? t('challengeSent') : t('pongChallenge')}
					</Typography>
				</Stack>

				<Typography variant="body2" sx={{ opacity: 0.9, textAlign: 'center' }}>
					{isMe
						? t('waitingForAcceptance')
						: t('challengeMessage')}
				</Typography>

				<Button
					variant={isMe ? "outlined" : "contained"}
					color={isMe ? "inherit" : "primary"}
					fullWidth
					size="small"
					onClick={handleJoinGame}
					sx={{
						mt: 1,
						fontWeight: 'bold',
						bgcolor: isMe ? 'transparent' : 'black',
						color: isMe ? 'white' : '#f1c40f',
						'&:hover': {
							bgcolor: isMe ? 'rgba(255,255,255,0.1)' : '#333'
						}
					}}
				>
					{isMe ? t('enterRoom') : t('acceptDuel')}
				</Button>
			</Stack>
		</Paper>
	);
};

// --- CHAT WINDOW PRINCIPAL ---
export const ChatWindow = () => {
	const { t } = useTranslation();
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
		// Generamos un ID de sala único y corto
		// Usamos Math.random para evitar conflictos simples
		const roomId = `duel-${user?.id}-${Date.now().toString().slice(-4)}`;
		sendMessage(roomId, 'game_invite');
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				bgcolor: 'background.paper'
			}}
		>
			{/* --- CABECERA FIJA --- */}
			<Box sx={{
				p: 1.5,
				bgcolor: 'primary.main',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				boxShadow: 1,
				zIndex: 10
			}}>
				<Stack direction="row" spacing={1} alignItems="center">
					<IconButton size="small" onClick={closeChat} sx={{ color: 'white', mr: 1 }}>
						<ArrowBackIcon />
					</IconButton>
					<Avatar src={activeChat.otherUser.avatar_url} sx={{ width: 32, height: 32 }} />
					<Typography variant="subtitle2" color="white" fontWeight="bold">
						{activeChat.otherUser.username}
					</Typography>
				</Stack>
			</Box>

			{/* --- CUERPO MENSAJES --- */}
			<Box sx={{
				flexGrow: 1,
				p: 2,
				overflowY: 'auto',
				bgcolor: '#e5e5f7', // Un fondo con patrón o color suave queda mejor
				backgroundImage: 'radial-gradient(#444cf7 0.5px, #e5e5f7 0.5px)', // Patrón de puntos opcional
				backgroundSize: '10px 10px',
				display: 'flex',
				flexDirection: 'column'
			}}>
				{messages.map((msg) => {
					const isMe = msg.sender_id === user?.id;
					return (
						<Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 2 }}>
							{msg.type === 'game_invite' ? (
								// 👇 Aquí renderizamos la burbuja mágica
								<GameInviteBubble gameId={msg.content} isMe={isMe} />
							) : (
								<Paper sx={{
									p: 1, px: 2,
									maxWidth: '75%',
									bgcolor: isMe ? 'primary.main' : 'white',
									color: isMe ? 'white' : 'text.primary',
									borderRadius: 2,
									boxShadow: 1,
									// Pequeño triángulo para el bocadillo
									borderTopRightRadius: isMe ? 0 : 2,
									borderTopLeftRadius: isMe ? 2 : 0,
								}}>
									<Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
										{msg.content}
									</Typography>
								</Paper>
							)}
						</Box>
					);
				})}
				<div ref={messagesEndRef} />
			</Box>

			{/* --- INPUT FIJO --- */}
			<Box sx={{ p: 1, borderTop: '1px solid #ddd', display: 'flex', gap: 1, bgcolor: 'white' }}>
				<IconButton color="warning" onClick={handleInvite} title={t('challengeToPong')}>
					<VideogameAssetIcon />
				</IconButton>
				<TextField
					fullWidth size="small" placeholder={t('writeMessage')} value={inputText}
					onChange={(e) => setInputText(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSend()}
					sx={{ '& .MuiOutlinedInput-root': { borderRadius: 5 } }}
				/>
				<IconButton color="primary" onClick={handleSend} disabled={!inputText.trim()}>
					<SendIcon />
				</IconButton>
			</Box>
		</Box>
	);
};