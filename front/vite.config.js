import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	// 👇 AÑADE ESTE BLOQUE
	server: {
		host: true, // Esto es igual a poner 0.0.0.0
		port: 5173
	}
})