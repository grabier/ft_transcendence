import { createAPIServer } from './server.js';
import { ENV } from './routes/routes.js';
import { connect } from '../db/database.js';

const start = async () => {
	//creamos el servidor
	const app = await createAPIServer();

	try {
		//fastify requiere especificar el host '0.0.0.0' para que Docker lo vea
		await connect('pong.sqlite');
		const app = await createAPIServer();

		await app.listen({
			port: Number(ENV.PORT) || 3000,
			host: '0.0.0.0'
		});
		console.log(`Server running on port ${ENV.PORT}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();