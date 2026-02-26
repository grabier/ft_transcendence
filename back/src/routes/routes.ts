import 'dotenv/config';

const root = '/api';

export const API_ROUTES = {
	root,
	auth: `${root}/auth`,
	user: `${root}/user`,
	game: `${root}/game`,
	friend: `${root}/friend`,
	ws: `${root}/ws`,
	chat: `${root}/chat`,
	snake: `${root}/snake`,
};

export const ENV = {
	PORT: process.env.PORT,
	NODE_ENV: process.env.NODE_ENV,
};
