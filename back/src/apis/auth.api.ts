import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import * as userRepository from "../data-access/user.repository.js";
import jwt from 'jsonwebtoken';
import { authenticate } from "../middleware/auth.js";
import { registerSchema, loginSchema, logoutSchema } from "../schemas/auth.schema.js";

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

const authRoutes: FastifyPluginAsync = async (fastify, opts) => {

	fastify.post<{ Body: RegisterBody }>("/register", { schema: registerSchema }, async (request, reply) => {
		const { username, email, password, avatarUrl } = request.body;

		if (!username || !email || !password || !avatarUrl) {
			return reply.code(400).send({ error: "Field required missing" });
		}

		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);

			const newUser = await userRepository.create({
				username,
				email,
				password: hashedPassword,
				avatar_url: avatarUrl
			});
			const user = await userRepository.findByEmail(email);

			return reply.code(201).send({ message: "User created succesfully", userId: user?.id });
		} catch (error: any) {
			request.log.error(error);
			if (error.code === "ER_DUP_ENTRY") {
				return reply.code(409).send({ error: "Email or user already exists" });
			}
			return reply.code(500).send({ error: "Internal error", details: error.message });
		}
	});

	fastify.post<{ Body: LoginBody }>("/login", { schema: loginSchema }, async (request, reply) => {
		const { email, password } = request.body;
		if (!email || !password) {
			return reply.code(400).send({ error: "Field required missing" });
		}

		try {
			const user = await userRepository.findByEmail(email);
			if (!user) return reply.code(401).send({ error: "Invalid credentials" });

			if (!user.password) return reply.code(401).send({ error: "User uses OAuth(github)" });

			const validPassword = await bcrypt.compare(password, user.password);
			if (!validPassword) return reply.code(401).send({ error: "Invalid credentials" });

			await userRepository.updateLastLogin(user.id);
			await userRepository.updateOnlineStatus(user.id, true);

			const token = jwt.sign(
				{ id: user.id, email: user.email, username: user.username, avatarUrl: user.avatar_url },
				process.env.JWT_SECRET || 'super_secret',
				{ expiresIn: '7d' }
			);

			return reply.code(200).send({
				message: "Login succesfull",
				token,
				user: { id: user.id, username: user.username, email: user.email },
			});
		} catch (error: any) {
			request.log.error(error);
			return reply.code(500).send({ error: "Internal error", details: error.message });
		}
	});

	fastify.get("/github", async (request, reply) => {
		const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
		const protocol = request.protocol;
		const host = request.headers.host;
		const redirectUri = `${protocol}://${host}/api/auth/github/callback`;
		const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
		return reply.redirect(url);
	});

	fastify.get<{ Querystring: { code: string } }>("/github/callback", async (request, reply) => {
		const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
		const { code } = request.query;
		let frontendRedirectUrl = process.env.FRONTEND_URL;

		if (!frontendRedirectUrl) {
			const protocol = request.protocol;
			const hostIp = request.hostname.split(':')[0];
			frontendRedirectUrl = `${protocol}://${hostIp}:5173`;
		}

		if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
			return reply.redirect(`${frontendRedirectUrl}?error=server_config_error`);
		}

		if (!code) {
			return reply.redirect(`${frontendRedirectUrl}?error=no_code_provided`);
		}

		try {
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
				throw new Error(tokenData.error || "GitHub did not return token");
			}

			const userResponse = await fetch("https://api.github.com/user", {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});
			const userData = await userResponse.json() as GitHubUserResponse;

			let email = userData.email;
			if (!email) {
				const emailsResponse = await fetch("https://api.github.com/user/emails", {
					headers: { Authorization: `Bearer ${tokenData.access_token}` },
				});
				const emailsData = await emailsResponse.json() as any[];
				email = emailsData.find((e: any) => e.primary && e.verified)?.email;
			}

			if (!email) throw new Error("Could not obtain a verified email from Github");

			let user = await userRepository.findByEmail(email);

			if (!user) {
				const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.login}`;
				const newUser = await userRepository.create({
					username: userData.login,
					email: email,
					password: "",
					avatar_url: defaultAvatar,
				});
				user = await userRepository.findByEmail(email);
			} else {
				if (user.password) {
					return reply.redirect(`${frontendRedirectUrl}?error=user_exists_with_password`);
				}
			}

			if (!user) throw new Error("Critical error fetching user from database");

			await userRepository.updateLastLogin(user.id);
			await userRepository.updateOnlineStatus(user.id, true);

			const token = jwt.sign(
				{ id: user.id, email: user.email, username: user.username, avatarUrl: user.avatar_url },
				process.env.JWT_SECRET || 'super_secret',
				{ expiresIn: '7d' }
			);

			return reply.redirect(`${frontendRedirectUrl}?token=${token}`);

		} catch (error: any) {
			return reply.redirect(`${frontendRedirectUrl}?error=oauth_failed`);
		}
	});

	fastify.post("/logout", { preHandler: [authenticate], schema: logoutSchema }, async (request, reply) => {
		try {
			const user = request.user as any;
			if (user && user.id) {
				await userRepository.updateLastLogin(user.id);
				await userRepository.updateOnlineStatus(user.id, false);
			}
			return { message: "Disconnected succesfully" };
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: "Could not close session correctly" });
		}
	});
};

export default authRoutes;