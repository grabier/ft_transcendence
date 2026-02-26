import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import PhotoCamera from '@mui/icons-material/PhotoCamera';

import { useAuth } from "@/context/AuthContext";
import { useAuthModals } from '@/hooks/useAuthModals';

interface Props {
	open: boolean;
	onClose: () => void;
}

export const Profile = ({ open, onClose }: Props) => {
	const { user, logout } = useAuth();
	const modals = useAuthModals();
	const navigate = useNavigate();
	const { updateAvatarUrl, updateUsername, uploadAvatarFile } = useAuth();
	const [editName, setEditName] = useState({ open: false, value: user?.username || '' });
	const [, setCurrentAvatar] = useState(user?.avatarUrl);
	const AVATAR_SEEDS = ['Felix', 'Aneka', 'Buddy', 'Max', 'Garfield', 'Lucky', 'Willow', 'Jasper'];
	const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const { t } = useTranslation();

	const handleSelectAvatar = async (seed: string) => {
		const newUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

		setCurrentAvatar(newUrl);

		const success = await updateAvatarUrl(newUrl);
		if (success) {
			setShowAvatarPicker(false);
		} else {
			setCurrentAvatar(user?.avatarUrl);
			alert("Error al actualizar el avatar");
		}
	};
	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				alert("File too large (max 2MB)");
				return;
			}
			await uploadAvatarFile(file);
		}
	};
	const handleUpdate = useCallback(async (type: 'user') => {
		if (type === 'user') {
			const success = await updateUsername(editName.value);
			if (success) {
				setEditName(prev => ({ ...prev, open: false }));
			}
		}
	}, [editName.value, updateUsername]);
	const onLogoutClick = () => {
		logout();
		modals.closeAll();
		onClose();
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

			<Box sx={{
				p: 2,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				bgcolor: 'primary.main',
				color: 'white'
			}}>
				<Typography aria-label="Profile modal" variant="h6" fontWeight="600">{t('profile.title')}</Typography>
				<IconButton onClick={onClose} aria-label="Close profile modal" size="small" sx={{ color: 'white' }}>
					<CloseIcon />
				</IconButton>
			</Box>

			<Box sx={{
				py: 4,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				bgcolor: 'background.paper',
				borderBottom: '1px solid',
				borderColor: 'divider'
			}}>
				<Box sx={{ position: 'relative', width: 100, height: 100, mb: 2 }}>
					<Avatar
						src={user?.avatarUrl}
						sx={{ width: '100%', height: '100%', boxShadow: 3, border: '4px solid white' }}
					/>
					<input
						type="file"
						id="avatar-upload-input"
						hidden
						accept="image/png, image/jpeg, image/gif"
						onChange={handleFileChange}
					/>
					<label htmlFor="avatar-upload-input">
						<IconButton
							component="span"
							size="small"
							sx={{
								position: 'absolute',
								bottom: -5,
								left: -10,
								bgcolor: 'secondary.main',
								color: 'white',
								'&:hover': { bgcolor: 'secondary.dark' },
								boxShadow: 3,
								border: '2px solid white',
								zIndex: 10,
								width: 35,
								height: 35
							}}
						>
							<PhotoCamera sx={{ fontSize: 18 }} />
						</IconButton>
					</label>

					<IconButton
						onClick={() => setShowAvatarPicker(!showAvatarPicker)}
						size="small"
						sx={{
							position: 'absolute',
							bottom: -5,
							right: -10,
							bgcolor: 'primary.main',
							color: 'white',
							'&:hover': { bgcolor: 'primary.dark' },
							boxShadow: 3,
							border: '2px solid white',
							zIndex: 10,
							width: 35,
							height: 35
						}}
					>
						<PersonOutlineIcon sx={{ fontSize: 20 }} />
					</IconButton>
				</Box>

				<Collapse in={showAvatarPicker} sx={{ width: '100%', px: 3 }}>
					<Typography aria-label="Choose from the pictures bellow:" variant="caption" display="block" textAlign="center" sx={{ mb: 1, color: 'text.secondary' }}>
						{t('profile.selectAvatar')}
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
									aria-label={`Choose ${seed} as your profile avatar`}
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
				<Typography variant="h5" fontWeight="bold" aria-label="Profile username">
					{user?.username || 'Guest'}
				</Typography>
				<Typography variant="body2" color="text.secondary" aria-label="Profile role">
					{t('profile.role') || 'Standard Member'}
				</Typography>
			</Box>

			<List sx={{ p: 2 }}>
				<ListItem
					secondaryAction={
						<IconButton edge="end" aria-label="Edit profile username" onClick={() => setEditName(p => ({ ...p, open: !p.open }))}>
							<EditIcon fontSize="small" />
						</IconButton>
					}
				>
					<ListItemAvatar>
						<Avatar sx={{ bgcolor: 'primary.light' }}><PersonOutlineIcon /></Avatar>
					</ListItemAvatar>
					<ListItemText
						aria-label="Profile username"
						primary={t('profile.username')}
						secondary={user?.username || 'Not set'}
					/>
				</ListItem>

				<Collapse in={editName.open} sx={{ px: 2, mb: 2 }}>
					<TextField
						aria-label="Input new username"
						fullWidth
						size="small"
						label={t('profile.newUsername')}
						value={editName.value}
						onChange={(e) => setEditName(p => ({ ...p, value: e.target.value }))}
						InputProps={{
							endAdornment: (
								<IconButton size="small" aria-label="Save new profile username" onClick={() => handleUpdate('user')} color="primary">
									<SaveIcon />
								</IconButton>
							)
						}}
					/>
				</Collapse>

				<Divider variant="inset" component="li" />

				<ListItem>
					<ListItemAvatar>
						<Avatar sx={{ bgcolor: 'secondary.light' }}><MailOutlineIcon /></Avatar>
					</ListItemAvatar>
					<ListItemText
						aria-label="Profile email"
						primary={t('profile.email')}
						secondary={user?.email || 'Not set'}
					/>
				</ListItem>
			</List>

			<Box sx={{ mt: 'auto', p: 3 }}>
				<Button
					aria-label="Close profile modal"
					fullWidth
					variant="contained"
					color="error"
					sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
					onClick={onLogoutClick}
				>
					{t('profile.logout')}
				</Button>
			</Box>
		</Drawer>
	);
}

export default Profile;