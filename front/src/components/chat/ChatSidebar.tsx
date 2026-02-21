import { useTranslation } from 'react-i18next';
import { Box, List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Typography, Badge, Paper } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

import { useChat } from '@/context/ChatContext';

export const ChatSidebar = () => {
	// SEGURIDAD: Inicializamos con un objeto vacío por si el contexto falla
	const { chats = [], activeChat, selectChat, typingChats } = useChat() || {};

	const { t } = useTranslation();

	// Si no hay chats (o es null/undefined), mostramos mensaje vacío
	if (!chats || chats.length === 0) {
		return (
			<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
				<Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
					<Typography variant="subtitle1" fontWeight="bold">{t('chatSidebar.title')}</Typography>
				</Box>
				<Paper elevation={0} sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: 'transparent' }}>
					<Typography variant="body2" color="text.secondary" align="center">
						{t('chatSidebar.noConversations')} <br />
						{t('chatSidebar.talkToFriends')}
					</Typography>
				</Paper>
			</Box>
		);
	}

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
				<Typography variant="subtitle1" fontWeight="bold">{t('chatSidebar.title')}</Typography>
			</Box>

			<List sx={{ p: 0, overflowY: 'auto', flexGrow: 1 }}>
				{chats.map((chat) => {
					const isActive = activeChat?.id === chat.id;
					return (
						// 1. ListItem es el contenedor (lleva la key y el padding desactivado)
						<ListItem key={chat.id} disablePadding>
							{/* 2. ListItemButton es lo que hace click */}
							<ListItemButton
								selected={isActive}
								onClick={() => selectChat(chat.otherUser.id, chat.otherUser)}
								sx={{
									borderBottom: '1px solid #eee',
									bgcolor: isActive ? 'action.selected' : 'inherit'
								}}
							>
								<ListItemAvatar>
									<Badge
										overlap="circular"
										anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
										badgeContent={
											<CircleIcon sx={{ fontSize: 12, color: chat.otherUser.is_online ? '#44b700' : '#bdbdbd' }} />
										}
									>
										<Avatar src={chat.otherUser.avatar_url} alt={chat.otherUser.username} />
									</Badge>
								</ListItemAvatar>

								<ListItemText
									primary={chat.otherUser.username}
									secondary={
										<Typography variant="caption" noWrap display="block" color="text.secondary">
											{/* SI ESTÁ ESCRIBIENDO, SUSTITUYE EL ÚLTIMO MENSAJE */}
											{typingChats[chat.id] ? (
												<i>Escribiendo...</i>
											) : (
												chat.lastMessage?.content || t('chatSidebar.newConversation')
											)}
										</Typography>
									}
								/>
							</ListItemButton>
						</ListItem>
					);
				})}
			</List>
		</Box>
	);
};