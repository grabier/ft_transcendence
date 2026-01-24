import { FastifyPluginAsync } from 'fastify';
import { PongGame } from '../game/PongGame.js';

const gameRoutes: FastifyPluginAsync = async (fastify, opts) => {

	const game = new PongGame();

	fastify.get('/', { websocket: true }, (connection: any, req: any) => {
		const socket = connection.socket || connection;

		if (socket) {
			const query = req.query as { mode?: string, score?: string };

			const currentMode = (query.mode === 'ai') ? 'ai' : 'pvp';

			const currentScore = parseInt(query.score || '5', 10) || 5;

			console.log(`Nueva Conexión -> Modo: ${currentMode}, Puntos: ${currentScore}`);

			game.startGame(currentMode, currentScore);

			const sendInterval = setInterval(() => {
				if (socket.readyState === 1) {
					socket.send(JSON.stringify({
						type: 'UPDATE',
						state: game.state
					}));
				}
			}, 1000 / 60);

			socket.on('message', (rawData: any) => {
				try {
					const message = JSON.parse(rawData.toString());

					if (message.type === 'INPUT') {
						game.handleInput(message.key, message.action);
					}

					if (message.type === 'RESTART') {
						console.log(`Reiniciando partida (${currentMode} a ${currentScore} puntos)`);
						game.startGame(currentMode, currentScore);
					}
				} catch (e) {
					console.error("Error socket:", e);
				}
			});

			socket.on('close', () => {
				clearInterval(sendInterval);
			});
		}
	});
};

export default gameRoutes;