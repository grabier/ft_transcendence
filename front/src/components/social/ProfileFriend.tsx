import { useState, useCallback } from 'react';
import {
	List, ListItem, ListItemAvatar, ListItemText, Avatar,
	Typography, Divider, IconButton, Box,
	TextField, Collapse, Drawer, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useAuthModals } from '../../hooks/useAuthModals';
import { FriendActionsMenu } from './FriendActionsMenu';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import BlockIcon from '@mui/icons-material/Block';
import Tooltip from '@mui/material/Tooltip';

import { BASE_URL } from '../../config';


interface Props {
	open: boolean;
	onClose: () => void;
	friend: any;
}
const token = localStorage.getItem('auth_token');

const handleDelete = async (friendId: number) => {
	try {
		const res = await fetch(`${BASE_URL}:3000/api/friend/delete/${friendId}`, {
			method: 'DELETE',
			headers: { 'Authorization': `Bearer ${token}` }
		});
	} catch (err) {
		console.error(err);
	}
};

const handleBlock = async (blockedId: number) => {
	try {
		const res = await fetch(`${BASE_URL}/api/friend/block/${blockedId}`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${token}` }
		});

	} catch (err) {
		console.error(err);
	}
};
const sendRequest = async (receiverId: number) => {
	await fetch(`${BASE_URL}/api/friend/request`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
		body: JSON.stringify({ receiverId })
	});
};

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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {friend?.role || 'Standard Member'}
            </Typography>

            {/* BOTONES DE ACCIÓN: Ahora centrados y con espacio */}
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Tooltip title="Añadir amigo">
                    <IconButton 
                        onClick={() => sendRequest(friend.id)} 
                        color="primary"
                        sx={{ bgcolor: 'action.hover' }} // Un ligero fondo para que resalten
                    >
                        <PersonAddIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Eliminar">
                    <IconButton 
                        onClick={() => handleDelete(friend.id)} 
                        color="error"
                        sx={{ bgcolor: 'action.hover' }}
                    >
                        <PersonRemoveIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Bloquear">
                    <IconButton 
                        onClick={() => handleBlock(friend.id)} 
                        sx={{ color: 'text.secondary', bgcolor: 'action.hover' }}
                    >
                        <BlockIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>

        {/* Account Details */}
        <List sx={{ p: 2 }}>
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