import { useState, useEffect, useRef } from 'react';
import {
	Box, Paper, TextField, IconButton, Typography, Avatar, Stack, Button,
	Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// --- INTERFAZ EXTENDIDA PARA MENSAJES ---
// Asegúrate de que tu tipo Message en el frontend tenga esta propiedad opcional
interface MessageWithScore {
	id: number;
	content: string;
	type: 'text' | 'game_invite';
	sender_id: number;
	invite_score?: number;
}

// --- COMPONENTE BURBUJA DE INVITACIÓN ---
const GameInviteBubble = ({ gameId, isMe, score }: { gameId: string, isMe: boolean, score?: number }) => {
	const navigate = useNavigate();

	// Si es un mensaje antiguo sin score, asumimos 5 por defecto
	console.log(`Score: ${score}`);
	const pointsToWin = score || 5;

	const handleJoinGame = () => {
		// LA URL INCLUYE EL SCORE DINÁMICO
		navigate(`/?mode=pvp&roomId=${gameId}&score=${pointsToWin}`);
	};

	return (
		<Paper sx={{
			p: 2,
			maxWidth: '90%',
			bgcolor: isMe ? '#2c3e50' : '#f1c40f',
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
						{isMe ? 'DESAFÍO ENVIADO' : '¡DUELO PONG!'}
					</Typography>
				</Stack>

				<Typography variant="body2" sx={{ opacity: 0.9, textAlign: 'center' }}>
					{isMe
						? `Has propuesto una partida a ${pointsToWin} puntos.`
						: `Te han retado a un duelo a ${pointsToWin} puntos.`}
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
					{isMe ? 'ENTRAR A LA SALA' : `ACEPTAR (${pointsToWin} PTS)`}
				</Button>
			</Stack>
		</Paper>
	);
};

// --- CHAT WINDOW PRINCIPAL ---
export const ChatWindow = () => {
	// @ts-ignore - Ignoramos error de tipado si sendMessage no está actualizado aún en tu contexto
	const { activeChat, messages, sendMessage, closeChat } = useChat();
	const { user } = useAuth();
	const [inputText, setInputText] = useState('');

	// Estado para el menú de puntos
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const openMenu = Boolean(anchorEl);

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	if (!activeChat) return null;

	const handleSend = () => {
		if (!inputText.trim()) return;
		sendMessage(inputText, 0, 'text');
		setInputText('');
	};

	// Abrir menú al hacer click en el mando
	const handleOpenInviteMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleCloseInviteMenu = () => {
		setAnchorEl(null);
	};

	// Enviar la invitación con los puntos seleccionados
	const handleInvite = (points: number) => {
		handleCloseInviteMenu();
		const roomId = `duel-${user?.id}-${Date.now().toString().slice(-4)}`;
		sendMessage(roomId, points, 'game_invite');
		console.log("patatatt");
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
			{/* --- CABECERA --- */}
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

			{/* --- LISTA DE MENSAJES --- */}
			<Box sx={{
				flexGrow: 1,
				p: 2,
				overflowY: 'auto',
				bgcolor: '#e5e5f7',
				backgroundImage: 'radial-gradient(#444cf7 0.5px, #e5e5f7 0.5px)',
				backgroundSize: '10px 10px',
				display: 'flex',
				flexDirection: 'column'
			}}>
				{messages.map((msg: any) => {
					const isMe = msg.sender_id === user?.id;
					return (
						<Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 2 }}>
							{msg.type === 'game_invite' ? (
								<GameInviteBubble
									gameId={msg.content}
									isMe={isMe}
									score={msg.invite_score} // Pasamos el score que viene del back
								/>
							) : (
								<Paper sx={{
									p: 1, px: 2,
									maxWidth: '75%',
									bgcolor: isMe ? 'primary.main' : 'white',
									color: isMe ? 'white' : 'text.primary',
									borderRadius: 2,
									boxShadow: 1,
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

			{/* --- AREA DE INPUT --- */}
			<Box sx={{ p: 1, borderTop: '1px solid #ddd', display: 'flex', gap: 1, bgcolor: 'white' }}>

				{/* Botón de Invitar con Menú */}
				<IconButton
					color="warning"
					onClick={handleOpenInviteMenu}
					title="Desafiar a Pong"
				>
					<VideogameAssetIcon />
				</IconButton>

				{/* Menú de Selección de Puntos */}
				<Menu
					anchorEl={anchorEl}
					open={openMenu}
					onClose={handleCloseInviteMenu}
					anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
					transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				>
					<MenuItem onClick={() => handleInvite(3)}>
						<ListItemIcon><SpeedIcon fontSize="small" /></ListItemIcon>
						<ListItemText>Rápida (3 pts)</ListItemText>
					</MenuItem>
					<MenuItem onClick={() => handleInvite(5)}>
						<ListItemIcon><SportsEsportsIcon fontSize="small" /></ListItemIcon>
						<ListItemText>Estándar (5 pts)</ListItemText>
					</MenuItem>
					<MenuItem onClick={() => handleInvite(11)}>
						<ListItemIcon><TimerIcon fontSize="small" /></ListItemIcon>
						<ListItemText>Larga (11 pts)</ListItemText>
					</MenuItem>
					<MenuItem onClick={() => handleInvite(21)}>
						<ListItemIcon><TimerIcon fontSize="small" /></ListItemIcon>
						<ListItemText>Maratón (21 pts)</ListItemText>
					</MenuItem>
				</Menu>

				<TextField
					fullWidth size="small" placeholder="Escribe un mensaje..." value={inputText}
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