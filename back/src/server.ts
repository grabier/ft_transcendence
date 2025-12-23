import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { fastifyWebsocket } from '@fastify/websocket';
import dotenv from 'dotenv';
import authRoutes from './apis/auth.api.js';
import userRoutes from './apis/user.api.js';
import { API_ROUTES } from './routes/routes.js';

dotenv.config();

export const createAPIServer = async (): Promise<FastifyInstance> => {
	// 1. Crear la instancia
	const app = Fastify({
		logger: true
	});

	// 2. Registrar Plugins (Equivalente a los middlewares globales de Express)
	// A diferencia de Express, en Fastify se usa 'await register'
	await app.register(cors, {
		origin: ['http://localhost:5173', 'http://localhost:8080'],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE']
	});

	await app.register(cookie);

	await app.register(fastifyWebsocket);

	//registramos las rutas
	await app.register(authRoutes, { prefix: API_ROUTES.auth });
	await app.register(userRoutes, { prefix: API_ROUTES.user });

	// Fastify parsea JSON nativamente, no necesitas "app.use(express.json())"

	return app;
}