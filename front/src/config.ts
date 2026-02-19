const PROTOCOL = window.location.protocol; // 'http:' o 'https:'
const HOST = window.location.hostname;     // 'localhost' o '10.13.x.x'
const PORT = '3000';                       // puerto de backend

// URL Base para la API (HTTP)
export const BASE_URL = `${PROTOCOL}//${HOST}:${PORT}`;

// URL Base para WebSockets (WS/WSS)
// si estamos en https, usamos wss. Si es http, usamos ws.
const WS_PROTOCOL = PROTOCOL === 'https:' ? 'wss:' : 'ws:';
export const WS_URL = `${WS_PROTOCOL}//${HOST}:${PORT}`;