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
	const { updateAvatarUrl } = useAuth();
	const { updateUsername } = useAuth(); // Importas la función

	// Independent states for editing
	const [editName, setEditName] = useState({ open: false, value: user?.username || '' });
	const [editEmail, setEditEmail] = useState({ open: false, value: user?.email || '' });

	// avatar
	const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}`;
	const [currentAvatar, setCurrentAvatar] = useState(user?.avatarUrl || defaultAvatar);

	const AVATAR_SEEDS = ['Felix', 'Aneka', 'Buddy', 'Max', 'Garfield', 'Lucky', 'Willow', 'Jasper'];
	const [showAvatarPicker, setShowAvatarPicker] = useState(false);


	const handleSelectAvatar = async (seed: string) => {
		const newUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

		// Cambiamos la imagen en la UI antes de que responda el servidor (Optimismo)
		setCurrentAvatar(newUrl);

		const success = await updateAvatarUrl(newUrl);
		if (success) {
			setShowAvatarPicker(false);
		} else {
			// Si falla, volvemos a la original
			setCurrentAvatar(user?.avatarUrl || defaultAvatar);
			alert("Error al actualizar el avatar");
		}
	};
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
				<Box sx={{ position: 'relative', mb: 2 }}>
					<Avatar
						src={currentAvatar}
						sx={{ width: 100, height: 100, boxShadow: 3, border: '4px solid white' }}
					/>
					<IconButton
						onClick={() => setShowAvatarPicker(!showAvatarPicker)}
						sx={{
							position: 'absolute',
							bottom: 0,
							right: -5,
							bgcolor: 'primary.main',
							color: 'white',
							'&:hover': { bgcolor: 'primary.dark' },
							width: 30,
							height: 30,
							boxShadow: 2
						}}
					>
						<EditIcon sx={{ fontSize: 16 }} />
					</IconButton>
				</Box>

				{/* Selector de Avatares (Collapse) */}
				<Collapse in={showAvatarPicker} sx={{ width: '100%', px: 3 }}>
					<Typography variant="caption" display="block" textAlign="center" sx={{ mb: 1, color: 'text.secondary' }}>
						Selecciona un nuevo avatar:
					</Typography>
					<Box sx={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: 1,
						p: 1.5,
						bgcolor: '#f8f9fa',
						borderRadius: 2,
						mb: 2
					}}>
						{AVATAR_SEEDS.map((seed) => {
							const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
							return (
								<Avatar
									key={seed}
									src={url}
									onClick={() => handleSelectAvatar(seed)}
									sx={{
										width: 45,
										height: 45,
										cursor: 'pointer',
										border: user?.avatarUrl === url ? '2px solid #1976d2' : '2px solid transparent',
										'&:hover': { transform: 'scale(1.1)', transition: '0.1s' }
									}}
								/>
							);
						})}
					</Box>
				</Collapse>
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