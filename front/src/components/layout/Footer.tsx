import { Box, Container, Typography } from "@mui/material";
import { useTranslation } from 'react-i18next';

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
				<Box sx={{ p: 0.5 }}>
					<Typography sx={{ color: "inherit", fontWeight: 700, fontSize: "0.875rem" }}>
						{t('footer.copyright')}
					</Typography>
				</Box>
			</Container>
		</Box>
	);
};

export default Footer;
