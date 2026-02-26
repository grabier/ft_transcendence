import { FastifyPluginAsync } from 'fastify';
import { authenticate } from "../middleware/auth.js";
import { pool } from '../../db/database.js';
import { getDMSchema, getMessagesSchema, getMyChatsSchema } from "../schemas/chat.schema.js";

const chatRoutes: FastifyPluginAsync = async (fastify, opts) => {
	fastify.addHook('preHandler', authenticate);

	fastify.post<{ Body: { targetUserId: number } }>(
		'/dm',
		{ schema: getDMSchema },
		async (request, reply) => {
			try {
				const myId = (request.user as any).id;
				const targetId = request.body.targetUserId;

				if (myId === targetId)
					return reply.code(400).send({ error: "Cant talk to yourself" });

				const user1 = Math.min(myId, targetId);
				const user2 = Math.max(myId, targetId);

				const [rows]: any = await pool.execute(
					'SELECT id FROM direct_messages WHERE user1_id = ? AND user2_id = ?',
					[user1, user2]
				);

				if (rows.length > 0) {
					return { dmId: rows[0].id, isNew: false };
				}

				const [result]: any = await pool.execute(
					'INSERT INTO direct_messages (user1_id, user2_id) VALUES (?, ?)',
					[user1, user2]
				);

				return { dmId: result.insertId, isNew: true };

			} catch (error) {
				request.log.error(error);
				return reply.code(500).send({ error: "Error managing chat" });
			}
		});

	fastify.get<{ Params: { dmId: number }, Querystring: { limit?: number, offset?: number } }>(
		'/:dmId/messages',
		{ schema: getMessagesSchema },
		async (request, reply) => {
			try {
				const userId = (request.user as any).id;
				const dmId = request.params.dmId;
				const limit = request.query.limit || 50;
				const offset = request.query.offset || 0;

				const [membership]: any = await pool.execute(
					'SELECT id FROM direct_messages WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
					[dmId, userId, userId]
				);

				if (membership.length === 0) {
					return reply.code(403).send({ error: "Dont have permission to see this chat" });
				}

				const [messages] = await pool.execute(`
                SELECT m.id, m.content, m.type, m.created_at, m.sender_id, m.invite_score, m.is_read, u.username, u.avatar_url
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.dm_id = ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            `, [dmId, limit.toString(), offset.toString()]); 
				return (messages as any[]).reverse();

			} catch (error) {
				request.log.error(error);
				return reply.code(500).send({ error: "Error fetching messages" });
			}
		});

	fastify.get(
		'/me',
		{ schema: getMyChatsSchema },
		async (request, reply) => {
			try {
				const userId = (request.user as any).id;
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
				return reply.send({ error: "Error listing chats" });
			}
		});
};

export default chatRoutes;