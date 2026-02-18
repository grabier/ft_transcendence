import React from 'react';
import { Box, keyframes } from '@mui/material';

const floatLeft = keyframes`
  0%, 100% { transform: translateY(-50%); }
  50% { transform: translateY(-30%); }
`;

const floatRight = keyframes`
  0%, 100% { transform: translateY(-50%); }
  50% { transform: translateY(-70%); }
`;

const bounceBall = keyframes`
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
`;

interface SceneProps {
    isActive: boolean;
}

// memo sirve para que react no esta renderizando cada vez este componentey se vea fluido
export const PongPanel: React.FC<SceneProps> = React.memo(({ isActive }) => {
    return (
        <Box sx={{ 
            position: 'absolute', 
            inset: 0, 
            width: '100%', 
            height: '100%', 
            overflow: 'hidden', 
            pointerEvents: 'none',
            bgcolor: 'transparent' 
        }}>
            
            <Box sx={{ 
                position: 'absolute', 
                left: '50%', 
                top: '5%', 
                bottom: '5%', 
                width: 0,
                borderLeft: '4px dashed rgba(255,255,255,0.2)', 
                transform: 'translateX(-50%)'
            }} />

            <Box sx={{
                position: 'absolute', left: 48, top: '50%', width: 12, height: 100, bgcolor: 'white',
                boxShadow: '0 0 20px rgba(255,255,255,0.4)',
                animation: isActive ? `${floatLeft} 3s ease-in-out infinite` : 'none',
                transform: 'translateY(-50%)',
                opacity: isActive ? 1 : 0.3,
                transition: 'opacity 500ms', 
            }} />

            <Box sx={{
                position: 'absolute', right: 48, top: '50%', width: 12, height: 100, bgcolor: 'white',
                boxShadow: '0 0 20px rgba(255,255,255,0.4)',
                animation: isActive ? `${floatRight} 3s ease-in-out infinite` : 'none',
                animationDelay: '0.5s',
                transform: 'translateY(-50%)',
                opacity: isActive ? 1 : 0.3,
                transition: 'opacity 500ms',
            }} />

            {/* bolillaaa */}
            <Box sx={{
                position: 'absolute', left: '50%', top: '50%', width: 20, height: 20, bgcolor: 'white', 
                boxShadow: '0 0 25px white', 
                zIndex: 10,
                marginTop: '-10px', 
                marginLeft: '-10px',
                animation: isActive ? `${bounceBall} 2s ease-in-out infinite` : 'none',
                opacity: isActive ? 1 : 0.3,
                transition: 'opacity 500ms',
            }} />
        </Box>
    );
});