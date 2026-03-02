/**
 * Frontend Application Constants
 * Centralized location for all magic numbers, repeated strings, and configuration values
 */

// Storage Keys
export const STORAGE_KEYS = {
	AUTH_TOKEN: 'auth_token',
} as const;

// Network Configuration
export const NETWORK = {
	PORT: '3000',
	RECONNECT_TIMEOUT: 3000, // milliseconds
} as const;

// External APIs
export const EXTERNAL_APIS = {
	DICEBEAR_BASE_URL: 'https://api.dicebear.com/7.x/avataaars/svg',
} as const;

// Avatar Configuration
export const AVATAR_SEEDS = [
	'Felix',
	'Aneka', 
	'Buddy',
	'Max',
	'Garfield',
	'Lucky',
	'Willow',
	'Jasper'
] as const;

// File Upload Limits
export const FILE_LIMITS = {
	MAX_AVATAR_SIZE_MB: 2,
	MAX_AVATAR_SIZE_BYTES: 2 * 1024 * 1024, // 2MB in bytes
} as const;

// Chat Configuration  
export const CHAT = {
	DEFAULT_MESSAGE_LIMIT: 50,
	DEFAULT_OFFSET: 0,
} as const;

// Game Configuration
export const GAME = {
	DEFAULT_POINTS_TO_WIN: 5,
	POINT_OPTIONS: [3, 5, 11, 21] as const,
} as const;
