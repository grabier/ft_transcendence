import { pool } from '../db/database.js';
import bcrypt from 'bcrypt';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const seedUsers = [
	{
		username: 'admin',
		email: 'admin@transcendence.com',
		password: 'admin123'
	},
	{
		username: 'testuser',
		email: 'test@transcendence.com',
		password: 'test123'
	},
	{
		username: 'player',
		email: 'player@transcendence.com',
		password: 'player123'
	}
];

const isUsersTableEmpty = async (): Promise<boolean> => {
	const [rows] = await pool.execute<RowDataPacket[]>(
		'SELECT COUNT(*) as count FROM users'
	);
	return rows[0].count === 0;
};

export const seedDatabase = async (): Promise<void> => {
	try {
		const isEmpty = await isUsersTableEmpty();

		if (!isEmpty) {
			console.log('⚠ The users table already contains data, skipping seed');
			return;
		}

		console.log('📦 Inserting test data...');

		for (const user of seedUsers) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(user.password, salt);

			await pool.execute<ResultSetHeader>(
				'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
				[user.username, user.email, hashedPassword]
			);
		}

		console.log(`✓ ${seedUsers.length} test users inserted`);
		console.log('  Available credentials:');
		seedUsers.forEach(u => {
			console.log(`    - ${u.email} / ${u.password}`);
		});

	} catch (error) {
		console.error('✗ Error inserting test data:', error);
		throw error;
	}
};