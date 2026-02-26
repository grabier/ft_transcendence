import { Container, Typography, Paper, Box, Grid, Button, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const teamMembers = [
	{
		player: 'PLAYER 1',
		login: 'gmontoro',
		name: 'Gabriel Montoro Hazañas',
		github: 'https://github.com/grabier'
	},
	{
		player: 'PLAYER 2',
		login: 'jormoral',
		name: 'Jorge Morales Baldizzone',
		github: 'https://github.com/Baldizzone42'
	},
	{
		player: 'PLAYER 3',
		login: 'jose-rig',
		name: 'José Ricardo Gómez Acebo Yuste',
		github: 'https://github.com/C42joseri'
	},
	{
		player: 'PLAYER 4',
		login: 'ppeckham',
		name: 'Patrick Peckham',
		github: 'https://github.com/patrixampm'
	}
];

const AboutUs = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<Container maxWidth="md" sx={{ py: 6, position: 'relative' }}>
			<Button
				onClick={() => navigate(-1)}
				sx={{
					mb: 4,
					color: '#00ff66',
					fontFamily: '"Montserrat", sans-serif',
					fontWeight: 'bold',
					border: '2px solid #00ff66',
					backgroundColor: 'transparent',
					padding: '8px 24px',
					borderRadius: '0px',
					boxShadow: '0 0 10px rgba(0, 255, 102, 0.4)',
					'&:hover': {
						backgroundColor: 'rgba(0, 255, 102, 0.1)',
						boxShadow: '0 0 20px rgba(0, 255, 102, 0.8)',
						borderColor: '#00ff66',
					}
				}}
			>
				{t('aboutUs.backButton')}
			</Button>

			<Paper
				elevation={0}
				sx={{
					p: { xs: 4, md: 6 },
					bgcolor: '#0a0a0a',
					color: 'grey.400',
					border: '1px solid #1a1a1a',
					borderRadius: 0,
					position: 'relative',
					overflow: 'hidden'
				}}
			>
				<Typography variant="h3" component="h1" sx={{
					color: 'white',
					fontWeight: 'bold',
					mb: 1,
					fontFamily: '"Montserrat", sans-serif',
					textShadow: '0 0 20px rgba(0, 255, 102, 0.5)',
					textAlign: 'center'
				}}>
					{t('aboutUs.title')}
				</Typography>

				<Typography variant="h6" sx={{ color: '#00ff66', mb: 4, letterSpacing: '4px', textAlign: 'center' }}>
					{t('aboutUs.subtitle')}
				</Typography>

				<Box sx={{ mb: 6, textAlign: 'center' }}>
					<Typography variant="body1" sx={{ lineHeight: 1.8, opacity: 0.8 }}>
						{t('aboutUs.description')}
					</Typography>
				</Box>

				<Grid container spacing={4}>
					{teamMembers.map((member, index) => (
						<Grid size={{ xs: 12, sm: 6 }} key={index}>
							<Box sx={{
								p: 3,
								border: '1px solid #333',
								bgcolor: '#111',
								textAlign: 'center',
								transition: 'all 0.3s ease',
								'&:hover': {
									borderColor: '#00ff66',
									boxShadow: '0 0 15px rgba(0, 255, 102, 0.2)',
									transform: 'translateY(-5px)'
								}
							}}>
								<Typography variant="caption" sx={{ color: '#00ff66', letterSpacing: '2px', fontWeight: 'bold' }}>
									{member.player}
								</Typography>
								<Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mt: 1, mb: 0.5 }}>
									{member.login}
								</Typography>
								<Typography variant="body2" sx={{ color: 'grey.500', mb: 3, minHeight: '40px' }}>
									{member.name}
								</Typography>

								<Button
									component={Link}
									href={member.github}
									target="_blank"
									rel="noopener noreferrer"
									sx={{
										color: 'black',
										bgcolor: 'white',
										fontFamily: '"Montserrat", sans-serif',
										fontWeight: 'bold',
										borderRadius: 0,
										'&:hover': { bgcolor: '#e0e0e0' }
									}}
								>
									{t('aboutUs.githubButton')}
								</Button>
							</Box>
						</Grid>
					))}
				</Grid>

			</Paper>
		</Container>
	);
};

export default AboutUs;