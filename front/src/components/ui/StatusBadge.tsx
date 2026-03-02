import { Badge, styled } from '@mui/material';

export type UserStatus = 'online' | 'offline' | 'in-game';

interface Props {
  children: React.ReactNode;
  status: UserStatus;
}

const StyledBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: UserStatus }>(({ theme, status }) => {
  let badgeColor = theme.palette.success.main;
  if (status === 'offline') badgeColor = theme.palette.grey[500];
  if (status === 'in-game') badgeColor = theme.palette.warning.main;
  return {
    '& .MuiBadge-badge': {
      backgroundColor: badgeColor,
      color: badgeColor,
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      
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

const StatusBadge = ({ children, status }: Props) => {
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

export default StatusBadge;