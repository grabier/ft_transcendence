export type Role = 'standard-user' | 'admin-user';

export interface UserSession {
	id: string;
	role: Role;
}