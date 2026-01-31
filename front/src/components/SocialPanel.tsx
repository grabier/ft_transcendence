import { useState, useEffect, useCallback, useMemo } from 'react';
import {
	List, ListItem, ListItemAvatar, ListItemText, Avatar,
	Typography, Divider, Badge, IconButton, Box, CircularProgress,
	TextField, Collapse, Drawer, Stack
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import GroupIcon from '@mui/icons-material/Group';
import { useSocket } from "../context/SocketContext";



interface Props {
	open: boolean;
	onClose: () => void;
}

export const SocialPanel = ({ open, onClose }: Props) => {
	// --- ESTADOS ORIGINALES ---
	const [friends, setFriends] = useState<any[]>([]);
	const [pending, setPending] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [showOnline, setShowOnline] = useState(true);
	const [showOffline, setShowOffline] = useState(true);
	const [showPending, setShowPending] = useState(true);

	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const {markAsRead, lastNotification} = useSocket();
	const token = localStorage.getItem('auth_token');

	// --- LÓGICA ORIGINAL ---
	const fetchData = useCallback(async () => {
		if (!token) return;
		try {
			const [resF, resP] = await Promise.all([
				fetch('http://localhost:3000/api/friend/list', { headers: { 'Authorization': `Bearer ${token}` } }),
				fetch('http://localhost:3000/api/friend/pending', { headers: { 'Authorization': `Bearer ${token}` } })
			]);

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

	useEffect(() => {
		if (open) {
			markAsRead();
			fetchData();
		}
	}, [open, fetchData, markAsRead]);

	useEffect(() => {
		if (lastNotification?.type === 'FRIEND_REQUEST') {
			fetchData();
			
		}
	}, [lastNotification]);

	

	const handleSearch = useCallback(async () => {
		if (searchQuery.length < 2) return;
		try {
			const res = await fetch(`http://localhost:3000/api/user/search?q=${searchQuery}`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const data = await res.json();
			setSearchResults(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error("Error en búsqueda:", err);
			setSearchResults([]);
		}
	}, [searchQuery, setSearchResults]);

	useEffect(() => {
		if (searchQuery.length < 1) {
			setSearchResults([]);
			return;
		}
		const timer = setTimeout(() => {
			if (searchQuery.length > 1) handleSearch();
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery, handleSearch]);

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

	const handleAccept = async (senderId: number) => {
		try {
			const res = await fetch(`http://localhost:3000/api/friend/accept/${senderId}`, {
				method: 'PUT',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok) fetchData();
		} catch (err) {
			console.error(err);
		}
	};

	const handleReject = async (senderId: number) => {
		try {
			const res = await fetch(`http://localhost:3000/api/friend/${senderId}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok) fetchData();
		} catch (err) {
			console.error(err);
		}
	};

	const online = useMemo(() => Array.isArray(friends) ? friends.filter(f => f.is_online) : [], [friends]);
	const offline = useMemo(() => Array.isArray(friends) ? friends.filter(f => !f.is_online) : [], [friends]);

	// --- RENDERIZADO DEL MODAL ---
	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			// ESTA ES LA CLAVE PARA LA PERSISTENCIA:
			// Mantiene el componente montado en el DOM aunque esté oculto.
			// Así no pierdes si tenías desplegado "Offline" o lo que habías escrito en el buscador.
			ModalProps={{ keepMounted: true }}
			PaperProps={{
				sx: {
					width: 320, // Ancho fijo del sidebar
					bgcolor: 'background.paper',
					borderLeft: '1px solid',
					borderColor: 'divider',
					p: 0
				}
			}}
		>
			{/* --- CABECERA DEL DRAWER --- */}
			<Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.dark' }}>
				<Stack direction="row" spacing={1} alignItems="center">
					<GroupIcon sx={{ color: 'secondary.main' }} />
					<Typography variant="h6" color="white" fontWeight="bold">
						Social Hub
					</Typography>
				</Stack>
				<IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
					<CloseIcon />
				</IconButton>
			</Box>

			{/* --- CONTENIDO SCROLLABLE --- */}
			<Box sx={{ overflowY: 'auto', height: '100%' }}>

				{/* BARRA DE BÚSQUEDA */}
				<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: showSearch ? 1 : 0 }}>
						<Typography variant="subtitle2" sx={{ flexGrow: 1, color: 'text.secondary' }}>
							FIND FRIENDS
						</Typography>
						<IconButton
							size="small"
							onClick={() => setShowSearch(!showSearch)}
							color={showSearch ? 'primary' : 'default'}
						>
							<SearchIcon fontSize="small" />
						</IconButton>
					</Box>

					<Collapse in={showSearch}>
						<TextField
							fullWidth
							size="small"
							placeholder="Username..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)} //gives the searchquery string value
							onKeyDown={(e) => (e.key === 'Enter' && handleSearch())}
							//onKeyUp={() =>  handleSearch()}
							sx={{ mt: 1 }}
							InputProps={{
								endAdornment: (
									<IconButton size="small" onClick={handleSearch}>
										<PersonAddIcon fontSize="small" />
									</IconButton>
								)
							}}
						/>
						{/* Resultados de búsqueda */}
						<List dense sx={{ mt: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
							{Array.isArray(searchResults) && searchResults.map(u => (
								<ListItem key={u.id} divider>
									<ListItemText primary={u.username} />
									<IconButton size="small" onClick={() => sendRequest(u.id)} color="primary">
										<PersonAddIcon fontSize="small" />
									</IconButton>
								</ListItem>
							))}
							{searchResults.length === 0 && searchQuery.length > 2 && (
								<Typography variant="caption" sx={{ p: 1, display: 'block', textAlign: 'center' }}>No users found</Typography>
							)}
						</List>
					</Collapse>
				</Box>

				{/* --- LISTAS DE AMIGOS --- */}
				{loading && friends.length === 0 ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
						<CircularProgress size={30} />
					</Box>
				) : (
					<List component="nav" sx={{ p: 0 }}>

						{/* PENDING REQUESTS */}
						{pending.length > 0 && (
							<>
								<Box onClick={() => setShowPending(!showPending)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer', bgcolor: 'warning.main', color: 'black' }}>
									{showPending ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
									<Typography variant="subtitle2" sx={{ fontWeight: 'bold', ml: 1 }}>
										REQUESTS ({pending.length})
									</Typography>
								</Box>
								<Collapse in={showPending}>
									<List disablePadding>
										{pending.map(p => (
											<ListItem key={p.sender_id} sx={{ pl: 4, bgcolor: 'background.default' }} divider>
												<ListItemText primary={p.username} />
												<Stack direction="row" spacing={0}>
													<IconButton size="small" color="success" onClick={() => handleAccept(p.sender_id)}>
														<CheckIcon fontSize="small" />
													</IconButton>
													<IconButton size="small" color="error" onClick={() => handleReject(p.sender_id)}>
														<CloseIcon fontSize="small" />
													</IconButton>
												</Stack>
											</ListItem>
										))}
									</List>
								</Collapse>
							</>
						)}

						{/* ONLINE FRIENDS */}
						<Box onClick={() => setShowOnline(!showOnline)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
							{showOnline ? <KeyboardArrowDownIcon fontSize="small" color="success" /> : <KeyboardArrowRightIcon fontSize="small" color="disabled" />}
							<Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 'bold', ml: 1 }}>
								ONLINE ({online.length})
							</Typography>
						</Box>
						<Collapse in={showOnline}>
							<List disablePadding>
								{online.map(f => (
									<ListItem key={f.id} sx={{ pl: 3 }}>
										<ListItemAvatar sx={{ minWidth: 45 }}>
											<Badge variant="dot" color="success" overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
												<Avatar src={f.avatar_url} sx={{ width: 32, height: 32 }} />
											</Badge>
										</ListItemAvatar>
										<ListItemText
											primary={f.username}
											primaryTypographyProps={{ fontSize: '0.9rem' }}
										/>
									</ListItem>
								))}
								{online.length === 0 && <Typography variant="caption" sx={{ pl: 4, py: 1, display: 'block', color: 'text.secondary' }}>No friends online</Typography>}
							</List>
						</Collapse>
						<Divider variant="middle" sx={{ my: 1 }} />

						{/* OFFLINE FRIENDS */}
						<Box onClick={() => setShowOffline(!showOffline)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
							{showOffline ? <KeyboardArrowDownIcon fontSize="small" color="disabled" /> : <KeyboardArrowRightIcon fontSize="small" color="disabled" />}
							<Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 'bold', ml: 1 }}>
								OFFLINE ({offline.length})
							</Typography>
						</Box>
						<Collapse in={showOffline}>
							<List disablePadding>
								{offline.map(f => (
									<ListItem key={f.id} sx={{ pl: 3, opacity: 0.5 }}>
										<ListItemAvatar sx={{ minWidth: 45 }}>
											<Avatar src={f.avatar_url} sx={{ width: 32, height: 32, filter: 'grayscale(1)' }} />
										</ListItemAvatar>
										<ListItemText
											primary={f.username}
											primaryTypographyProps={{ fontSize: '0.9rem' }}
										/>
									</ListItem>
								))}
							</List>
						</Collapse>

					</List>
				)}
			</Box>
		</Drawer>
	);
};

export default SocialPanel;