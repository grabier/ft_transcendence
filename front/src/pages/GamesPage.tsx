import React, { useState } from 'react';
import { Box } from '@mui/material';
import GamePanel from '../components/GamePanel';
import ScoreModal from '../components/ScoreModal';
import { loadGame } from '../game';

const GamesPage: React.FC = () => {
    const [leftActive, setLeftActive] = useState(false);
    const [rightActive, setRightActive] = useState(false);

	const [modalOpen, setModalOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState<'pvp' | 'ai' | null>(null);

    const handlePongSelection = (option: string) => {
		const modeStr = option.trim().toUpperCase();
        let mode: 'pvp' | 'ai' | null = null;
        if (modeStr === 'IA')
			mode = 'ai';
        else if (modeStr === '1V1')
			mode = 'pvp';

        if (mode) {
			setSelectedMode(mode);
            setModalOpen(true);
        }
    };

    const handleStartGame = (score: number) => {
		if (selectedMode) {
			setModalOpen(false);
            loadGame(selectedMode, score);
        } 
    };

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
                buttons={['IA ', 'Tournament', '1v1',]}
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
                buttons={['IA ', 'Tournament', '1v1',]}
                align="right"
                isActive={rightActive}
                isPeerActive={leftActive}
                onHover={() => setRightActive(true)}
                onLeave={() => setRightActive(false)}
            />
        </Box>
    );
};

export default GamesPage;
