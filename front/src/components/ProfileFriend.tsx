import { useState, useCallback } from 'react';
import {
	List, ListItem, ListItemAvatar, ListItemText, Avatar,
	Typography, Divider, IconButton, Box,
	TextField, Collapse, Drawer, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useAuthModals } from '../hooks/useAuthModals';

interface Props {
	open: boolean;
	onClose: () => void;
	friend: any;
}

export const ProfileFriend = ({ open, onClose, friend }: Props) => {
	const modals = useAuthModals();
	// avatar
	const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend?.username || 'Guest'}`;
	const [currentAvatar, setCurrentAvatar] = useState(friend?.avatarUrl || defaultAvatar);

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: { width: { xs: '100%', sm: 400 }, bgcolor: '#fcfcfc' }
			}}
		>
			{/* Header */}
			<Box sx={{
				p: 2,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				bgcolor: 'primary.main',
				color: 'white'
			}}>
				<Typography variant="h6" fontWeight="600">{friend.username}'s profile</Typography>
				<IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
					<CloseIcon />
				</IconButton>
			</Box>

			{/* Hero Section */}
			<Box sx={{
				py: 4,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				bgcolor: 'background.paper',
				borderBottom: '1px solid',
				borderColor: 'divider'
			}}>
				<Box sx={{ position: 'relative', mb: 2 }}>
					<Avatar
						src={currentAvatar}
						sx={{ width: 100, height: 100, boxShadow: 3, border: '4px solid white' }}
					/>
				</Box>

				<Typography variant="h5" fontWeight="bold">
					{friend?.username || 'Guest'}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{friend?.role || 'Standard Member'}
				</Typography>
			</Box>

			{/* Account Details */}
			<List sx={{ p: 2 }}>
				{/* Username Field */}
				<ListItem>
					<ListItemAvatar>
						<Avatar sx={{ bgcolor: 'primary.light' }}><PersonOutlineIcon /></Avatar>
					</ListItemAvatar>
					<ListItemText
						primary="Username"
						secondary={friend?.username || 'Not set'}
					/>
				</ListItem>

				<Divider variant="inset" component="li" />

	
			</List>
		</Drawer>
	);
}

export default ProfileFriend;