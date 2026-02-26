import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';

import GamePanel from '@/components/game/GamePanel';
import ScoreModal from '@/components/game/ScoreModal';
import PongGame from '@/components/game/PongGame';
import SnakeGame from '@/components/game/SnakeGame';
import { useAuth } from '@/context/AuthContext'; // <-- Añade esta línea

const GamesPage = () => {
	const { t } = useTranslation();
	const { user } = useAuth();
	
	// UI States
	const [expandedPanel, setExpandedPanel] = useState<'pong' | 'snake' | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Game Config
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedMode, setSelectedMode] = useState<'pvp' | 'ai' | 'local' | null>(null);
	const [selectedGame, setSelectedGame] = useState<'pong' | 'snake' | null>(null);
	const [scoreToWin, setScoreToWin] = useState(5);
	const [roomId, setRoomId] = useState<string | null>(null);

	const [isPlaying, setIsPlaying] = useState(false);
	const [searchParams, setSearchParams] = useSearchParams();
	const [gameKey, setGameKey] = useState(0); 

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

	// --- EFECTO MAESTRO: LA URL ES LA ÚNICA QUE MANDA ---
	useEffect(() => {
		const gameParam = searchParams.get('game');
		const modeParam = searchParams.get('mode');
		const roomIdParam = searchParams.get('roomId');
		const scoreParam = searchParams.get('score');

		// 1. Si la URL tiene juego y NO estamos jugando -> ENCENDEMOS EL JUEGO
		if (gameParam && modeParam && !isPlaying) {
			if (gameParam === 'snake') setSelectedGame('snake');
			else setSelectedGame('pong');

			setSelectedMode(modeParam as any);
			if (roomIdParam) setRoomId(roomIdParam);
			if (scoreParam) setScoreToWin(parseInt(scoreParam));

			setModalOpen(false);
			setIsPlaying(true);
		}
		// 2. Si la URL NO tiene juego (le dimos a Atrás o Salir) y SÍ estamos jugando -> APAGAMOS
		else if (!gameParam && isPlaying) {
			setIsPlaying(false);
			setRoomId(null);
			setSelectedGame(null);
		}
	}, [searchParams, isPlaying]);

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
				// Ponemos la URL. El useEffect detectará esto y arrancará la partida.
				setSearchParams({ game, mode: 'pvp', score: '5' }); 
			} else {
				setSearchParams({});
				setModalOpen(true);
			}
		}
	};

	const handleStartGame = (score: number) => {
		if (selectedMode && selectedGame) {
			setScoreToWin(score);
			// Ponemos la URL. El useEffect detectará esto y arrancará la partida.
			setSearchParams({ game: selectedGame, mode: selectedMode, score: score.toString() });
			setModalOpen(false);
		}
	};

	const handleExitGame = () => {
		// Al limpiar la URL, el useEffect apagará el juego instantáneamente
		setSearchParams({});
	};

	const handleRestartGame = () => {
		if (selectedGame && selectedMode) {
			setSearchParams({
				game: selectedGame,
				mode: selectedMode,
				score: scoreToWin.toString()
			}, { replace: true });
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