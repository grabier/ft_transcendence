import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { ProfileFriend } from '@/components/social/ProfileFriend';


// --- COMPONENTE BURBUJA DE INVITACIÓN ---
const GameInviteBubble = ({ content, isMe, score }: { content: string, isMe: boolean, score?: number }) => {
	const navigate = useNavigate();
	const pointsToWin = score || 5;
	const { t } = useTranslation();

	let inviteData = { id: content, status: 'pending', result: null as string | null };
	try {
		const parsed = JSON.parse(content);
		if (parsed.id) inviteData = parsed;
	} catch (e) {
		inviteData.id = content;
	}

	// --- AQUI ESTA EL ARREGLO PRINCIPAL ---
	const handleJoinGame = () => {
		// Navegamos a la raíz ('/') pero pasando los datos en el state invisible
		navigate('/', { 
			state: { 
				gameParam: 'pong', 
				modeParam: 'pvp', 
				roomIdParam: inviteData.id, 
				scoreParam: pointsToWin 
			} 
		});
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
						{isMe ? t('chatWindow.challengeSent') : t('chatWindow.pongChallenge')}
					</Typography>
				</Stack>

				{/* SI LA PARTIDA TERMINÓ, MOSTRAMOS RESULTADO */}
				{inviteData.status === 'finished' ? (
					<Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, textAlign: 'center', width: '100%' }}>
						<Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.8 }}>
							Partida finalizada
						</Typography>
						<Typography variant="h5" fontWeight="bold">
							🏆 {inviteData.result}
						</Typography>
					</Box>
				) : (
					/* SI ESTÁ PENDIENTE, MOSTRAMOS BOTÓN DE ENTRAR */
					<>
						<Typography variant="body2" sx={{ opacity: 0.9, textAlign: 'center' }}>
							{isMe
								? t('chatWindow.proposedMatch', { points: pointsToWin })
								: t('chatWindow.challengedTo', { points: pointsToWin })}
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
							{isMe ? t('chatWindow.enterRoom') : t('chatWindow.acceptPoints', { points: pointsToWin })}
						</Button>
					</>
				)}
			</Stack>
		</Paper>
	);
};

// --- CHAT WINDOW PRINCIPAL ---
export const ChatWindow = () => {
	const { t } = useTranslation();
	const { activeChat, messages, sendMessage, closeChat, sendTyping, typingChats } = useChat();
	const { user } = useAuth();
	const [inputText, setInputText] = useState('');

	// --- 2. ESTADO PARA EL PERFIL DEL AMIGO ---
	const [profileOpen, setProfileOpen] = useState(false);

	// Estado para el menú de puntos
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const openMenu = Boolean(anchorEl);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	if (!activeChat) return null;
	const isTyping = typingChats[activeChat.id] || false;

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	if (!activeChat) return null;

	const handleSend = () => {
		if (!inputText.trim()) return;
		sendMessage(inputText, 0, 'text');
		setInputText('');
	};

	const handleOpenInviteMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleCloseInviteMenu = () => {
		setAnchorEl(null);
	};

	const handleInvite = (points: number) => {
		handleCloseInviteMenu();
		const roomId = `duel-${user?.id}-${Date.now().toString().slice(-4)}`;
		sendMessage(roomId, points, 'game_invite');
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				bgcolor: 'background.paper',
				position: 'relative' // Necesario por si el Drawer se renderiza dentro
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

					{/* --- 3. AVATAR CLICABLE --- */}
					<Avatar
						src={activeChat.otherUser.avatar_url}
						sx={{
							width: 32,
							height: 32,
							cursor: 'pointer', // Indicador visual de click
							'&:hover': { opacity: 0.8 }
						}}
						onClick={() => setProfileOpen(true)} // Abre el perfil
					/>
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
									content={msg.content}
									isMe={isMe}
									score={msg.invite_score}
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
									{isMe && (
										<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
											<DoneAllIcon sx={{
												fontSize: 14,
												// Si está leído, azul brillante, si no, gris clarito
												color: msg.is_read ? '#4fc3f7' : 'rgba(255,255,255,0.6)'
											}} />
										</Box>
									)}
								</Paper>
							)}
						</Box>
					);
				})}
				{isTyping && (
					<Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', ml: 2, mb: 1 }}>
						{activeChat.otherUser.username} {t('chatWindow.isTyping', 'está escribiendo...')}
					</Typography>
				)}
				<div ref={messagesEndRef} />
			</Box>

			{/* --- AREA DE INPUT --- */}
			<Box sx={{ p: 1, borderTop: '1px solid #ddd', display: 'flex', gap: 1, bgcolor: 'white' }}>
				<IconButton color="warning" onClick={handleOpenInviteMenu} title={t('chatWindow.challengeToPong')}>
					<VideogameAssetIcon />
				</IconButton>

				<Menu
					anchorEl={anchorEl}
					open={openMenu}
					onClose={handleCloseInviteMenu}
					anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
					transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				>
					<MenuItem onClick={() => handleInvite(3)}>
						<ListItemIcon><SpeedIcon fontSize="small" /></ListItemIcon>
						<ListItemText>{t('chatWindow.quickMatch')}</ListItemText>
					</MenuItem>
					<MenuItem onClick={() => handleInvite(5)}>
						<ListItemIcon><SportsEsportsIcon fontSize="small" /></ListItemIcon>
						<ListItemText>{t('chatWindow.standardMatch')}</ListItemText>
					</MenuItem>
					<MenuItem onClick={() => handleInvite(11)}>
						<ListItemIcon><TimerIcon fontSize="small" /></ListItemIcon>
						<ListItemText>{t('chatWindow.longMatch')}</ListItemText>
					</MenuItem>
					<MenuItem onClick={() => handleInvite(21)}>
						<ListItemIcon><TimerIcon fontSize="small" /></ListItemIcon>
						<ListItemText>{t('chatWindow.marathonMatch')}</ListItemText>
					</MenuItem>
				</Menu>

				<TextField
					fullWidth size="small" placeholder={t('chatWindow.writeMessage')} value={inputText}
					onChange={(e) => {
						setInputText(e.target.value);
						sendTyping();
					}}
					onKeyDown={(e) => e.key === 'Enter' && handleSend()}
					sx={{ '& .MuiOutlinedInput-root': { borderRadius: 5 } }}
				/>
				<IconButton color="primary" onClick={handleSend} disabled={!inputText.trim()}>
					<SendIcon />
				</IconButton>
			</Box>

			{/* --- 4. RENDERIZADO DEL PERFIL --- */}
			<ProfileFriend
				open={profileOpen}
				onClose={() => setProfileOpen(false)}
				friend={activeChat.otherUser}
				onActionSuccess={() => { closeChat(); }}
			/>
		</Box>
	);
};