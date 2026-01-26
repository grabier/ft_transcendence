import { jwtDecode } from "jwt-decode";
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
    Snackbar,
    Alert,
    Avatar
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

interface UserPayload {
    id: number;
    username: string;
    email: string;
}

const Header = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // --- ESTADOS ---
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [user, setUser] = useState<UserPayload | null>(null);

    // Modales
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);

    // Notificaciones
    const [authError, setAuthError] = useState({ open: false, message: "" });
    const [successMsg, setSuccessMsg] = useState({ open: false, message: "" });

    // --- EFECTOS (Persistencia y OAuth) ---
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const decoded = jwtDecode<UserPayload>(token);
                setUser(decoded);
            } catch (e) {
                localStorage.removeItem('auth_token');
                setUser(null);
            }
        }
    }, []);

    useEffect(() => {
        const errorType = searchParams.get("error");
        if (errorType) {
            const message = errorType === "user_exists" 
                ? "Email already registered" 
                : "External auth error";
            setAuthError({ open: true, message });
            setSearchParams({});
        }
    }, [searchParams, setSearchParams]);

    // --- HANDLERS ---
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    
    const handleNavigate = (path: string) => {
        handleMenuClose();
        navigate(path);
    };

    const triggerSuccess = (msg: string) => setSuccessMsg({ open: true, message: msg });
    const triggerError = (msg: string) => setAuthError({ open: true, message: msg });

    // --- AUTH LOGIC ---
    const handleLogin = async (email: string, password: string) => {
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || data.error || 'Credential error');

            localStorage.setItem('auth_token', data.token);
            const decoded = jwtDecode<UserPayload>(data.token);
            setUser(decoded);
            
            setLoginModalOpen(false);
            triggerSuccess(`¡Welcome, ${decoded.username}!`);
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
                triggerError("User or email already exists");
                return;
            }
            if (!response.ok) throw new Error("Register error");

            setRegisterModalOpen(false);
            setLoginModalOpen(true);
            triggerSuccess("Account created, please log in");
        } catch (error: any) {
            triggerError(error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
        handleMenuClose();
        navigate("/");
        triggerSuccess("Logged out correctly");
    };

    const handleSwitchToLogin = () => { setRegisterModalOpen(false); setResetPasswordModalOpen(false); setLoginModalOpen(true); };
    const handleSwitchToRegister = () => { setLoginModalOpen(false); setRegisterModalOpen(true); };
    const handleSwitchToResetPassword = () => { setLoginModalOpen(false); setResetPasswordModalOpen(true); };

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

                    {/* BOTÓN DEL MENÚ (ICONO vs AVATAR) */}
                    <IconButton 
                        onClick={handleMenuOpen} 
                        sx={{ 
                            width: 48, 
                            height: "100%",
                            bgcolor: "primary.main", 
                            borderLeft: "2px solid", 
                            borderRadius: 0, 
                            "&:hover": { bgcolor: "grey.900" }, 
                            flexShrink: 0 
                        }}
                    >
                        {user ? (
                            <Avatar 
                                sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    bgcolor: "secondary.main",
                                    color: "primary.dark",
                                    fontWeight: "bold",
                                    fontSize: "1.2rem",
                                    border: "2px solid #000"
                                }}
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </Avatar>
                        ) : (
                            <MenuIcon sx={{ color: "background.default" }} />
                        )}
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* MENÚ DESPLEGABLE */}
            <Menu 
                anchorEl={anchorEl} 
                open={Boolean(anchorEl)} 
                onClose={handleMenuClose} 
                sx={{ mt: 5 }}
            >
                {!user && <MenuItem onClick={() => { handleMenuClose(); setLoginModalOpen(true); }}>Login</MenuItem>}
                {!user && <MenuItem onClick={() => { handleMenuClose(); setRegisterModalOpen(true); }}>Register</MenuItem>}
                
                {!user && <Divider />}
                {!user && <MenuItem onClick={() => handleNavigate("/stats")}>Rankings</MenuItem>}

                {user && (
                    <MenuItem disabled sx={{ opacity: "1 !important", color: "primary.main", fontWeight: "bold" }}>
                        Hola, {user.username}
                    </MenuItem>
                )}
                {user && <MenuItem onClick={() => handleNavigate("/profile")}>Profile</MenuItem>}
                {user && <MenuItem onClick={() => handleNavigate("/social")}>Social</MenuItem>}
                
                {user && <Divider />}
                {user && <MenuItem onClick={handleLogout}>Logout</MenuItem>}
            </Menu>

            {/* MODALES Y NOTIFICACIONES */}
            <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} onSwitchToResetPassword={handleSwitchToResetPassword} />
            <RegisterModal open={registerModalOpen} onClose={() => setRegisterModalOpen(false)} onRegister={handleRegister} onSwitchToLogin={handleSwitchToLogin} />
            <ResetPasswordModal open={resetPasswordModalOpen} onClose={() => setResetPasswordModalOpen(false)} onResetPassword={() => {}} onSwitchToLogin={handleSwitchToLogin} />

            <AuthErrorNotification open={authError.open} message={authError.message} onClose={() => setAuthError({ ...authError, open: false })} />
            <Snackbar open={successMsg.open} autoHideDuration={4000} onClose={() => setSuccessMsg({ ...successMsg, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" sx={{ width: '100%', fontWeight: 'bold' }}>{successMsg.message}</Alert>
            </Snackbar>
        </>
    );
};

export default Header;