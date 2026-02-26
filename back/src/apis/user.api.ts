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
	getUserByIdSchema,
	searchUsersSchema,
	updateUsernameSchema,
	updateAvatarSchema,
	persistenceSchema,
	uploadAvatarSchema
} from "../schemas/user.schema.js";

import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

//  Esta función busca la IP real de tu máquina (ej: 10.13.1.5)
const getServerIp = () => {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name] || []) {
			// Buscamos una dirección IPv4 que NO sea interna (no sea 127.0.0.1)
			if (iface.family === 'IPv4' && !iface.internal) {
				return iface.address;
			}
		}
	}
	return 'localhost'; // Fallback por si acaso
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

	//endpoint de busqueda
	fastify.get(
		'/search',
		{ schema: searchUsersSchema },
		async (request, reply) => {
			const { q } = request.query as { q: string };

			if (!q || q.length < 1) return [];

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
				const currentUser = request.user as { id: number; email: string; username: string; avatarUrl: string; };
				if (!currentUser) {
					return reply.code(401).send({ error: "Unauthorized: No user found in token" });
				}
				const userId = currentUser.id;
				await userRepository.updateAvatarUrl(userId, newUrl);
				const newToken = jwt.sign(
					{ id: userId, email: currentUser.email, username: currentUser.username, avatarUrl: newUrl },
					process.env.JWT_SECRET || 'super_secret',
					{ expiresIn: '7d' }
				);
				return reply.code(200).send({
					message: "Avatar updated successfully",
					newUrl: newUrl,
					token: newToken
				});
			} catch (error: any) {
				request.log.error(error);
				return reply.code(500).send({ error: "Internal server error", details: error.message });
			}
		}
	);

	// POST /api/user/upload-avatar
	fastify.post('/upload-avatar', { preHandler: [authenticate], schema: uploadAvatarSchema }, async (request, reply) => {
		const data = await request.file();
		if (!data) return reply.code(400).send({ error: "No file uploaded" });

		const currentUser = request.user as { id: number; email: string; username: string; avatarUrl: string };
		// 1. Crear nombre único: userId-timestamp.ext
		const extension = path.extname(data.filename);
		const fileName = `${currentUser.id}-${Date.now()}${extension}`;

		// 2. Definir ruta física (back/uploads/avatars)
		const uploadDir = path.join(__dirname, '../../uploads/avatars');
		const uploadPath = path.join(uploadDir, fileName);

		// 3. Crear carpeta si no existe
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		// 4. Guardar archivo en disco
		await pipeline(data.file, fs.createWriteStream(uploadPath));

		// 5. Generar URL pública dinámica
		// Usamos request.protocol y request.hostname para que funcione en LAN/IP
		const protocol = request.protocol;
		const serverIp = getServerIp();
		const newAvatarUrl = `${protocol}://${serverIp}:3000/public/avatars/${fileName}`;
		console.log("📸 Nueva URL generada:", newAvatarUrl);
		// 6. Actualizar Base de Datos
		await userRepository.updateAvatarUrl(currentUser.id, newAvatarUrl);
		const newToken = jwt.sign(
			{
				id: currentUser.id,
				email: currentUser.email,
				username: currentUser.username,
				avatarUrl: newAvatarUrl // La magia ocurre aquí
			},
			process.env.JWT_SECRET || 'super_secret',
			{ expiresIn: '7d' }
		);

		return {
			message: "Avatar uploaded successfully",
			avatarUrl: newAvatarUrl,
			token: newToken
		};
	});
};

export default userRoutes;