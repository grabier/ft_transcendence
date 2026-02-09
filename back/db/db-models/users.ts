/**
 * users.ts - Modelo de datos para usuarios
 * 
 * Define las interfaces TypeScript que representan la estructura
 * de la tabla 'users' en MariaDB.
 */

// ============================================================================
// INTERFAZ PRINCIPAL: Usuario completo (como viene de la BD)
// ============================================================================

/**
 * Representa un usuario tal como está almacenado en la base de datos.
 * Todos los campos coinciden con las columnas de la tabla 'users'.
 */
export interface DbUser {
	id: number;                     // ID único autoincremental
	username: string;               // Nombre de usuario único
	email: string;                  // Email único para login
	password?: string;        // Contraseña hasheada (NULL si usa OAuth)
	avatar_url?: string;      // URL de la foto de perfil
	is_online: boolean;             // Estado actual del usuario
	created_at: Date;               // Fecha de registro
	last_login?: Date;        // Última conexión
}

// ============================================================================
// TIPOS AUXILIARES: Para operaciones específicas
// ============================================================================

/**
 * Datos necesarios para crear un nuevo usuario (registro).
 * Excluye campos que la BD genera automáticamente (id, created_at, etc.)
 */
export type NewUser = Pick<DbUser, 'username' | 'email' | 'password' | 'avatar_url'>;

/**
 * Datos que se pueden mostrar públicamente (sin password).
 * Usar cuando devolvemos info de usuario al frontend.
 */
export type PublicUser = Omit<DbUser, 'password'>;

/**
 * Campos actualizables del perfil de usuario.
 */
export type UpdateUserProfile = {
	username?: string;
	email?: string;
	avatar_url?: string;
};
