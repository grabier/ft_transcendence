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
import ChatIcon from '@mui/icons-material/Chat';
import { useSocket } from "../context/SocketContext";
import { useChat } from '../context/ChatContext';
import ProfileFriend from './ProfileFriend';
import { useAuthModals } from "../hooks/useAuthModals";

// Importamos tu componente de menú semicircular
import { FriendActionsMenu } from './FriendActionsMenu';

const PROTOCOL = window.location.protocol; // 'http:' o 'https:'
const HOST = window.location.hostname;     // 'localhost' o '10.13.1.5'
const PORT = '3000';                       // Tu puerto de backend
const BASE_URL = `${PROTOCOL}//${HOST}:${PORT}`; // Resultado: http://10.13.1.5:3000


interface Props {
	open: boolean;
	onClose: () => void;
}

export const SocialPanel = ({ open, onClose }: Props) => {
	// --- ESTADOS ---
	const [friends, setFriends] = useState<any[]>([]);
	const [pending, setPending] = useState<any[]>([]);
	const [blocked, setBlocked] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	// Estados de visualización de secciones
	const [showOnline, setShowOnline] = useState(true);
	const [showOffline, setShowOffline] = useState(true);
	const [showPending, setShowPending] = useState(true);
	const [showBlocked, setShowBlocked] = useState(true);


	// Estados de búsqueda
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<any[]>([]);

	// Hooks y Contexto
	const { markAsRead, lastNotification } = useSocket();
	const { selectChat } = useChat();
	const token = localStorage.getItem('auth_token');

	const modals = useAuthModals();
	const [selectedFriend, setSelectedFriend] = useState<any>();

	const handleViewProfile = (friend: any) => {
		setSelectedFriend(friend);
		modals.toggleProfileFriends();
	};

	// --- FETCH DATA ---
	const fetchData = useCallback(async () => {
		if (!token) return;
		try {
			const [resF, resP, resB] = await Promise.all([
				fetch(`${BASE_URL}/api/friend/list`, {
					headers: {
						'Authorization': `Bearer ${token}`,
						'Cache-Control': 'no-cache, no-store, must-revalidate',
						'Pragma': 'no-cache',
						'Expires': '0'
					}
				}),
				fetch(`${BASE_URL}/api/friend/pending`, {
					headers: {
						'Authorization': `Bearer ${token}`,
						'Cache-Control': 'no-cache, no-store, must-revalidate',
						'Pragma': 'no-cache',
						'Expires': '0'
					}
				}), fetch(`${BASE_URL}/api/friend/blocked`, {
					headers: {
						'Authorization': `Bearer ${token}`,
						'Cache-Control': 'no-cache, no-store, must-revalidate',
						'Pragma': 'no-cache',
						'Expires': '0'
					}
				})
			]);

			const friendsData = await resF.json();
			const pendingData = await resP.json();
			const blockedData = await resB.json();
			setFriends(Array.isArray(friendsData) ? friendsData : []);
			setPending(Array.isArray(pendingData) ? pendingData : []);
			setBlocked(Array.isArray(blockedData) ? blockedData : []);
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
		if (lastNotification?.type === 'FRIEND_REQUEST' || 'DELETE') {
			fetchData();
		}
	}, [lastNotification, fetchData]);

	// --- BUSQUEDA ---
	const handleSearch = useCallback(async () => {
		if (searchQuery.length < 2)
			return;
		try {
			const res = await fetch(`${BASE_URL}/api/user/search?q=${searchQuery}`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const data = await res.json();
			setSearchResults(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error("Error en búsqueda:", err);
			setSearchResults([]);
		}
	}, [searchQuery, token]);

	useEffect(() => {
		if (searchQuery.length < 1) {
			setSearchResults([]);
			return;
		}
		const timer = setTimeout(() => {
			if (searchQuery.length > 1)
				handleSearch();
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery, handleSearch]);

	// --- ACCIONES ---
	const sendRequest = async (receiverId: number) => {
		await fetch(`${BASE_URL}/api/friend/request`, {
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
			const res = await fetch(`${BASE_URL}/api/friend/accept/${senderId}`, {
				method: 'PUT',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok)
				fetchData();
		} catch (err) {
			console.error(err);
		}
	};
	const handleReject = async (senderId: number) => {
		try {
			const res = await fetch(`${BASE_URL}/api/friend/delete/${senderId}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok)
				fetchData();
		} catch (err) {
			console.error(err);
		}
	};
	const handleDelete = async (friendId: number) => {
		try {
			const res = await fetch(`${BASE_URL}/api/friend/delete/${friendId}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok)
				fetchData();
		} catch (err) {
			console.error(err);
		}
	};

	const handleBlock = async (blockedId: number) => {
		try {
			const res = await fetch(`${BASE_URL}/api/friend/block/${blockedId}`, {
				method: 'PUT',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok)
				fetchData();
		} catch (err) {
			console.error(err);
		}
	};
	const online = useMemo(() => Array.isArray(friends) ? friends.filter(f => f.is_online) : [], [friends]);
	const offline = useMemo(() => Array.isArray(friends) ? friends.filter(f => !f.is_online) : [], [friends]);
	const blockedUsers = useMemo(() => Array.isArray(blocked) ? blocked : [], [blocked]);
	// --- RENDERIZADO ---
	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			ModalProps={{ keepMounted: true }}
			PaperProps={{
				sx: {
					width: 320,
					bgcolor: 'background.paper',
					borderLeft: '1px solid',
					borderColor: 'divider',
					p: 0
				}
			}}
		>
			{/* --- CABECERA --- */}
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
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => (e.key === 'Enter' && handleSearch())}
							sx={{ mt: 1 }}
							InputProps={{
								endAdornment: (
									<IconButton size="small" onClick={handleSearch}>
										<PersonAddIcon fontSize="small" />
									</IconButton>
								)
							}}
						/>
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
									<ListItem
										key={f.id}
										sx={{ pl: 3 }}
										secondaryAction={
											<Stack direction="row" spacing={0} alignItems="center">
												{/* AQUÍ ESTA TU MENÚ INTEGRADO CORRECTAMENTE */}
												<FriendActionsMenu
													friend={f}
													onViewProfile={() => handleViewProfile(f)}
													onRemove={() => handleDelete(f.id)}
													onBlock={() => handleBlock(f.id)}
												/>
												<IconButton onClick={() => { onClose(); selectChat(f.id, f); }}>
													<ChatIcon color="primary" fontSize="small" />
												</IconButton>


											</Stack>
										}
									>
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
									<ListItem
										key={f.id}
										sx={{ pl: 3, opacity: 0.8 }}
										secondaryAction={
											<Stack direction="row" spacing={0} alignItems="center">
												{/* AQUÍ TAMBIÉN ESTÁ INTEGRADO */}
												<FriendActionsMenu
													friend={f}
													onViewProfile={() => handleViewProfile(f)}
													onRemove={() => handleDelete(f.id)}
													onBlock={() => handleBlock(f.id)}
												/>
												<IconButton onClick={() => { selectChat(f.id, f); onClose(); }}>
													<ChatIcon fontSize="small" sx={{ color: 'text.disabled' }} />
												</IconButton>


											</Stack>
										}
									>
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
						{/* BLOCKED */}
						<Box onClick={() => setShowBlocked(!showBlocked)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
							{showBlocked ? <KeyboardArrowDownIcon fontSize="small" color="disabled" /> : <KeyboardArrowRightIcon fontSize="small" color="disabled" />}
							<Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 'bold', ml: 1 }}>
								BLOCKED ({blockedUsers.length})
							</Typography>
						</Box>
						<Collapse in={showBlocked}>
							<List disablePadding>
								{blockedUsers.map(f => (
									<ListItem
										key={f.id}
										sx={{ pl: 3, opacity: 0.8 }}
										secondaryAction={
											<Stack direction="row" spacing={0} alignItems="center">
												{/* AQUÍ TAMBIÉN ESTÁ INTEGRADO */}
												<FriendActionsMenu
													friend={f}
													onViewProfile={() => handleViewProfile(f)}
													onRemove={() => handleDelete(f.id)}
													onBlock={() => handleBlock(f.id)}
												/>
												<IconButton onClick={() => { selectChat(f.id, f); onClose(); }}>
													<ChatIcon fontSize="small" sx={{ color: 'text.disabled' }} />
												</IconButton>


											</Stack>
										}
									>
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

			{selectedFriend && (
				<ProfileFriend
					open={modals.profileFriendsOpen}
					onClose={modals.closeAll}
					friend={selectedFriend}
				/>
			)}
		</Drawer>
	);
};

export default SocialPanel;