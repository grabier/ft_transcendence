import { Box, Container, Typography, Link as MuiLink } from "@mui/material";
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from "react-router-dom";

const Footer = () => {

	const { t } = useTranslation();

	return (
		<Box
			component="footer"
			sx={{
				bgcolor: "primary.main",
				color: "secondary.main",
				py: 2,
				px: 2,
				mt: "auto",
			}}
		>
			<Container
				sx={{
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					justifyContent: "space-between",
					alignItems: "center",
					gap: 4,
				}}
			>
				<Box
					component="img"
					src="/assets/lyrics-logo.png"
					alt="Transcendence"
					sx={{ height: 40, filter: "invert(1)" }}
				/>
				<Box sx={{ p: 0.5, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-end' } }}>
					<Typography sx={{ color: "inherit", fontWeight: 700, fontSize: "0.875rem" }}>
						{t('footer.copyright')}
					</Typography>
					<Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
						<MuiLink 
							component={RouterLink} 
							to="/terms" 
							sx={{ 
								color: 'rgba(255,255,255,0.6)', 
								fontSize: '0.8rem', 
								textDecoration: 'none', 
								'&:hover': { color: '#00ff66', textDecoration: 'underline' },
								cursor: 'pointer'
							}}
						>
							Términos de Servicio
						</MuiLink>
						<Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>|</Typography>
						<MuiLink 
							component={RouterLink} 
							to="/privacy" 
							sx={{ 
								color: 'rgba(255,255,255,0.6)', 
								fontSize: '0.8rem', 
								textDecoration: 'none', 
								'&:hover': { color: '#00ff66', textDecoration: 'underline' },
								cursor: 'pointer'
							}}
						>
							Política de Privacidad
						</MuiLink>
						<Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>|</Typography>
						<MuiLink 
							component={RouterLink} 
							to="/about" 
							sx={{ 
								color: 'rgba(255,255,255,0.6)', 
								fontSize: '0.8rem', 
								textDecoration: 'none', 
								'&:hover': { color: '#00ff66', textDecoration: 'underline' },
								cursor: 'pointer'
							}}
						>
							Sobre Nosotros
						</MuiLink>
					</Box>
				</Box>
			</Container>
		</Box>
	);
};

export default Footer;
