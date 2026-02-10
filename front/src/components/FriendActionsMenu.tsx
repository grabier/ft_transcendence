import { SpeedDial, SpeedDialAction, Box } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import BlockIcon from '@mui/icons-material/Block';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface Props {
    friend: any;
    onViewProfile: (id: number) => void;
    onRemove: (id: number) => void;
    onBlock: (id: number) => void;
}

export const FriendActionsMenu= ({ friend, onViewProfile, onRemove, onBlock }: Props) => {
    const actions = [
        { icon: <AccountCircleIcon />, name: 'Perfil', onClick: () => onViewProfile(friend.id),  color: '#607d8b' },
        { icon: <PersonRemoveIcon />, name: 'Eliminar', onClick: () => onRemove(friend.id), color: '#ff5252' },
        { icon: <BlockIcon />, name: 'Bloquear', onClick: () => onBlock(friend.id), color: '#607d8b' },
    ];

    return (
        <Box sx={{ position: 'relative', width: 40, height: 40 }}>
            <SpeedDial
                ariaLabel="Acciones"
                icon={<MoreVertIcon fontSize="small" />}
                direction="left"
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    '& .MuiSpeedDial-fab': {
                        width: 32,
                        height: 32,
                        minHeight: 32,
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'action.hover', color: 'primary.main' }
                    }
                }}
            >
                {actions.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                        onClick={action.onClick}
                        sx={{
                            width: 30,
                            height: 30,
                            minHeight: 30,
                            bgcolor: 'background.paper',
                            color: action.color,
                            '&:hover': { transform: 'scale(1.2)' }
                        }}
                    />
                ))}
            </SpeedDial>
        </Box>
    );
};