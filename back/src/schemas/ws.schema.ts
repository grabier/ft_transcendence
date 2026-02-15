/**
 * ws.schema.ts - Documentación del Socket de Notificaciones y Chat
 */

export const mainSocketSchema = {
	description: 'Conexión WebSocket principal para notificaciones en tiempo real, chat y estado de amigos.',
	tags: ['Websocket'],
	querystring: {
		type: 'object',
		required: ['token'],
		properties: {
			token: {
				type: 'string',
				description: 'Token JWT del usuario para autenticar la conexión'
			}
		}
	},
	response: {
		101: {
			description: 'Cambio de protocolo a WebSocket exitoso',
			type: 'object',
			properties: {
				message: { type: 'string' }
			}
		},
		408: {
			description: 'Token requerido o inválido',
			type: 'object',
			properties: {
				error: { type: 'string' }
			}
		}
	}
};