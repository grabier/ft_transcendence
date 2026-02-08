/**
 * database.ts - Configuración y conexión a MariaDB
 * 
 * Este módulo gestiona la conexión a la base de datos MariaDB usando mysql2.
 * Exporta funciones para conectar, desconectar y obtener el pool de conexiones.
 * Al conectar, crea automáticamente las tablas necesarias si no existen.
 */

import mysql from 'mysql2/promise';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

/**
 * Configuración de la base de datos obtenida de las variables de entorno.
 * Estos valores deben estar definidos en el archivo .env
 */
const dbConfig = {
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,       // Espera si no hay conexiones disponibles
	connectionLimit: 10,            // Máximo de conexiones simultáneas
	queueLimit: 0                   // Sin límite en la cola de espera
};

// ============================================================================
// POOL DE CONEXIONES
// ============================================================================

/**
 * Pool de conexiones a MariaDB.
 * Usamos un pool porque es más eficiente que crear/cerrar conexiones individuales.
 * El pool se inicializa en la función connect() y se cierra en disconnect().
 */
export let pool: mysql.Pool;

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Conecta a la base de datos MariaDB y crea las tablas si no existen.
 * Esta función debe llamarse al iniciar la aplicación.
 * 
 * @throws Error si no puede conectar a la base de datos
 */
export const connect = async (): Promise<void> => {
	try {
		// Crear el pool de conexiones
		pool = mysql.createPool(dbConfig);

		// Obtener una conexión para verificar que funciona
		const connection = await pool.getConnection();
		console.log(`✓ Conectado a MariaDB en ${dbConfig.host}:${dbConfig.port}`);

		// Liberar la conexión de prueba
		connection.release();

		// Crear las tablas necesarias si no existen
		await initializeTables();

		console.log('✓ Base de datos conectada e inicializada');
	} catch (error) {
		console.error('✗ Error al conectar con MariaDB:', error);
		throw error;
	}
};

/**
 * Cierra el pool de conexiones a la base de datos.
 * Debe llamarse al cerrar la aplicación para liberar recursos.
 */
export const disconnect = async (): Promise<void> => {
	if (pool) {
		await pool.end();
		console.log('✓ Conexión a MariaDB cerrada');
	}
};

/**
 * Obtiene una conexión del pool para realizar operaciones.
 * Recuerda liberar la conexión con connection.release() después de usarla.
 * 
 * @returns Una conexión del pool
 */
export const getConnection = async (): Promise<mysql.PoolConnection> => {
	return await pool.getConnection();
};

// ============================================================================
// INICIALIZACIÓN DE TABLAS
// ============================================================================

/**
 * Crea las tablas necesarias si no existen.
 * Se ejecuta automáticamente al conectar.
 * Si la tabla ya existe, no hace nada (gracias a IF NOT EXISTS).
 */
const initializeTables = async (): Promise<void> => {
	const connection = await pool.getConnection();

	try {
		// ----------------------------------------------------------------
		// TABLA: users
		// Almacena la información básica de los usuarios
		// ----------------------------------------------------------------
		await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nombre de usuario único',
                email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email único para login',
                password VARCHAR(255) NULL COMMENT 'Contraseña hasheada (NULL si usa OAuth)',
                avatar_url VARCHAR(500) NULL COMMENT 'URL de la foto de perfil',
                is_online BOOLEAN DEFAULT FALSE COMMENT 'Estado actual del usuario',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de registro',
                last_login TIMESTAMP NULL COMMENT 'Última vez que inició sesión'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

		//tabla friendships
		await connection.execute(`
				CREATE TABLE IF NOT EXISTS friendships (
					id INT AUTO_INCREMENT PRIMARY KEY,
					sender_id INT NOT NULL COMMENT 'Usuario que envía la petición',
					receiver_id INT NOT NULL COMMENT 'Usuario que recibe la petición',
					status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					-- Claves foráneas para mantener integridad
					FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
					FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
					-- Evita duplicados: no puedes mandar dos peticiones a la misma persona
					UNIQUE KEY unique_friendship (sender_id, receiver_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
			`);

		// SALAS DE CHAT (Direct Messages)
		// Define QUE existen conversaciones entre dos personas
		await connection.execute(`
            CREATE TABLE IF NOT EXISTS direct_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user1_id INT NOT NULL,
                user2_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
                -- CONSTRAINT: Asegura que no haya salas duplicadas para la misma pareja
                UNIQUE KEY unique_dm (user1_id, user2_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

		//  MENSAJES (El historial)
		// Aquí guardamos cada línea de texto o invitación
		await connection.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dm_id INT NOT NULL,
                sender_id INT NOT NULL,
                content TEXT,
                type ENUM('text', 'game_invite', 'system') DEFAULT 'text',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dm_id) REFERENCES direct_messages(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);


		// USUARIOS BLOQUEADOS
		// Para que el chat sepa si permitir enviar mensaje o no
		await connection.execute(`
            CREATE TABLE IF NOT EXISTS blocked_users (
                blocker_id INT NOT NULL,
                blocked_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (blocker_id, blocked_id),
                FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

		console.log('✓ Tablas verificadas/creadas: users, friendships, direct_messages, messages, blocked_users');
	} finally {
		// Siempre liberamos la conexión, incluso si hay error
		connection.release();
	}
};

// ============================================================================
// MANEJO DE CIERRE GRACEFUL
// ============================================================================

/**
 * Handlers para cerrar la conexión correctamente cuando la app se detiene.
 * Esto previene conexiones huérfanas en la base de datos.
 */

// Cuando el proceso de Node termina normalmente
process.on('exit', () => {
	if (pool) {
		pool.end();
	}
});

// Cuando se presiona Ctrl+C en la terminal
process.on('SIGINT', async () => {
	await disconnect();
	process.exit(128 + 2);
});

// Cuando el proceso recibe señal de terminación (ej: Docker stop)
process.on('SIGTERM', async () => {
	await disconnect();
	process.exit(128 + 15);
});
