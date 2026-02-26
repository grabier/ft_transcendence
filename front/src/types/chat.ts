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
	username: string;
	avatar_url: string;
	content: string;
	type: 'text' | 'game_invite' | 'system';
	created_at: string;
	is_read?: boolean;
}

export interface DM {
	id: number;
	otherUser: ChatUser;
	lastMessage?: Message;
	unreadCount?: number;
}