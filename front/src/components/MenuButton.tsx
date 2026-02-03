import {
	Box,
	AppBar,
	Toolbar,
	IconButton,
	Menu,
	MenuItem,
	Divider,
	Alert,
	Avatar,
	Badge,
	ClickAwayListener
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import React, { useState, useEffect } from "react";
import RegisterModal from "./RegisterModal";

interface Props {
	anchorEl: HTMLElement | null;
	onClose: () => void;
	username: string | null;
	onRegisterClick: () => void;
}

const MenuButton = ({ anchorEl, onClose, username, onRegisterClick }: Props) => {

	return (

		<Menu
			anchorEl={anchorEl}
			open={Boolean(anchorEl)}
			onClose={onClose}
			anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			sx={{ mt: 5 }}
		>
			{(
				<MenuItem disabled sx={{ opacity: "1 !important", color: "primary.main", fontWeight: "bold" }}>
					Hola  {username || "SINPAPELES"}
				</MenuItem>
			)}

			{!username && <MenuItem onClick={() => { onClose(); setLoginModalOpen(true); }}>Login</MenuItem>}
			{!username && <MenuItem onClick={onRegisterClick}>
                Register
            </MenuItem>}
			

			{!username && <Divider />}
			{!username && <MenuItem onClick={() => handleNavigate("/stats")}>Rankings</MenuItem>}

			{username && <MenuItem onClick={() => handleNavigate("/profile")}>Profile</MenuItem>}
			{username && <MenuItem onClick={() => {
				onClose();
				setSocialOpen(!socialOpen);
			}}>Social</MenuItem>}
			{username && (
				<MenuItem onClick={() => { onClose(); setSeeAllUsernames(true); }}>
					Admin: Ver Lista Usuarios
				</MenuItem>
			)}
			{username && <Divider />}
			{username && <MenuItem onClick={handleLogout}>Logout</MenuItem>}
		</Menu>

	)
};

export default MenuButton;


