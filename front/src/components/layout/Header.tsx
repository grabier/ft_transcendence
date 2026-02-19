import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, AppBar, Toolbar } from "@mui/material"; // Menos imports!
import { MarqueeContainer, MarqueeTrack, MarqueeContent } from "../../style/MarqueeStyle";

// Importamos SOLO el MenuHeader
import MenuHeader from "./MenuHeader";

import { useNotification } from "../../context/NotificationContext";

const Header = () => {
	return (
		<AppBar position="fixed" sx={{ bgcolor: "primary.dark", borderBottom: "2px solid", borderColor: "secondary.main", boxShadow: "none" }}>
			<Toolbar disableGutters variant="dense" sx={{ minHeight: 48, px: 0 }}>
				{/* LOGO */}
				<Box component="img" src="/assets/lyrics-logo.png" sx={{ filter: "invert(1)", width: 145, height: 36, bgcolor: "secondary.main", px: 1 }} />

				{/* MARQUEE */}
				<MarqueeContainer>
                        <MarqueeTrack>
                            <MarqueeContent> Pong Tournament • Join the Arena • Win • Glory • Pong Tournament • Join the Arena • Win • Glory Pong Tournament • Join the Arena • Win • Glory •</MarqueeContent>
                            <MarqueeContent> Pong Tournament • Join the Arena • Win • Glory • Pong Tournament • Join the Arena • Win • Glory Pong Tournament • Join the Arena • Win • Glory •</MarqueeContent>
                        </MarqueeTrack>
                    </MarqueeContainer>
				<MenuHeader />
			</Toolbar>
		</AppBar>
	);
};

export default Header;