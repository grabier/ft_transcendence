/*import { useContext, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Paper,
    Stack,
    Button,
    IconButton,
    Typography,
} from "@mui/material";
import LoginModal from "../components/LoginModal";

const ProfilePage = () => {
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const handleLogin = async (username: string, password: string) => {
        setIsLoading(true);
        setError("");

        try {
            // const serviceLogin = new ServiceLoginApp(new ServiceLoginApiRest());
            const response = await serviceLogin.doLogin({
                operatorId: username,
                pwd: password,
            });

            if (response.isCorrect) {
                const user: User = {
                    operatorId: response.operatorId,
                    token: response.token,
                    name: response.name,
                };
                navigate("/", { replace: true });
            } else {
                setError(response.errorDescription);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(String(error));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box // Box for the whole page
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage:
                    "url(../../public/backgrounds/login-background.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box // Box for the header
                sx={{
                    display: "flex",
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    py: 2,
                }}
            >
                <Typography
                    variant="h2"
                    sx={{
                        fontWeight: 700,
                        color: "white",
                        minWidth: 80,
                    }}
                >
                    MCS
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                        size="small"
                        sx={{
                            backgroundColor: "grey.500",
                            color: "white",
                            "&:hover": {
                                backgroundColor: "primary.dark",
                            },
                        }}
                        aria-label="language menu"
                    >
                    </IconButton>
                </Box>
            </Box>
            <Box // Box for the welcome paper
                sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Paper
                    sx={{
                        maxWidth: 450,
                        width: "100%",
                        p: 6,
                        textAlign: "center",
                    }}
                >
                    <Stack spacing={3}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontSize: "30px",
                                lineHeight: "40px",
                            }}
                        >
                            Copexa
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontSize: "36px",
                                lineHeight: "46px",
                                color: "text.secondary",
                            }}
                        >
                            Napoli - Salerno
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontSize: "36px",
                                lineHeight: "46px",
                                color: "primary.main",
                            }}
                        >
                            Bienvenido <br />
                            Accede a tu cuenta
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontSize: "18px",
                                lineHeight: "24px",
                                color: "text.secondary",
                            }}
                        >
                            Por favor inicie sesión para continuar
                        </Typography>
                        <Button
                            variant="contained"
                            sx={{ height: "56px", minWidth: "120px" }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            Iniciar sesión
                        </Button>
                    </Stack>
                </Paper>
            </Box>
            <Box // Box for the footer
                sx={{
                    display: "flex",
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    py: 2,
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: "white",
                        fontSize: "18px",
                        lineHeight: "24px",
                    }}
                >
                    Powered by
                    <img
                        src="../../public/backgrounds/footer-image.png"
                        alt="Eysa-footer"
                        style={{ width: 98, height: 39 }}
                    />
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}></Box>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 500,
                        color: "grey.300",
                        fontSize: "15px",
                        lineHeight: "22px",
                    }}
                >
                    Versión 3.0.0
                </Typography>
            </Box>
            <LoginModal
                open={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setError("");
                }}
                onLogin={handleLogin}
                isLoading={isLoading}
                error={error}
            />
        </Box>
    );
};

export default ProfilePage;*/
