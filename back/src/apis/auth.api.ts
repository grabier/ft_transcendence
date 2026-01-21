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
	// GET /github - Redirigir a GitHub
// ========================================================================
		fastify.get("/github", async (request, reply) => {
			const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
			const redirectUri = "http://localhost:3000/api/auth/github/callback";
			
			// Mandamos al usuario a GitHub pidiendo permiso para leer su email y perfil
			const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
			
			return reply.redirect(url);
		});
		fastify.get("/github/callback", async (request, reply) => {
			// 1. Extraemos las variables de entorno nada más empezar
			const { 
				GITHUB_CLIENT_ID, 
				GITHUB_CLIENT_SECRET, 
				FRONTEND_URL 
			} = process.env;
	
			const { code } = request.query as { code: string };
	
			// 2. Validación de seguridad para que el servidor no pete si falta el .env
			if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
				request.log.error("Faltan variables de entorno de OAuth");
				return reply.redirect(`${FRONTEND_URL}?error=server_config_error`);
			}
	
			if (!code) {
				return reply.redirect(`${FRONTEND_URL}?error=oauth_failed`);
			}
	
			try {
				// --- PASO A: TOKEN ---
				const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify({
						client_id: GITHUB_CLIENT_ID,
						client_secret: GITHUB_CLIENT_SECRET,
						code: code,
					}),
				});
	
				const tokenData = await tokenResponse.json() as { access_token: string };
				
				if (!tokenData.access_token) {
					throw new Error("GitHub no devolvió un access_token");
				}
	
				// --- PASO B: USUARIO ---
				const userResponse = await fetch("https://api.github.com/user", {
					headers: { Authorization: `Bearer ${tokenData.access_token}` },
				});
				const userData = await userResponse.json() as { login: string, email: string | null };
	
				// Lógica de correos (GitHub devuelve null si el correo no es público en el perfil)
				let email = userData.email;
				if (!email) {
					const emailsResponse = await fetch("https://api.github.com/user/emails", {
						headers: { Authorization: `Bearer ${tokenData.access_token}` },
					});
					const emailsData = await emailsResponse.json() as any[];
					email = emailsData.find((e) => e.primary)?.email;
				}
	
				if (!email) throw new Error("No se pudo obtener el email del usuario");
	
				// --- PASO C: BASE DE DATOS ---
				let user = await userRepository.findByEmail(email);
	
				if (!user) {
					// Nuevo usuario
					await userRepository.create({
						username: userData.login,
						email: email,
						password: "", // Usuario OAuth
					});
				} else if (user.password) {
					// Existe con contraseña manual: Conflicto
					return reply.redirect(`${FRONTEND_URL}?error=user_exists`);
				}
	
				// --- PASO D: ÉXITO ---
				// Aquí es donde mandas al usuario logueado al Front
				return reply.redirect(`${FRONTEND_URL}`);
	
			} catch (error: any) {
				request.log.error("Error en el flujo de GitHub:", error.message);
				return reply.redirect(`${FRONTEND_URL}?error=oauth_failed`);
			}
		});
};

export default authRoutes;
