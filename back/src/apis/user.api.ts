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

const getServerIp = () => {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name] || []) {
			if (iface.family === 'IPv4' && !iface.internal) {
				return iface.address;
			}
		}
	}
	return 'localhost'; 
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UserParams {
	id: string;
}
interface UpdateUsernameBody {
	newUsername: string;
}
interface UpdateAvatarUrlBody {
	newUrl: string;
}

const userRoutes: FastifyPluginAsync = async (fastify, opts) => {
	fastify.get<{ Params: UserParams }>(
		'/:id',
		{ schema: getUserByIdSchema },
		async (request, reply) => {
			try {
				const { id } = request.params;
				const [rows] = await pool.execute(
					'SELECT id, username, email, avatar_url, is_online, created_at, last_login FROM users WHERE id = ?',
					[id]
				);

				const users = rows as any[];
				if (users.length === 0) {
					return reply.code(404).send({
						error: 'User  not found'
					});
				}
				return users[0];
			} catch (error: any) {
				request.log.error(error);
				return reply.code(500).send({
					error: 'Error fetching user',
					details: error.message
				});
			}
		});

	fastify.get(
		'/search',
		{ schema: searchUsersSchema },
		async (request, reply) => {
			const { q } = request.query as { q: string };

			if (!q || q.length < 1) return [];

			try {
				const [rows] = await pool.execute(
					'SELECT id, username, avatar_url, is_online FROM users WHERE username LIKE ? LIMIT 5',
					[`%${q}%`]
				);
				return rows || [];
			} catch (error: any) {
				request.log.error(error);
				return [];
			}
		});

	fastify.get("/persistence",
		{
			preHandler: [authenticate],
			schema: persistenceSchema
		},
		async (req, reply) => {
			const userToken = req.user as any; 
			await userRepository.updateOnlineStatus(userToken.id, true);
			await userRepository.updateLastLogin(userToken.id);
		});


	fastify.addHook('preHandler', authenticate);
	fastify.patch<{ Body: UpdateUsernameBody }>(
		"/update-username",
		{ preHandler: [authenticate], schema: updateUsernameSchema },
		async (request, reply) => {
			try {
				const { newUsername } = request.body;
				const currentUser = request.user as { id: number; email: string; username: string };

				if (!currentUser) {
					return reply.code(401).send({ error: "Unauthorized: No user found in token" });
				}

				const userId = currentUser.id;

				const existingUser = await userRepository.findByUsername(newUsername);
				if (existingUser && existingUser.id !== userId) {
					return reply.code(409).send({ error: "Username is already taken" });
				}

				await userRepository.updateUsername(userId, newUsername);

				const newToken = jwt.sign(
					{ id: userId, email: currentUser.email, username: newUsername },
					process.env.JWT_SECRET || 'super_secret',
					{ expiresIn: '7d' }
				);

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

	fastify.post('/upload-avatar', { preHandler: [authenticate], schema: uploadAvatarSchema }, async (request, reply) => {
		const data = await request.file();
		if (!data) return reply.code(400).send({ error: "No file uploaded" });

		const currentUser = request.user as { id: number; email: string; username: string; avatarUrl: string };
		const extension = path.extname(data.filename);
		const fileName = `${currentUser.id}-${Date.now()}${extension}`;

		const uploadDir = path.join(__dirname, '../../uploads/avatars');
		const uploadPath = path.join(uploadDir, fileName);

		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		await pipeline(data.file, fs.createWriteStream(uploadPath));

		const protocol = request.protocol;
		const serverIp = getServerIp();
		const newAvatarUrl = `${protocol}://${serverIp}:3000/public/avatars/${fileName}`;
		await userRepository.updateAvatarUrl(currentUser.id, newAvatarUrl);
		const newToken = jwt.sign(
			{
				id: currentUser.id,
				email: currentUser.email,
				username: currentUser.username,
				avatarUrl: newAvatarUrl
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