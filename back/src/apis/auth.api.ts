/**
 * auth.api.ts - API de autenticación
 * * CORREGIDO: Error TS18047 solucionado en el callback de GitHub
 */

import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import * as userRepository from "../data-access/user.repository.js";
import jwt from 'jsonwebtoken';
import { authenticate } from "../middleware/auth.js";
// ============================================================================
// INTERFACES
// ============================================================================

interface RegisterBody {
	username: string;
	email: string;
	password: string;
}

interface LoginBody {
	email: string;
	password: string;
}

// ============================================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================================

const authRoutes: FastifyPluginAsync = async (fastify, opts) => {

	// --- POST /register (Sin cambios, estaba bien) ---
	fastify.post<{ Body: RegisterBody }>("/register", async (request, reply) => {
		const { username, email, password } = request.body;
		if (!username || !email || !password) {
			return reply.code(400).send({ error: "Faltan campos requeridos" });
		}
		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			const userId = await userRepository.create({ username, email, password: hashedPassword });
			return reply.code(201).send({ message: "Usuario creado con éxito", userId });
		} catch (error: any) {
			request.log.error(error);
			if (error.code === "ER_DUP_ENTRY") {
				return reply.code(409).send({ error: "El usuario o email ya existe" });
			}
			return reply.code(500).send({ error: "Error interno", details: error.message });
		}
	});

	// --- POST /login (Sin cambios, estaba bien) ---
	fastify.post<{ Body: LoginBody }>("/login", async (request, reply) => {
		const { email, password } = request.body;
		if (!email || !password) {
			return reply.code(400).send({ error: "Faltan campos requeridos" });
		}
		try {
			const user = await userRepository.findByEmail(email);
			if (!user) return reply.code(401).send({ error: "Credenciales inválidas" });
			if (!user.password) return reply.code(401).send({ error: "Este usuario usa OAuth" });

			const validPassword = await bcrypt.compare(password, user.password);
			if (!validPassword) return reply.code(401).send({ error: "Credenciales inválidas" });

			await userRepository.updateLastLogin(user.id);
			await userRepository.updateOnlineStatus(user.id, true);

			// Generar token normal (opcional, si lo necesitas en login normal)
			const token = jwt.sign(
				{ id: user.id, email: user.email, username: user.username },
				process.env.JWT_SECRET || 'super_secret',
				{ expiresIn: '7d' }
			);

			return reply.code(200).send({
				message: "Login exitoso",
				token, // <--- Añado el token aquí también por si acaso
				user: { id: user.id, username: user.username, email: user.email },
			});
		} catch (error: any) {
			request.log.error(error);
			return reply.code(500).send({ error: "Error interno", details: error.message });
		}
	});

	// --- GET /github (Sin cambios) ---
	fastify.get("/github", async (request, reply) => {
		const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
		const redirectUri = "http://localhost:3000/api/auth/github/callback";
		const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
		return reply.redirect(url);
	});

	// ========================================================================
	// GET /github/callback - AQUÍ ESTÁ LA CORRECCIÓN 🛠️
	// ========================================================================
	fastify.get("/github/callback", async (request, reply) => {
		const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, FRONTEND_URL } = process.env;
		const { code } = request.query as { code: string };

		if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
			request.log.error("Faltan variables de entorno de OAuth");
			return reply.redirect(`${FRONTEND_URL}?error=server_config_error`);
		}
		if (!code) return reply.redirect(`${FRONTEND_URL}?error=oauth_failed`);


		try {
			// A. Obtener Token de GitHub
			const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
			});
			const tokenData = await tokenResponse.json() as { access_token: string };
			if (!tokenData.access_token) throw new Error("GitHub no devolvió token");

			// B. Obtener Datos del Usuario
			const userResponse = await fetch("https://api.github.com/user", {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});
			const userData = await userResponse.json() as { login: string, email: string | null };

			let email = userData.email;
			if (!email) {
				const emailsResponse = await fetch("https://api.github.com/user/emails", {
					headers: { Authorization: `Bearer ${tokenData.access_token}` },
				});
				const emailsData = await emailsResponse.json() as any[];
				email = emailsData.find((e) => e.primary)?.email;
			}
			if (!email) throw new Error("No se pudo obtener el email");

			// C. Base de Datos
			let user = await userRepository.findByEmail(email);

			if (!user) {
				// CASO: Nuevo Usuario
				await userRepository.create({
					username: userData.login,
					email: email,
					password: "",
				});

				// Acabamos de crearlo, pero la variable 'user' sigue siendo null.
				// TENEMOS QUE BUSCARLO OTRA VEZ para llenar la variable.
				user = await userRepository.findByEmail(email);
			} else if (user.password) {
				// CASO: Usuario existe con contraseña (conflicto)
				return reply.redirect(`${FRONTEND_URL}?error=user_exists`);
			}

			// Ahora le aseguramos a TypeScript que 'user' no es null
			if (!user) {
				throw new Error("Error crítico: El usuario debería existir pero no se encontró.");
			}
			await userRepository.updateLastLogin(user.id);       // Actualiza fecha
			await userRepository.updateOnlineStatus(user.id, true);
			// D. Generar JWT
			const token = jwt.sign(
				{
					id: user.id,
					email: user.email,
					username: user.username
				},
				process.env.JWT_SECRET || 'super_secret',
				{ expiresIn: '7d' }
			);

			return reply.redirect(`${FRONTEND_URL}?token=${token}`);

		} catch (error: any) {
			request.log.error("Error en GitHub OAuth:", error.message);
			return reply.redirect(`${FRONTEND_URL}?error=oauth_failed`);
		}
	});


	fastify.post("/logout", 
        { preHandler: [authenticate] }, // <--- ESTA ES LA CLAVE MÁGICA 🗝️
        async (request, reply) => {
            try {
                const userId = (request.user as any).id;
                
                console.log(`🔌 Logout user ${userId}...`);

                await userRepository.updateLastLogin(userId);
                await userRepository.updateOnlineStatus(userId, false); // <--- Ahora sí funciona
                
                return { message: "Desconectado" };
            } catch (err) {
                request.log.error(err);
                return reply.code(500).send({ error: "No se pudo cerrar sesión" });
            }
        }
    );
};

export default authRoutes;