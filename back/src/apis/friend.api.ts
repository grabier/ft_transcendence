import { FastifyPluginAsync } from 'fastify';
import { authenticate } from "../middleware/auth.js";
import { pool } from '../../db/database.js';
import { socketManager } from '../websocket/connection-manager.js';
import {
	sendRequestSchema,
	listFriendsSchema,
	listBlockedSchema,
	listPendingSchema,
	acceptFriendSchema,
	deleteFriendSchema,
	blockUserSchema
} from "../schemas/friend.schema.js";

interface FriendParams {
	id: string;
}

interface FriendRequestBody {
	receiverId: number;
}

const friendRoutes: FastifyPluginAsync = async (fastify, opts) => {

	fastify.addHook('preHandler', authenticate);
	fastify.post<{ Body: FriendRequestBody }>(
		'/request',
		{ schema: sendRequestSchema },
		async (request, reply) => {
			const sender = request.user as any;
			const senderId = (request.user as any).id;
			const { receiverId } = request.body;

			let shouldNotify = false;

			if (senderId === receiverId) {
				return reply.code(400).send({ error: "Cannot send a request to yourself" });
			}

			const [rows] = await pool.execute(
				'SELECT id FROM friendships WHERE sender_id = ? AND receiver_id = ? OR sender_id = ? AND receiver_id = ?',
				[senderId, receiverId, receiverId, senderId]
			);

			const users = rows as any[];
			if (users.length > 0) {
				return reply.code(409).send({
					error: 'Petition send already'
				});
			}

			try {
				await pool.execute(
					'INSERT INTO friendships (sender_id, receiver_id, status) VALUES (?, ?, "pending")',
					[senderId, receiverId]
				);

				shouldNotify = true;
				return { message: "Friend request sent succesfully" };

			} catch (error: any) {
				if (error.code === 'ER_DUP_ENTRY') {
					return reply.code(409).send({ error: "There's already a request" });
				}
				return reply.code(500).send({ error: "Internal error sending request" });

			} finally {
				if (shouldNotify) {
					socketManager.notifyUser(receiverId, 'FRIEND_REQUEST', {
						senderId: senderId,
						username: sender.username,
						message: `${sender.username} sent you a request.`
					});
				}
			}
		});

	fastify.get('/list', { schema: listFriendsSchema }, async (request, reply) => {
		try {
			const userId = (request.user as any).id;
			const [friends] = await pool.execute(`
                SELECT u.id, u.username, u.avatar_url, u.is_online
                FROM users u
                JOIN friendships f ON (u.id = f.sender_id OR u.id = f.receiver_id)
                WHERE (f.sender_id = ? OR f.receiver_id = ?) 
                  AND f.status = 'accepted'
                  AND u.id != ?
            `, [userId, userId, userId]);

			return friends;
		} catch (error: any) {
			return reply.send({ error: "Error fetching friend list" });
		}
	});
	fastify.get('/blocked', { schema: listBlockedSchema }, async (request, reply) => {
		try {
			const userId = (request.user as any).id;

			const [blockade] = await pool.execute(`
                SELECT u.id, u.username, u.avatar_url, u.is_online
                FROM users u
                JOIN friendships f ON (u.id = f.sender_id OR u.id = f.receiver_id)
                WHERE (f.sender_id = ? OR f.receiver_id = ?) 
                  AND f.status = 'blocked' 
                  AND u.id != ?
				  AND blocked_by = ?
            `, [userId, userId, userId, userId]);

			return blockade;
		} catch (error: any) {
			return reply.send({ error: "Error fetching friend list" });
		}
	});

	fastify.get('/pending', { schema: listPendingSchema }, async (request, reply) => {
		try {
			const userId = (request.user as any).id;

			const [requests] = await pool.execute(`
                SELECT f.id AS friendship_id, u.id AS sender_id, u.username, u.avatar_url, f.created_at
                FROM friendships f
                JOIN users u ON f.sender_id = u.id
                WHERE f.receiver_id = ? AND f.status = 'pending'
            `, [userId]);

			return requests;
		} catch (error: any) {
			return reply.send({ error: "Error fetching pending friend list" });
		}
	});

	fastify.put<{ Params: FriendParams }>(
		'/accept/:id',
		{ schema: acceptFriendSchema },
		async (request, reply) => {
			try {
				const userId = (request.user as any).id;
				const senderId = (request.params as any).id;

				const [result]: any = await pool.execute(
					'UPDATE friendships SET status = "accepted" WHERE receiver_id = ? AND sender_id = ? AND status = "pending"',
					[userId, senderId]
				);

				if (result.affectedRows === 0) {
					return reply.code(404).send({ error: "Petition already found or accepted" });
				}
				const aidi = parseInt(senderId);
				socketManager.notifyUser(aidi, 'FRIEND_REQUEST', {
					senderId: aidi,
					username: userId.username,
					message: `${(request.params as any).username} has accepted your request.`
				});
				return { message: "You are now friends" };
			} catch (error: any) {
				return reply.code(500).send({ error: "Error accepting friend request" });
			}
		});

	fastify.delete<{ Params: FriendParams }>(
		'/delete/:id',
		{ schema: deleteFriendSchema },
		async (request, reply) => {
			try {
				const userId = (request.user as any).id;
				const otherId = (request.params as any).id;

				await pool.execute(`
                DELETE FROM friendships
                WHERE (sender_id = ? AND receiver_id = ?) 
                   OR (sender_id = ? AND receiver_id = ?)
            `, [userId, otherId, otherId, userId]);

				const aidi = parseInt(otherId);
				socketManager.notifyUser(aidi, 'DELETE', {
					senderId: aidi,
					message: `${(request.params as any).username} has removed you as a friend.`
				});

				return { message: "Relationship deleted succesfully" };
			} catch (error: any) {
				return reply.code(500).send({ error: "Error when deleting relationship" });
			}
		});

	fastify.put<{ Params: FriendParams }>(
		'/block/:id',
		{ schema: blockUserSchema },
		async (request, reply) => {
			try {
				const user = request.user as any;
				const userId = user.id;
				const blockedId = (request.params as any).id;

				const [result]: any = await pool.execute(
					`UPDATE friendships 
                 SET status = 'blocked', blocked_by = ? 
                 WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
                 AND status IN ('pending', 'accepted')`,
					[userId, userId, blockedId, blockedId, userId]
				);

				if (result.affectedRows === 0) {
					return reply.code(404).send({ error: "Friendship not found" });
				}

				const blockedIdInt = parseInt(blockedId);
				socketManager.notifyUser(blockedIdInt, 'BLOCKED', {
					blockedId: blockedIdInt,
					username: user.username,
					message: `${user.username} has blocked you.`
				});

				return { message: "User blocked successfully" };

			} catch (error: any) {
				console.error(error);
				return reply.code(500).send({ error: "Error blocking user" });
			}
		});

};

export default friendRoutes;