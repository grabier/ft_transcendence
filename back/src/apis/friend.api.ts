/**
 * friend.api.ts - API para la gestión de amigos
 * * Gestiona el ciclo de vida de las amistades: enviar peticiones,
 * aceptar, listar amigos y eliminar/bloquear.
 */

import { FastifyPluginAsync } from 'fastify';
import { authenticate } from "../middleware/auth.js";
import { pool } from '../../db/database.js';
import { socketManager } from '../websocket/connection-manager.js';

// ============================================================================
// INTERFACES
// ============================================================================

interface FriendParams {
	id: string; // Para rutas como /accept/:id o /delete/:id
}

interface FriendRequestBody {
	receiverId: number;
}

// ============================================================================
// RUTAS DE AMISTAD
// ============================================================================

const friendRoutes: FastifyPluginAsync = async (fastify, opts) => {

	// Aplicamos el guardia de seguridad a todas las rutas de este archivo
	fastify.addHook('preHandler', authenticate);

	/**
	 * POST /request - Enviar una nueva petición de amistad
	 */
	fastify.post<{ Body: FriendRequestBody }>('/request', async (request, reply) => {
		const sender = request.user as any;
		const senderId = (request.user as any).id;
		const { receiverId } = request.body;

		// Variable para rastrear si la inserción fue exitosa
		let shouldNotify = false;

		if (senderId === receiverId) {
			return reply.code(400).send({ error: "No puedes enviarte una petición a ti mismo" });
		}

		try {
			// Intentamos insertar
			await pool.execute(
				'INSERT INTO friendships (sender_id, receiver_id, status) VALUES (?, ?, "pending")',
				[senderId, receiverId]
			);

			// Si llegamos aquí, la DB aceptó el registro
			shouldNotify = true;
			return { message: "Petición de amistad enviada con éxito" };

		} catch (error: any) {
			if (error.code === 'ER_DUP_ENTRY') {
				return reply.code(409).send({ error: "Ya existe una petición o relación entre vosotros" });
			}
			return reply.code(500).send({ error: "Error interno al enviar la petición" });

		} finally {
			// Esto se ejecuta SIEMPRE, pero solo notificamos si shouldNotify es true
			if (shouldNotify) {
				socketManager.notifyUser(receiverId, 'FRIEND_REQUEST', {
					senderId: senderId,
					username: sender.username,
					message: `${sender.username} te ha enviado una solicitud.`
				});
			}
		}
	});

	/**
	 * GET /list - Obtener la lista de amigos aceptados (Para la barra lateral)
	 */
	fastify.get('/list', async (request, reply) => {
		try {
			const userId = (request.user as any).id;

			// Query que busca amigos en ambas direcciones de la relación
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
			return reply.code(500).send({ error: "Error al obtener la lista de amigos" });
		}
	});
	fastify.get('/blocked', async (request, reply) => {
		try {
			const userId = (request.user as any).id;

			// Query que busca amigos en ambas direcciones de la relación
			const [blockade] = await pool.execute(`
                SELECT u.id, u.username, u.avatar_url, u.is_online
                FROM users u
                JOIN friendships f ON (u.id = f.sender_id OR u.id = f.receiver_id)
                WHERE (f.sender_id = ? OR f.receiver_id = ?) 
                  AND f.status = 'blocked' 
                  AND u.id != ?
            `, [userId, userId, userId]);

			return blockade;
		} catch (error: any) {
			return reply.code(500).send({ error: "Error al obtener la lista de amigos" });
		}
	});

	/**
	 * GET /pending - Ver peticiones recibidas que están pendientes
	 */
	fastify.get('/pending', async (request, reply) => {
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
			return reply.code(500).send({ error: "Error al obtener peticiones pendientes" });
		}
	});

	/**
	 * PUT /accept/:id - Aceptar una petición de amistad
	 * El :id es el ID del usuario que envió la petición (sender_id)
	 */

	//gabri del futuro.. si tienes tiempo prueba esto
	//fastify.put<{ Params: {id: number}, }>('/accept/:id', async (request, reply) => {
	fastify.put<{ Params: FriendParams, }>('/accept/:id', async (request, reply) => {
		try {
			const userId = (request.user as any).id;
			const senderId = (request.params as any).id;

			const [result]: any = await pool.execute(
				'UPDATE friendships SET status = "accepted" WHERE receiver_id = ? AND sender_id = ? AND status = "pending"',
				[userId, senderId]
			);

			if (result.affectedRows === 0) {
				return reply.code(404).send({ error: "Petición no encontrada o ya aceptada" });
			}
			const aidi = parseInt(senderId);
			socketManager.notifyUser(aidi, 'FRIEND_REQUEST', {
				senderId: aidi,
				username: userId.username, // Para que el front muestre el nombre
				message: `${(request.params as any).username} has accepted your request.`
			});
			return { message: "Ahora sois amigos" };
		} catch (error: any) {
			return reply.code(500).send({ error: "Error al aceptar la amistad" });
		}
	});

	/**
	 * DELETE /:id - Eliminar un amigo o rechazar una petición
	 * El :id es el ID del otro usuario
	 */
	fastify.delete<{ Params: FriendParams }>('/delete/:id', async (request, reply) => {
		try {
			const userId = (request.user as any).id;
			const otherId = (request.params as any).id;

			// Borra la relación sin importar quién la empezó
			await pool.execute(`
                DELETE FROM friendships 
                WHERE (sender_id = ? AND receiver_id = ?) 
                   OR (sender_id = ? AND receiver_id = ?)
            `, [userId, otherId, otherId, userId]);

			const aidi = parseInt(otherId);
			socketManager.notifyUser(aidi, 'DELETE', {
				senderId: aidi,
				message: `${(request.params as any).username} has removed you as a frien.`
			});

			return { message: "Relación eliminada correctamente" };
		} catch (error: any) {
			return reply.code(500).send({ error: "Error al eliminar la relación" });
		}
	});


	/**
	 * PUT /accept/:id - Aceptar una petición de amistad
	 * El :id es el ID del usuario que envió la petición (sender_id)
	 */

	//gabri del futuro.. si tienes tiempo prueba esto
	//fastify.put<{ Params: {id: number}, }>('/accept/:id', async (request, reply) => {
	fastify.put<{ Params: FriendParams, }>('/block/:id', async (request, reply) => {
		try {
			const userId = (request.user as any).id;
			const blockedId = (request.params as any).id;

			const [result]: any = await pool.execute(
				'UPDATE friendships SET status = "blocked" WHERE receiver_id = ? AND sender_id = ? AND status = "pending" OR status = "accepted"',
				[userId, blockedId]
			);

			if (result.affectedRows === 0) {
				return reply.code(404).send({ error: "Petición no encontrada o ya bloqueada" });
			}
			const aidi = parseInt(blockedId);
			socketManager.notifyUser(aidi, 'BLOCKED', {
				blockedId: aidi,
				username: userId.username, // Para que el front muestre el nombre
				message: `${(request.params as any).username} has blocked you.`
			});
			return { message: "Tan blokeao por pajas" };
		} catch (error: any) {
			return reply.code(500).send({ error: "Error al bloquear usuario" });
		}
	});

};

export default friendRoutes;