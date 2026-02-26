import { useEffect, useState } from 'react';
import {
	Box, Paper, Tooltip, Fab, Badge
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';

import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { useChat } from '@/context/ChatContext';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';


const ChatWidget = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { activeChat, closeChat, refreshChats: fetchChats} = useChat();
	const { unreadMessages, markAsReadMessage } = useSocket();
	const { user } = useAuth();
	const toggleOpen = () => {
		if (isOpen) {
			markAsReadMessage();
			closeChat();
		} else {
			fetchChats();
		}
		setIsOpen(!isOpen);
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
					{activeChat ? (
						
						<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
							<ChatWindow />
						</Box>
					) : (
						<ChatSidebar />
					)}
				</Paper>
			)}

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

export default ChatWidget;