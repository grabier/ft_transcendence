import { useState } from "react";

export const useAuthModals = () => {
	// --- ESTADOS ---
	const [loginOpen, setLoginOpen] = useState(false);
	const [registerOpen, setRegisterOpen] = useState(false);
	const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

	// Estados de paneles extra
	const [socialOpen, setSocialOpen] = useState(false);
	const [seeAllUsers, setSeeAllUsers] = useState(false);

	// --- ACCIONES DE CIERRE ---
	const closeAll = () => {
		setLoginOpen(false);
		setRegisterOpen(false);
		setResetPasswordOpen(false);
		setSocialOpen(false);
		setSeeAllUsers(false);
	};

	// --- ACCIONES DE APERTURA / CAMBIO ---
	const openLogin = () => { closeAll(); setLoginOpen(true); };
	const openRegister = () => { closeAll(); setRegisterOpen(true); };

	const switchToRegister = () => {
		setLoginOpen(false);
		setRegisterOpen(true);
	};

	const switchToLogin = () => {
		setRegisterOpen(false);
		setResetPasswordOpen(false); // Por si veníamos del reset
		setLoginOpen(true);
	};

	const switchToReset = () => {
		setLoginOpen(false);
		setResetPasswordOpen(true);
	};

	const toggleSocial = () => {
		// Si estaba cerrado lo abrimos, si abierto lo cerramos.
		// Pero cerramos otros modales por si acaso.
		const wasOpen = socialOpen;
		closeAll();
		if (!wasOpen) setSocialOpen(true);
	};

	const openUserList = () => {
		closeAll();
		setSeeAllUsers(true);
	};

	// Devolvemos todo empaquetado en un objeto bonito
	return {
		// Estados (Flags)
		loginOpen,
		registerOpen,
		resetPasswordOpen,
		socialOpen,
		seeAllUsers,

		// Acciones
		closeAll,
		openLogin,
		openRegister,
		openUserList,
		toggleSocial,

		// Transiciones
		switchToRegister,
		switchToLogin,
		switchToReset,

		// Setters manuales (por si acaso los necesitas sueltos)
		setLoginOpen,
		setRegisterOpen
	};
};