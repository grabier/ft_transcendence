import { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/database.js';
import bcrypt from 'bcrypt';

interface RegisterBody {
	username: string;
	email: string;
	password: string;
}

const authRoutes: FastifyPluginAsync = async (fastify, opts) => {

	fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
		const { username, email, password } = request.body;

		if (!username || !email || !password) {
			return reply.code(400).send({ error: 'Faltan campos (username, email, password)' });
		}
		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			const stmt = db.prepare(`
        INSERT INTO users (username, email, password) 
        VALUES (?, ?, ?)
      	`);
			const info = stmt.run(username, email, hashedPassword);
			return reply.code(201).send({
				message: 'Usuario creado con éxito',
				userId: info.lastInsertRowid
			});
		} catch (error: any) {
			request.log.error(error);

			// Si el error es de restricción única (ej: usuario ya existe)
			if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
				return reply.code(409).send({ error: 'El usuario o email ya existe' });
			}
			// Si el error es de PERMISOS (Read-only), saldrá aquí un 500
			return reply.code(500).send({ error: 'Error interno del servidor', details: error.message });
		}
	});

	// POST /login (Dejamos el dummy por ahora)
	fastify.post('/login', async (request, reply) => {
		return { message: "Login endpoint (TODO)" };
	});
};

export default authRoutes;