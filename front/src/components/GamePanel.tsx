import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import ButtonGame from './ButtonGame';

// Keyframes
const gridMove = keyframes`
  0% { transform: rotateX(60deg) translateY(0); }
  100% { transform: rotateX(60deg) translateY(80px); }
`;

const floatUp = keyframes`
  0% { top: 100%; opacity: 0; transform: rotate(0deg); }
  10% { opacity: 0.8; }
  90% { opacity: 0.5; }
  100% { top: -10%; opacity: 0; transform: rotate(360deg); }
`;

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
}

const GamePanel: React.FC<GamePanelProps> = ({
  title,
  highlightWord,
  subtitle,
  buttons,
  align,
  isActive,
  isPeerActive,
  onHover,
  onLeave,
}) => {
  const isLeft = align === 'left';
  const shadowColor = 'rgba(255, 255, 255, 0.6)';

  // 1. Pong Scene (Left) - White Grid on Black
  const PongScene = () => (
    <Box sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1000px' }}>
        {/* White Grid Floor */}
        <Box
          sx={{
            width: '200%',
            height: '200%',
            position: 'absolute',
            bottom: '-50%',
            backgroundImage: `linear-gradient(transparent 0%, rgba(255,255,255,0.1) 1px, transparent 2px), linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 1px, transparent 2px)`,
            backgroundSize: '80px 80px',
            transform: 'rotateX(60deg) translateY(0)',
            animation: isActive ? `${gridMove} 10s linear infinite` : 'none',
          }}
        />
        {/* Center Line */}
        <Box sx={{ width: 4, height: '200%', bgcolor: 'rgba(255,255,255,0.3)', position: 'absolute', left: '50%', transform: 'translateX(-50%) rotateX(60deg)', filter: 'blur(1px)' }} />
      </Box>

      {/* Paddles - Pure White */}
      <Box sx={{
        position: 'absolute', left: 48, top: '50%', width: 8, height: 128, bgcolor: 'white',
        boxShadow: '0 0 15px rgba(255,255,255,0.8)',
        transition: 'all 700ms',
        transform: isActive ? 'translateY(-33%)' : 'translateY(-50%)',
        opacity: isActive ? 1 : 0.2
      }} />
      <Box sx={{
        position: 'absolute', right: 48, top: '50%', width: 8, height: 128, bgcolor: 'white',
        boxShadow: '0 0 15px rgba(255,255,255,0.8)',
        transition: 'all 700ms',
        transitionDelay: '75ms',
        transform: isActive ? 'translateY(25%)' : 'translateY(-50%)',
        opacity: isActive ? 1 : 0.2
      }} />

      {/* Ball - White */}
      <Box sx={{
        position: 'absolute', left: '50%', top: '50%', width: 16, height: 16, bgcolor: 'white', borderRadius: '50%',
        boxShadow: '0 0 20px white', zIndex: 10,
        transition: 'all 500ms',
        transform: isActive ? 'scale(1.5)' : 'scale(1)',
        opacity: isActive ? 1 : 0.2
      }} />
    </Box>
  );

  // 2. Block Breaker Scene (Right) - Grey Cubes / Smoke
  const BreakerScene = () => {
    // Generate floating cubes in grayscale
    const cubes = Array.from({ length: 15 }).map((_, i) => {
      const left = `${Math.random() * 90 + 5}%`;
      const delay = `${Math.random() * 5}s`;
      const duration = `${15 + Math.random() * 10}s`;
      const size = Math.random() * 30 + 10;

      return (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            border: '1px solid rgba(255,255,255,0.4)',
            bgcolor: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(4px)',
            left,
            width: size,
            height: size,
            animation: isActive ? `${floatUp} ${duration} linear infinite` : 'none',
            animationDelay: delay,
            opacity: 0,
            top: '100%'
          }}
        />
      );
    });

    return (
      <Box sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', background: 'linear-gradient(to top, #111, #000)' }}>
        {/* Noise Texture Overlay */}
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {cubes}
        </Box>

        {/* Subtle Scanline */}
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

  const baseBgColor = isLeft ? 'common.black' : '#0a0a0a';
  const highlightColor = isLeft ? 'grey.400' : 'grey.500';

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const topThreshold = rect.height * 0.15; // 15% top margin
    const bottomThreshold = rect.height * 0.85; // 15% bottom margin

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
      sx={{
        position: 'relative',
        height: { xs: '50%', md: '100%' },
        width: { xs: '100%', md: isActive ? '75%' : isPeerActive ? '25%' : '50%' },
        transition: 'width 500ms ease-out, flex-grow 500ms ease-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        bgcolor: baseBgColor,
        borderBottom: { xs: '2px solid', md: 'none' },
        borderRight: { xs: 'none', md: '1px solid' },
        borderColor: 'grey.800',
        zIndex: 10,
      }}
    >
      {/* Dynamic Background Scene */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, transition: 'opacity 700ms', opacity: isActive ? 1 : 0.3, filter: isActive ? 'none' : 'grayscale(100%)' }}>
        {isLeft ? <PongScene /> : <BreakerScene />}
      </Box>

      {/* Main Content Container */}
      <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 4, width: '100%', maxWidth: 'md' }}>

        {/* Title: Always visible, acts as Cover */}
        <Box sx={{
          transform: isActive ? 'translateY(0) scale(1)' : 'translateY(32px) scale(1.1)',
          transition: 'all 500ms'
        }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 900,
              fontSize: { xs: '3.75rem', md: '6rem' }, // 6xl / 8xl
              textTransform: 'uppercase',
              letterSpacing: '-0.05em',
              mb: 1,
              color: 'white',
              position: 'relative',
              textShadow: isActive ? `0 0 30px ${shadowColor}` : '0 0 10px rgba(255,255,255,0.2)',
              transition: 'text-shadow 500ms'
            }}
          >
            {title} <Box component="span" sx={{ color: highlightColor, display: 'inline-block' }}>{highlightWord}</Box>
          </Typography>
        </Box>

        {/* Subtitle & Buttons: Only appear on Hover (Sweep effect) */}
        <Box sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
          transition: 'all 500ms',
          opacity: isActive ? 1 : 0,
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