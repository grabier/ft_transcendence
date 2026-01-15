import React, { useState } from 'react';
import { Box } from '@mui/material';
import GamePanel from '../components/GamePanel';

const GamesPage: React.FC = () => {
    const [leftActive, setLeftActive] = useState(false);
    const [rightActive, setRightActive] = useState(false);

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, bgcolor: 'common.black' }}>
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
