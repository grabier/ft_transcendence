/**
 * user.repository.ts - Repositorio de usuarios
 * 
 * Funciones de acceso a datos para la tabla 'users'.
 * Encapsula las queries SQL para mantener limpia la lógica de negocio.
 * 
 * Todas las funciones son async porque mysql2 trabaja con promesas.
 */

import { RowDataPacket } from 'mysql2';
import { pool } from '../../db/database.js';
import { DbUser, PublicUser, NewUser } from '../../db/db-models/users.js';
import { ResultSetHeader } from 'mysql2';

// ============================================================================
// QUERIES DE LECTURA
// ============================================================================

/**
 * Busca un usuario por su ID
 * @param id - ID del usuario
 * @returns El usuario encontrado o null si no existe
 */
export const findById = async (id: number): Promise<PublicUser | null> => {
	const [rows] = await pool.execute<RowDataPacket[]>(
		'SELECT id, username, email, avatar_url, is_online, created_at, last_login FROM users WHERE id = ?',
		[id]
	);
	return rows.length > 0 ? rows[0] as PublicUser : null;
};

/**
 * Busca un usuario por su email (incluye password para validación de login)
 * @param email - Email del usuario
 * @returns El usuario completo o null si no existe
 */
export const findByEmail = async (email: string): Promise<DbUser | null> => {
	const [rows] = await pool.execute<RowDataPacket[]>(
		'SELECT * FROM users WHERE email = ?',
		[email]
	);
	return rows.length > 0 ? rows[0] as DbUser : null;
};

/**
 * Busca un usuario por su username
 * @param username - Nombre de usuario
 * @returns El usuario o null si no existe
 */
export const findByUsername = async (username: string): Promise<PublicUser | null> => {
	const [rows] = await pool.execute<RowDataPacket[]>(
		'SELECT id, username, email, avatar_url, is_online, created_at, last_login FROM users WHERE username = ?',
		[username]
	);
	return rows.length > 0 ? rows[0] as PublicUser : null;
};

/**
 * Crea un nuevo usuario en la base de datos
 * @param userData - Datos del nuevo usuario
 * @returns El ID del usuario creado
 */
export const create = async (userData: NewUser): Promise<number> => {
    const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [userData.username, userData.email, userData.password]
    );
    return result.insertId;
};

/**
 * Obtiene todos los usuarios (sin passwords)
 * @returns Lista de todos los usuarios
 */
export const getAll = async (): Promise<PublicUser[]> => {
	const [rows] = await pool.execute<RowDataPacket[]>(
		'SELECT id, username, email, avatar_url, is_online, created_at, last_login FROM users'
	);
	return rows as PublicUser[];
};

// ============================================================================
// QUERIES DE ESCRITURA
// ============================================================================

/**
 * Actualiza el estado online de un usuario
 * @param id - ID del usuario
 * @param isOnline - Nuevo estado
 */
export const updateOnlineStatus = async (id: number, isOnline: boolean): Promise<void> => {
	await pool.execute(
		'UPDATE users SET is_online = ? WHERE id = ?',
		[isOnline, id]
	);
};

/**
 * Actualiza la fecha de último login
 * @param id - ID del usuario
 */
export const updateLastLogin = async (id: number): Promise<void> => {
	await pool.execute(
		'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
		[id]
	);
};

/**
 * Updates the username for a specific user
 * @param id - User ID
 * @param newUsername - The new username string
 */
export const updateUsername = async (id: number, newUsername: string): Promise<void> => {
    await pool.execute(
        'UPDATE users SET username = ? WHERE id = ?',
        [newUsername, id]
    );
};