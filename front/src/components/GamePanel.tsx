import React from 'react';
import { Box, Typography } from '@mui/material';
import ButtonGame from './ButtonGame';
// Importamos las escenas atomizadas
import { PongPanel } from './PongPanel';
import { BreakerPanel } from './BreakPanel';

interface GamePanelProps {
  title: string;
  highlightWord: string;
  subtitle: string;
  buttons: string[];
  align: 'left' | 'right';
  isActive: boolean;
  isPeerActive: boolean;
  onHover: () => void;
  onLeave: () => void;
  onOptionSelect: (option: string) => void;
}

const GamePanel: React.FC<GamePanelProps> = ({
  title, highlightWord, subtitle, buttons, align,
  isActive, isPeerActive,
  onHover, onLeave, onOptionSelect,
}) => {
  const isLeft = align === 'left';
  const shadowColor = 'rgba(255, 255, 255, 0.6)';
  const baseBgColor = isLeft ? 'common.black' : '#0a0a0a';
  const highlightColor = isLeft ? 'grey.400' : 'grey.500';

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const topThreshold = rect.height * 0.15;
    const bottomThreshold = rect.height * 0.85;

    if (y > topThreshold && y < bottomThreshold) {
      if (!isActive) onHover();
    } else {
      if (isActive) onLeave();
    }
  };

  return (
    <Box
      component="section"
      onMouseMove={handleMouseMove}
      onMouseLeave={onLeave}
      onFocus={onHover} // Accesibilidad: Activar con teclado
      onBlur={onLeave}  // Accesibilidad: Desactivar al salir
      tabIndex={0}      // Accesibilidad: Hacemos el panel focuseable
      sx={{
        position: 'relative',
        height: { xs: '50%', md: '100%' },
        width: { xs: '100%', md: isActive ? '75%' : isPeerActive ? '25%' : '50%' },
        transition: 'width 500ms ease-out, flex-grow 500ms ease-out',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        bgcolor: baseBgColor,
        borderBottom: { xs: '2px solid', md: 'none' },
        borderRight: { xs: 'none', md: '1px solid' },
        borderColor: 'grey.800',
        zIndex: 10,
        outline: 'none', // Quitamos el borde azul por defecto del focus
      }}
    >
      {/* Dynamic Background Scene */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, transition: 'opacity 700ms', opacity: isActive ? 1 : 0.3, filter: isActive ? 'none' : 'grayscale(100%)' }}>
        {isLeft ? (
            <PongPanel isActive={isActive} /> 
        ) : (
            <BreakerPanel isActive={isActive} />
        )}
      </Box>

      {/* Main Content Container */}
      <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 4, width: '100%', maxWidth: 'md' }}>
        
        {/* Title */}
        <Box sx={{ transform: isActive ? 'translateY(0) scale(1)' : 'translateY(32px) scale(1.1)', transition: 'all 500ms' }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Montserrat", sans-serif', fontWeight: 900,
              fontSize: { xs: '3.75rem', md: '6rem' },
              textTransform: 'uppercase', letterSpacing: '-0.05em', mb: 1, color: 'white', position: 'relative',
              textShadow: isActive ? `0 0 30px ${shadowColor}` : '0 0 10px rgba(255,255,255,0.2)',
              transition: 'text-shadow 500ms'
            }}
          >
            {title} <Box component="span" sx={{ color: highlightColor, display: 'inline-block' }}>{highlightWord}</Box>
          </Typography>
        </Box>

        {/* Subtitle & Buttons */}
        <Box sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
          transition: 'all 500ms', opacity: isActive ? 1 : 0,
          transform: isActive ? 'translateY(0)' : 'translateY(16px)',
          pointerEvents: isActive ? 'auto' : 'none'
        }}>
          <Typography variant="body1" sx={{ fontSize: { xs: '1.5rem', md: '1.875rem' }, mb: 5, maxWidth: '36rem', color: 'grey.400', fontWeight: 300, letterSpacing: '0.025em' }}>
            {subtitle}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, width: '100%', justifyContent: 'center', mt: 3 }}>
            {buttons.map((label, idx) => (
              <Box
                key={label}
                sx={{
                  transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                  opacity: isActive ? 1 : 0,
                  transition: 'all 300ms ease-out',
                  transitionDelay: isActive ? `${idx * 75}ms` : '0ms'
                }}
              >
                <ButtonGame
                  label={label}
                  fillDirection={isLeft ? 'left-to-right' : 'right-to-left'}
                  onClick={() => onOptionSelect(label)}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Peer Active Vertical Text */}
      {isPeerActive && (
        <Box sx={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, pointerEvents: 'none',
          bgcolor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', transition: 'opacity 300ms'
        }}>
          <Typography variant="h4" sx={{
            fontFamily: '"Montserrat", sans-serif', fontWeight: 'bold', fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.5em',
            color: 'grey.500', transform: 'rotate(90deg)', whiteSpace: 'nowrap'
          }}>
            {title}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GamePanel;