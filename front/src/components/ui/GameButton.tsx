import { Box, Typography, Stack } from '@mui/material'; // Importamos Stack
import LockIcon from '@mui/icons-material/Lock'; // Importamos el icono del candado

interface Props {
    label: string;
    fillDirection?: 'left-to-right' | 'right-to-left';
    onClick?: () => void;
    disabled?: boolean;
}

const ButtonGame = ({ label, fillDirection = 'left-to-right', onClick, disabled = false }: Props) => {
    return (
        <Box
            component="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            sx={{
                position: 'relative',
                overflow: 'hidden',
                px: 4,
                py: 1.5,
                bgcolor: 'transparent',
                border: '1px solid',
                borderColor: disabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.4)',
                color: disabled ? 'rgba(255, 255, 255, 0.3)' : 'white',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                transition: 'all 200ms',
                cursor: disabled ? 'default' : 'pointer',
                outline: 'none',
                ...(disabled ? {} : {
                    '&:hover': {
                        borderColor: 'white',
                        transform: 'scale(1.05)',
                        '& .hover-fill': {
                            transform: 'translateX(0)',
                        },
                        '& .btn-text': {
                            color: 'black',
                        }
                    },
                    '&:active': {
                        transform: 'scale(0.95)',
                    },
                })
            }}
        >
            <Stack 
                direction="row" 
                alignItems="center" 
                spacing={1} 
                className="btn-text"
                sx={{
                    position: 'relative',
                    zIndex: 10,
                    justifyContent: 'center' 
                }}
            >
                {disabled && <LockIcon sx={{ fontSize: '1rem' }} />}
                
                <Typography
                    component="span"
                    sx={{
                        transition: 'color 200ms',
                        fontWeight: 'bold',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        letterSpacing: 'inherit',
                    }}
                >
                    {label}
                </Typography>
            </Stack>

            {!disabled && (
                <Box
                    className="hover-fill"
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'white',
                        transform: fillDirection === 'left-to-right' ? 'translateX(-100%)' : 'translateX(100%)',
                        transition: 'transform 200ms ease-out',
                    }}
                />
            )}
        </Box>
    );
};

export default ButtonGame;