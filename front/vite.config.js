import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig(({ command }) => {
	const config = {
		plugins: [react()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src')
			}
		},
		server: {
			host: true,
			port: 5173
		}
	};

	// 'serve' es el comando que usa Vite para arrancar el servidor de desarrollo.
	// Si estamos haciendo 'build' dentro de Docker, esto se ignora.
	if (command === 'serve') {
		try {
			config.server.https = {
				key: fs.readFileSync(path.resolve(__dirname, '../.certs/server.key')),
				cert: fs.readFileSync(path.resolve(__dirname, '../.certs/server.crt')),
			};
		} catch (err) {
			console.warn("⚠️ No se encontraron certificados TLS. Arrancando sin HTTPS.");
		}
	}

	return config;
});