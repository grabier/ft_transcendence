import { Snackbar, Box, Typography, IconButton, Slide, type SlideProps } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { styled } from "@mui/material/styles";

interface Props {
    open: boolean;
    message: string;
    onClose: () => void;
}

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="up" />;
}

const ErrorCard = styled(Box)(({ theme }) => ({
    minWidth: "300px",
    backgroundColor: "#FFFFFF",
    border: `3px solid ${theme.palette.text.primary}`,
    boxShadow: `8px 8px 0px 0px ${theme.palette.error.main}`,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
}));

const ErrorHeader = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.error.main,
    color: "#FFFFFF",
    padding: "4px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `3px solid ${theme.palette.text.primary}`,
}));

// 1. Pasamos las Props a la función
const AuthErrorNotification = ({ open, message, onClose }: Props) => {
    return (
        <Snackbar
            open={open} // 2. Usamos el prop 'open'
            autoHideDuration={6000}
            onClose={onClose} // 3. Cerramos al pasar el tiempo
            TransitionComponent={SlideTransition}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            sx={{ bottom: { xs: 20, sm: 40 } }}
        >
            <ErrorCard>
                <ErrorHeader>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ErrorOutlineIcon sx={{ fontSize: 20 }} />
                        <Typography
                            variant="caption"
                            sx={{
                                fontFamily: "'Space Mono', monospace",
                                fontWeight: "bold",
                                letterSpacing: "1px",
                            }}
                        >
                            SYSTEM_ERROR
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        aria-label="close"
                        color="inherit"
                        onClick={onClose} // 4. Cerramos al hacer clic en la X
                        sx={{ padding: 0 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </ErrorHeader>

                <Box sx={{ p: 2, pr: 4, display: "flex", alignItems: "center" }}>
                    <Typography
                        sx={{
                            color: "text.primary",
                            fontWeight: 700,
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: "0.95rem",
                        }}
                    >
                        {message} {/* 5. Renderizamos el mensaje dinámico */}
                    </Typography>
                </Box>
            </ErrorCard>
        </Snackbar>
    );
};

export default AuthErrorNotification;