export interface ChatUser {
	id: number;
	username: string;
	avatar_url: string;
	is_online?: boolean; // Opcional, para el futuro
}

export interface Message {
	id: number;
	dm_id: number;
	sender_id: number;
	username: string;     // Para mostrar el nombre encima del mensaje
	avatar_url: string;   // Para la fotito
	content: string;      // El texto o el ID de la partida
	type: 'text' | 'game_invite' | 'system';
	created_at: string;
	is_read?: boolean;
}

export interface DM {
	id: number;          // El ID de la sala (dm_id)
	otherUser: ChatUser; // Los datos del OTRO (con quien hablas)
	lastMessage?: Message; // Para mostrar la previsualización en el sidebar
	unreadCount?: number;
}