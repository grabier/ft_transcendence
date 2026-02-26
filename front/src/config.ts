import { NETWORK } from './constants';

const PROTOCOL = window.location.protocol;
const HOST = window.location.hostname;
const PORT = NETWORK.PORT;


export const BASE_URL = `${PROTOCOL}//${HOST}:${PORT}`;

const WS_PROTOCOL = PROTOCOL === 'https:' ? 'wss:' : 'ws:';
export const WS_URL = `${WS_PROTOCOL}//${HOST}:${PORT}`;