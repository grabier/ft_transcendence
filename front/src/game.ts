const square = { x: 400, y: 300, width: 18, height: 18 };
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
const paddleLeft = { x: 10, y: 265, width: 10, height: 70 };
const paddleRight = { x: 800 - 20, y: 265, width: 10, height: 70 };
let scoreRight = 0;
let scoreLeft = 0;
let gameState = 'loading'; // 'loading', 'countdown', 'playing', 'ended'

const serverTarget = {
	ball: { x: 400, y: 300 },
	paddleLeft: { y: 265 },
	paddleRight: { y: 265 }
};

//interpolacion: la bola se dibuja 60veces x segundo, o la tasa de refresco del monitor
//el front no recibe 60 actualizaciones x segundo, sino bastantes menos. 
//entonces no podemos igualar la posicion en pantalla a la posicion q nos de el server, pq iria a tirones
//el lerp permite q vaya fluido, va acercando poco a poco la pelota a donde deberia estar, no teletransporta
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

function createElement(tag: string, className: string = "", attributes: Record<string, string> = {}, children: (HTMLElement | string)[] = []): HTMLElement {
	const element = document.createElement(tag);
	if (className)
		element.className = className;
	Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
	children.forEach(child => typeof child === 'string' ? element.appendChild(document.createTextNode(child)) : element.appendChild(child));
	return element;
}

function draw() {
	if (!context)
		return;
	context.fillStyle = 'black';
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = 'white';
	context.font = '50px Arial';
	context.textAlign = 'center';
	context.fillText(scoreLeft.toString(), canvas.width / 4, 100);
	context.fillText(scoreRight.toString(), (canvas.width / 4) * 3, 100);
	context.fillRect((canvas.width / 2) - 2, 0, 4, canvas.height);

	context.fillStyle = 'white';
	context.fillRect(square.x, square.y, square.width, square.height);

	context.fillStyle = 'red';
	context.fillRect(paddleLeft.x, paddleLeft.y, paddleLeft.width, paddleLeft.height);

	context.fillStyle = 'blue';
	context.fillRect(paddleRight.x, paddleRight.y, paddleRight.width, paddleRight.height);
}

function gameLoop() {
	if (gameState !== 'loading') {
		const LERP_FACTOR = 0.3;

		const dx = serverTarget.ball.x - square.x;
		const dy = serverTarget.ball.y - square.y;

		//para los casos en los q la pelota se mueve mucho en poco tiempo(como cuando marcamos gol, q vuelve al medio)
		//no lerpeamos, sino q teletransportamos del tiron
		if (Math.sqrt(dx * dx + dy * dy) > 100) {
			square.x = serverTarget.ball.x;
			square.y = serverTarget.ball.y;
		} else {
			square.x = lerp(square.x, serverTarget.ball.x, LERP_FACTOR);
			square.y = lerp(square.y, serverTarget.ball.y, LERP_FACTOR);
		}
		//lerpeamos tb las palas para q vayan fluidas
		paddleLeft.y = lerp(paddleLeft.y, serverTarget.paddleLeft.y, LERP_FACTOR);
		paddleRight.y = lerp(paddleRight.y, serverTarget.paddleRight.y, LERP_FACTOR);

		draw();
	}
	requestAnimationFrame(gameLoop);
}

function startCountdown(onComplete: () => void) {
	const layer = document.getElementById('menuLayer');
	const title = layer?.querySelector('h1');
	const sub = layer?.querySelector('p');

	if (!layer || !title || !sub)
		return;

	layer.style.display = 'flex';
	gameState = 'countdown';

	let count = 3;
	title.innerText = "PREPARADOS...";
	sub.innerText = count.toString();
	sub.style.fontSize = "4em";
	sub.style.fontWeight = "bold";

	const interval = setInterval(() => {
		count--;
		if (count > 0)
			sub.innerText = count.toString();
		else if (count === 0) {
			sub.innerText = "GO!";
			sub.style.color = "#FFFF00";
		} else {
			clearInterval(interval);
			layer.style.display = 'none';
			onComplete();
		}
	}, 1000);
}

