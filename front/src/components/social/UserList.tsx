import { useState, useEffect } from 'react';
import {
	Box,
	List,
	ListItem,
	ListItemText,
	ListItemAvatar,
	Typography,
	Alert,
	CircularProgress,
	Divider
} from '@mui/material';

import { BASE_URL } from '@/config';
import UserAvatar from "@/components/ui/UserAvatar";
import {
	StyledDialog,
	PrimaryAuthButton
} from "@/style/AuthModalStyle";

interface User {
	id: number;
	username: string;
	email: string;
}

interface Props {
	open: boolean;
	onClose: () => void;
}

export const UserList = ({ open, onClose }: Props) => {
	const [users, setUsers] = useState<User[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// Mantenemos la lógica original de fetch
	const fetchUsers = async () => {
		const token = localStorage.getItem('auth_token');

		if (!token) {
			setError("No hay token. Por favor, inicia sesión.");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${BASE_URL}/api/user`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Error al cargar usuarios');
			}

			setUsers(data);
			setError(null);
		} catch (err: any) {
			setError(err.message);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	};

	// Opcional: Cargar automáticamente al abrir el modal
	useEffect(() => {
		if (open) {
			fetchUsers();
		}
	}, [open]);

	return (
		<StyledDialog open={open} onClose={onClose}>
			<Box sx={{ p: 4 }}>
				{/* CABECERA ESTILO LOGIN */}
				<Box sx={{ textAlign: "center", mb: 3 }}>
					<Typography
						variant="authSubtitle"
						sx={{
							borderBottom: "2px solid",
							borderColor: "secondary.main",
							display: "inline-block",
							pb: 0.5,
							mb: 1,
						}}
					>
						Admin Panel
					</Typography>
					<Typography variant="displayTitle">
						User List
					</Typography>
				</Box>

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
				)}

				{/* BOTÓN REFRESH (Estilo PrimaryAuthButton) */}
				<PrimaryAuthButton onClick={fetchUsers} disabled={loading} sx={{ mb: 3 }}>
					{loading ? <CircularProgress size={24} color="inherit" /> : "Refresh List"}
				</PrimaryAuthButton>

				{/* LISTA DE USUARIOS CON ESTILO */}
				<Box sx={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #333', borderRadius: 2 }}>
					<List>
						{users.map((user, index) => (
							<Box key={user.id}>
								<ListItem>
									<ListItemAvatar>
										<UserAvatar
											name={user.username}
											src={undefined} // O user.avatarUrl si tu backend ya lo devuelve
											size={40}
										/>
									</ListItemAvatar>
									<ListItemText
										primary={
											<Typography variant="subtitle1" fontWeight="bold">
												{user.username}
											</Typography>
										}
										secondary={user.email}
									/>
								</ListItem>
								{index < users.length - 1 && <Divider component="li" />}
							</Box>
						))}
						{!loading && users.length === 0 && !error && (
							<Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
								No users found.
							</Typography>
						)}
					</List>
				</Box>
			</Box>
		</StyledDialog>
	);
};

export default UserList;