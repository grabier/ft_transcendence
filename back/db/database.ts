import mysql from 'mysql2/promise';



export let pool: mysql.Pool;

export const connect = async (): Promise<void> => {
	try {

		const dbConfig = {
			host: process.env.DB_HOST,
			port: Number(process.env.DB_PORT),
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0
		};
		pool = mysql.createPool(dbConfig);

		const connection = await pool.getConnection();
		console.log(`✓ Connected to MariaDB at ${dbConfig.host}:${dbConfig.port}`);

		connection.release();

		await initializeTables();

		console.log('✓ Database connected and initialized');
	} catch (error) {
		console.error('✗ Error connecting to MariaDB:', error);
		throw error;
	}
};

export const disconnect = async (): Promise<void> => {
	if (pool) {
		await pool.end();
		console.log('✓ MariaDB connection closed');
	}
};

export const getConnection = async (): Promise<mysql.PoolConnection> => {
	return await pool.getConnection();
};

const initializeTables = async (): Promise<void> => {
	const connection = await pool.getConnection();

	try {
		await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL COMMENT 'Unique username',
                email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Unique email for login',
                password VARCHAR(255) NULL COMMENT 'Hashed password (NULL if using OAuth)',
                avatar_url VARCHAR(500) NULL COMMENT 'Profile picture URL',
                is_online BOOLEAN DEFAULT FALSE COMMENT 'Current user status',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Registration date',
                last_login TIMESTAMP NULL COMMENT 'Last login time'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
		await connection.execute(`
				CREATE TABLE IF NOT EXISTS friendships (
					id INT AUTO_INCREMENT PRIMARY KEY,
					sender_id INT NOT NULL COMMENT 'User who sends the request',
					receiver_id INT NOT NULL COMMENT 'User who receives the request',
					status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					blocked_by INT DEFAULT NULL,
					-- Foreign keys to maintain integrity
					FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
					FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
					-- Prevents duplicates: cannot send two requests to the same person
					UNIQUE KEY unique_friendship (sender_id, receiver_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
			`);
		await connection.execute(`
            CREATE TABLE IF NOT EXISTS direct_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user1_id INT NOT NULL,
                user2_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
                -- CONSTRAINT: Ensures no duplicate rooms for the same pair
                UNIQUE KEY unique_dm (user1_id, user2_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
		await connection.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dm_id INT NOT NULL,
                sender_id INT NOT NULL,
                content TEXT,
                type ENUM('text', 'game_invite', 'system') DEFAULT 'text',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                invite_score INT DEFAULT NULL,
				is_read BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (dm_id) REFERENCES direct_messages(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

		console.log('✓ Tables verified/created: users, friendships, direct_messages, messages');
	} finally {
		connection.release();
	}
};

process.on('exit', () => {
	if (pool) {
		pool.end();
	}
});

process.on('SIGINT', async () => {
	await disconnect();
	process.exit(128 + 2);
});

process.on('SIGTERM', async () => {
	await disconnect();
	process.exit(128 + 15);
});