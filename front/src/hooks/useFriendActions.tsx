import { useCallback } from 'react';
import { BASE_URL } from '../config';

export const useFriendActions = (onSuccess?: () => void) => {
	const token = localStorage.getItem('auth_token');

	const deleteFriend = useCallback(async (friendId: number) => {
		if (!token) return false;
		try {
			const res = await fetch(`${BASE_URL}/api/friend/delete/${friendId}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok) {
				if (onSuccess) onSuccess(); // Avisamos de que ha ido bien
				return true;
			}
			return false;
		} catch (err) {
			console.error("Error deleting friend:", err);
			return false;
		}
	}, [token, onSuccess]);

	const blockFriend = useCallback(async (friendId: number) => {
		if (!token) return false;
		try {
			const res = await fetch(`${BASE_URL}/api/friend/block/${friendId}`, {
				method: 'PUT',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok) {
				if (onSuccess) onSuccess(); // Avisamos de que ha ido bien
				return true;
			}
			return false;
		} catch (err) {
			console.error("Error blocking friend:", err);
			return false;
		}
	}, [token, onSuccess]);

	return { deleteFriend, blockFriend };
};