/**
 * auth.api.ts - API de autenticación (Versión LAN + Sin 2FA)
 */

import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import * as userRepository from "../data-access/user.repository.js";
import jwt from 'jsonwebtoken';
import { authenticate } from "../middleware/auth.js";
import { loginSchema, registerSchema, logoutSchema } from "../schemas/auth.schema.js";
// ============================================================================
// INTERFACES
// ============================================================================

interface RegisterBody {
	username: string;
	email: string;
	password: string;
	avatarUrl: string;
}

interface LoginBody {
	email: string;
	password: string;
}

// ============================================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================================

const authRoutes: FastifyPluginAsync = async (fastify, opts) => {

	// --- POST /register ---
	fastify.post<{ Body: RegisterBody }>("/register", {
		schema: registerSchema, config: {
			rateLimit: {
				max: 10,
				timeWindow: '1 minute'
			}
		}
	}, async (request, reply) => {
		const { username, email, password, avatarUrl } = request.body;
		if (!username || !email || !password || !avatarUrl) {
			return reply.code(400).send({ error: "Faltan campos requeridos" });
		}
		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			const userId = await userRepository.create({ username, email, password: hashedPassword, avatar_url: avatarUrl });
			return reply.code(201).send({ message: "Usuario creado con éxito", userId });
		} catch (error: any) {
			request.log.error(error);
			if (error.code === "ER_DUP_ENTRY") {
				return reply.code(409).send({ error: "El usuario o email ya existe" });
			}
			return reply.code(500).send({ error: "Error interno", details: error.message });
		}
	});

	// --- POST /login ---
	fastify.post<{ Body: LoginBody }>("/login", {
		schema: loginSchema, config: {
			rateLimit: {
				max: 10,
				timeWindow: '1 minute'
			}
		}
	}, async (request, reply) => {
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

			const token = jwt.sign(
				{ id: user.id, email: user.email, username: user.username },
				process.env.JWT_SECRET || 'super_secret',
				{ expiresIn: '7d' }
			);

			return reply.code(200).send({
				message: "Login exitoso",
				token,
				user: { id: user.id, username: user.username, email: user.email },
			});
		} catch (error: any) {
			request.log.error(error);
			return reply.code(500).send({ error: "Error interno", details: error.message });
		}
	});

	// --- GET /github ---
	fastify.get("/github", async (request, reply) => {
		const CLIENT_ID = process.env.GITHUB_CLIENT_ID;

		// 1. Calculamos la IP dinámicamente
		const protocol = request.protocol;
		const host = request.headers.host; // Ej: "10.13.1.5:3000"

		// 2. Le decimos a GitHub que vuelva a ESTA IP
		const redirectUri = `${protocol}://${host}/api/auth/github/callback`;

		const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
		return reply.redirect(url);
	});

	// --- GET /github/callback ---
	fastify.get("/github/callback", async (request, reply) => {
		const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
		const { code } = request.query as { code: string };

		// FIX CRÍTICO PARA LAN: Calculamos dónde está el Frontend (IP:5173)
		// Si usáramos process.env.FRONTEND_URL, mandaría a tu amigo a localhost (error)
		const protocol = request.protocol;
		const hostIp = request.hostname.split(':')[0]; // Quitamos el puerto 3000
		const DYNAMIC_FRONTEND_URL = `${protocol}://${hostIp}:5173`;

		console.log(`🔙 Callback recibido. Redirigiendo a: ${DYNAMIC_FRONTEND_URL}`);

		if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
			request.log.error("Faltan variables de entorno de OAuth");
			return reply.redirect(`${DYNAMIC_FRONTEND_URL}?error=server_config_error`);
		}
		if (!code) return reply.redirect(`${DYNAMIC_FRONTEND_URL}?error=oauth_failed`);

		try {
			// A. Token de GitHub
			const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
			});
			const tokenData = await tokenResponse.json() as { access_token: string };
			if (!tokenData.access_token) throw new Error("GitHub no devolvió token");

			// B. Datos Usuario
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
			const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.login || 'Guest'}`;

			if (!user) {
				await userRepository.create({
					username: userData.login,
					email: email,
					password: "",
					avatar_url: defaultAvatar,
				});
				user = await userRepository.findByEmail(email);
			} else if (user.password) {
				return reply.redirect(`${DYNAMIC_FRONTEND_URL}?error=user_exists`);
			}

			if (!user) throw new Error("Error crítico user creation");

			await userRepository.updateLastLogin(user.id);
			await userRepository.updateOnlineStatus(user.id, true);

			// D. Generar JWT
			const token = jwt.sign(
				{ id: user.id, email: user.email, username: user.username },
				process.env.JWT_SECRET || 'super_secret',
				{ expiresIn: '7d' }
			);

			// Redirigimos a la IP correcta
			return reply.redirect(`${DYNAMIC_FRONTEND_URL}?token=${token}`);

		} catch (error: any) {
			request.log.error("Error en GitHub OAuth:", error.message);
			return reply.redirect(`${DYNAMIC_FRONTEND_URL}?error=oauth_failed`);
		}
	});

	// --- POST /logout ---
	fastify.post("/logout", {
		preHandler: [authenticate],
		schema: logoutSchema
	}, async (request, reply) => {
		try {
			const userId = (request.user as any).id;
			await userRepository.updateLastLogin(userId);
			await userRepository.updateOnlineStatus(userId, false);
			return { message: "Desconectado" };
		} catch (err) {
			request.log.error(err);
			return reply.send({ error: "No se pudo cerrar sesión" });
		}
	}
	);
};

export default authRoutes;