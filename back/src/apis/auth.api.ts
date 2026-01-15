/**
 * auth.api.ts - API de autenticación
 *
 * Endpoints para registro y login de usuarios.
 * Usa MariaDB para almacenar los usuarios.
 */

import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import * as userRepository from "../data-access/user.repository.js";

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Estructura del body para el endpoint de registro
 */
interface RegisterBody {
	username: string;
	email: string;
	password: string;
}

/**
 * Estructura del body para el endpoint de login
 */
interface LoginBody {
	email: string;
	password: string;
}

// ============================================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================================

const authRoutes: FastifyPluginAsync = async (fastify, opts) => {
	// ========================================================================
	// POST /register - Registrar un nuevo usuario
	// ========================================================================
	fastify.post<{ Body: RegisterBody }>(
		"/register",
		async (request, reply) => {
			const { username, email, password } = request.body;

			// Validar que todos los campos estén presentes
			if (!username || !email || !password) {
				return reply.code(400).send({
					error: "Faltan campos requeridos (username, email, password)",
				});
			}

			try {
				// Generar salt y hashear la contraseña
				const salt = await bcrypt.genSalt(10);
				const hashedPassword = await bcrypt.hash(password, salt);

				// Insertar el nuevo usuario usando el repositorio
				const userId = await userRepository.create({
					username,
					email,
					password: hashedPassword,
				});

				return reply.code(201).send({
					message: "Usuario creado con éxito",
					userId,
				});
			} catch (error: any) {
				request.log.error(error);

				// Error de duplicado (usuario o email ya existe)
				// En MariaDB el código es 'ER_DUP_ENTRY' en lugar de 'SQLITE_CONSTRAINT_UNIQUE'
				if (error.code === "ER_DUP_ENTRY") {
					return reply.code(409).send({
						error: "El usuario o email ya existe",
					});
				}

				return reply.code(500).send({
					error: "Error interno del servidor",
					details: error.message,
				});
			}
		}
	);

	// ========================================================================
	// POST /login - Iniciar sesión
	// ========================================================================
	fastify.post<{ Body: LoginBody }>("/login", async (request, reply) => {
		const { email, password } = request.body;

		// Validar campos
		if (!email || !password) {
			return reply.code(400).send({
				error: "Faltan campos requeridos (email, password)",
			});
		}

		try {
			// Buscar usuario por email
			const user = await userRepository.findByEmail(email);

			// Verificar si el usuario existe
			if (!user) {
				return reply.code(401).send({
					error: "Credenciales inválidas",
				});
			}

			// Verificar que el usuario tenga contraseña (no OAuth)
			if (!user.password) {
				return reply.code(401).send({
					error: "Este usuario usa autenticación OAuth",
				});
			}

			// Verificar la contraseña
			const validPassword = await bcrypt.compare(password, user.password);

			if (!validPassword) {
				return reply.code(401).send({
					error: "Credenciales inválidas",
				});
			}

			// Actualizar last_login
			// Actualizar last_login y estado online
			await userRepository.updateLastLogin(user.id);
			await userRepository.updateOnlineStatus(user.id, true);

			// TODO: Generar y devolver JWT token
			return reply.code(200).send({
				message: "Login exitoso",
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
				},
			});
		} catch (error: any) {
			request.log.error(error);
			return reply.code(500).send({
				error: "Error interno del servidor",
				details: error.message,
			});
		}
	});
};

export default authRoutes;
