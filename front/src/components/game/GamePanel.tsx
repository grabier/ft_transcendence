import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

import ButtonGame from '@/components/ui/GameButton';
import { PongPanel } from '@/components/game/PongPanel';
import { SnakePanel } from '@/components/game/SnakePanel';

interface GamePanelProps {
	title: string;
	highlightWord: string;
	subtitle: string;
	buttons: string[];
	align: 'left' | 'right';
	isActive: boolean;
	isPeerActive: boolean;
	onClick: () => void; // Adiós onHover y onLeave, usamos onClick
	onOptionSelect: (option: string) => void;
}

const GamePanel: React.FC<GamePanelProps> = ({
	title, highlightWord, subtitle, buttons, align,
	isActive, isPeerActive,
	onClick, onOptionSelect,
}) => {
	const isLeft = align === 'left';
	const shadowColor = 'rgba(255, 255, 255, 0.6)';
	const baseBgColor = isLeft ? 'common.black' : '#0a0a0a';
	const highlightColor = isLeft ? 'grey.400' : 'grey.500';

	const [isHovered, setIsHovered] = useState(false);

	// Solo disparamos el evento si el panel no está activo
	const handlePanelClick = (e: React.MouseEvent) => {
		if (!isActive) {
			e.stopPropagation(); // Evita que el click llegue al contenedor padre
			onClick();
		}
	};

	// Accesibilidad: permitir abrirlo con Enter o Espacio
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if ((e.key === 'Enter' || e.key === ' ') && !isActive) {
			e.preventDefault();
			onClick();
		}
	};
	// is comming custom cursors ??
	//const pongCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32"><rect x="12" y="4" width="8" height="24" fill="white"/></svg>') 16 16, crosshair`;
	//const snakeCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32"><rect x="6" y="6" width="20" height="20" fill="%2300ff66"/></svg>') 16 16, crosshair`;
	return (
		<Box
			component="section"
			onClick={handlePanelClick}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
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
				outline: 'none',
				cursor: isActive ? 'default' : isLeft //? pongCursor : snakeCursor,
			}}
		>
			{/* Dynamic Background Scene */}
			<Box sx={{
				position: 'absolute',
				inset: 0,
				zIndex: 0,
				transition: 'all 700ms ease',
				opacity: isActive ? 1 : isHovered ? 0.7 : 0.3,
				filter: isActive ? 'none' : isHovered ? 'grayscale(40%)' : 'grayscale(100%)',
				transform: isHovered && !isActive ? 'scale(1.02)' : 'scale(1)'
			}}>
				{isLeft ? (
					<PongPanel isActive={isActive || isHovered} />
				) : (
					<SnakePanel isActive={isActive || isHovered} />
				)}
			</Box>
			{/* Main Content Container */}
			<Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 4, width: '100%', maxWidth: 'md' }}>

				{/* Title */}
				<Box sx={{ transform: isActive ? 'translateY(0) scale(1)' : 'translateY(32px) scale(1.1)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
					<Typography
						variant="h2"
						sx={{
							fontFamily: '"Montserrat", sans-serif', fontWeight: 900,
							fontSize: { xs: '3.75rem', md: '6rem' },
							textTransform: 'uppercase', letterSpacing: '-0.05em', mb: 1, color: 'white', position: 'relative',
							textShadow: isActive
								? `0 0 30px ${shadowColor}`
								: isHovered
									? `0 0 40px ${isLeft ? 'rgba(255,255,255,0.8)' : 'rgba(0,255,102,0.8)'}, 0 0 10px ${isLeft ? 'white' : '#00ff66'}`
									: '0 0 10px rgba(255,255,255,0.2)',

							transition: 'text-shadow 500ms ease-out'
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
									onClick={(e: React.MouseEvent) => {
										e.stopPropagation(); // Evitamos que el click en el botón expanda/cierre el panel
										onOptionSelect(label);
									}}
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