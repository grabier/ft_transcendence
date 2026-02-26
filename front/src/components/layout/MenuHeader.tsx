import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
	IconButton,
	Menu,
	MenuItem,
	Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";
import ResetPasswordModal from "@/components/auth/ResetPasswordModal";
import UserAvatar from "@/components/ui/UserAvatar";
import { SocialPanel } from "@/components/social/SocialPanel";
import { Profile } from "@/components/social/Profile";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { useAuthModals } from "@/hooks/useAuthModals";

// Ya no recibe children, se pinta él solo
const MenuHeader = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();
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
	}; 

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
						<UserAvatar
							name={user.username}
							src={user.avatarUrl} // Asumiendo que user tiene avatarUrl
							size={32}
							sx={{ border: "2px solid #000" }} // Estilo específico que tenías
						/>
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
				PaperProps={{
					sx: { minWidth: 220 } // FORZAMOS EL ANCHO MÍNIMO AQUÍ PARA QUE NO ENCOJA
				}}
			>
				{!user && (
					<MenuItem
						onClick={() => {
							handleMenuClose();
							modals.openLogin();
						}}
					>
						{t('menuHeader.login')}
					</MenuItem>
				)}
				{!user && (
					<MenuItem
						onClick={() => {
							handleMenuClose();
							modals.openRegister();
						}}
					>
						{t('menuHeader.register')}
					</MenuItem>
				)}

				{user && <MenuItem disabled sx={{ opacity: "1 !important", color: "primary.main", fontWeight: "bold" }}>{t('menuHeader.hello', { username: user.username })}</MenuItem>}
				{user ? (<MenuItem onClick={() => { handleMenuClose(); modals.toggleProfile(); }}>{t('menuHeader.profile')}</MenuItem>) : <MenuItem disabled >{t('menuHeader.profile')}</MenuItem >}
				{user ? (
					<MenuItem
						onClick={() => { handleMenuClose(); modals.toggleSocial(); }}
						sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
					>
						{t('menuHeader.social')}
						<Badge
							color="error"
							variant="dot"
							invisible={unreadCount === 0}
							sx={{ ml: 2 }} // Un poco de margen a la izquierda del punto
						/>
					</MenuItem>
				) : (
					<MenuItem disabled>{t('menuHeader.social')}</MenuItem>
				)}

				{user && <MenuItem onClick={onLogoutClick}>{t('menuHeader.logout')}</MenuItem>}
			</Menu>

			{/* 3. LOS MODALES */}
			<LoginModal
				open={modals.loginOpen}
				onClose={modals.closeAll}
				onLogin={onLoginSubmit}
				onSwitchToRegister={modals.switchToRegister}
			/>
			<RegisterModal
				open={modals.registerOpen}
				onClose={modals.closeAll}
				onRegister={onRegisterSubmit}
				onSwitchToLogin={modals.switchToLogin}
			/>

			<SocialPanel open={modals.socialOpen} onClose={modals.closeAll} />
			<Profile open={modals.profileOpen} onClose={modals.closeAll} />
		</>
	);
};

export default MenuHeader;