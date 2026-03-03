import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTranslation } from 'react-i18next';

interface Props {
	friend: any;
	onViewProfile: () => void;
	onRemove: (id: number) => void;
	onBlock: (id: number) => void;
	isBlocked?: boolean;
}

const FriendActionsMenu = ({ friend, onViewProfile, onRemove, onBlock, isBlocked }: Props) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const { t } = useTranslation();

	// Comprobamos si está bloqueado por el prop explícito o por los datos de BD
	const currentlyBlocked = isBlocked || !!friend?.blocked_by;

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
	};

	const handleClose = (event?: React.MouseEvent) => {
		if (event) event.stopPropagation();
		setAnchorEl(null);
	};

	const handleAction = (actionFn: () => void) => {
		actionFn();
		setAnchorEl(null);
	};

	return (
		<>
			<IconButton
				onClick={handleClick}
			>
				<MoreVertIcon />
			</IconButton>

			<Menu
				disableScrollLock
				MenuListProps={{}}
				anchorEl={anchorEl}
				open={open}
				onClose={(e: any) => handleClose(e)}
				onClick={(e) => e.stopPropagation()}
				slotProps={{
					paper: {
						sx: {
							minWidth: '160px',
							boxShadow: 3
						},
					},
				}}
				transformOrigin={{ horizontal: 'right', vertical: 'top' }}
				anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
			>
				<MenuItem onClick={() => handleAction(onViewProfile)}>
					<ListItemIcon>
						<AccountCircleIcon fontSize="small" sx={{ color: '#607d8b' }} />
					</ListItemIcon>
					<ListItemText>{t('friendActionsMenu.profile', 'Perfil')}</ListItemText>
				</MenuItem>

				{/* Si no está bloqueado, mostramos el botón de eliminar amistad */}
				{!currentlyBlocked && (
					<MenuItem onClick={() => handleAction(() => onRemove(friend.id))}>
						<ListItemIcon>
							<PersonRemoveIcon fontSize="small" sx={{ color: '#ff5252' }} />
						</ListItemIcon>
						<ListItemText sx={{ color: '#ff5252' }}>{t('friendActionsMenu.remove', 'Eliminar')}</ListItemText>
					</MenuItem>
				)}

				{/* Botón Dinámico: Bloquear o Desbloquear */}
				<MenuItem onClick={() => handleAction(() => onBlock(friend.id))}>
					<ListItemIcon>
						{currentlyBlocked ? (
							<LockOpenIcon fontSize="small" sx={{ color: '#4caf50' }} />
						) : (
							<BlockIcon fontSize="small" sx={{ color: '#607d8b' }} />
						)}
					</ListItemIcon>
					<ListItemText>
						{/* He puesto un fallback en el 't' por si no tienes metidas las traducciones en tu JSON aún */}
						{currentlyBlocked
							? t('friendActionsMenu.unblock', 'Desbloquear')
							: t('friendActionsMenu.block', 'Bloquear')
						}
					</ListItemText>
				</MenuItem>
			</Menu>
		</>
	);
};

export default FriendActionsMenu;