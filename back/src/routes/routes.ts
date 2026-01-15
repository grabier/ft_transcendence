/**
 * routes.ts - Configuración centralizada de rutas y variables de entorno
 * 
 * Este módulo centraliza:
 * - Las rutas base de cada API
 * - Las variables de entorno de configuración
 */

import 'dotenv/config';

// ============================================================================
// RUTAS DE LA API
// ============================================================================

const root = '/api';

/**
 * Rutas base para cada módulo de la API.
 * Ejemplo de uso: fastify.register(authRoutes, { prefix: API_ROUTES.auth })
 */
export const API_ROUTES = {
	root,
	auth: `${root}/auth`,
	user: `${root}/user`,
};

// ============================================================================
// VARIABLES DE ENTORNO
// ============================================================================

/**
 * Variables de entorno de la aplicación.
 * Centralizar aquí facilita el acceso y documentación.
 * 
 * NOTA: Las variables DB_* se usan directamente en database.ts
 */
export const ENV = {
	PORT: process.env.PORT,
	NODE_ENV: process.env.NODE_ENV,

	// Variables de MariaDB (para referencia, se usan en database.ts)
	// DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
};
