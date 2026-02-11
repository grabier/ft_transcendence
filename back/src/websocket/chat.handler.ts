import { pool } from '../../db/database.js';
import { socketManager } from './connection-manager.js';

interface ChatPayload {
	dmId: number;
	content: string;
	type?: 'text' | 'game_invite'; // Por defecto será 'text'
}

export const handleChatMessage = async (senderId: number, payload: ChatPayload) => {
	const { dmId, content, type = 'text' } = payload;

	try {
		// 1. SEGURIDAD: ¿Quién es el otro participante? Y ¿Realmente estoy en este chat?
		const [rows]: any = await pool.execute(
			'SELECT user1_id, user2_id FROM direct_messages WHERE id = ?',
			[dmId]
		);

		if (rows.length === 0)
			return; // El chat no existe

		const dm = rows[0];
		// Determinar quién es el receptor (el que NO soy yo)
		const receiverId = (dm.user1_id === senderId) ? dm.user2_id : dm.user1_id;

		// Si yo no era ni user1 ni user2, es que estoy intentando hackear
		if (dm.user1_id !== senderId && dm.user2_id !== senderId) {
			console.warn(`🚨 User ${senderId} intentó escribir en chat ajeno ${dmId}`);
			return;
		}

		// 2. BLOQUEOS: ¿Me ha bloqueado el receptor?
		// Buscamos si existe una fila donde blocker = receptor AND blocked = yo
		const [blockCheck]: any = await pool.execute(
			`SELECT 1 FROM friendships WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))  AND status = 'blocked'`,
			[receiverId, senderId, senderId, receiverId]
		);

		if (blockCheck.length > 0) {
			// OPCIÓN A: Le damos error (Silent Fail). 
			// El usuario cree que lo envió, pero nunca llega. Es más elegante.
			console.log(`🚫 Mensaje bloqueado de ${senderId} a ${receiverId}`);
			return;
		}

		// 3. PERSISTENCIA: Guardar en BBDD
		const [result]: any = await pool.execute(
			'INSERT INTO messages (dm_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
			[dmId, senderId, content, type]
		);

		// Recuperamos la fecha exacta de creación para enviarla al front
		const createdAt = new Date().toISOString();
		const messageId = result.insertId;

		// 4. ENVÍO: Notificar al receptor (Si está conectado)
		// Usamos tu socketManager para enviarle el evento 'NEW_MESSAGE'

		// Obtenemos datos extra del sender para pintar el mensaje bonito en el front del otro
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
			created_at: createdAt
		};

		// Enviar al RECEPTOR
		socketManager.notifyUser(receiverId, 'NEW_MESSAGE', messageToSend);

		// Enviar al EMISOR (Para confirmar que se guardó y pintarlo, o usamos optimismo en front)
		// A veces es útil reenviárselo para confirmar ID y fecha real
		socketManager.notifyUser(senderId, 'MESSAGE_SENT_OK', messageToSend);

	} catch (error) {
		console.error("🔥 Error handling chat message:", error);
	}
};