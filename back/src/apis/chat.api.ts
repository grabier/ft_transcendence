import { FastifyPluginAsync } from 'fastify';
import { authenticate } from "../middleware/auth.js"; // Asegúrate de que la ruta sea correcta
import { pool } from '../../db/database.js'; // Ajusta ruta según tu estructura

const chatRoutes: FastifyPluginAsync = async (fastify, opts) => {

	// Candado de seguridad: Solo usuarios logueados
	fastify.addHook('preHandler', authenticate);

	/**
	 * POST /dm - Obtener o Crear un Chat Privado (DM)
	 * Body: { targetUserId: 5 }
	 * Devuelve: El ID del chat (dmId) para que empieces a pedir mensajes.
	 */
	fastify.post<{ Body: { targetUserId: number } }>('/dm', async (request, reply) => {
		try {
			const myId = (request.user as any).id;
			const targetId = request.body.targetUserId;

			if (myId === targetId)
				return reply.code(400).send({ error: "No puedes hablar contigo mismo (aún)" });

			// TRUCO: Ordenamos los IDs para asegurar unicidad (user1 siempre menor que user2)
			const user1 = Math.min(myId, targetId);
			const user2 = Math.max(myId, targetId);

			// 1. ¿Existe ya el chat?
			const [rows]: any = await pool.execute(
				'SELECT id FROM direct_messages WHERE user1_id = ? AND user2_id = ?',
				[user1, user2]
			);

			if (rows.length > 0) {
				// ¡Existe! Devolvemos su ID
				return { dmId: rows[0].id, isNew: false };
			}

			// 2. No existe, lo creamos
			// Verificar primero si el usuario objetivo existe y no está bloqueado (Mejora para Fase 2)
			const [result]: any = await pool.execute(
				'INSERT INTO direct_messages (user1_id, user2_id) VALUES (?, ?)',
				[user1, user2]
			);

			return { dmId: result.insertId, isNew: true };

		} catch (error) {
			request.log.error(error);
			return reply.code(500).send({ error: "Error al gestionar el chat" });
		}
	});

	/**
	 * GET /:dmId/messages - Obtener historial de un chat
	 * Query Params opcionales: ?limit=50&offset=0
	 */
	fastify.get<{ Params: { dmId: number }, Querystring: { limit?: number, offset?: number } }>('/:dmId/messages', async (request, reply) => {
		try {
			const userId = (request.user as any).id;
			const dmId = request.params.dmId;
			const limit = request.query.limit || 50;
			const offset = request.query.offset || 0;

			// 1. SEGURIDAD: ¿Soy participante de este chat?
			// Si no comprobamos esto, cualquiera podría leer chats ajenos probando IDs
			const [membership]: any = await pool.execute(
				'SELECT id FROM direct_messages WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
				[dmId, userId, userId]
			);

			if (membership.length === 0) {
				return reply.code(403).send({ error: "No tienes permiso para ver este chat" });
			}

			// 2. Obtener mensajes con datos del remitente (avatar, nombre)
			// Ordenamos DESC primero para coger los últimos, luego el Front les dará la vuelta
			const [messages] = await pool.execute(`
                SELECT m.id, m.content, m.type, m.created_at, m.sender_id, u.username, u.avatar_url
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.dm_id = ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            `, [dmId, limit.toString(), offset.toString()]); // toString por compatibilidad mysql2

			// Invertimos el array para enviarlo en orden cronológico (viejo -> nuevo)
			return (messages as any[]).reverse();

		} catch (error) {
			request.log.error(error);
			return reply.code(500).send({ error: "Error al obtener mensajes" });
		}
	});

	/**
	 * GET /me - Listar mis conversaciones activas
	 * Devuelve: [{ id, otherUser: { username, avatar_url... }, lastMessage: {...} }]
	 */
	fastify.get('/me', async (request, reply) => {
		try {
			const userId = (request.user as any).id;

			// Esta consulta es un poco compleja:
			// 1. Busca todos los DMs donde soy user1 o user2
			// 2. Hace JOIN con la tabla users para sacar los datos DEL OTRO
			// 3. Hace un sub-select o JOIN para sacar el último mensaje (Opcional, pero recomendado)

			const [rows] = await pool.execute(`
                SELECT 
                    dm.id, 
                    dm.user1_id, 
                    dm.user2_id,
                    u.id AS other_id,
                    u.username,
                    u.avatar_url,
                    u.is_online,
                    (SELECT content FROM messages WHERE dm_id = dm.id ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT created_at FROM messages WHERE dm_id = dm.id ORDER BY created_at DESC LIMIT 1) as last_date
                FROM direct_messages dm
                JOIN users u ON (u.id = IF(dm.user1_id = ?, dm.user2_id, dm.user1_id))
                WHERE dm.user1_id = ? OR dm.user2_id = ?
                ORDER BY last_date DESC
            `, [userId, userId, userId]);

			// Formateamos para que el Front lo entienda fácil
			const formattedChats = (rows as any[]).map(row => ({
				id: row.id,
				otherUser: {
					id: row.other_id,
					username: row.username,
					avatar_url: row.avatar_url,
					is_online: row.is_online === 1
				},
				lastMessage: row.last_message ? { content: row.last_message, created_at: row.last_date } : null
			}));

			return formattedChats;

		} catch (error) {
			request.log.error(error);
			return reply.code(500).send({ error: "Error al listar chats" });
		}
	});
};

export default chatRoutes;