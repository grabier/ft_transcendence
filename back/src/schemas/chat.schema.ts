/**
 * chat.schema.ts - Definiciones para Swagger y Validación del Chat
 */

export const getDMSchema = {
	description: 'Obtiene un chat privado existente o crea uno nuevo entre el usuario actual y el objetivo',
	tags: ['Chat'],
	security: [{ bearerAuth: [] }],
	body: {
		type: 'object',
		required: ['targetUserId'],
		properties: {
			targetUserId: { type: 'number', description: 'ID del usuario con el que se quiere chatear' }
		}
	},
	response: {
		200: {
			description: 'ID del chat obtenido o creado',
			type: 'object',
			properties: {
				dmId: { type: 'number' },
				isNew: { type: 'boolean' }
			}
		},
		400: {
			description: 'Error en la solicitud (ej: hablar contigo mismo)',
			type: 'object',
			properties: {
				error: { type: 'string' }
			}
		}
	}
};

export const getMessagesSchema = {
	description: 'Obtiene el historial de mensajes de un chat específico',
	tags: ['Chat'],
	security: [{ bearerAuth: [] }],
	params: {
		type: 'object',
		properties: {
			dmId: { type: 'number', description: 'ID de la conversación (direct_messages)' }
		}
	},
	querystring: {
		type: 'object',
		properties: {
			limit: { type: 'number', default: 50 },
			offset: { type: 'number', default: 0 }
		}
	},
	response: {
		200: {
			description: 'Lista de mensajes ordenada cronológicamente',
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					content: { type: 'string' },
					type: { type: 'string', enum: ['text', 'game_invite'] },
					created_at: { type: 'string', format: 'date-time' },
					sender_id: { type: 'number' },
					username: { type: 'string' },
					avatar_url: { type: 'string' },
					invite_score: { type: ['number', 'null'] },
					is_read: { type: 'boolean', default: false }
				}
			}
		},
		403: {
			description: 'Acceso denegado (el usuario no pertenece a este chat)',
			type: 'object',
			properties: {
				error: { type: 'string' }
			}
		}
	}
};

export const getMyChatsSchema = {
	description: 'Lista todas las conversaciones activas del usuario actual',
	tags: ['Chat'],
	security: [{ bearerAuth: [] }],
	response: {
		200: {
			description: 'Lista de conversaciones con el último mensaje y datos del otro usuario',
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					otherUser: {
						type: 'object',
						properties: {
							id: { type: 'number' },
							username: { type: 'string' },
							avatar_url: { type: 'string' },
							is_online: { type: 'boolean' }
						}
					},
					lastMessage: {
						type: ['object', 'null'],
						properties: {
							content: { type: 'string' },
							created_at: { type: 'string', format: 'date-time' }
						}
					}
				}
			}
		}
	}
};