import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastifyWebsocket from '@fastify/websocket';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import authRoutes from './apis/auth.api.js';
import userRoutes from './apis/user.api.js';
import gameRoutes from './apis/game.api.js';
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

	await app.register(fastifyJwt, {
        secret: process.env.JWT_SECRET || 'super_secret' // Debe coincidir con el de auth.api.ts
    });

	console.log("🔌 Inspeccionando plugin websocket...");

	// TSX a veces devuelve el plugin directamente y a veces dentro de un objeto.   gr 
	// @ts-ignore
	if (fastifyWebsocket.default) {
		console.log("📦 Usando fastifyWebsocket.default");
		// @ts-ignore
		await app.register(fastifyWebsocket.default);
	} else {
		console.log("📦 Usando fastifyWebsocket directo");
		await app.register(fastifyWebsocket);
	}

	//registramos las rutas
	await app.register(authRoutes, { prefix: API_ROUTES.auth });
	await app.register(userRoutes, { prefix: API_ROUTES.user });
	await app.register(gameRoutes, { prefix: '/api/game' });

	// Fastify parsea JSON nativamente, no necesitas "app.use(express.json())"

	return app;
}