/**
 * game.schema.ts - Definiciones para la conexión al motor del Juego
 */

export const gameSocketSchema = {
	description: 'Endpoint de WebSocket para el motor de juego. Maneja Matchmaking, IA y Local.',
	tags: ['Game'],
	querystring: {
		type: 'object',
		required: ['token'],
		properties: {
			token: {
				type: 'string',
				description: 'JWT del usuario para autenticación'
			},
			mode: {
				type: 'string',
				enum: ['pvp', 'ai', 'local'],
				default: 'pvp',
				description: 'Modo de juego: Jugador vs Jugador, vs IA, o Local'
			},
			score: {
				type: 'integer',
				default: 5,
				description: 'Puntuación necesaria para ganar'
			},
			roomId: {
				type: 'string',
				description: 'ID de sala específica para desafíos directos'
			}
		}
	},
	response: {
		101: {
			description: 'Protocolo cambiado a WebSocket exitosamente',
			type: 'object',
			properties: {
				message: { type: 'string' }
			}
		},
		401: {
			description: 'Token inválido o no proporcionado',
			type: 'object',
			properties: {
				error: { type: 'string' }
			}
		}
	}
};