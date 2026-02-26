import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';

import GamePanel from '@/components/game/GamePanel';
import ScoreModal from '@/components/game/ScoreModal';
import PongGame from '@/components/game/PongGame';
import SnakeGame from '@/components/game/SnakeGame';
import { useAuth } from '@/context/AuthContext';

const GamesPage = () => {
	const { t } = useTranslation();
	const { user } = useAuth();
	
	const [expandedPanel, setExpandedPanel] = useState<'pong' | 'snake' | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [selectedMode, setSelectedMode] = useState<'pvp' | 'ai' | 'local' | null>(null);
	const [selectedGame, setSelectedGame] = useState<'pong' | 'snake' | null>(null);
	const [scoreToWin, setScoreToWin] = useState(5);
	const [roomId, setRoomId] = useState<string | null>(null);

	const [isPlaying, setIsPlaying] = useState(false);
	const [gameKey, setGameKey] = useState(0); 

	const location = useLocation();
	const navigate = useNavigate();

	// --- 1. EL TRUCO LIMPIO PARA EL BOTÓN ATRÁS ---
	useEffect(() => {
		// Al arrancar la partida, metemos un evento invisible en el navegador. 
		// ¡La URL NO cambia!
		if (isPlaying) {
			window.history.pushState({ internal: 'game_active' }, '');
		}

		// Si el usuario presiona la flecha de "Atrás" en su navegador, salta este evento
		const handlePopState = () => {
			if (isPlaying) {
				setIsPlaying(false);
				setRoomId(null);
				setSelectedGame(null);
			}
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, [isPlaying]);

	// --- 2. EFECTO PARA LAS INVITACIONES DEL CHAT ---
	useEffect(() => {
		const state = location.state as any;
		
		if (state?.gameParam && state?.modeParam) {
			if (state.gameParam === 'snake') setSelectedGame('snake');
			else setSelectedGame('pong');

			setSelectedMode(state.modeParam);
			if (state.roomIdParam) setRoomId(state.roomIdParam);
			if (state.scoreParam) setScoreToWin(parseInt(state.scoreParam));

			setModalOpen(false);
			setIsPlaying(true); // Esto lanzará automáticamente el pushState del efecto de arriba
			
			// Vaciamos el estado del router para no generar bucles si recargas la página
			navigate(location.pathname, { replace: true, state: {} });
		}
	}, [location, navigate]);

	// Cerrar paneles al hacer click fuera
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setExpandedPanel(null); 
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// --- HANDLERS ---
	const handleGameSelection = (game: 'pong' | 'snake', option: string) => {
		setSelectedGame(game); 
		const modeStr = option.trim().toUpperCase();
		let mode: 'pvp' | 'ai' | 'local' | null = null;

		if (modeStr.includes('IA')) mode = 'ai';
		else if (modeStr === '1V1') mode = 'pvp';
		else if (modeStr === 'LOCAL') mode = 'local';

		if (mode) {
			setSelectedMode(mode);
			if (mode === 'pvp') {
				setScoreToWin(5);
				setIsPlaying(true); 
			} else {
				setModalOpen(true);
			}
		}
	};

	const handleStartGame = (score: number) => {
		if (selectedMode && selectedGame) {
			setScoreToWin(score);
			setIsPlaying(true);
			setModalOpen(false);
		}
	};

	const handleExitGame = () => {
		// En lugar de tocar estados a mano, forzamos un paso atrás en el historial.
		// Esto dispara el 'popstate' y se encarga de apagar todo limpiamente de golpe.
		window.history.back();
	};

	const handleRestartGame = () => {
		if (selectedGame && selectedMode) {
			setRoomId(null); 
			setGameKey(prev => prev + 1); 
		}
	};

	// --- RENDERIZADO DEL JUEGO ---
	if (isPlaying && selectedMode && selectedGame) {
		return (
			<Box sx={{
				position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
				bgcolor: 'black', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
			}}>
				{selectedGame === 'pong' ? (
					<PongGame
						key={`pong-${gameKey}`}
						mode={selectedMode}
						scoreToWin={scoreToWin}
						roomId={roomId || undefined}
						onExit={handleExitGame}
						onRestart={handleRestartGame}
					/>
				) : (
					<SnakeGame
						key={`snake-${gameKey}`}
						mode={selectedMode}
						scoreToWin={scoreToWin}
						roomId={roomId || undefined}
						onExit={handleExitGame}
						onRestart={handleRestartGame}
					/>
				)}
			</Box>
		);
	}

	// --- RENDERIZADO DEL MENÚ ---
	return (
		<Box ref={containerRef}
			onClick={() => setExpandedPanel(null)}
			sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, bgcolor: 'common.black' }}>

			<ScoreModal
				open={modalOpen}
				mode={selectedMode}
				onClose={() => setModalOpen(false)}
				onStart={handleStartGame}
			/>

			<GamePanel
				title="PONG"
				highlightWord="CLASSIC"
				subtitle={t('gamesPage.pongSubtitle')}
				buttons={['IA ', 'Local', '1v1']}
				align="left"
				isActive={expandedPanel === 'pong'}
				isPeerActive={expandedPanel === 'snake'}
				onClick={() => setExpandedPanel('pong')} 
				onOptionSelect={(opt) => handleGameSelection('pong', opt)}
				userLoggedIn={!!user} 
			/>

			<GamePanel
				title="SNAKE"
				highlightWord="NEON"
				subtitle={t('gamesPage.snakeSubtitle')}
				buttons={['IA ', 'Local', '1v1']}
				align="right"
				isActive={expandedPanel === 'snake'}
				isPeerActive={expandedPanel === 'pong'}
				onClick={() => setExpandedPanel('snake')} 
				onOptionSelect={(opt) => handleGameSelection('snake', opt)}
				userLoggedIn={!!user}
			/>
		</Box>
	);
};

export default GamesPage;