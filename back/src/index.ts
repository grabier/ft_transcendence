import { ENV } from './routes/routes.js';
import { connect } from '../db/database.js';
import { seedDatabase } from '../db/seed-data.js';
import { createAPIServer } from './server.js';

const start = async () => {
	try {
		await connect();
		await seedDatabase();

		const app = await createAPIServer();

		await app.listen({
			port: 3000,
			host: '0.0.0.0'
		});

	} catch (err) {
		console.error('✗ Error starting the application:', err);
		process.exit(1);
	}
};

start();