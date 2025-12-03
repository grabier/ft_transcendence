import { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/database.js';

// Definimos la "forma" que tendrán los parámetros de la URL
interface UserParams {
	id: string;
}

const userRoutes: FastifyPluginAsync = async (fastify, opts) => {

	// GET / (Listar todos)
	fastify.get('/', async (request, reply) => {
		try {
			const users = db.prepare('SELECT id, username, email, created_at FROM users').all();
			// EN FASTIFY: No usas res.json(users). Simplemente retornas el objeto.
			return users;
		} catch (error) {
			request.log.error(error); // Usamos el logger de Fastify
			return reply.code(500).send({ error: 'Failed to fetch users' });
		}
	});

	fastify.get<{ Params: UserParams }>('/:id', async (request, reply) => {
		try {
			const { id } = request.params; // Ahora TS sabe que 'id' es un string

			const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(id);

			if (!user) {
				return reply.code(404).send({ error: 'User not found' });
			}
			return user;
		} catch (error) {
			request.log.error(error);
			return reply.code(500).send({ error: 'Failed to fetch user' });
		}
	});
};

export default userRoutes;