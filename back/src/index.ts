/**
 * index.ts - Punto de entrada de la aplicación
 * 
 * Inicializa la conexión a MariaDB y arranca el servidor Fastify.
 */


import { ENV } from './routes/routes.js';
import { connect } from '../db/database.js';
import { seedDatabase } from '../db/seed-data.js';
import { createAPIServer } from './server.js';

/**
 * Función principal que arranca la aplicación.
 * 1. Conecta a MariaDB (crea tablas si no existen)
 * 2. Crea el servidor Fastify
 * 3. Inicia a escuchar en el puerto configurado
 */
const start = async () => {
	try {
		// Conectar a MariaDB primero
		// La función connect() crea las tablas automáticamente si no existen
		await connect();
		await seedDatabase();

		// Crear el servidor Fastify con todas las rutas
		const app = await createAPIServer();

		// Fastify requiere host '0.0.0.0' para que Docker pueda acceder
		await app.listen({
			port: Number(ENV.PORT) || 3000,
			host: '0.0.0.0'
		});

		console.log(`✓ Servidor corriendo en puerto ${ENV.PORT}`);

	} catch (err) {
		console.error('✗ Error al iniciar la aplicación:', err);
		process.exit(1);
	}
};

// Arrancar la aplicación
start();