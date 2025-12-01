import { FastifyPluginAsync } from 'fastify';

// Definimos el plugin. Fastify pasa la instancia 'server' (o fastify) como primer argumento
const authRoutes: FastifyPluginAsync = async (fastify, opts) => {

	// POST /register (Nota el async/await, Fastify lo ama)
	fastify.post('/register', async (request, reply) => {
		// Tu lógica de registro aquí
		return { message: "Register endpoint" };
	});

	// POST /login
	fastify.post('/login', async (request, reply) => {
		// Tu lógica de login aquí
		return { message: "Login endpoint" };
	});

	// Logout
	fastify.post('/logout', async (request, reply) => {
		// Lógica logout
		return { message: "Logout endpoint" };
	});
};

export default authRoutes;