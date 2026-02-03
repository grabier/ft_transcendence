import React, { useMemo } from 'react';
import { Box, keyframes } from '@mui/material';

const floatUp = keyframes`
  0% { top: 100%; opacity: 0; transform: rotate(0deg); }
  10% { opacity: 0.8; }
  90% { opacity: 0.5; }
  100% { top: -10%; opacity: 0; transform: rotate(360deg); }
`;

interface SceneProps {
    isActive: boolean;
}

export const BreakerPanel: React.FC<SceneProps> = ({ isActive }) => {
    const cubes = useMemo(() => Array.from({ length: 15 }).map((_, i) => {
        const left = `${Math.random() * 90 + 5}%`;
        const delay = `${Math.random() * 5}s`;
        const duration = `${15 + Math.random() * 10}s`;
        const size = Math.random() * 30 + 10;
        return { i, left, delay, duration, size };
    }), []);

    return (
        <Box sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', background: 'linear-gradient(to top, #111, #000)' }}>

            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cubes.map((cube) => (
                    <Box
                        key={cube.i}
                        sx={{
                            position: 'absolute',
                            border: '1px solid rgba(255,255,255,0.4)',
                            bgcolor: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(4px)',
                            left: cube.left,
                            width: cube.size,
                            height: cube.size,
                            animation: isActive ? `${floatUp} ${cube.duration} linear infinite` : 'none',
                            animationDelay: cube.delay,
                            opacity: 0,
                            top: '100%'
                        }}
                    />
                ))}
            </Box>
            <Box sx={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,0.1) 50%), linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))',
                zIndex: 20,
                backgroundSize: '100% 2px, 3px 100%',
                pointerEvents: 'none',
                opacity: 0.2
            }} />
        </Box>
    );
};