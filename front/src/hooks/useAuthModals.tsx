import { useState } from "react";

export const useAuthModals = () => {
	const [loginOpen, setLoginOpen] = useState(false);
	const [registerOpen, setRegisterOpen] = useState(false);
	const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

	const [socialOpen, setSocialOpen] = useState(false);
	const [seeAllUsers, setSeeAllUsers] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [profileFriendsOpen, setProfileFriendsOpen] = useState(false);

	const closeAll = () => {
		setLoginOpen(false);
		setRegisterOpen(false);
		setResetPasswordOpen(false);
		setSocialOpen(false);
		setSeeAllUsers(false);
		setProfileOpen(false);
		setProfileFriendsOpen(false);
	};

	const openLogin = () => { closeAll(); setLoginOpen(true); };
	const openRegister = () => { closeAll(); setRegisterOpen(true); };

	const switchToRegister = () => {
		setLoginOpen(false);
		setRegisterOpen(true);
	};

	const switchToLogin = () => {
		setRegisterOpen(false);
		setResetPasswordOpen(false);
		setLoginOpen(true);
	};

	const switchToReset = () => {
		setLoginOpen(false);
		setResetPasswordOpen(true);
	};

	const toggleSocial = () => {
		const wasOpen = socialOpen;
		closeAll();
		if (!wasOpen) setSocialOpen(true);
	};
	const toggleProfile = () => {
		const wasOpen = profileOpen;
		closeAll();
		if (!wasOpen)
			setProfileOpen(true);
	};

	const toggleProfileFriends = () => {
		const wasOpen = profileFriendsOpen;
		closeAll();
		if (!wasOpen)
			setProfileFriendsOpen(true);
	};

	const openUserList = () => {
		closeAll();
		setSeeAllUsers(true);
	};

	return {
		loginOpen,
		registerOpen,
		resetPasswordOpen,
		socialOpen,
		profileOpen,
		profileFriendsOpen,
		seeAllUsers,

		closeAll,
		openLogin,
		openRegister,
		openUserList,
		toggleSocial,
		toggleProfile,
		toggleProfileFriends,

		switchToRegister,
		switchToLogin,
		switchToReset,

		setLoginOpen,
		setRegisterOpen
	};
};