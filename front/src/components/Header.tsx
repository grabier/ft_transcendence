import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from "react";
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
	Avatar,
	Badge,
	ClickAwayListener
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
import UserList from "./UserList";
import { useSocket } from "../context/SocketContext";
import { SocialPanel } from "./SocialPanel";


interface UserPayload {
	id: number;
	username: string;
	email: string;
}

const Header = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const {unreadCount}= useSocket();
	// --- ESTADOS ---
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [user, setUser] = useState<null | UserPayload>(null);

	// Modales
	const [loginModalOpen, setLoginModalOpen] = useState(false);
	const [registerModalOpen, setRegisterModalOpen] = useState(false);
	const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);

	const [seeAllUsers, setSeeAllUsers] = useState(false);
	const [socialOpen, setSocialOpen] = useState(false);

	// Notificaciones
	const [authError, setAuthError] = useState({ open: false, message: "" });
	const [successMsg, setSuccessMsg] = useState({ open: false, message: "" });

	const closeAllModals = () => {
		setLoginModalOpen(false);
		setRegisterModalOpen(false);
		setResetPasswordModalOpen(false);
		setSeeAllUsers(false);
		setSocialOpen(false);
		// Cierra también el menú desplegable si estuviera abierto
		setAnchorEl(null);
	};
	// --- EFECTOS (Persistencia y OAuth) ---
	// ⚡ PROBLEMA: Cuando GitHub redirecciona con el token en la URL, Header ya está montado.
	// El token se guarda en localStorage pero Header no se enteraba del cambio.
	// SOLUCIÓN: Usar polling para detectar cambios en el token y recargar el usuario.
	
	const lastTokenRef = React.useRef<string | null>(null);

	useEffect(() => {
		const checkToken = () => {
			const currentToken = localStorage.getItem('auth_token');
			// Solo procesar si el token cambió (evita spam innecesario de fetches)
			if (currentToken !== lastTokenRef.current) {
				lastTokenRef.current = currentToken;
				
				if (currentToken) {
					try {
						// Decodificar el JWT para extraer datos del usuario
						const decoded = jwtDecode<UserPayload>(currentToken);
						setUser(decoded); // ✅ Actualiza el estado del usuario
						
						// Validar el token con el backend y actualizar último acceso
						fetch('http://localhost:3000/api/user/persistence', {
							headers: { 'Authorization': `Bearer ${currentToken}` }
						}).catch(err => {
							console.error("Token inválido o expiró", err);
							localStorage.removeItem('auth_token');
							lastTokenRef.current = null;
							setUser(null);
						});
					} catch (e) {
						// Token corrupto o inválido
						localStorage.removeItem('auth_token');
						lastTokenRef.current = null;
						setUser(null);
					}
				} else {
					// Sin token = usuario deslogueado
					setUser(null);
				}
			}
		};
		// ⭐ CLAVE: Ejecutar INMEDIATAMENTE al montar (para el primer load + refresh)
		checkToken();
		// 🔄 Polling cada 500ms (detecta cuando GitHub redirecciona y cambia el token)
		// Solo hace fetch si detecta un CAMBIO en el token, no cada 500ms
		const interval = setInterval(checkToken, 500);
		return () => clearInterval(interval);
	}, []);

	// Uso de parámetros de búsqueda para manejar errores de OAuth
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

			if (!response.ok)
				throw new Error(data.message || data.error || 'Credential error');

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
		// 1. Avisar al back (Opcional si confías en que el usuario ya no hará peticiones, 
		// pero recomendable hacerlo para poner is_online=false al instante)
		const token = localStorage.getItem('auth_token');
		if (token) {
			fetch('http://localhost:3000/api/auth/logout', {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${token}` }
			});

		}
		// 2. Limpieza local
		localStorage.removeItem('auth_token'); // <--- IMPORTANTE: sessionStorage
		setUser(null); // Limpiar estado de React
		closeAllModals();
		triggerSuccess("Logged out successfully");
		navigate("/"); // Redirigir
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
						<Badge badgeContent={unreadCount} color="error" overlap="circular" >
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
						</Badge>
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
				{user && <MenuItem onClick={() => {
					handleMenuClose();
					setSocialOpen(!socialOpen);
				}}>Social</MenuItem>}
				{user && (
					<MenuItem onClick={() => { handleMenuClose(); setSeeAllUsers(true); }}>
						Admin: Ver Lista Usuarios
					</MenuItem>
				)}
				{user && <Divider />}
				{user && <MenuItem onClick={handleLogout}>Logout</MenuItem>}
			</Menu>

			{/* MODALES Y NOTIFICACIONES */}
			<LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} onSwitchToResetPassword={handleSwitchToResetPassword} />
			<RegisterModal open={registerModalOpen} onClose={() => setRegisterModalOpen(false)} onRegister={handleRegister} onSwitchToLogin={handleSwitchToLogin} />
			<ResetPasswordModal open={resetPasswordModalOpen} onClose={() => setResetPasswordModalOpen(false)} onResetPassword={async () => { }} onSwitchToLogin={handleSwitchToLogin} />
			<UserList
				open={seeAllUsers}
				onClose={() => setSeeAllUsers(false)}
			/>
			<SocialPanel
				open={socialOpen}
				onClose={() => setSocialOpen(false)}
			/>
			<AuthErrorNotification open={authError.open} message={authError.message} onClose={() => setAuthError({ ...authError, open: false })} />
			<Snackbar open={successMsg.open} autoHideDuration={4000} onClose={() => setSuccessMsg({ ...successMsg, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
				<Alert severity="success" sx={{ width: '100%', fontWeight: 'bold' }}>{successMsg.message}</Alert>
			</Snackbar>
		</>
	);
};

export default Header;