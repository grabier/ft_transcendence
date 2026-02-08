import { useState, useCallback } from 'react';
import {
	List, ListItem, ListItemAvatar, ListItemText, Avatar,
	Typography, Divider, IconButton, Box,
	TextField, Collapse, Drawer, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Check';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useAuth } from "../context/AuthContext";
import { useAuthModals } from '../hooks/useAuthModals';
import { useNavigate } from 'react-router-dom';

interface Props {
	open: boolean;
	onClose: () => void;
}

export const Profile = ({ open, onClose }: Props) => {
	const { user, logout } = useAuth();
	const modals = useAuthModals();
	const navigate = useNavigate();

	// Independent states for editing
	const [editName, setEditName] = useState({ open: false, value: user?.username || '' });
	const [editEmail, setEditEmail] = useState({ open: false, value: user?.email || '' });

	// Consistent default avatar
	const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}`;

	const { updateUsername } = useAuth(); // Importas la función

	const handleUpdate = useCallback(async (type: 'user' | 'email') => {
		if (type === 'user') {
			// Llamas a la función del contexto
			const success = await updateUsername(editName.value);
			if (success) {
				setEditName(prev => ({ ...prev, open: false }));
			}
		}
		// ... resto de lógica
	}, [editName.value, updateUsername]);

	const onLogoutClick = () => {
		logout();
		modals.closeAll();
		onClose(); // This triggers the drawer to close in the parent state
		navigate("/");
	};

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
				<Typography variant="h6" fontWeight="600">My Profile</Typography>
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
				<Avatar
					src={user?.avatarUrl || defaultAvatar}
					sx={{ width: 100, height: 100, mb: 2, boxShadow: 3, border: '4px solid white' }}
				/>
				<Typography variant="h5" fontWeight="bold">
					{user?.username || 'Guest'}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{user?.role || 'Standard Member'}
				</Typography>
			</Box>

			{/* Account Details */}
			<List sx={{ p: 2 }}>
				{/* Username Field */}
				<ListItem
					secondaryAction={
						<IconButton edge="end" onClick={() => setEditName(p => ({ ...p, open: !p.open }))}>
							<EditIcon fontSize="small" />
						</IconButton>
					}
				>
					<ListItemAvatar>
						<Avatar sx={{ bgcolor: 'primary.light' }}><PersonOutlineIcon /></Avatar>
					</ListItemAvatar>
					<ListItemText
						primary="Username"
						secondary={user?.username || 'Not set'}
					/>
				</ListItem>

				<Collapse in={editName.open} sx={{ px: 2, mb: 2 }}>
					<TextField
						fullWidth
						size="small"
						label="New Username"
						value={editName.value}
						onChange={(e) => setEditName(p => ({ ...p, value: e.target.value }))}
						InputProps={{
							endAdornment: (
								<IconButton size="small" onClick={() => handleUpdate('user')} color="primary">
									<SaveIcon />
								</IconButton>
							)
						}}
					/>
				</Collapse>

				<Divider variant="inset" component="li" />

				{/* Email Field */}
				<ListItem
					secondaryAction={
						<IconButton edge="end" onClick={() => setEditEmail(p => ({ ...p, open: !p.open }))}>
							<EditIcon fontSize="small" />
						</IconButton>
					}
				>
					<ListItemAvatar>
						<Avatar sx={{ bgcolor: 'secondary.light' }}><MailOutlineIcon /></Avatar>
					</ListItemAvatar>
					<ListItemText
						primary="Email Address"
						secondary={user?.email || 'Not set'}
					/>
				</ListItem>

				<Collapse in={editEmail.open} sx={{ px: 2, mb: 2 }}>
					<TextField
						fullWidth
						size="small"
						label="New Email"
						value={editEmail.value}
						onChange={(e) => setEditEmail(p => ({ ...p, value: e.target.value }))}
						InputProps={{
							endAdornment: (
								<IconButton size="small" onClick={() => handleUpdate('email')} color="primary">
									<SaveIcon />
								</IconButton>
							)
						}}
					/>
				</Collapse>
			</List>

			{/* Actions */}
			<Box sx={{ mt: 'auto', p: 3 }}>
				<Button
					fullWidth
					variant="contained"
					color="error"
					sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
					onClick={onLogoutClick}
				>
					Logout
				</Button>
			</Box>
		</Drawer>
	);
}

export default Profile;