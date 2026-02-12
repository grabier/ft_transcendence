import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	IconButton,
	Menu,
	MenuItem,
	Divider,
	Avatar,
	Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

// Importamos Modales y Hooks
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import ResetPasswordModal from "./ResetPasswordModal";
import UserList from "./UserList";
import { SocialPanel } from "./SocialPanel";
import { Profile } from "./Profile";

import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useAuthModals } from "../hooks/useAuthModals";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Ya no recibe children, se pinta él solo
const MenuHeader = () => {
	const navigate = useNavigate();
	const { user, login, register, logout } = useAuth();
	const { unreadCount } = useSocket();
	// Necesitamos esto para el Badge
	const modals = useAuthModals();

	// Estado local del menú (Solo vive aquí, no ensucia el Header)
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
		setAnchorEl(event.currentTarget);
	const handleMenuClose = () => setAnchorEl(null);
	const handleNavigate = (path: string) => {
		handleMenuClose();
		navigate(path);
	}; // no tendremos otro path, quitar.

	// --- PUENTES LÓGICOS ---
	const onLoginSubmit = async (email: string, pass: string) => {
		if (await login(email, pass)) modals.closeAll();
	};

	const onRegisterSubmit = async (
		username: string,
		email: string,
		pass: string,
	) => {
		if (await register(username, email, pass)) {
			await login(email, pass);
			modals.closeAll();
		}
	};

	const onLogoutClick = () => {
		logout();
		modals.closeAll();
		handleMenuClose();
		navigate("/");
	};

	return (
		<>
			<LanguageSwitcher />
			{/* 1. EL BOTÓN DISPARADOR (Movido desde Header) */}
			<IconButton
				onClick={handleMenuOpen}
				sx={{
					width: 48,
					height: "100%",
					bgcolor: "primary.main",
					borderLeft: "2px solid",
					borderRadius: 0,
					"&:hover": { bgcolor: "grey.900" },
					flexShrink: 0,
				}}
			>
				<Badge
					badgeContent={unreadCount}
					color="error"
					overlap="circular"
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
								border: "2px solid #000",
							}}
						>
							{user.username.charAt(0).toUpperCase()}
						</Avatar>
					) : (
						<MenuIcon sx={{ color: "background.default" }} />
					)}
				</Badge>
			</IconButton>

			{/* 2. EL MENÚ DESPLEGABLE */}
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
				sx={{ mt: 5 }}
			>
				{!user && (
					<MenuItem
						onClick={() => {
							handleMenuClose();
							modals.openLogin();
						}}
					>
						Login
					</MenuItem>
				)}
				{!user && (
					<MenuItem
						onClick={() => {
							handleMenuClose();
							modals.openRegister();
						}}
					>
						Register
					</MenuItem>
				)}

				{!user && (
					<MenuItem onClick={() => handleNavigate("/stats")}>
						Rankings
					</MenuItem>
				)}

				{user && (
					<MenuItem
						disabled
						sx={{
							opacity: "1 !important",
							color: "primary.main",
							fontWeight: "bold",
						}}
					>
						Hola, {user.username}
					</MenuItem>
				)}
				{user ? (
					<MenuItem
						onClick={() => {
							handleMenuClose();
							modals.toggleProfile();
						}}
					>
						Profile
					</MenuItem>
				) : (
					<MenuItem disabled>Profile</MenuItem>
				)}
				{user ? (
					<MenuItem
						onClick={() => {
							handleMenuClose();
							modals.toggleSocial();
						}}
					>
						Social
					</MenuItem>
				) : (
					<MenuItem disabled>Social</MenuItem>
				)}
				{user ? (
					<MenuItem
						onClick={() => {
							handleMenuClose();
							modals.openUserList();
						}}
					>
						Admin:Ver Lista Usuarios
					</MenuItem>
				) : (
					<MenuItem disabled> Admin:Ver Lista Usuarios</MenuItem>
				)}

				{user && <MenuItem onClick={onLogoutClick}>Logout</MenuItem>}
			</Menu>

			{/* 3. LOS MODALES */}
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
				onResetPassword={async () => {}}
				onSwitchToLogin={modals.switchToLogin}
			/>

			<UserList open={modals.seeAllUsers} onClose={modals.closeAll} />
			<SocialPanel open={modals.socialOpen} onClose={modals.closeAll} />
			<Profile open={modals.profileOpen} onClose={modals.closeAll} />
		</>
	);
};

export default MenuHeader;
