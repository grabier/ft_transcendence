import { RowDataPacket } from 'mysql2';
import { pool } from '../../db/database.js';
import { DbUser, PublicUser, NewUser } from '../../db/db-models/users.js';
import { ResultSetHeader } from 'mysql2';

export const findById = async (id: number): Promise<PublicUser | null> => {
	const [rows] = await pool.execute<RowDataPacket[]>(
		'SELECT id, username, email, avatar_url, is_online, created_at, last_login FROM users WHERE id = ?',
		[id]
	);
	return rows.length > 0 ? rows[0] as PublicUser : null;
};

export const findByEmail = async (email: string): Promise<DbUser | null> => {
	const [rows] = await pool.execute<RowDataPacket[]>(
		'SELECT * FROM users WHERE email = ?',
		[email]
	);
	return rows.length > 0 ? rows[0] as DbUser : null;
};

export const findByUsername = async (username: string): Promise<PublicUser | null> => {
	const [rows] = await pool.execute<RowDataPacket[]>(
		'SELECT id, username, email, avatar_url, is_online, created_at, last_login FROM users WHERE username = ?',
		[username]
	);
	return rows.length > 0 ? rows[0] as PublicUser : null;
};

export const create = async (userData: NewUser): Promise<number> => {
	const [result] = await pool.execute<ResultSetHeader>(
		'INSERT INTO users (username, email, password, avatar_url) VALUES (?, ?, ?, ?)',
		[userData.username, userData.email, userData.password, userData.avatar_url]
	);
	return result.insertId;
};

export const getAll = async (): Promise<PublicUser[]> => {
	const [rows] = await pool.execute<RowDataPacket[]>(
		'SELECT id, username, email, avatar_url, is_online, created_at, last_login FROM users'
	);
	return rows as PublicUser[];
};

export const updateOnlineStatus = async (id: number, isOnline: boolean): Promise<void> => {
	await pool.execute(
		'UPDATE users SET is_online = ? WHERE id = ?',
		[isOnline, id]
	);
};

export const updateLastLogin = async (id: number): Promise<void> => {
	await pool.execute(
		'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
		[id]
	);
};

export const updateUsername = async (id: number, newUsername: string): Promise<void> => {
	await pool.execute(
		'UPDATE users SET username = ? WHERE id = ?',
		[newUsername, id]
	);
};

export const updateAvatarUrl = async (id: number, newUrl: string): Promise<void> => {
	await pool.execute(
		'UPDATE users SET avatar_url = ? WHERE id = ?',
		[newUrl, id]
	);
};