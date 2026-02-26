import { Container, Typography, Paper, Box, Divider, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
	const navigate = useNavigate();
	const { t, i18n } = useTranslation();

	return (
		<Container maxWidth="md" sx={{ py: 6 }}>
			<Button
				onClick={() => navigate(-1)}
				sx={{ mb: 4, color: 'grey.400', '&:hover': { color: 'white' } }}
			>
				{t('privacyPolicy.backButton')}
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
					{t('privacyPolicy.title')}
				</Typography>
				<Typography variant="subtitle1" sx={{ color: '#00ff66', mb: 4, fontFamily: '"Montserrat", sans-serif' }}>
					{t('privacyPolicy.subtitle')}
				</Typography>

				<Box sx={{ mb: 4 }}>
					<Typography variant="body1" paragraph dangerouslySetInnerHTML={{ __html: t('privacyPolicy.intro') }} />
				</Box>

				<Divider sx={{ borderColor: 'grey.800', mb: 4 }} />

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						{t('privacyPolicy.section1Title')}
					</Typography>
					<Typography variant="body2" paragraph>
						{t('privacyPolicy.section1Intro')}
					</Typography>
					<Box component="ul" sx={{ pl: 3, mb: 2 }}>
						<Typography component="li" variant="body2" sx={{ mb: 1 }} dangerouslySetInnerHTML={{ __html: t('privacyPolicy.section1Item1') }} />
						<Typography component="li" variant="body2" sx={{ mb: 1 }} dangerouslySetInnerHTML={{ __html: t('privacyPolicy.section1Item2') }} />
						<Typography component="li" variant="body2" sx={{ mb: 1 }} dangerouslySetInnerHTML={{ __html: t('privacyPolicy.section1Item3') }} />
						<Typography component="li" variant="body2" sx={{ mb: 1 }} dangerouslySetInnerHTML={{ __html: t('privacyPolicy.section1Item4') }} />
					</Box>
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						{t('privacyPolicy.section2Title')}
					</Typography>
					<Typography variant="body2" paragraph dangerouslySetInnerHTML={{ __html: t('privacyPolicy.section2Intro') }} />
					<Box component="ul" sx={{ pl: 3, mb: 2 }}>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>{t('privacyPolicy.section2Item1')}</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>{t('privacyPolicy.section2Item2')}</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>{t('privacyPolicy.section2Item3')}</Typography>
					</Box>
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						{t('privacyPolicy.section3Title')}
					</Typography>
					<Typography variant="body2" paragraph dangerouslySetInnerHTML={{ __html: t('privacyPolicy.section3Content') }} />
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						{t('privacyPolicy.section4Title')}
					</Typography>
					<Typography variant="body2" paragraph>
						{t('privacyPolicy.section4Content')}
					</Typography>
				</Box>

				<Divider sx={{ borderColor: 'grey.800', my: 4 }} />

				<Box sx={{ textAlign: 'center', opacity: 0.7 }}>
					<Typography variant="body2">
						{t('privacyPolicy.footerDeveloped')}
					</Typography>
					<Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
						{t('privacyPolicy.footerTeam')}
					</Typography>
					<Typography variant="caption" display="block" sx={{ mt: 2 }}>
						{t('privacyPolicy.footerLastUpdate')} {new Date().toLocaleDateString(i18n.language)}
					</Typography>
				</Box>
			</Paper>
		</Container>
	);
};

export default PrivacyPolicy;