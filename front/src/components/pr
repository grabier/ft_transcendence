import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Menu,
    MenuItem,
    Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import {
    MarqueeContainer,
    MarqueeTrack,
    MarqueeContent,
} from "../style/MarqueeStyle";

import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import ResetPasswordModal from "./ResetPasswordModal";
import AuthErrorNotification from "./AuthErrorNotification";

const Header = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // --- ESTADOS DE NAVEGACIÓN Y MODALES ---
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);

    // --- ESTADO ÚNICO DE ERROR (Limpieza hecha aquí) ---
    const [authError, setAuthError] = useState({ open: false, message: "" });

    // Función para disparar el error desde cualquier sitio
    const triggerError = (message: string) => {
        setAuthError({ open: true, message });
    };

    // --- EFECTO PARA OAUTH (ERRORES DE URL) ---
    useEffect(() => {
        const errorType = searchParams.get("error");
        if (errorType) {
            const message = errorType === "user_exists" 
                ? "Este email ya está registrado con otro método" 
                : "Error de autenticación con el proveedor externo";
            
            triggerError(message);
            setSearchParams({}); // Limpia la URL
        }
    }, [searchParams, setSearchParams]);

    // --- HANDLERS ---
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogin = async (email: string, password: string) => {
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Credenciales incorrectas');
            }

            setIsLoggedIn(true);
            setLoginModalOpen(false);
        } catch (error: any) {
            triggerError(error.message);
        }
    };

    const handleRegister = async (username: string, email: string, password: string) => {
        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            if (response.status === 409) {
                triggerError("El nombre de usuario o email ya están en uso");
                return;
            }

            if (!response.ok) throw new Error("Error en el registro");

            handleSwitchToLogin();
        } catch (error: any) {
            triggerError(error.message || "Fallo de conexión");
        }
    };

    // --- NAVEGACIÓN ENTRE MODALES ---
    const handleSwitchToLogin = () => {
        setRegisterModalOpen(false);
        setResetPasswordModalOpen(false);
        setLoginModalOpen(true);
    };

    const handleSwitchToRegister = () => {
        setLoginModalOpen(false);
        setRegisterModalOpen(true);
    };

    const handleSwitchToResetPassword = () => {
        setLoginModalOpen(false);
        setResetPasswordModalOpen(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        handleMenuClose();
        navigate("/");
    };

    return (
        <>
            <AppBar position="fixed" sx={{ bgcolor: "primary.dark", borderBottom: "2px solid", borderColor: "secondary.main", boxShadow: "none" }}>
                <Toolbar disableGutters variant="dense" sx={{ minHeight: 48, px: 0 }}>
                    <Box component="img" src="/assets/lyrics-logo.png" sx={{ filter: "invert(1)", width: 145, height: 36, bgcolor: "secondary.main", px: 1 }} />
                    <MarqueeContainer>
                        <MarqueeTrack>
                            <MarqueeContent>Pong Tournament • Join the Arena • Win • Glory • </MarqueeContent>
                        </MarqueeTrack>
                    </MarqueeContainer>
                    <IconButton onClick={handleMenuOpen} sx={{ width: 48, bgcolor: "primary.main", borderRadius: 0 }}>
                        <MenuIcon sx={{ color: "background.default" }} />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Menú Dropdown simplificado */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} sx={{ mt: 5 }}>
                {!isLoggedIn ? (
                    <>
                        <MenuItem onClick={() => { handleMenuClose(); setLoginModalOpen(true); }}>Login</MenuItem>
                        <MenuItem onClick={() => { handleMenuClose(); setRegisterModalOpen(true); }}>Register</MenuItem>
                    </>
                ) : (
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                )}
            </Menu>

            {/* Modales */}
            <LoginModal 
                open={loginModalOpen} 
                onClose={() => setLoginModalOpen(false)} 
                onLogin={handleLogin} 
                onSwitchToRegister={handleSwitchToRegister} 
                onSwitchToResetPassword={handleSwitchToResetPassword} 
            />
            <RegisterModal 
                open={registerModalOpen} 
                onClose={() => setRegisterModalOpen(false)} 
                onRegister={handleRegister} 
                onSwitchToLogin={handleSwitchToLogin} 
            />
            <ResetPasswordModal 
                open={resetPasswordModalOpen} 
                onClose={() => setResetPasswordModalOpen(false)} 
                onResetPassword={() => {}} 
                onSwitchToLogin={handleSwitchToLogin} 
            />

            {/* NOTIFICACIÓN ÚNICA (La solución definitiva) */}
            <AuthErrorNotification 
                open={authError.open} 
                message={authError.message} 
                onClose={() => setAuthError({ ...authError, open: false })} 
            />
        </>
    );
};

export default Header;