import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import BlockIcon from '@mui/icons-material/Block';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface Props {
    friend: any;
    onViewProfile: () => void;
    onRemove: (id: number) => void;
    onBlock: (id: number) => void;
}

export const FriendActionsMenu = ({ friend, onViewProfile, onRemove, onBlock }: Props) => {
    // Usamos anchorEl para posicionar el menú donde se hizo click
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation(); // Evita que el click dispare eventos en la fila/tarjeta padre
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event?: React.MouseEvent) => {
        if (event) event.stopPropagation();
        setAnchorEl(null);
    };

    const handleAction = (actionFn: () => void) => {
        actionFn(); // Ejecuta la acción (borrar, bloquear, etc.)
        setAnchorEl(null); // Cierra el menú
    };

    return (
        <>
            {/* Botón de tres puntos */}
            <IconButton
                aria-label="more"
                id="long-button"
                aria-controls={open ? 'long-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
            >
                <MoreVertIcon />
            </IconButton>

            {/* Menú desplegable estándar */}
            <Menu
                id="long-menu"
                MenuListProps={{
                    'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={(e: any) => handleClose(e)}
                onClick={(e) => e.stopPropagation()} // Evita propagación al hacer click dentro del menú
                slotProps={{
                    paper: {
                        sx: {
                            minWidth: '160px', // Ancho mínimo cómodo
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
                    <ListItemText>Perfil</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleAction(() => onRemove(friend.id))}>
                    <ListItemIcon>
                        <PersonRemoveIcon fontSize="small" sx={{ color: '#ff5252' }} />
                    </ListItemIcon>
                    <ListItemText sx={{ color: '#ff5252' }}>Eliminar</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleAction(() => onBlock(friend.id))}>
                    <ListItemIcon>
                        <BlockIcon fontSize="small" sx={{ color: '#607d8b' }} />
                    </ListItemIcon>
                    <ListItemText>Bloquear</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};