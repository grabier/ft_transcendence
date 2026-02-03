import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, AppBar, Toolbar } from "@mui/material"; // Menos imports!
import { MarqueeContainer, MarqueeTrack, MarqueeContent } from "../style/MarqueeStyle";

// Importamos SOLO el MenuHeader
import MenuHeader from "./MenuHeader";

import { useNotification } from "../context/NotificationContext";

const Header = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const { notifyError } = useNotification();

	// Solo mantenemos la lógica de errores de OAuth porque afecta a la URL global
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

	return (
		<AppBar position="fixed" sx={{ bgcolor: "primary.dark", borderBottom: "2px solid", borderColor: "secondary.main", boxShadow: "none" }}>
			<Toolbar disableGutters variant="dense" sx={{ minHeight: 48, px: 0 }}>
				{/* LOGO */}
				<Box component="img" src="/assets/lyrics-logo.png" sx={{ filter: "invert(1)", width: 145, height: 36, bgcolor: "secondary.main", px: 1 }} />

				{/* MARQUEE */}
				<MarqueeContainer>
					<MarqueeTrack>
						<MarqueeContent>Pong Tournament • Join the Arena • Win • Glory • </MarqueeContent>
						<MarqueeContent>Pong Tournament • Join the Arena • Win • Glory • </MarqueeContent>
					</MarqueeTrack>
				</MarqueeContainer>

				{/* AQUÍ ESTÁ LA LLAMADA 📞 */}
				{/* El componente se pinta a sí mismo (botón) y gestiona sus modales */}
				<MenuHeader />
			</Toolbar>
		</AppBar>
	);
};

export default Header;