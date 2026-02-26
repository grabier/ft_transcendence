/**
 * user.schema.ts - Definiciones para Swagger y Validación de Usuarios
 */

const userFullProperties = {
	id: { type: 'number' },
	username: { type: 'string' },
	email: { type: 'string', format: 'email' },
	avatar_url: { type: 'string' },
	is_online: { type: 'boolean' },
	created_at: { type: 'string', format: 'date-time' },
	last_login: { type: 'string', format: 'date-time' }
};

export const getUserByIdSchema = {
	description: 'Obtiene los detalles públicos de un usuario por su ID',
	tags: ['User'],
	params: {
		type: 'object',
		properties: {
			id: { type: 'number', description: 'ID único del usuario' }
		}
	},
	response: {
		200: {
			description: 'Datos del usuario encontrados',
			type: 'object',
			properties: userFullProperties
		},
		404: {
			description: 'Usuario no encontrado',
			type: 'object',
			properties: { error: { type: 'string' } }
		}
	}
};

export const searchUsersSchema = {
	description: 'Busca usuarios por nombre de usuario (mínimo 1 caracteres)',
	tags: ['User'],
	querystring: {
		type: 'object',
		required: ['q'],
		properties: {
			q: { type: 'string', minLength: 1, description: 'Término de búsqueda' }
		}
	},
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					username: { type: 'string' },
					avatar_url: { type: 'string' },
					is_online: { type: 'boolean' }
				}
			}
		}
	}
};
export const persistenceSchema = {
	description: 'Verifica la validez del token y actualiza el estado online/última conexión',
	tags: ['User'],
	security: [{ bearerAuth: [] }],
	response: {
		200: {
			description: 'Token válido y estado actualizado',
			type: 'object',
			properties: {
				status: { type: 'string' },
				user: {
					type: 'object',
					properties: {
						id: { type: 'number' },
						username: { type: 'string' }
					}
				}
			}
		},
		401: {
			description: 'Token inválido o expirado',
			type: 'object',
			properties: {
				error: { type: 'string' }
			}
		}
	}
};
export const updateUsernameSchema = {
	description: 'Actualiza el nombre de usuario y genera un nuevo token JWT',
	tags: ['User'],
	security: [{ bearerAuth: [] }],
	body: {
		type: 'object',
		required: ['newUsername'],
		properties: {
			newUsername: { type: 'string', minLength: 3 }
		}
	},
	response: {
		200: {
			description: 'Nombre actualizado y nuevo token generado',
			type: 'object',
			properties: {
				message: { type: 'string' },
				token: { type: 'string' },
				username: { type: 'string' }
			}
		},
		409: {
			description: 'El nombre de usuario ya está en uso',
			type: 'object',
			properties: { error: { type: 'string' } }
		}
	}
};

export const updateAvatarSchema = {
	description: 'Actualiza la URL del avatar del usuario',
	tags: ['User'],
	security: [{ bearerAuth: [] }],
	body: {
		type: 'object',
		required: ['newUrl'],
		properties: {
			newUrl: { type: 'string', format: 'uri' }
		}
	},
	response: {
		200: {
			description: 'Avatar actualizado',
			type: 'object',
			properties: {
				message: { type: 'string' },
				newUrl: { type: 'string' }
			}
		}
	}
};

export const uploadAvatarSchema = {
	description: 'Sube un archivo de imagen para actualizar el avatar',
	tags: ['User'],
	security: [{ bearerAuth: [] }],
	consumes: ['multipart/form-data'],
	body: {
		type: 'object',
		properties: {
			file: { type: 'string', format: 'binary', description: 'La imagen a subir' }
		}
	},
	response: {
		200: {
			description: 'Avatar subido exitosamente',
			type: 'object',
			properties: {
				message: { type: 'string' },
				avatarUrl: { type: 'string' },
				token: { type: 'string' }
			}
		},
		400: {
			description: 'Error: No se subió ningún archivo',
			type: 'object',
			properties: {
				error: { type: 'string' }
			}
		}
	}
};