import { Badge, styled } from '@mui/material';

export type UserStatus = 'online' | 'offline' | 'in-game';

interface StatusBadgeProps {
  children: React.ReactNode;
  status: UserStatus;
}

// Creamos un Badge personalizado
const StyledBadge = styled(Badge, {
  // Evitamos que la prop 'status' pase al DOM de HTML
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: UserStatus }>(({ theme, status }) => {
  
  // Asignamos colores según el estado
  let badgeColor = theme.palette.success.main; // Verde para online
  if (status === 'offline') badgeColor = theme.palette.grey[500]; // Gris para offline
  if (status === 'in-game') badgeColor = theme.palette.warning.main; // Naranja/Amarillo para in-game

  return {
    '& .MuiBadge-badge': {
      backgroundColor: badgeColor,
      color: badgeColor,
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`, // Borde del color del fondo para que "recorte" la imagen
      
      // Animación de pulso solo si está online
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: status === 'online' ? 'ripple 1.2s infinite ease-in-out' : 'none',
        border: '1px solid currentColor',
        content: '""',
      },
    },
    '@keyframes ripple': {
      '0%': { transform: 'scale(.8)', opacity: 1 },
      '100%': { transform: 'scale(2.4)', opacity: 0 },
    },
  };
});

export const StatusBadge = ({ children, status }: StatusBadgeProps) => {
  return (
    <StyledBadge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant="dot"
      status={status}
    >
      {children}
    </StyledBadge>
  );
};