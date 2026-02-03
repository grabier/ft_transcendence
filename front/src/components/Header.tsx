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
import { SocialPanel } from "./SocialPanel";
import { useSocket } from "../context/SocketContext";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { useAuthModals } from "../hooks/useAuthModals";


const Header = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	//----Contexts---
	const { unreadCount } = useSocket();
	const { notifySuccess, notifyError } = useNotification();
	const { user, login, register, logout } = useAuth();

	// --- HOOK DE MODALES (Toda la lógica visual está aquí dentro) ---
	const modals = useAuthModals();

	// --- ESTADOS(solo el menu desplegable) ---
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	// Uso de parámetros de búsqueda para manejar errores de OAuth
	useEffect(() => {
		const errorType = searchParams.get("error");
		if (errorType) {
			const message = errorType === "user_exists"
				? "Email already registered"
				: "External auth error";
			notifyError(message);
			setSearchParams({});
		}
	}, [searchParams, setSearchParams, notifyError]);

	// --- HANDLERS AUXILIARES ---
	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
	const handleMenuClose = () => setAnchorEl(null);
	const handleNavigate = (path: string) => { handleMenuClose(); navigate(path); };

	// Puentes lógicos (Conectan Contexto <-> Modal)
	const onLoginSubmit = async (email: string, pass: string) => {
		if (await login(email, pass))
			modals.closeAll();
	};

	const onRegisterSubmit = async (username: string, email: string, pass: string) => {
		if (await register(username, email, pass))
			modals.switchToLogin();
	};

	const onLogoutClick = () => {
		logout();
		modals.closeAll();
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
							<MarqueeContent> Pong Tournament • Join the Arena • Win • Glory • Pong Tournament • Join the Arena • Win • Glory Pong Tournament • Join the Arena • Win • Glory •</MarqueeContent>
							<MarqueeContent> Pong Tournament • Join the Arena • Win • Glory • Pong Tournament • Join the Arena • Win • Glory Pong Tournament • Join the Arena • Win • Glory •</MarqueeContent>
						</MarqueeTrack>
					</MarqueeContainer>

					<IconButton onClick={handleMenuOpen} sx={{ width: 48, height: "100%", bgcolor: "primary.main", borderLeft: "2px solid", borderRadius: 0, "&:hover": { bgcolor: "grey.900" }, flexShrink: 0 }}>
						<Badge badgeContent={unreadCount} color="error" overlap="circular" >
							{user ? (
								<Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main", color: "primary.dark", fontWeight: "bold", fontSize: "1.2rem", border: "2px solid #000" }}>
									{user.username.charAt(0).toUpperCase()}
								</Avatar>
							) : (<MenuIcon sx={{ color: "background.default" }} />)}
						</Badge>
					</IconButton>
				</Toolbar>
			</AppBar>

			{/* MENÚ DESPLEGABLE */}
			<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} sx={{ mt: 5 }}>
				{!user && <MenuItem onClick={() => { handleMenuClose(); modals.openLogin(); }}>Login</MenuItem>}
				{!user && <MenuItem onClick={() => { handleMenuClose(); modals.openRegister(); }}>Register</MenuItem>}

				{!user && <Divider />}
				{!user && <MenuItem onClick={() => handleNavigate("/stats")}>Rankings</MenuItem>}

				{user && <MenuItem disabled sx={{ opacity: "1 !important", color: "primary.main", fontWeight: "bold" }}>Hola, {user.username}</MenuItem>}
				{user && <MenuItem onClick={() => handleNavigate("/profile")}>Profile</MenuItem>}
				{user && <MenuItem onClick={() => { handleMenuClose(); modals.toggleSocial(); }}>Social</MenuItem>}
				{user && <MenuItem onClick={() => { handleMenuClose(); modals.openUserList(); }}>Admin: Ver Lista Usuarios</MenuItem>}

				{user && <Divider />}
				{user && <MenuItem onClick={onLogoutClick}>Logout</MenuItem>}
			</Menu>

			{/* MODALES (Más limpios) */}
			<LoginModal
				open={modals.loginOpen}
				onClose={modals.closeAll}
				onLogin={onLoginSubmit}
				onSwitchToRegister={modals.switchToRegister}
				onSwitchToResetPassword={modals.switchToReset}
			/>
			<RegisterModal
				open={modals.registerOpen}
				onClose={modals.closeAll}
				onRegister={onRegisterSubmit}
				onSwitchToLogin={modals.switchToLogin}
			/>
			<ResetPasswordModal
				open={modals.resetPasswordOpen}
				onClose={modals.closeAll}
				onResetPassword={async () => { }}
				onSwitchToLogin={modals.switchToLogin}
			/>

			<UserList open={modals.seeAllUsers} onClose={modals.closeAll} />
			<SocialPanel open={modals.socialOpen} onClose={modals.closeAll} />
		</>
	);
};

export default Header;