export function loadGame(gameMode: 'pvp' | 'ai' = 'pvp', scoreToWin: number = 5) {
	const app = document.getElementById('root') || document.getElementById('app');

	if (!app) {
		console.error("CRITICAL: No encuentro el div 'root' ni 'app' para montar el juego.");
		return;
	}

	app.innerHTML = '';

	if (!document.getElementById('game-styles')) {
		const style = document.createElement('style');
		style.id = 'game-styles';
		style.textContent = `
            #gameContainer { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #222; display: flex; justify-content: center; align-items: center; z-index: 9999; }
            #gameCanvas { background-color: #000; border: 2px solid #fff; box-sizing: border-box; display: block; }
            .overlay-menu { position: absolute; z-index: 10; background-color: rgba(0, 0, 0, 0.9); padding: 40px; border-radius: 15px; border: 1px solid #666; width: 300px; display: flex; flex-direction: column; gap: 15px; color: white; font-family: 'Courier New', monospace; text-align: center; justify-content: center; align-items: center; }
            .overlay-menu h1 { margin: 0; text-transform: uppercase; }
            .overlay-menu button { padding: 10px 20px; font-size: 1.2em; cursor: pointer; font-family: inherit; font-weight: bold; background: #fff; border: none; color: #000; margin-top: 10px; }
            .overlay-menu button:hover { background: #ccc; }
        `;
		document.head.appendChild(style);
	}

	const menuLayer = createElement('div', 'overlay-menu', { id: 'menuLayer' }, [
		createElement('h1', '', {}, ['CONECTANDO']),
		createElement('p', '', {}, ['...'])
	]);

	const btnRestart = createElement('button', '', { id: 'restartBtn' }, ['JUGAR OTRA VEZ']);
	const endLayer = createElement('div', 'overlay-menu', { id: 'endLayer', style: 'display: none;' }, [
		createElement('h1', '', { id: 'winnerText' }, ['WINNER']),
		btnRestart
	]);

	const gameCanvas = createElement('canvas', '', { id: 'gameCanvas', width: '800', height: '600' });
	const gameContainer = createElement('div', '', { id: 'gameContainer' }, [gameCanvas, menuLayer, endLayer]);

	app.appendChild(gameContainer);

	canvas = gameCanvas as HTMLCanvasElement;
	context = canvas.getContext('2d')!;

	console.log(`Conectando: Mode=${gameMode}, Score=${scoreToWin}`);
	const socket = new WebSocket(`ws://localhost:3000/api/game/?mode=${gameMode}&score=${scoreToWin}`);

	const winnerText = document.getElementById('winnerText')!;
	const endLayerDiv = document.getElementById('endLayer')!;

	socket.onopen = () => {
		console.log("Conectado");
		startCountdown(() => {
			gameState = 'playing';
		});
	};

	socket.onmessage = (event) => {
		try {
			const msg = JSON.parse(event.data);
			if (msg.type === 'UPDATE') {
				const s = msg.state;

				const PREDICTION = 0.05;
				if (Math.abs(s.ball.speedX) > 0) {
					//serverTarget.ball.x = lerp(s.ball.x, s.ball.speedX, PREDICTION);
					//serverTarget.ball.y = lerp(s.ball.y, s.ball.speedY, PREDICTION);
					serverTarget.ball.x = s.ball.x + (s.ball.speedX * PREDICTION);
					serverTarget.ball.y = s.ball.y + (s.ball.speedY * PREDICTION);
				} else {
					serverTarget.ball.x = s.ball.x;
					serverTarget.ball.y = s.ball.y;
				}

				serverTarget.paddleLeft.y = s.paddleLeft.y;
				serverTarget.paddleRight.y = s.paddleRight.y;
				scoreLeft = s.paddleLeft.score;
				scoreRight = s.paddleRight.score;

				if (s.status === 'ended' && gameState !== 'ended') {
					gameState = 'ended';
					endLayerDiv.style.display = 'flex';
					winnerText.innerText = s.winner === 'left' ? "P1 WINS" : "P2 WINS";
					if (gameMode === 'ai' && s.winner === 'right') winnerText.innerText = "AI WINS 🤖";
				}

				if (s.status === 'playing' && gameState === 'ended') {
					endLayerDiv.style.display = 'none';
					startCountdown(() => { gameState = 'playing'; });
				}
			}
		} catch (e) { }
	};

	const keysPressed: Record<string, boolean> = {};
	const sendInput = (action: string, key: string) => {
		if (socket.readyState === WebSocket.OPEN) {
			const msg = { type: 'INPUT', action, key: '' };
			if (key === 'ArrowUp')
				msg.key = 'RIGHT_UP';
			else if (key === 'ArrowDown')
				msg.key = 'RIGHT_DOWN';
			else if (key === 'w' || key === 'W')
				msg.key = 'LEFT_UP';
			else if (key === 's' || key === 'S')
				msg.key = 'LEFT_DOWN';
			if (msg.key)
				socket.send(JSON.stringify(msg));
		}
	};

	document.addEventListener('keydown', (e) => {
		if (["ArrowUp", "ArrowDown", " "].includes(e.key))
			e.preventDefault();
		if (keysPressed[e.key])
			return;
		keysPressed[e.key] = true;
		sendInput('PRESS', e.key);
	});

	document.addEventListener('keyup', (e) => {
		keysPressed[e.key] = false;
		sendInput('RELEASE', e.key);
	});

	btnRestart.addEventListener('click', () => {
		if (socket.readyState === WebSocket.OPEN)
			socket.send(JSON.stringify({ type: 'RESTART' }));
	});

	gameLoop();
}