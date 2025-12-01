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
	// 1. Crear la instancia (logger: true es MUY útil para ver qué pasa en la terminal)
	const app = Fastify({
		logger: true
	});

	// 2. Registrar Plugins (Equivalente a los middlewares globales de Express)
	// A diferencia de Express, en Fastify se usa 'await register'
	await app.register(cors, {
		origin: true, // O pon aquí la URL de tu frontend 'http://localhost:5173'
		credentials: true
	});

	await app.register(cookie);

	// 3. Registrar WebSockets (Lo usaremos pronto para el Pong)
	await app.register(fastifyWebsocket);

	//registramos las rutas
	await app.register(authRoutes, { prefix: API_ROUTES.auth });
	await app.register(userRoutes, { prefix: API_ROUTES.user });

	// Fastify parsea JSON nativamente, no necesitas "app.use(express.json())"

	return app;
}