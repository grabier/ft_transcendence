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
import UserAvatar from "@/components/ui/UserAvatar";
import SocialPanel from "@/components/social/SocialPanel";
import Profile from "@/components/social/Profile";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { useAuthModals } from "@/hooks/useAuthModals";

const MenuHeader = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { user, login, register, logout } = useAuth();
	const { unreadCount } = useSocket();
	const modals = useAuthModals();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
		setAnchorEl(event.currentTarget);
	const handleMenuClose = () => setAnchorEl(null);
	

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
							src={user.avatarUrl}
							size={32}
							sx={{ border: "2px solid #000" }}
						/>
					) : (
						<MenuIcon sx={{ color: "background.default" }} />
					)}
				</Badge>
			</IconButton>

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
				sx={{ mt: 5 }}
				PaperProps={{
					sx: { minWidth: 220 }
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
							sx={{ ml: 2 }}
						/>
					</MenuItem>
				) : (
					<MenuItem disabled>{t('menuHeader.social')}</MenuItem>
				)}

				{user && <MenuItem onClick={onLogoutClick}>{t('menuHeader.logout')}</MenuItem>}
			</Menu>

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