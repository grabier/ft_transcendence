import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Typography, Badge, Paper, IconButton, Tooltip } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { useChat } from '@/context/ChatContext';
import { useFriendActions } from '@/hooks/useFriendActions';
import { BASE_URL } from '@/config';

const formatLastMessage = (message: any, t: any): string => {
	if (!message?.content) return t('chatSidebar.newConversation');

	// Check if it's a game invite (JSON content)
	if (message.content.startsWith('{')) {
		try {
			const data = JSON.parse(message.content);
			if (data.status === 'pending') return '🎮 Game invite';
			if (data.status === 'finished') return `🎮 Game finished: ${data.result}`;
			if (data.status === 'accepted') return '🎮 Game accepted';
		} catch {
			// If JSON parse fails, fall through to return as-is
		}
	}

	return message.content;
};

const ChatSidebar = () => {
	const { chats = [], activeChat, selectChat, typingChats } = useChat() || {};
	const { t } = useTranslation();
	const token = localStorage.getItem('auth_token');

	// --- ESTADO PARA SABER QUIÉN ESTÁ BLOQUEADO ---
	const [blockedIds, setBlockedIds] = useState<number[]>([]);

	const fetchBlocked = useCallback(async () => {
		if (!token) return;
		try {
			const res = await fetch(`${BASE_URL}/api/friend/blocked`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Cache-Control': 'no-cache, no-store, must-revalidate'
				}
			});
			if (res.ok) {
				const data = await res.json();
				setBlockedIds(Array.isArray(data) ? data.map((u: any) => u.id) : []);
			}
		} catch (err) {
			console.error("Error fetching blocked users in sidebar:", err);
		}
	}, [token]);

	useEffect(() => {
		fetchBlocked();
	}, [fetchBlocked]);

	const { blockFriend, unBlockFriend } = useFriendActions(fetchBlocked);

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
					const isBlocked = blockedIds.includes(chat.otherUser.id);

					return (
						<ListItem
							key={chat.id}
							disablePadding
							secondaryAction={
								isBlocked ? (
									<Tooltip title="Desbloquear">
										<IconButton edge="end" onClick={() => unBlockFriend(chat.otherUser.id)} size="small" sx={{ color: 'success.main' }}>
											<LockOpenIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								) : (
									<Tooltip title="Bloquear">
										<IconButton edge="end" onClick={(e) => {
											e.stopPropagation();
											blockFriend(chat.otherUser.id);
										}} size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
											<BlockIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								)
							}
						>
							<ListItemButton
								selected={isActive}
								onClick={() => selectChat(chat.otherUser.id, chat.otherUser, isBlocked)}
								sx={{
									borderBottom: '1px solid #eee',
									bgcolor: isActive ? 'action.selected' : 'inherit',
									pr: 6 
								}}
							>
								<ListItemAvatar>
									<Badge
										overlap="circular"
										anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
										badgeContent={
											!isBlocked && <CircleIcon sx={{ fontSize: 12, color: chat.otherUser.is_online ? '#44b700' : '#bdbdbd' }} />
										}
									>
										<Avatar
											src={chat.otherUser.avatar_url}
											alt={chat.otherUser.username}
											sx={{ filter: isBlocked ? 'grayscale(1)' : 'none', opacity: isBlocked ? 0.5 : 1 }}
										/>
									</Badge>
								</ListItemAvatar>

								<ListItemText
									primary={
										<Typography
											variant="body1"
											sx={{
												color: isBlocked ? 'error.main' : 'inherit',
												textDecoration: isBlocked ? 'line-through' : 'none',
												fontWeight: isActive ? 'bold' : 'normal'
											}}
										>
											{chat.otherUser.username}
										</Typography>
									}
									secondary={
										<Typography variant="caption" noWrap display="block" color="text.secondary">
											{isBlocked ? (
												<span style={{ color: '#d32f2f' }}>Usuario bloqueado</span>
											) : typingChats[chat.id] ? (
												<i>{t('chatSidebar.typing')}</i>
											) : (
												formatLastMessage(chat.lastMessage, t)
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

export default ChatSidebar;