import {
	List, ListItem, ListItemAvatar, ListItemText, Avatar,
	Typography, Divider, IconButton, Box, Drawer,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useFriendActions } from '../../hooks/useFriendActions';

import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import BlockIcon from '@mui/icons-material/Block';
import Tooltip from '@mui/material/Tooltip';



interface Props {
	open: boolean;
	onClose: () => void;
	friend: any;
	onActionSuccess?: () => void;
}

const ProfileFriend = ({ open, onClose, friend, onActionSuccess }: Props) => {
	const { deleteFriend, blockFriend } = useFriendActions(onActionSuccess);

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
				<Typography variant="h6" fontWeight="600">{friend.username}'s profile</Typography>
				<IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
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

				<Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
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
				</Box>
			</Box>

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