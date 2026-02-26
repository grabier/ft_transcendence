import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Slider, Typography, Box, Fade } from '@mui/material';

interface Props {
	open: boolean;
	mode: 'ai' | 'player' | string | null;
	onClose: () => void;
	onStart: (score: number) => void;
}

const ScoreModal = ({ open, mode, onClose, onStart }: Props) => {
	const [score, setScore] = useState<number>(5);
	const { t } = useTranslation();
	useEffect(() => {
		if (open) {
			setScore(5);
		}
	}, [open]);

	const isAI = mode?.toLowerCase() === 'ai';
	const displayMode = isAI ? t('scoreModal.vsAI') : t('scoreModal.vsPlayer');

	return (
		<Dialog
			open={open}
			onClose={onClose}
			TransitionComponent={Fade}
			transitionDuration={300}
			PaperProps={{
				sx: {
					bgcolor: '#121212',
					color: '#e0e0e0',
					border: '1px solid rgba(255, 255, 255, 0.1)',
					borderRadius: '16px',
					minWidth: '350px',
					textAlign: 'center',
					boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
				}
			}}
		>
			<DialogTitle sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 900, fontSize: '1.5rem', mt: 1 }}>
				{t('scoreModal.title')}
			</DialogTitle>

			<DialogContent sx={{ overflow: 'hidden' }}>
				<Box sx={{ mb: 4, mt: 1, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
					<Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', letterSpacing: '1px' }}>
						{t('scoreModal.mode')}
					</Typography>
					<Typography variant="h6" sx={{ color: isAI ? '#4fc3f7' : '#81c784', fontWeight: 'bold' }}>
						{displayMode}
					</Typography>
				</Box>

				<Typography sx={{ fontSize: '1.1rem', mb: 2 }}>
					{t('scoreModal.pointsToWin')}: <Typography component="span" sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{score}</Typography>
				</Typography>

				<Box sx={{ px: 3, mt: 2 }}>
					<Slider
						value={score}
						onChange={(_, val) => setScore(val as number)}
						step={1}
						marks
						min={3}
						max={21}
						valueLabelDisplay="auto"
						sx={{
							color: '#fff',
							height: 6,
							'& .MuiSlider-mark': { backgroundColor: '#444', height: 4, width: 4, borderRadius: '50%' },
							'& .MuiSlider-markActive': { backgroundColor: '#fff' },
							'& .MuiSlider-track': { border: 'none' },
							'& .MuiSlider-thumb': {
								backgroundColor: '#fff',
								width: 20,
								height: 20,
								'&:hover, &.Mui-focusVisible': {
									boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.1)',
								},
							},
						}}
					/>
				</Box>
			</DialogContent>

			<DialogActions sx={{ justifyContent: 'space-between', px: 4, pb: 4 }}>
				<Button 
					onClick={onClose} 
					sx={{ color: 'grey.500', fontWeight: 'bold', '&:hover': { color: '#fff', bgcolor: 'transparent' } }}
				>
					{t('scoreModal.cancel')}
				</Button>
				<Button
					onClick={() => onStart(score)}
					variant="contained"
					disableElevation
					sx={{
						bgcolor: '#fff',
						color: '#000',
						fontWeight: 'bold',
						borderRadius: '8px',
						px: 3,
						'&:hover': { 
							bgcolor: '#e0e0e0', 
							transform: 'scale(1.05)', 
							transition: 'transform 0.2s ease-in-out' 
						}
					}}
				>
					{t('scoreModal.startGame')}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ScoreModal;