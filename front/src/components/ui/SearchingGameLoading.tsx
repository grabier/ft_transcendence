import { Box, styled, Typography } from '@mui/material';

const RotatingAvatar = styled('img')(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  boxShadow: theme.shadows[3],
  animation: 'spin 3s linear infinite',
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
}));

export const SearchingGameLoading = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={3}
      sx={{ p: 4, width: '100%', height: '100%' }}
    >
      <RotatingAvatar src="/assets/mecki.png" alt="Buscando partida" />
      
      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 'bold' }}>
        Buscando oponente...
      </Typography>
    </Box>
  );
};