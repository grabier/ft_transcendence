import { useState, useEffect, useCallback, useMemo } from 'react';
import {
	List, ListItem, ListItemAvatar, ListItemText, Avatar,
	Typography, Divider, Badge, IconButton, Box, CircularProgress,
	Paper, TextField, Collapse, Button
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

export const SocialPanel = () => {
	const [friends, setFriends] = useState<any[]>([]);
	const [pending, setPending] = useState<any[]>([]);
	const [searchResults, setSearchResults] = useState<any[]>([]); // Se inicializa como array vacío
	const [loading, setLoading] = useState(true);

	const [showOnline, setShowOnline] = useState(true);
	const [showOffline, setShowOffline] = useState(true);
	const [showPending, setShowPending] = useState(true);
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	const token = sessionStorage.getItem('auth_token');

	const fetchData = useCallback(async () => {
		if (!token) return;
		try {
			const [resF, resP] = await Promise.all([
				fetch('http://localhost:3000/api/friend/list', { headers: { 'Authorization': `Bearer ${token}` } }),
				fetch('http://localhost:3000/api/friend/pending', { headers: { 'Authorization': `Bearer ${token}` } })
			]);

			// Verificamos que las respuestas sean arrays antes de setear
			const friendsData = await resF.json();
			const pendingData = await resP.json();

			setFriends(Array.isArray(friendsData) ? friendsData : []);
			setPending(Array.isArray(pendingData) ? pendingData : []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => { fetchData(); }, [fetchData]);

	const handleSearch = async () => {
		if (searchQuery.length < 2) return;
		try {
			const res = await fetch(`http://localhost:3000/api/user/search?q=${searchQuery}`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const data = await res.json();
			// PROTECCIÓN: Si el back no devuelve un array, ponemos uno vacío
			setSearchResults(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error("Error en búsqueda:", err);
			setSearchResults([]);
		}
	};

	const sendRequest = async (receiverId: number) => {
		await fetch('http://localhost:3000/api/friend/request', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
			body: JSON.stringify({ receiverId })
		});
		setSearchQuery('');
		setSearchResults([]);
		setShowSearch(false);
	};

	// ... debajo de sendRequest ...

	// ACEPTAR SOLICITUD
	const handleAccept = async (senderId: number) => {
		try {
			const res = await fetch(`http://localhost:3000/api/friend/accept/${senderId}`, {
				method: 'PUT',
				headers: { 'Authorization': `Bearer ${token}` }
			});

			if (res.ok) {
				// Si todo va bien, recargamos las listas para ver al nuevo amigo
				fetchData();
			} else {
				console.error("Error al aceptar solicitud");
			}
		} catch (err) {
			console.error(err);
		}
	};

	// RECHAZAR SOLICITUD
	const handleReject = async (senderId: number) => {
		try {
			// Usamos DELETE pasando el ID del usuario
			const res = await fetch(`http://localhost:3000/api/friend/${senderId}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			});

			if (res.ok) {
				fetchData(); // Recargamos para que desaparezca de la lista
			}
		} catch (err) {
			console.error(err);
		}
	};

	const online = useMemo(() => Array.isArray(friends) ? friends.filter(f => f.is_online) : [], [friends]);
	const offline = useMemo(() => Array.isArray(friends) ? friends.filter(f => !f.is_online) : [], [friends]);

	if (loading) return <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>;

	return (
		<Paper elevation={8} sx={{ width: 280, bgcolor: '#121212', color: 'white', borderRadius: 2, border: '1px solid #333' }}>
			<Box sx={{ p: 2, bgcolor: '#1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{"FRIENDS"}</Typography>
				<IconButton size="small" onClick={() => setShowSearch(!showSearch)} sx={{ color: 'grey.500' }}>
					<SearchIcon fontSize="small" />
				</IconButton>
			</Box>

			{showSearch && (
				<Box sx={{ px: 2, pb: 1 }}>
					<TextField
						fullWidth size="small" variant="standard" placeholder="Buscar..."
						value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
						onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
						sx={{ input: { color: 'white', fontSize: '0.8rem' } }}
						InputProps={{ endAdornment: <IconButton onClick={handleSearch}><SearchIcon sx={{ color: 'white', fontSize: 16 }} /></IconButton> }}
					/>
					{/* CAMBIO AQUÍ: Añadida validación Array.isArray para evitar el error .map */}
					{Array.isArray(searchResults) && searchResults.map(u => (
						<ListItem key={u.id} secondaryAction={<IconButton onClick={() => sendRequest(u.id)} size="small" color="primary"><PersonAddIcon /></IconButton>}>
							<ListItemText primary={u.username} primaryTypographyProps={{ fontSize: '0.8rem' }} />
						</ListItem>
					))}
				</Box>
			)}

			<List sx={{ py: 0 }}>
				{/* ONLINE */}
				<Box onClick={() => setShowOnline(!showOnline)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#222' } }}>
					{showOnline ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
					<Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold', ml: 1 }}>{`ONLINE (${online.length})`}</Typography>
				</Box>
				<Collapse in={showOnline}>
					{online.map(f => (
						<ListItem key={f.id} sx={{ py: 0.5 }}>
							<ListItemAvatar sx={{ minWidth: 40 }}><Badge variant="dot" color="success" overlap="circular"><Avatar src={f.avatar_url} sx={{ width: 28, height: 28 }} /></Badge></ListItemAvatar>
							<ListItemText primary={f.username} primaryTypographyProps={{ fontSize: '0.85rem' }} />
						</ListItem>
					))}
				</Collapse>

				{/* OFFLINE */}
				<Box onClick={() => setShowOffline(!showOffline)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#222' } }}>
					{showOffline ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
					<Typography variant="caption" sx={{ color: 'grey.600', fontWeight: 'bold', ml: 1 }}>{`OFFLINE (${offline.length})`}</Typography>
				</Box>
				<Collapse in={showOffline}>
					{offline.map(f => (
						<ListItem key={f.id} sx={{ py: 0.5, opacity: 0.6 }}>
							<ListItemAvatar sx={{ minWidth: 40 }}><Avatar src={f.avatar_url} sx={{ width: 28, height: 28, filter: 'grayscale(1)' }} /></ListItemAvatar>
							<ListItemText primary={f.username} primaryTypographyProps={{ fontSize: '0.85rem' }} />
						</ListItem>
					))}
				</Collapse>

				{/* PENDING */}
				<Box onClick={() => setShowPending(!showPending)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', bgcolor: '#1a1a1a' }}>
					{showPending ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
					<Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 'bold', ml: 1 }}>{`PENDING (${pending.length})`}</Typography>
				</Box>
				<Collapse in={showPending}>
					{pending.map(p => (
						<ListItem
							key={p.sender_id}
							secondaryAction={
								<Box>
									{/* Botón ACEPTAR */}
									<IconButton
										size="small"
										color="success"
										onClick={() => handleAccept(p.sender_id)}
									>
										<CheckIcon fontSize="small" />
									</IconButton>

									{/* Botón RECHAZAR */}
									<IconButton
										size="small"
										color="error"
										onClick={() => handleReject(p.sender_id)}
									>
										<CloseIcon fontSize="small" />
									</IconButton>
								</Box>
							}
						>
							<ListItemText primary={p.username} primaryTypographyProps={{ fontSize: '0.8rem' }} />
						</ListItem>
					))}
				</Collapse>
			</List>
		</Paper>
	);
};

export default SocialPanel;