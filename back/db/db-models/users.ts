export interface DbUser {
	id: number;
	username: string;
	email: string;
	password?: string;
	avatar_url?: string;
	is_online: boolean;
	created_at: Date;
	last_login?: Date;
}

export type NewUser = Pick<DbUser, 'username' | 'email' | 'password' | 'avatar_url'>;
export type PublicUser = Omit<DbUser, 'password'>
export type UpdateUserProfile = {
	username?: string;
	email?: string;
	avatar_url?: string;
};