import { pool } from '../../db/database.js';
import { socketManager } from './connection-manager.js';

interface ChatPayload {
	dmId: number;
	content: string;
	type?: 'text' | 'game_invite';
	score?: number;
}

export const handleChatMessage = async (senderId: number, payload: ChatPayload) => {
	const { dmId, content, type = 'text', score } = payload;

	try {
		// 1. SEGURIDAD (Igual que antes)
		const [rows]: any = await pool.execute(
			'SELECT user1_id, user2_id FROM direct_messages WHERE id = ?',
			[dmId]
		);

		if (rows.length === 0) return;

		const dm = rows[0];
		const receiverId = (dm.user1_id === senderId) ? dm.user2_id : dm.user1_id;

		if (dm.user1_id !== senderId && dm.user2_id !== senderId) {
			console.warn(`🚨 User ${senderId} intentó escribir en chat ajeno ${dmId}`);
			return;
		}

		// 2. BLOQUEOS
		const [blockCheck]: any = await pool.execute(
			`SELECT 1 FROM friendships WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND status = 'blocked'`,
			[receiverId, senderId, senderId, receiverId]
		);

		const [isfriend]: any = await pool.execute(
			`SELECT 1 FROM friendships WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))`,
			[receiverId, senderId, senderId, receiverId]
		);

		if (blockCheck.length > 0 || isfriend.length < 1) {
			console.log(`🚫 Mensaje bloqueado de ${senderId} a ${receiverId}`);
			return;
		}

		// 3. PERSISTENCIA: Guardar en BBDD con el SCORE

		// Lógica del Score:
		// Si es invitación y no mandan score, ponemos 5 por defecto.
		// Si es texto normal, forzamos NULL.
		let inviteScore = null;
		console.log(`🚫 🚫 🚫 🚫 🚫 🚫 Score: ${score}`);
		if (type === 'game_invite') {
			inviteScore = score || 5;
		}

		const [result]: any = await pool.execute(
			'INSERT INTO messages (dm_id, sender_id, content, type, invite_score) VALUES (?, ?, ?, ?, ?)',
			[dmId, senderId, content, type, inviteScore]
		);

		const createdAt = new Date().toISOString();
		const messageId = result.insertId;

		// 4. ENVÍO
		const [senderData]: any = await pool.execute('SELECT username, avatar_url FROM users WHERE id = ?', [senderId]);
		const sender = senderData[0];

		const messageToSend = {
			id: messageId,
			dm_id: dmId,
			sender_id: senderId,
			username: sender.username,
			avatar_url: sender.avatar_url,
			content: content,
			type: type,
			created_at: createdAt,
			invite_score: inviteScore
		};

		socketManager.notifyUser(receiverId, 'NEW_MESSAGE', messageToSend);
		socketManager.notifyUser(senderId, 'MESSAGE_SENT_OK', messageToSend);

	} catch (error) {
		console.error("🔥 Error handling chat message:", error);
	}
};

//typing indicators
export const handleTyping = async (senderId: number, payload: { dmId: number }) => {
	const { dmId } = payload;
	const [rows]: any = await pool.execute('SELECT user1_id, user2_id FROM direct_messages WHERE id = ?', [dmId]);
	if (rows.length === 0) return;
	
	const receiverId = rows[0].user1_id === senderId ? rows[0].user2_id : rows[0].user1_id;
	// Le rebotamos el evento al receptor
	socketManager.notifyUser(receiverId, 'TYPING', { dmId, senderId });
};

//read receipts
export const handleMarkAsRead = async (userId: number, payload: { dmId: number }) => {
	const { dmId } = payload;
	
	// Marcamos en BBDD todos los mensajes NO leídos de esta sala que NO sean míos
	await pool.execute(
		'UPDATE messages SET is_read = TRUE WHERE dm_id = ? AND sender_id != ? AND is_read = FALSE',
		[dmId, userId]
	);

	// Avisamos al emisor original de que ya los he leído para que le salga el check azul
	const [rows]: any = await pool.execute('SELECT user1_id, user2_id FROM direct_messages WHERE id = ?', [dmId]);
	if (rows.length === 0) return;

	const receiverId = rows[0].user1_id === userId ? rows[0].user2_id : rows[0].user1_id;
	socketManager.notifyUser(receiverId, 'MESSAGES_READ', { dmId });
};