/**
 * friend.schema.ts - Definiciones para Swagger y Validación de Amistades
 */

const userSummaryProperties = {
	id: { type: 'number' },
	username: { type: 'string' },
	avatar_url: { type: 'string' },
	is_online: { type: 'boolean' }
};

export const sendRequestSchema = {
	description: 'Envía una nueva petición de amistad a otro usuario',
	tags: ['Friends'],
	security: [{ apiKey: [] }],
	body: {
		type: 'object',
		required: ['receiverId'],
		properties: {
			receiverId: { type: 'number', description: 'ID del usuario al que se envía la petición' }
		}
	},
	response: {
		200: {
			type: 'object',
			properties: { message: { type: 'string' } }
		},
		400: {
			type: 'object',
			properties: { error: { type: 'string' } }
		},
		409: {
			type: 'object',
			properties: { error: { type: 'string' } }
		}
	}
};

export const listFriendsSchema = {
	description: 'Obtiene la lista de amigos aceptados del usuario actual',
	tags: ['Friends'],
	security: [{ apiKey: [] }],
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: userSummaryProperties
			}
		}
	}
};

export const listBlockedSchema = {
	description: 'Obtiene la lista de usuarios bloqueados por el usuario actual',
	tags: ['Friends'],
	security: [{ apiKey: [] }],
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: userSummaryProperties
			}
		}
	}
};

export const listPendingSchema = {
	description: 'Obtiene las peticiones de amistad recibidas que están pendientes',
	tags: ['Friends'],
	security: [{ apiKey: [] }],
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					friendship_id: { type: 'number' },
					sender_id: { type: 'number' },
					username: { type: 'string' },
					avatar_url: { type: 'string' },
					created_at: { type: 'string', format: 'date-time' }
				}
			}
		}
	}
};

export const acceptFriendSchema = {
	description: 'Acepta una petición de amistad recibida',
	tags: ['Friends'],
	security: [{ apiKey: [] }],
	params: {
		type: 'object',
		properties: {
			id: { type: 'number', description: 'ID del usuario que envió la petición' }
		}
	},
	response: {
		200: {
			type: 'object',
			properties: { message: { type: 'string' } }
		},
		404: {
			type: 'object',
			properties: { error: { type: 'string' } }
		}
	}
};

export const deleteFriendSchema = {
	description: 'Elimina un amigo o rechaza una petición de amistad',
	tags: ['Friends'],
	security: [{ apiKey: [] }],
	params: {
		type: 'object',
		properties: {
			id: { type: 'number', description: 'ID del otro usuario en la relación' }
		}
	},
	response: {
		200: {
			type: 'object',
			properties: { message: { type: 'string' } }
		}
	}
};

export const blockUserSchema = {
	description: 'Bloquea a un usuario (debe existir una relación previa o petición)',
	tags: ['Friends'],
	security: [{ apiKey: [] }],
	params: {
		type: 'object',
		properties: {
			id: { type: 'number', description: 'ID del usuario a bloquear' }
		}
	},
	response: {
		200: {
			type: 'object',
			properties: { message: { type: 'string' } }
		},
		404: {
			type: 'object',
			properties: { error: { type: 'string' } }
		}
	}
};