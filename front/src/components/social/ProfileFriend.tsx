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
import { useFriendActions } from '../../hooks/useFriendActions';
import { FriendActionsMenu } from './FriendActionsMenu';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Tooltip from '@mui/material/Tooltip';

import { BASE_URL } from '../../config';


interface Props {
	open: boolean;
	onClose: () => void;
	friend: any;
	onActionSuccess?: () => void;
	isBlocked?: boolean;
}

export const ProfileFriend = ({ open, onClose, friend, onActionSuccess, isBlocked = false }: Props) => {
	const modals = useAuthModals();
	const { deleteFriend, blockFriend, unBlockFriend } = useFriendActions(onActionSuccess);
	const token = localStorage.getItem('auth_token');

	const [currentAvatar, setCurrentAvatar] = useState(friend?.avatar_url || null);
	console.log(`ProfileFriends: ${friend?.username}`);

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
				<Typography variant="h6" fontWeight="600">{friend?.username}'s profile</Typography>
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
						src={friend?.avatar_url}
						sx={{ width: 100, height: 100, boxShadow: 3, border: '4px solid white' }}
					/>
				</Box>

				<Typography variant="h5" fontWeight="bold">
					{friend?.username || 'Guest'}
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					{friend?.role || 'Standard Member'}
				</Typography>

				{/* BOTONES DE ACCIÓN */}
				<Box sx={{ display: 'flex', gap: 2, mt: 1 }}>

					{/* Si NO está bloqueado, mostramos el botón de eliminar */}
					{!isBlocked && (
						<Tooltip title="Eliminar">
							<IconButton
								onClick={async () => {
									await deleteFriend(friend.id);
									onClose();
								}}
								color="error"
								sx={{ bgcolor: 'action.hover' }}
							>
								<PersonRemoveIcon />
							</IconButton>
						</Tooltip>
					)}

					{/* Botón condicional: Desbloquear o Bloquear */}
					{isBlocked ? (
						<Tooltip title="Desbloquear">
							<IconButton
								onClick={async () => {
									await unBlockFriend(friend.id);
									onClose();
								}}
								color="success"
								sx={{ bgcolor: 'action.hover' }}
							>
								<LockOpenIcon />
							</IconButton>
						</Tooltip>
					) : (
						<Tooltip title="Bloquear">
							<IconButton
								onClick={async () => {
									await blockFriend(friend.id);
									onClose();
								}}
								sx={{ color: 'text.secondary', bgcolor: 'action.hover' }}
							>
								<BlockIcon />
							</IconButton>
						</Tooltip>
					)}
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