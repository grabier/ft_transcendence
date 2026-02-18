import { useState } from 'react';
import { SpeedDial, SpeedDialAction, Box } from '@mui/material';
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
    const [open, setOpen] = useState(false);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        setOpen(!open);
    };

    const handleAction = (actionFn: () => void) => {
        actionFn();
        setOpen(false);
    };

    const actions = [
        { icon: <AccountCircleIcon />, name: 'Perfil', onClick: () => handleAction(onViewProfile), color: '#607d8b' },
        { icon: <PersonRemoveIcon />, name: 'Eliminar', onClick: () => handleAction(() => onRemove(friend.id)), color: '#ff5252' },
        { icon: <BlockIcon />, name: 'Bloquear', onClick: () => handleAction(() => onBlock(friend.id)),  color: '#607d8b' },
    ];

    return (
        // CAMBIO 1: Aumentamos a 40px para igualar al IconButton vecino
        // y usamos flex para centrar el SpeedDial dentro de esta caja.
        <Box 
            sx={{ 
                position: 'relative', 
                width: 40, 
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10 
            }}
            onMouseLeave={() => setOpen(false)}
        >
            {/* Backdrop invisible */}
            {open && (
                <Box 
                    sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} 
                    onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                />
            )}

            <SpeedDial
                ariaLabel="Acciones"
                icon={<MoreVertIcon sx={{ fontSize: '1.2rem' }} />}
                direction="left"
                open={open}
                onClick={handleToggle}
                sx={{
                    position: 'absolute',
                    // CAMBIO 2: Eliminamos top/right fijos y dejamos que el Flex del padre lo centre,
                    // o forzamos que ocupe el espacio correcto.
                    // Al ser absolute, 'top: 0' y 'right: 0' en una caja de 40x40 lo pega a la esquina.
                    // Mejor lo centramos manualmente o dejamos que ocupe todo:
                    top: 0, 
                    right: 0,
                    zIndex: 2,
                    
                    '& .MuiSpeedDial-fab': {
                        width: 32, // El botón visible sigue siendo pequeño y elegante
                        height: 32,
                        minHeight: 32,
                        margin: '4px', // Centrado visual dentro de la caja de 40px
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'action.hover', color: 'primary.main' }
                    },

                    '& .MuiSpeedDial-actions': {
                        transform: 'translateY(-38px)', 
                        paddingRight: '10px'
                    }
                }}
            >
                {actions.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAction(action.onClick);
                        }}
                        sx={{
                            width: 28,
                            height: 28,
                            minHeight: 28,
                            bgcolor: 'background.paper',
                            color: action.color,
                            boxShadow: 2,
                        }}
                    />
                ))}
            </SpeedDial>
        </Box>
    );
};