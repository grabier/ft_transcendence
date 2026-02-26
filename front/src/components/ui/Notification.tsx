import { Snackbar, Box, Typography, IconButton, Slide, type SlideProps } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { styled, useTheme } from "@mui/material/styles";
import { useTranslation } from 'react-i18next';

// 1. Añadimos el tipo de variante a las Props
export type NotificationType = "success" | "error" | "info" | "warning";

interface Props {
	open: boolean;
	message: string;
	type?: NotificationType; // Por defecto lo haremos "info" si no se pasa
	onClose: () => void;
}

function SlideTransition(props: SlideProps) {
	return <Slide {...props} direction="up" />;
}

// 2. Diccionario de configuración para iconos y colores según el tipo
const configMap = {
	success: { icon: CheckCircleOutlineIcon, colorKey: "success.main", title: "system.success" },
	error: { icon: ErrorOutlineIcon, colorKey: "error.main", title: "system.error" },
	info: { icon: InfoOutlinedIcon, colorKey: "info.main", title: "system.info" },
	warning: { icon: WarningAmberIcon, colorKey: "warning.main", title: "system.warning" },
};

// 3. Estilos adaptables (ya no está hardcodeado al color de error)
const NotificationCard = styled(Box, {
	shouldForwardProp: (prop) => prop !== "$bgColor",
})<{ $bgColor: string }>(({ theme, $bgColor }) => ({
	minWidth: "300px",
	backgroundColor: "#FFFFFF",
	border: `3px solid ${theme.palette.text.primary}`,
	boxShadow: `8px 8px 0px 0px ${$bgColor}`,
	display: "flex",
	flexDirection: "column",
	position: "relative",
	overflow: "hidden",
}));

const NotificationHeader = styled(Box, {
	shouldForwardProp: (prop) => prop !== "$bgColor",
})<{ $bgColor: string }>(({ theme, $bgColor }) => ({
	backgroundColor: $bgColor,
	color: "#FFFFFF",
	padding: "4px 12px",
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	borderBottom: `3px solid ${theme.palette.text.primary}`,
}));

const Notification = ({ open, message, type = "info", onClose }: Props) => {
	const { t } = useTranslation();
	const theme = useTheme();

	// Obtenemos la configuración actual basada en el prop 'type'
	const currentConfig = configMap[type];
	const IconComponent = currentConfig.icon;

	// Resolvemos el color hexadecimal desde el theme de MUI
	const colorType = type === "success" || type === "error" || type === "info" || type === "warning" ? type : "info";
	const headerColor = theme.palette[colorType].main;

	return (
		<Snackbar
			open={open}
			autoHideDuration={6000}
			onClose={onClose}
			TransitionComponent={SlideTransition}
			anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			sx={{ bottom: { xs: 20, sm: 40 } }}
		>
			<NotificationCard $bgColor={headerColor}>
				<NotificationHeader $bgColor={headerColor}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<IconComponent sx={{ fontSize: 20 }} />
						<Typography
							variant="caption"
							sx={{
								fontFamily: "'Space Mono', monospace",
								fontWeight: "bold",
								letterSpacing: "1px",
								textTransform: "uppercase"
							}}
						>
							{/* Deberás añadir estas keys a tus archivos de i18n */}
							{t(currentConfig.title)}
						</Typography>
					</Box>
					<IconButton
						size="small"
						aria-label="close"
						color="inherit"
						onClick={onClose}
						sx={{ padding: 0 }}
					>
						<CloseIcon fontSize="small" />
					</IconButton>
				</NotificationHeader>

				<Box sx={{ p: 2, pr: 4, display: "flex", alignItems: "center" }}>
					<Typography
						sx={{
							color: "text.primary",
							fontWeight: 700,
							fontFamily: "'Montserrat', sans-serif",
							fontSize: "0.95rem",
						}}
					>
						{message}
					</Typography>
				</Box>
			</NotificationCard>
		</Snackbar>
	);
};

export default Notification;