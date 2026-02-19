import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Slider, Typography, Box } from '@mui/material';

interface ScoreModalProps {
	open: boolean;
	mode: string | null;
	onClose: () => void;
	onStart: (score: number) => void;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ open, mode, onClose, onStart }) => {
	const [score, setScore] = useState<number>(5);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			slotProps={{
				paper: {
					sx: {
						bgcolor: '#1a1a1a',
						color: 'white',
						border: '1px solid #333',
						minWidth: '300px',
						textAlign: 'center',
						boxShadow: '0 0 50px rgba(0,0,0,0.9)'
					}
				}
			}}
		>
			<DialogTitle sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 'bold' }}>
				Set Game
			</DialogTitle>

			<DialogContent>
				<Typography gutterBottom sx={{ color: 'grey.400', mb: 4 }}>
					Mode: <span style={{ color: '#fff', fontWeight: 'bold' }}>{mode === 'ai' ? 'VS IA' : '1 VS 1'}</span>
				</Typography>

				<Typography gutterBottom>
					Points to win: <strong>{score}</strong>
				</Typography>

				<Box sx={{ px: 2, mt: 2 }}>
					<Slider
						value={score}
						onChange={(_, val) => setScore(val as number)}
						step={1}
						marks
						min={3}
						max={21}
						valueLabelDisplay="auto"
						sx={{
							color: 'white',
							'& .MuiSlider-mark': { backgroundColor: '#bfbfbf' },
							'& .MuiSlider-track': { border: 'none' },
							'& .MuiSlider-thumb': {
								backgroundColor: '#fff',
								'&:hover, &.Mui-focusVisible': {
									boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)',
								},
							},
						}}
					/>
				</Box>
			</DialogContent>

			<DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
				<Button onClick={onClose} sx={{ color: 'grey.500' }}>
					CANCEL
				</Button>
				<Button
					onClick={() => onStart(score)}
					variant="contained"
					sx={{
						bgcolor: 'white',
						color: 'black',
						fontWeight: 'bold',
						'&:hover': { bgcolor: 'grey.300' }
					}}
				>
					START GAME
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ScoreModal;