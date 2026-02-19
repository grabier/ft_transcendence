/**
 * auth.api.ts - API de autenticación (Versión LAN + Ngrok Compatible)
 */

import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import * as userRepository from "../data-access/user.repository.js";
import jwt from 'jsonwebtoken';
import { authenticate } from "../middleware/auth.js";
// Asegúrate de importar fetch si no estás en Node 18+ (aunque Fastify suele ir con Node reciente)
// import fetch from 'node-fetch'; 

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

interface GitHubTokenResponse {
	access_token: string;
	error?: string;
}

interface GitHubUserResponse {
	login: string;
	email: string | null;
}

// ============================================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================================

const authRoutes: FastifyPluginAsync = async (fastify, opts) => {

	// --- POST /register ---
	fastify.post<{ Body: RegisterBody }>("/register", async (request, reply) => {
		const { username, email, password, avatarUrl } = request.body;

		if (!username || !email || !password || !avatarUrl) {
			return reply.code(400).send({ error: "Faltan campos requeridos" });
		}

		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);

			// Asumo que create devuelve { id: ... } o similar
			const newUser = await userRepository.create({
				username,
				email,
				password: hashedPassword,
				avatar_url: avatarUrl
			});
			const user = await userRepository.findByEmail(email);

			return reply.code(201).send({ message: "Usuario creado con éxito", userId: user?.id });
		} catch (error: any) {
			request.log.error(error);
			if (error.code === "ER_DUP_ENTRY") { // Código típico de MySQL/MariaDB
				return reply.code(409).send({ error: "El usuario o email ya existe" });
			}
			return reply.code(500).send({ error: "Error interno", details: error.message });
		}
	});

	// --- POST /login ---
	fastify.post<{ Body: LoginBody }>("/login", async (request, reply) => {
		const { email, password } = request.body;
		if (!email || !password) {
			return reply.code(400).send({ error: "Faltan campos requeridos" });
		}

		try {
			const user = await userRepository.findByEmail(email);
			if (!user) return reply.code(401).send({ error: "Credenciales inválidas" });

			// Si el usuario no tiene password, es que se registró con OAuth (GitHub/42)
			if (!user.password) return reply.code(401).send({ error: "Este usuario usa OAuth (GitHub)" });

			const validPassword = await bcrypt.compare(password, user.password);
			if (!validPassword) return reply.code(401).send({ error: "Credenciales inválidas" });

			// Actualizar estado
			await userRepository.updateLastLogin(user.id);
			await userRepository.updateOnlineStatus(user.id, true);

			const token = jwt.sign(
				{ id: user.id, email: user.email, username: user.username, avatarUrl: user.avatar_url },
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

	// --- GET /github (Inicia el flujo) ---
	fastify.get("/github", async (request, reply) => {
		const CLIENT_ID = process.env.GITHUB_CLIENT_ID;

		// Determinar protocolo y host actual (sea localhost, IP o Ngrok)
		const protocol = request.protocol;
		const host = request.headers.host; // Ej: "miservidor.ngrok.app" o "192.168.1.35:3000"

		// Construir la URL de callback dinámicamente para que coincida con el origen
		const redirectUri = `${protocol}://${host}/api/auth/github/callback`;

		console.log(`🔗 Iniciando OAuth con callback: ${redirectUri}`);

		const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
		return reply.redirect(url);
	});

	// --- GET /github/callback (Recibe el código de GitHub) ---
	fastify.get<{ Querystring: { code: string } }>("/github/callback", async (request, reply) => {
		const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
		const { code } = request.query;

		// ------------------------------------------------------------------
		// LÓGICA DE REDIRECCIÓN INTELIGENTE (LAN vs NGROK)
		// ------------------------------------------------------------------
		let frontendRedirectUrl = process.env.FRONTEND_URL;

		if (!frontendRedirectUrl) {
			// Fallback para desarrollo local sin .env configurado
			const protocol = request.protocol;
			// Si es ngrok, hostname es el dominio. Si es IP:3000, quitamos puerto.
			const hostIp = request.hostname.split(':')[0];
			frontendRedirectUrl = `${protocol}://${hostIp}:5173`;
			console.log("⚠️ FRONTEND_URL no definido en .env. Usando fallback automático:", frontendRedirectUrl);
		}
		// ------------------------------------------------------------------

		if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
			request.log.error("❌ Faltan variables de entorno GITHUB_CLIENT_ID / SECRET");
			return reply.redirect(`${frontendRedirectUrl}?error=server_config_error`);
		}

		if (!code) {
			return reply.redirect(`${frontendRedirectUrl}?error=no_code_provided`);
		}

		try {
			// A. Canjear código por Token
			const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				},
				body: JSON.stringify({
					client_id: GITHUB_CLIENT_ID,
					client_secret: GITHUB_CLIENT_SECRET,
					code
				}),
			});

			const tokenData = await tokenResponse.json() as GitHubTokenResponse;
			if (tokenData.error || !tokenData.access_token) {
				throw new Error(tokenData.error || "GitHub no devolvió token");
			}

			// B. Obtener Datos de Usuario
			const userResponse = await fetch("https://api.github.com/user", {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});
			const userData = await userResponse.json() as GitHubUserResponse;

			// C. Obtener Email (si es privado)
			let email = userData.email;
			if (!email) {
				const emailsResponse = await fetch("https://api.github.com/user/emails", {
					headers: { Authorization: `Bearer ${tokenData.access_token}` },
				});
				const emailsData = await emailsResponse.json() as any[];
				email = emailsData.find((e: any) => e.primary && e.verified)?.email;
			}

			if (!email) throw new Error("No se pudo obtener un email verificado de GitHub");

			// D. Buscar o Crear Usuario en DB
			let user = await userRepository.findByEmail(email);

			if (!user) {
				// Crear nuevo usuario
				const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.login}`;
				// Nota: Asumiendo que create devuelve el objeto usuario completo o su ID
				const newUser = await userRepository.create({
					username: userData.login, // Cuidado con duplicados de username aquí
					email: email,
					password: "", // Usuario OAuth no tiene pass
					avatar_url: defaultAvatar,
				});
				// Recuperar el usuario completo recién creado
				user = await userRepository.findByEmail(email);
			} else {
				// Si el usuario existe pero tiene contraseña, significa que se registró por email/pass
				if (user.password) {
					return reply.redirect(`${frontendRedirectUrl}?error=user_exists_with_password`);
				}
			}

			if (!user) throw new Error("Error crítico al recuperar usuario de la BD");

			// E. Generar JWT y Login
			await userRepository.updateLastLogin(user.id);
			await userRepository.updateOnlineStatus(user.id, true);

			const token = jwt.sign(
				{ id: user.id, email: user.email, username: user.username, avatarUrl: user.avatar_url },
				process.env.JWT_SECRET || 'super_secret',
				{ expiresIn: '7d' }
			);

			console.log(`✅ Login GitHub exitoso para ${user.username}. Redirigiendo a Frontend.`);

			// F. Redirigir al Frontend con el token
			return reply.redirect(`${frontendRedirectUrl}?token=${token}`);

		} catch (error: any) {
			request.log.error("❌ Error en GitHub OAuth:", error.message);
			return reply.redirect(`${frontendRedirectUrl}?error=oauth_failed`);
		}
	});

	// --- POST /logout ---
	fastify.post("/logout", { preHandler: [authenticate] }, async (request, reply) => {
		try {
			const user = request.user as any; // Definido por tu middleware authenticate
			if (user && user.id) {
				await userRepository.updateLastLogin(user.id);
				await userRepository.updateOnlineStatus(user.id, false);
			}
			return { message: "Desconectado correctamente" };
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: "No se pudo cerrar sesión correctamente" });
		}
	});
};

export default authRoutes;