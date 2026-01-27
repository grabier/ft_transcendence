/**
 * user.api.ts - API de usuarios
 * 
 * Endpoints para gestionar usuarios (listar, obtener por ID, etc.)
 * Usa MariaDB para las consultas.
 */

import { FastifyPluginAsync } from 'fastify';
import { authenticate } from "../middleware/auth.js";
import { pool } from '../../db/database.js';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Parámetros de URL para endpoints que reciben un ID
 */
interface UserParams {
	id: string;
}

// ============================================================================
// RUTAS DE USUARIOS
// ============================================================================

const userRoutes: FastifyPluginAsync = async (fastify, opts) => {

	// ========================================================================
	// GET / - Listar todos los usuarios
	// ========================================================================
	fastify.get('/', async (request, reply) => {
		try {
			// Obtenemos todos los usuarios (sin el password por seguridad)
			const [rows] = await pool.execute(
				'SELECT id, username, email, avatar_url, is_online, created_at, last_login FROM users'
			);

			return rows;

		} catch (error: any) {
			request.log.error(error);
			return reply.code(500).send({
				error: 'Error al obtener usuarios',
				details: error.message
			});
		}
	});

	// ========================================================================
	// GET /:id - Obtener un usuario por su ID
	// ========================================================================
	fastify.get<{ Params: UserParams }>('/:id', async (request, reply) => {
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

	
	fastify.addHook('preHandler', authenticate); 
    // Ruta de prueba
    fastify.get("/profile", async (req, reply) => {
        const user = req.user;
        return { mensaje: "Si lees esto, es que tienes llave", user };
    });

	
};

export default userRoutes;