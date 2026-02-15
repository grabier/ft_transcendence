/**
 * user.api.ts - API de usuarios
 * 
 * Endpoints para gestionar usuarios (listar, obtener por ID, etc.)
 * Usa MariaDB para las consultas.
 */

import { FastifyPluginAsync } from 'fastify';
import { authenticate } from "../middleware/auth.js";
import { pool } from '../../db/database.js';
import * as userRepository from "../data-access/user.repository.js";
import jwt from 'jsonwebtoken';
import {
	listAllUsersSchema,
	getUserByIdSchema,
	searchUsersSchema,
	updateUsernameSchema,
	updateAvatarSchema,
	persistenceSchema
} from "../schemas/user.schema.js";

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Parámetros de URL para endpoints que reciben un ID
 */
interface UserParams {
	id: string;
}
interface UpdateUsernameBody {
	newUsername: string;
}
interface UpdateAvatarUrlBody {
	newUrl: string;
}

// ============================================================================
// RUTAS DE USUARIOS
// ============================================================================

const userRoutes: FastifyPluginAsync = async (fastify, opts) => {

	// ========================================================================
	// GET / - Listar todos los usuarios
	// ========================================================================
	fastify.get('/', { schema: listAllUsersSchema }, async (request, reply) => {
		try {
			// Obtenemos todos los usuarios (sin el password por seguridad)
			const [rows] = await pool.execute(
				'SELECT id, username, email, avatar_url, is_online, created_at, last_login FROM users'
			);

			return rows;

		} catch (error: any) {
			request.log.error(error);
			return reply.send({
				error: 'Error al obtener usuarios',
				details: error.message
			});
		}
	});

	// ========================================================================
	// GET /:id - Obtener un usuario por su ID
	// ========================================================================
	fastify.get<{ Params: UserParams }>(
		'/:id',
		{ schema: getUserByIdSchema },
		async (request, reply) => {
			try {
				const { id } = request.params;

				// Buscar usuario por ID (sin el password)
				const [rows] = await pool.execute(
					'SELECT id, username, email, avatar_url, is_online, created_at, last_login FROM users WHERE id = ?',
					[id]
				);

				const users = rows as any[];

				// Verificar si el usuario existe
				if (users.length === 0) {
					return reply.code(404).send({
						error: 'Usuario no encontrado'
					});
				}

				return users[0];

			} catch (error: any) {
				request.log.error(error);
				return reply.code(500).send({
					error: 'Error al obtener usuario',
					details: error.message
				});
			}
		});

	// user.api.ts

	// Nuevo Endpoint de búsqueda
	fastify.get(
		'/search',
		{ schema: searchUsersSchema },
		async (request, reply) => {
			const { q } = request.query as { q: string };

			if (!q || q.length < 2) return [];

			try {
				// Buscamos usuarios que coincidan con el nombre
				const [rows] = await pool.execute(
					'SELECT id, username, avatar_url, is_online FROM users WHERE username LIKE ? LIMIT 5',
					[`%${q}%`]
				);
				// Nos aseguramos de devolver SIEMPRE un array, aunque esté vacío
				return rows || [];
			} catch (error: any) {
				request.log.error(error);
				return []; // Devolvemos array vacío en lugar de error para que el front no pete
			}
		});


	// GET /api/user/persistence - Marcar usuario como online y actualizar last_login
	fastify.get("/persistence",
		{
			preHandler: [authenticate],
			schema: persistenceSchema
		},
		async (req, reply) => {
			const userToken = req.user as any; // El usuario del token

			await userRepository.updateOnlineStatus(userToken.id, true);
			await userRepository.updateLastLogin(userToken.id);

			// 2. Buscamos los datos...
		});


	fastify.addHook('preHandler', authenticate);
	// Ruta de prueba
	/*  fastify.get("/profile", async (req, reply) => {
		 const user = req.user;
		 return { mensaje: "Si lees esto, es que tienes llave", user };
	 }); */

	fastify.patch<{ Body: UpdateUsernameBody }>(
		"/update-username",
		{ preHandler: [authenticate], schema: updateUsernameSchema },
		async (request, reply) => {
			try {
				const { newUsername } = request.body;
				// Forzamos el tipado para evitar el error de "id does not exist on type user"
				const currentUser = request.user as { id: number; email: string; username: string };

				if (!currentUser) {
					return reply.code(401).send({ error: "Unauthorized: No user found in token" });
				}

				const userId = currentUser.id;

				// 1. Validar disponibilidad
				const existingUser = await userRepository.findByUsername(newUsername);
				if (existingUser && existingUser.id !== userId) {
					return reply.code(409).send({ error: "Username is already taken" });
				}

				// 2. Actualizar DB
				await userRepository.updateUsername(userId, newUsername);

				// 3. Generar nuevo Token
				const newToken = jwt.sign(
					{ id: userId, email: currentUser.email, username: newUsername },
					process.env.JWT_SECRET || 'super_secret',
					{ expiresIn: '7d' }
				);

				// 4. Enviar respuesta con el token
				return reply.code(200).send({
					message: "Username updated successfully",
					token: newToken,
					username: newUsername
				});
			} catch (error: any) {
				request.log.error(error);
				return reply.code(500).send({ error: "Internal server error", details: error.message });
			}
		}


	);
	fastify.patch<{ Body: UpdateAvatarUrlBody }>(
		"/update-avatarUrl",
		{ preHandler: [authenticate], schema: updateAvatarSchema },
		async (request, reply) => {
			try {
				const { newUrl } = request.body;
				// Forzamos el tipado para evitar el error de "id does not exist on type user"
				const currentUser = request.user as { id: number; email: string; username: string; avatarUrl: string; };

				if (!currentUser) {
					return reply.code(401).send({ error: "Unauthorized: No user found in token" });
				}

				const userId = currentUser.id;


				// 2. Actualizar DB
				await userRepository.updateAvatarUrl(userId, newUrl);

				// 4. Enviar respuesta con el token
				return reply.code(200).send({
					message: "Avatar updated successfully",
					newUrl: newUrl
				});
			} catch (error: any) {
				request.log.error(error);
				return reply.code(500).send({ error: "Internal server error", details: error.message });
			}
		}


	);


};

export default userRoutes;