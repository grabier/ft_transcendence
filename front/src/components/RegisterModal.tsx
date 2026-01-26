import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Button,
    Box,
    Typography,
    IconButton,
    Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GitHubIcon from "@mui/icons-material/GitHub";

interface RegisterModalProps {
    open: boolean;
    onClose: () => void;
    onRegister: (username: string, email: string, pass: string) => void;
    onSwitchToLogin: () => void;
}

const RegisterModal = ({ open, onClose, onRegister, onSwitchToLogin }: RegisterModalProps) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRegister(username, email, password);
    };

    const handleGithubRegister = () => {
        // Redirige al mismo endpoint que el login. El backend decide si crea o loguea.
        window.location.href = "http://localhost:3000/api/auth/github";
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    padding: 2,
                    minWidth: "350px",
                    border: "2px solid",
                    borderColor: "secondary.main"
                }
            }}
        >
            {/* CABECERA CON BOTÓN DE CERRAR */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <DialogTitle sx={{ p: 0, fontWeight: "bold", color: "primary.main" }}>
                    Únete a la Arena
                </DialogTitle>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 0 }}>
                {/* BOTÓN DE GITHUB (PRIMERO, COMO OPCIÓN RÁPIDA) */}
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<GitHubIcon />}
                    onClick={handleGithubRegister}
                    sx={{
                        mb: 2,
                        color: "black",
                        borderColor: "black",
                        textTransform: "none",
                        fontWeight: "bold",
                        "&:hover": {
                            backgroundColor: "rgba(0,0,0,0.05)",
                            borderColor: "black"
                        }
                    }}
                >
                    Registrarse con GitHub
                </Button>

                <Divider sx={{ my: 2, fontSize: "0.8rem", color: "text.secondary" }}>
                    O CON TU EMAIL
                </Divider>

                {/* FORMULARIO MANUAL */}
                <form onSubmit={handleSubmit}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nombre de Usuario"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Correo Electrónico"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Contraseña"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        sx={{ mb: 3 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: "bold",
                            "&:hover": { bgcolor: "primary.dark" }
                        }}
                    >
                        REGISTRARSE
                    </Button>
                </form>

                {/* PIE DE PÁGINA: CAMBIAR A LOGIN */}
                <Box mt={2} textAlign="center">
                    <Typography variant="body2">
                        ¿Ya tienes cuenta?{" "}
                        <Button
                            onClick={onSwitchToLogin}
                            sx={{ 
                                textTransform: "none", 
                                fontWeight: "bold", 
                                p: 0,
                                minWidth: "auto",
                                verticalAlign: "baseline"
                            }}
                        >
                            Inicia Sesión
                        </Button>
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default RegisterModal;