import React, { useMemo } from 'react';
import { Box, keyframes } from '@mui/material';

// Animación principal para el movimiento de la cabeza y el cuerpo
const movePerimeter = keyframes`
  0% { top: 10%; left: 10%; }
  25% { top: 10%; left: 85%; }
  50% { top: 85%; left: 85%; }
  75% { top: 85%; left: 10%; }
  100% { top: 10%; left: 10%; }
`;

// Animación para un efecto de "comida" parpadeante
const pulseFood = keyframes`
  0%, 100% { transform: scale(0.8); opacity: 0.5; box-shadow: 0 0 10px rgba(0,255,100,0.2); }
  50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 20px rgba(0,255,100,0.8); }
`;

interface SceneProps {
    isActive: boolean;
}

export const SnakePanel: React.FC<SceneProps> = React.memo(({ isActive }) => {
    // Generamos los segmentos de la serpiente. 
    // Cada segmento tendrá un pequeño retraso en la animación para crear el efecto de cola.
    const snakeSegments = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        delay: `-${i * 0.15}s`, // Retraso negativo para que sigan a la cabeza
        opacity: 1 - (i * 0.1),  // Se difumina hacia el final de la cola
        size: Math.max(10, 20 - i), // La cola se hace un poco más estrecha
    })), []);

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
            {/* Grid de fondo estilo Tron/Arcade */}
            <Box sx={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                zIndex: 0,
                opacity: isActive ? 1 : 0.2,
                transition: 'opacity 700ms',
            }} />

            {/* La Serpiente */}
            {snakeSegments.map((segment) => (
                <Box
                    key={segment.id}
                    sx={{
                        position: 'absolute',
                        width: segment.size,
                        height: segment.size,
                        bgcolor: 'white',
                        boxShadow: segment.id === 0 ? '0 0 20px white' : 'none', // Solo la cabeza brilla fuerte
                        borderRadius: '2px',
                        animation: isActive ? `${movePerimeter} 8s linear infinite` : 'none',
                        animationDelay: segment.delay,
                        opacity: isActive ? segment.opacity : 0.3,
                        transition: 'opacity 500ms',
                        zIndex: 10,
                        marginLeft: '-10px',
                        marginTop: '-10px',
                    }}
                />
            ))}

            {/* Comida de la serpiente (Manzana virtual) */}
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 16,
                height: 16,
                bgcolor: '#00ff66',
                borderRadius: '50%',
                animation: isActive ? `${pulseFood} 1.5s ease-in-out infinite` : 'none',
                opacity: isActive ? 1 : 0.1,
                transition: 'opacity 500ms',
                zIndex: 5,
                transform: 'translate(-50%, -50%)'
            }} />
        </Box>
    );
});