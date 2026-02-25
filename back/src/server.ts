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
import snakeRoutes from './apis/snake.api.js'; // <- 1. 🐍 AÑADIMOS LA IMPORTACIÓN
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
		ajv: {//para docu de las apis
			customOptions: {
				strict: false,
				allErrors: true
			}
		}
	});

	// --- PLUGINS BÁSICOS ---
	await app.register(cors, {
		origin: true, // true para LAN
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
	});

	await app.register(cookie);
	await app.register(fastifyJwt, {
		secret: process.env.JWT_SECRET || 'super_secret'
	});

	//for file uploads
	await app.register(multipart, {
		limits: { fileSize: 5 * 1024 * 1024 }
	});

	await app.register(fastifyStatic, {
		root: path.join(__dirname, '../uploads'),
		prefix: '/public/',
		decorateReply: false // Importante para evitar conflictos con otros plugins
	});

	//  RATE LIMIT (Protección)
	await app.register(rateLimit, {
		max: 1000,             // Máximo 100 peticiones...
		timeWindow: '1 minute' // ...por minuto por IP.
	});

	// SWAGGER (Documentación - Estructura)
	await app.register(swagger, {
		swagger: {
			info: {
				title: 'Transcendence API',
				description: 'API del mejor Pong de 42 Málaga',
				version: '1.0.0'
			},
			host: '10.11.4.1:3000', // O tu IP si quieres ser estricto
			schemes: ['https', 'http'],
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

	// SWAGGER UI (La web visual)
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
	await app.register(snakeRoutes, { prefix: API_ROUTES.snake }); // <- 2. 🐍 REGISTRAMOS LA RUTA
	await app.register(friendRoutes, { prefix: API_ROUTES.friend });
	await app.register(wsRoutes, { prefix: API_ROUTES.ws });
	await app.register(chatRoutes, { prefix: API_ROUTES.chat });

	return app;
}