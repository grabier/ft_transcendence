import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';

import GamePanel from '@/components/game/GamePanel';
import ScoreModal from '@/components/game/ScoreModal';
import PongGame from '@/components/game/PongGame';
// 1. Importamos el nuevo componente del juego
import SnakeGame from '@/components/game/SnakeGame';

const GamesPage = () => {
	const { t } = useTranslation();
	// UI States
	const [expandedPanel, setExpandedPanel] = useState<'pong' | 'snake' | null>(null);
	//Ref main container
	const containerRef = useRef<HTMLDivElement>(null);

	// Game Config
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedMode, setSelectedMode] = useState<'pvp' | 'ai' | 'local' | null>(null);
	// 2. Nuevo estado para saber qué juego se ha seleccionado
	const [selectedGame, setSelectedGame] = useState<'pong' | 'snake' | null>(null);
	const [scoreToWin, setScoreToWin] = useState(5);
	const [roomId, setRoomId] = useState<string | null>(null);

	const [isPlaying, setIsPlaying] = useState(false);
	const [searchParams, setSearchParams] = useSearchParams();

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			// Si el contenedor existe Y el click NO ocurrió dentro de él...
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setExpandedPanel(null); // Reseteamos al 50/50
			}
		};

		// Escuchamos el evento de ratón a nivel de todo el documento
		document.addEventListener('mousedown', handleClickOutside);

		// Función de limpieza vital para no dejar procesos fantasma consumiendo memoria
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// --- EFECTO: DETECTAR INVITACIÓN ---
	useEffect(() => {
		const gameParam = searchParams.get('game'); // Ahora leemos también el juego de la URL
		const modeParam = searchParams.get('mode');
		const roomIdParam = searchParams.get('roomId');
		const scoreParam = searchParams.get('score');

		if (modeParam && roomIdParam) {
			console.log("🔗 Invitación detectada:", gameParam, modeParam, roomIdParam);

			if (gameParam === 'snake') setSelectedGame('snake');
			else setSelectedGame('pong'); // Por defecto Pong si no viene especificado

			if (modeParam === 'pvp' || modeParam === '1v1') setSelectedMode('pvp');
			else if (modeParam === 'ai') setSelectedMode('ai');
			else if (modeParam === 'local') setSelectedMode('local');

			setRoomId(roomIdParam);
			if (scoreParam) setScoreToWin(parseInt(scoreParam));

			setModalOpen(false);
			setIsPlaying(true);
		}
	}, [searchParams]);

	// --- HANDLERS ---
	// 3. Unificamos la selección pasándole el juego como primer parámetro
	const handleGameSelection = (game: 'pong' | 'snake', option: string) => {
		setSearchParams({});
		setRoomId(null);
		setSelectedGame(game); // Guardamos a qué vamos a jugar

		const modeStr = option.trim().toUpperCase();
		let mode: 'pvp' | 'ai' | 'local' | null = null;

		if (modeStr.includes('IA')) mode = 'ai';
		else if (modeStr === '1V1') mode = 'pvp';
		else if (modeStr === 'LOCAL') mode = 'local';

		if (mode) {
			setSelectedMode(mode);
			setModalOpen(true);
		}
	};

	const handleStartGame = (score: number) => {
		if (selectedMode && selectedGame) {
			setScoreToWin(score);
			setModalOpen(false);
			setIsPlaying(true);
		}
	};

	const handleExitGame = () => {
		setIsPlaying(false);
		setRoomId(null);
		setSelectedGame(null); // Reseteamos el juego seleccionado
		setSearchParams({});
	};

	// --- RENDERIZADO DEL JUEGO (MODO PANTALLA COMPLETA) ---
	if (isPlaying && selectedMode && selectedGame) {
		return (
			<Box sx={{
				position: 'fixed',
				top: 0, left: 0,
				width: '100vw', height: '100vh',
				bgcolor: 'black',
				zIndex: 9999,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			}}>
				{/* 4. Renderizado condicional del juego */}
				{selectedGame === 'pong' ? (
					<PongGame
						mode={selectedMode}
						scoreToWin={scoreToWin}
						roomId={roomId || undefined}
						onExit={handleExitGame}
					/>
				) : (
					<SnakeGame
						mode={selectedMode}
						scoreToWin={scoreToWin}
						roomId={roomId || undefined}
						onExit={handleExitGame}
					/>
				)}
			</Box>
		);
	}

	// --- RENDERIZADO DEL MENÚ (NORMAL) ---
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
				onClick={() => setExpandedPanel('pong')} // Expande el panel izquierdo
				onOptionSelect={(opt) => handleGameSelection('pong', opt)}
			/>

			<GamePanel
				title="SNAKE"
				highlightWord="NEON"
				subtitle={t('gamesPage.snakeSubtitle')}
				buttons={['IA ', 'Local', '1v1']}
				align="right"
				isActive={expandedPanel === 'snake'}
				isPeerActive={expandedPanel === 'pong'}
				onClick={() => setExpandedPanel('snake')} // Expande el panel derecho
				onOptionSelect={(opt) => handleGameSelection('snake', opt)}
			/>
		</Box>
	);
};

export default GamesPage;