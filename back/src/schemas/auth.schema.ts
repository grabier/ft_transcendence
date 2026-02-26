/**
 * auth.schema.ts - Definiciones para Swagger y Validación
 */

export const registerSchema = {
	description: 'Registra un nuevo usuario en la plataforma',
	tags: ['Auth'],
	body: {
		type: 'object',
		required: ['username', 'email', 'password', 'avatarUrl'],
		properties: {
			username: { type: 'string', minLength: 3, example: 'gmontoro' },
			email: { type: 'string', format: 'email', example: 'gmontoro@student.42malaga.com' },
			password: { type: 'string', minLength: 6, example: '123456' },
			avatarUrl: { type: 'string', example: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky' }
		}
	},
	response: {
		201: {
			description: 'Usuario creado correctamente',
			type: 'object',
			properties: {
				message: { type: 'string' },
				userId: { type: 'number' }
			}
		},
		409: {
			description: 'Conflicto: Usuario o email ya existe',
			type: 'object',
			properties: {
				error: { type: 'string' }
			}
		}
	}
};

export const loginSchema = {
	description: 'Inicia sesión con email y contraseña',
	tags: ['Auth'],
	body: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: { type: 'string', format: 'email' },
			password: { type: 'string' }
		}
	},
	response: {
		200: {
			description: 'Login exitoso',
			type: 'object',
			properties: {
				message: { type: 'string' },
				token: { type: 'string' },
				user: {
					type: 'object',
					properties: {
						id: { type: 'number' },
						username: { type: 'string' },
						email: { type: 'string' }
					}
				}
			}
		},
		401: {
			description: 'Credenciales inválidas',
			type: 'object',
			properties: {
				error: { type: 'string' }
			}
		}
	}
};

export const logoutSchema = {
	description: 'Cierra la sesión del usuario actual',
	tags: ['Auth'],
	security: [{ bearerAuth: [] }],
	response: {
		200: {
			type: 'object',
			properties: {
				message: { type: 'string' }
			}
		},
		500: {
			description: 'Error interno del servidor al intentar cerrar sesión',
			type: 'object',
			properties: {
				error: { type: 'string' }
			}
		}
	}
};