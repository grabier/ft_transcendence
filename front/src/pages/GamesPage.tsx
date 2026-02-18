import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import GamePanel from '../components/GamePanel';
import ScoreModal from '../components/ScoreModal';
import PongGame from '../components/PongGame';

const GamesPage: React.FC = () => {
	// UI States
	const [leftActive, setLeftActive] = useState(false);
	const [rightActive, setRightActive] = useState(false);

	// Game Config
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedMode, setSelectedMode] = useState<'pvp' | 'ai' | 'local' | null>(null);
	const [scoreToWin, setScoreToWin] = useState(5);
	const [roomId, setRoomId] = useState<string | null>(null); // Para el desafío

	const [isPlaying, setIsPlaying] = useState(false);

	// Hook para leer la URL
	const [searchParams, setSearchParams] = useSearchParams();

	// --- EFECTO: DETECTAR INVITACIÓN (Aceptamos ?mode=pvp&roomId=...) ---
	useEffect(() => {
		const modeParam = searchParams.get('mode');
		const roomIdParam = searchParams.get('roomId');
		const scoreParam = searchParams.get('score');

		if (modeParam && roomIdParam) {
			console.log("🔗 Invitación detectada:", modeParam, roomIdParam);

			// Configuramos el modo
			if (modeParam === 'pvp' || modeParam === '1v1') setSelectedMode('pvp');
			else if (modeParam === 'ai') setSelectedMode('ai');
			else if (modeParam === 'local') setSelectedMode('local');

			setRoomId(roomIdParam);
			if (scoreParam) setScoreToWin(parseInt(scoreParam));

			// ¡Arrancamos directo!
			setModalOpen(false);
			setIsPlaying(true);
		}
	}, [searchParams]);

	// --- HANDLERS ---
	const handlePongSelection = (option: string) => {
		// Limpiamos URL para no arrastrar parámetros viejos
		setSearchParams({});
		setRoomId(null);

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
		if (selectedMode) {
			setScoreToWin(score);
			setModalOpen(false);
			setIsPlaying(true);
		}
	};

	const handleExitGame = () => {
		setIsPlaying(false);
		setRoomId(null);
		setSearchParams({}); // Limpiar URL al salir
	};

	// --- RENDERIZADO DEL JUEGO (MODO PANTALLA COMPLETA) ---
	if (isPlaying && selectedMode) {
		return (
			<Box sx={{
				// 👇 ESTO ARREGLA EL LAYOUT ROTO Y TAPA EL FOOTER
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				bgcolor: 'black',
				zIndex: 9999, // Por encima de todo (Header, Footer, Chat)
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			}}>
				<PongGame
					mode={selectedMode}
					scoreToWin={scoreToWin}
					roomId={roomId || undefined}
					onExit={handleExitGame}
				/>
			</Box>
		);
	}

	// --- RENDERIZADO DEL MENÚ (NORMAL) ---
	return (
		<Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, bgcolor: 'common.black' }}>

			<ScoreModal
				open={modalOpen}
				mode={selectedMode}
				onClose={() => setModalOpen(false)}
				onStart={handleStartGame}
			/>

			<GamePanel
				title="PONG"
				highlightWord="CLASSIC"
				subtitle="The original arcade legend. Pure reflex gaming."
				buttons={['IA ', 'Local', '1v1',]}
				align="left"
				isActive={leftActive}
				isPeerActive={rightActive}
				onHover={() => setLeftActive(true)}
				onLeave={() => setLeftActive(false)}
				onOptionSelect={handlePongSelection}
			/>

			<GamePanel
				title="BLOCK"
				highlightWord="BREAKER"
				subtitle="Break through the chaos. Precision meets destruction."
				buttons={['IA ', 'Local', '1v1',]}
				align="right"
				isActive={rightActive}
				isPeerActive={leftActive}
				onHover={() => setRightActive(true)}
				onLeave={() => setRightActive(false)}
				onOptionSelect={handlePongSelection}
			/>
		</Box>
	);
};

export default GamesPage;