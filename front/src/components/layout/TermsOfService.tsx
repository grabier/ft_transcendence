import { Container, Typography, Paper, Box, Divider, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TermsOfService = () => {
	const navigate = useNavigate();
	const { t, i18n } = useTranslation();

	return (
		<Container maxWidth="md" sx={{ py: 6 }}>
			<Button
				onClick={() => navigate(-1)}
				sx={{ mb: 4, color: 'grey.400', '&:hover': { color: 'white' } }}
			>
				{t('termsOfService.backButton')}
			</Button>

			<Paper
				elevation={24}
				sx={{
					p: { xs: 4, md: 6 },
					bgcolor: '#0a0a0a',
					color: 'grey.300',
					border: '1px solid #333',
					borderRadius: 2
				}}
			>
				<Typography variant="h3" component="h1" sx={{ color: 'white', fontWeight: 'bold', mb: 1, fontFamily: '"Montserrat", sans-serif' }}>
					{t('termsOfService.title')}
				</Typography>
				<Typography variant="subtitle1" sx={{ color: '#00ff66', mb: 4, fontFamily: '"Montserrat", sans-serif' }}>
					{t('termsOfService.subtitle')}
				</Typography>

				<Box sx={{ mb: 4 }}>
					<Typography variant="body1" paragraph dangerouslySetInnerHTML={{ __html: t('termsOfService.intro') }} />
				</Box>

				<Divider sx={{ borderColor: 'grey.800', mb: 4 }} />

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						{t('termsOfService.section1Title')}
					</Typography>
					<Typography variant="body2" paragraph dangerouslySetInnerHTML={{ __html: t('termsOfService.section1Content') }} />
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						{t('termsOfService.section2Title')}
					</Typography>
					<Typography variant="body2" paragraph>
						{t('termsOfService.section2Para1')}
					</Typography>
					<Typography variant="body2" paragraph>
						{t('termsOfService.section2Para2')}
					</Typography>
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						{t('termsOfService.section3Title')}
					</Typography>
					<Typography variant="body2" paragraph>
						{t('termsOfService.section3Intro')}
					</Typography>
					<Box component="ul" sx={{ pl: 3, mb: 2 }}>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>
							{t('termsOfService.section3Item1')}
						</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>
							{t('termsOfService.section3Item2')}
						</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }} dangerouslySetInnerHTML={{ __html: t('termsOfService.section3Item3') }} />
					</Box>
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						{t('termsOfService.section4Title')}
					</Typography>
					<Typography variant="body2" paragraph>
						{t('termsOfService.section4Content')}
					</Typography>
				</Box>

				<Divider sx={{ borderColor: 'grey.800', my: 4 }} />

				<Box sx={{ textAlign: 'center', opacity: 0.7 }}>
					<Typography variant="body2">
						{t('termsOfService.footerDeveloped')}
					</Typography>
					<Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
						{t('termsOfService.footerTeam')}
					</Typography>
					<Typography variant="caption" display="block" sx={{ mt: 2 }}>
						{t('termsOfService.footerLastUpdate')} {new Date().toLocaleDateString(i18n.language)}
					</Typography>
				</Box>
			</Paper>
		</Container>
	);
};

export default TermsOfService;