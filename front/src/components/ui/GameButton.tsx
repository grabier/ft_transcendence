import React from 'react';
import { Box, Typography } from '@mui/material';

interface ButtonProps {
    label: string;
    fillDirection?: 'left-to-right' | 'right-to-left';
	onClick?: () => void;
}

const ButtonGame: React.FC<ButtonProps> = ({ label, fillDirection = 'left-to-right', onClick}) => {
    return (
        <Box
            component="button"
			onClick={onClick}
            sx={{
                position: 'relative',
                overflow: 'hidden',
                px: 4, // px-8
                py: 1.5, // py-3
                bgcolor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em', // tracking-widest
                transition: 'all 200ms',
                cursor: 'pointer',
                outline: 'none',
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
            }}
        >
            {/* Button Text */}
            <Typography
                component="span"
                className="btn-text"
                sx={{
                    position: 'relative',
                    zIndex: 10,
                    transition: 'color 200ms',
                    fontWeight: 'bold',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    letterSpacing: 'inherit',
                }}
            >
                {label}
            </Typography>

            {/* Hover Fill Effect - White swipe */}
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
        </Box>
    );
};

export default ButtonGame;