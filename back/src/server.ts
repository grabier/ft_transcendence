import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastifyWebsocket from '@fastify/websocket';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import authRoutes from './apis/auth.api.js';
import userRoutes from './apis/user.api.js';
import gameRoutes from './apis/game.api.js';
import snakeRoutes from './apis/snake.api.js';
import friendRoutes from './apis/friend.api.js';
import wsRoutes from './apis/ws.api.js';
import chatRoutes from './apis/chat.api.js';
import path from 'path';
import { fileURLToPath } from 'url';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fs from 'fs';
import { API_ROUTES } from './routes/routes.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createAPIServer = async (): Promise<FastifyInstance> => {
	const app = Fastify({
		logger: true,
		https: {
			key: fs.readFileSync(path.join(__dirname, '../../.certs/server.key')),
			cert: fs.readFileSync(path.join(__dirname, '../../.certs/server.crt'))
		},
		ajv: {
			customOptions: {
				strict: false,
				allErrors: true
			}
		}
	});

	await app.register(cors, {
		origin: true,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
	});

	await app.register(cookie);
	await app.register(fastifyJwt, {
		secret: process.env.JWT_SECRET || 'super_secret'
	});

	await app.register(multipart, {
		limits: { fileSize: 5 * 1024 * 1024 }
	});

	await app.register(fastifyStatic, {
		root: path.join(__dirname, '../uploads'),
		prefix: '/public/',
		decorateReply: false 
	});

	await app.register(rateLimit, {
		max: 1000,
		timeWindow: '1 minute'
	});

	await app.register(swagger, {
		openapi: {
			info: {
				title: 'Transcendence API',
				description: 'API of the best Pong in 42 Malaga',
				version: '1.0.0'
			},
			components: {
				securitySchemes: {
					bearerAuth: {
						type: 'http',
						scheme: 'bearer',
						bearerFormat: 'JWT'
					}
				}
			}
		}
	});

	await app.register(swaggerUi, {
		routePrefix: '/documentation',
		uiConfig: {
			docExpansion: 'list',
			deepLinking: false
		},
		staticCSP: true,
	});

	// @ts-ignore
	if (fastifyWebsocket.default) {
		// @ts-ignore
		await app.register(fastifyWebsocket.default);
	}

	await app.register(authRoutes, { prefix: API_ROUTES.auth });
	await app.register(userRoutes, { prefix: API_ROUTES.user });
	await app.register(gameRoutes, { prefix: API_ROUTES.game });
	await app.register(snakeRoutes, { prefix: API_ROUTES.snake });
	await app.register(friendRoutes, { prefix: API_ROUTES.friend });
	await app.register(wsRoutes, { prefix: API_ROUTES.ws });
	await app.register(chatRoutes, { prefix: API_ROUTES.chat });

	return app;
}