import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastifyWebsocket from '@fastify/websocket';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';

// 👇 1. IMPORTAMOS LOS NUEVOS PLUGINS
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import authRoutes from './apis/auth.api.js';
import userRoutes from './apis/user.api.js';
import gameRoutes from './apis/game.api.js';
import friendRoutes from './apis/friend.api.js';
import wsRoutes from './apis/ws.api.js';
import chatRoutes from './apis/chat.api.js'; // Asegúrate de que este import exista si lo usas

import { API_ROUTES } from './routes/routes.js';

dotenv.config();

export const createAPIServer = async (): Promise<FastifyInstance> => {
	const app = Fastify({
		logger: true,
		ajv: {//para docu de las apis
			customOptions: {
				strict: false,
				allErrors: true
			}
		}
	});

	// --- PLUGINS BÁSICOS ---
	await app.register(cors, {
		origin: true, // Recuerda: true para LAN
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
	});

	await app.register(cookie);
	await app.register(fastifyJwt, {
		secret: process.env.JWT_SECRET || 'super_secret'
	});

	// 👇 2. RATE LIMIT (Protección)
	await app.register(rateLimit, {
		max: 1000,             // Máximo 100 peticiones...
		timeWindow: '1 minute' // ...por minuto por IP.
		// Puedes excluir rutas si quieres:
		// allowList: ['127.0.0.1'],
	});

	// 👇 3. SWAGGER (Documentación - Estructura)
	await app.register(swagger, {
		swagger: {
			info: {
				title: 'Transcendence API',
				description: 'API del mejor Pong de 42 Málaga',
				version: '1.0.0'
			},
			host: 'localhost:3000', // O tu IP si quieres ser estricto
			schemes: ['http', 'https'],
			consumes: ['application/json'],
			produces: ['application/json'],
			securityDefinitions: {
				apiKey: {
					type: 'apiKey',
					name: 'Authorization',
					in: 'header'
				}
			}
		}
	});

	// 👇 4. SWAGGER UI (La web visual)
	await app.register(swaggerUi, {
		routePrefix: '/documentation', // Entrarás aquí para ver los docs
		uiConfig: {
			docExpansion: 'list', // 'full' expande todo, 'list' solo lista endpoints
			deepLinking: false
		},
		staticCSP: true,
	});

	// --- WEBSOCKETS ---
	console.log("🔌 Inspeccionando plugin websocket...");
	// @ts-ignore
	if (fastifyWebsocket.default) {
		// @ts-ignore
		await app.register(fastifyWebsocket.default);
	}

	// --- RUTAS ---
	// Fastify lee las rutas AQUÍ y las añade a Swagger automáticamente
	await app.register(authRoutes, { prefix: API_ROUTES.auth });
	await app.register(userRoutes, { prefix: API_ROUTES.user });
	await app.register(gameRoutes, { prefix: API_ROUTES.game });
	await app.register(friendRoutes, { prefix: API_ROUTES.friend });
	await app.register(wsRoutes, { prefix: API_ROUTES.ws });
	await app.register(chatRoutes, { prefix: API_ROUTES.chat });

	return app;
}