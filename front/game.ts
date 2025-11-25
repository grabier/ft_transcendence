// Create square
const square = {
	x: 10,
	y: 10,
	width: 18,
	height: 18,
	speedX: 0,
	speedY: 0
};

const Velocity = 400;//ball initial velocity
let gameState = 'menu';
let winningScore = 5;
const MaxAngle = 60;//angle when u hit the ball whit the border of the paddle

// Variables for canvas and context
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;

// Create paddles
const paddleLeft = {
	x: 1,
	y: 50,
	width: 10,
	height: 70,
	speed: 600
};

const paddleRight = {
	x: 800 - 10,
	y: 50,
	width: 10,
	height: 70,
	speed: 600
};

let scoreRight = 0;
let scoreLeft = 0;

const keysPressed: { [key: string]: boolean } = {};

// To draw the current state
function draw() {
	// Repaint everything black
	context.fillStyle = 'black';
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = 'white';
	context.font = '50px Arial';
	context.textAlign = 'center';

	// Left score
	context.fillText(scoreLeft.toString(), canvas.width / 4, 100);

	// Right score
	context.fillText(scoreRight.toString(), (canvas.width / 4) * 3, 100);

	// Middle line
	context.fillRect((canvas.width / 2) - 2, 0, 4, canvas.height);

	// Ball
	context.fillStyle = 'green';
	context.fillRect(square.x, square.y, square.width, square.height);

	// Left paddle
	context.fillStyle = 'red';
	context.fillRect(paddleLeft.x, paddleLeft.y, paddleLeft.width, paddleLeft.height);

	// Right paddle
	context.fillStyle = 'blue';
	context.fillRect(paddleRight.x, paddleRight.y, paddleRight.width, paddleRight.height);
}

function getRandomAngle(): number {
	return ((Math.random() * 90) - 45) * Math.PI / 180;
}

function resetBall() {
	square.x = canvas.width / 2;
	square.y = canvas.height / 2;
	
	let sign = Math.random() > 0.5 ? 1 : -1;
	let angle = getRandomAngle();
	
	square.speedX = sign * Velocity * Math.cos(angle);
	square.speedY = Velocity * Math.sin(angle);
}

function update(dt: number) {
	// Move the square
	square.x += square.speedX * dt;
	square.y += square.speedY * dt;

	// Paddle movement
	if (keysPressed['w'])
		paddleLeft.y -= paddleLeft.speed * dt;
	if (keysPressed['s'])
		paddleLeft.y += paddleLeft.speed * dt;
	if (keysPressed['ArrowUp'])
		paddleRight.y -= paddleRight.speed * dt;
	if (keysPressed['ArrowDown'])
		paddleRight.y += paddleRight.speed * dt;

	// Paddle constraints (stay inside canvas)
	if (paddleLeft.y < 0)
		paddleLeft.y = 0;
	if (paddleLeft.y + paddleLeft.height > canvas.height)
		paddleLeft.y = canvas.height - paddleLeft.height;
	if (paddleRight.y < 0)
		paddleRight.y = 0;
	if (paddleRight.y + paddleRight.height > canvas.height)
		paddleRight.y = canvas.height - paddleRight.height;


	//COLISSIONS
	//right paddle
	if (square.speedX > 0 &&
		square.x + square.width >= paddleRight.x &&
		square.x < paddleRight.x + paddleRight.width &&
		square.y + square.height > paddleRight.y &&
		square.y < paddleRight.y + paddleRight.height) {
		let paddleCenter = paddleRight.y + paddleRight.height / 2;
		let ballCenter = square.y + square.height / 2;
		let offset = (ballCenter - paddleCenter) / (paddleRight.height / 2);

		if (offset > 1) offset = 1;
		if (offset < -1) offset = -1;

		let angle = offset * (MaxAngle * Math.PI / 180);
		let speedMult = 1;
		if (Math.abs(square.speedX) < 1000)
			speedMult = 1.5 + Math.abs(offset);
		square.speedX = -Velocity * speedMult * Math.cos(angle);
		square.speedY = Velocity * speedMult * Math.sin(angle);

		//sticky paddles
		square.x = paddleRight.x - square.width;
	}
	else if (square.x > canvas.width) {
		scoreLeft++;
		if (scoreLeft == winningScore) {
			gameState = 'ended';
			const endLayer = document.getElementById('endLayer');
			const winnerText = document.getElementById('winnerText');
			if (endLayer && winnerText) {
				endLayer.style.display = 'flex';
				winnerText.innerText = "LEFT PLAYER WINS";
			}
		}
		else
			resetBall();
	}

	//left paddle
	if (square.speedX < 0 &&
		square.x <= paddleLeft.x + paddleLeft.width &&
		square.x + square.width > paddleLeft.x &&
		square.y + square.height > paddleLeft.y &&
		square.y < paddleLeft.y + paddleLeft.height) {
		let paddleCenter = paddleLeft.y + paddleLeft.height / 2;
		let ballCenter = square.y + square.height / 2;
		let offset = (ballCenter - paddleCenter) / (paddleLeft.height / 2);

		if (offset > 1) offset = 1;
		if (offset < -1) offset = -1;

		let angle = offset * (MaxAngle * Math.PI / 180);
		let speedMult = 1;
		if (Math.abs(square.speedX) < 1000)
			speedMult = 1.5 + Math.abs(offset);

		square.speedX = Velocity * speedMult * Math.cos(angle);
		square.speedY = Velocity * speedMult * Math.sin(angle);

		//to avoid sticky paddles
		square.x = paddleLeft.x + paddleLeft.width;
	}
	else if (square.x + square.width < 0) {
		scoreRight++;
		if (scoreRight == winningScore) {
			gameState = 'ended';
			const endLayer = document.getElementById('endLayer');
			const winnerText = document.getElementById('winnerText');
			if (endLayer && winnerText) {
				endLayer.style.display = 'flex';
				winnerText.innerText = "RIGHT PLAYER WINS";
			}
		}
		else
			resetBall();
	}

	// Bottom border
	if (square.y + square.height > canvas.height) {
		square.speedY = -square.speedY;
		square.y = canvas.height - square.height;
	}

	// Top border
	if (square.y < 0) {
		square.speedY = -square.speedY;
		square.y = 0;
	}
}

let lastTime = 0;

function gameLoop(currentTime: number) {

	let dt;//changing velocity so it depends on pixels per second instead of pixels per frame
	if (lastTime == 0)
		dt = 0;
	else
		dt = (currentTime - lastTime) / 1000;
	lastTime = currentTime;
	if (gameState == 'playing')
		update(dt);
	draw();
	requestAnimationFrame(gameLoop); // Call gameloop recursively every frame. This is the loop
}

function createElement(
	tag: string,
	className: string = "",
	attributes: Record<string, string> = {},
	children: (HTMLElement | string)[] = []
): HTMLElement {
	const element = document.createElement(tag);
	if (className) element.className = className;
	Object.entries(attributes).forEach(([key, value]) => {
		element.setAttribute(key, value);
	});
	children.forEach(child => {
		if (typeof child === 'string') {
			element.appendChild(document.createTextNode(child));
		} else {
			element.appendChild(child);
		}
	});
	return element;
}

// 2. LA FUNCIÓN PRINCIPAL
export function loadGame() {
	const app = document.getElementById('app')!;
	app.innerHTML = ''; // clean login

	//css handling
	if (!document.getElementById('game-styles')) {
		const style = document.createElement('style');
		style.id = 'game-styles';
		style.textContent = `
            #gameContainer { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #222; display: flex; justify-content: center; align-items: center; z-index: 9999; }
            #gameCanvas { background-color: #000; border: 2px solid #fff; box-sizing: border-box; display: block; }
            .overlay-menu { position: absolute; z-index: 10; background-color: rgba(0, 0, 0, 0.9); padding: 40px; border-radius: 15px; border: 1px solid #666; box-shadow: 0 0 20px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 15px; color: white; font-family: 'Courier New', Courier, monospace; text-align: center; }
            .overlay-menu h1 { margin: 0 0 10px 0; text-transform: uppercase; }
            .overlay-menu button { padding: 10px 20px; font-size: 1.2em; cursor: pointer; font-family: inherit; font-weight: bold; }
            .overlay-menu input { padding: 10px; font-size: 1.2em; text-align: center; font-family: inherit; }
        `;
		document.head.appendChild(style);
	}

	// put the layers in variables to use later
	const menuLayer = createElement('div', 'overlay-menu', { id: 'menuLayer' }, [
		createElement('h1', '', {}, ['Pong Transcendence']),
		createElement('label', '', {}, ['Points to win:']),
		createElement('input', '', { type: 'number', id: 'scoreInput', value: '5', min: '1' }),
		createElement('button', '', { id: 'startBtn' }, ['START GAME'])
	]);

	const endLayer = createElement('div', 'overlay-menu', { id: 'endLayer', style: 'display: none;' }, [
		createElement('h1', '', { id: 'winnerText' }, ['WINNER']),
		createElement('button', '', { id: 'restartBtn' }, ['BACK TO MENY'])
	]);

	const pauseLayer = createElement('div', 'overlay-menu', { id: 'pauseLayer', style: 'display: none;' }, [
		createElement('h1', '', {}, ['GAME PAUSED']),
		createElement('button', '', { id: 'continueBtn' }, ['CONTINUE'])
	]);

	const gameCanvas = createElement('canvas', '', { id: 'gameCanvas', width: '800', height: '600' });

	const gameContainer = createElement('div', '', { id: 'gameContainer' }, [
		menuLayer,
		endLayer,
		pauseLayer,
		gameCanvas
	]);

	// put everything in app
	app.appendChild(gameContainer);


	// --- LÓGICA DEL JUEGO ---

	// Capturamos las referencias necesarias
	// NOTA: Como hemos creado los elementos arriba, podríamos usar las variables 'menuLayer' 
	// directamente, pero para input y canvas necesitamos castearlos o buscarlos por ID.

	canvas = gameCanvas as HTMLCanvasElement; // Usamos la variable directa
	context = canvas.getContext('2d')!;

	const startBtn = document.getElementById('startBtn')!;
	const restartBtn = document.getElementById('restartBtn')!;
	const continueBtn = document.getElementById('continueBtn')!;
	const scoreInput = document.getElementById('scoreInput') as HTMLInputElement;

	restartBtn.addEventListener('click', () => {
		endLayer.style.display = 'none';
		menuLayer.style.display = 'flex';
		gameState = 'menu';
		scoreLeft = 0;
		scoreRight = 0;
		resetBall();
		draw();
	});

	startBtn.addEventListener('click', () => {
		winningScore = parseInt(scoreInput.value);
		menuLayer.style.display = 'none';
		gameState = 'playing';
		scoreLeft = 0;
		scoreRight = 0;
		resetBall();
	});

	continueBtn.addEventListener('click', () => {
		gameState = 'playing';
		pauseLayer.style.display = 'none';
		lastTime = 0;
	});

	if (!context) {
		console.error("Couldn't get 2D context");
		return;
	}

	console.log("Game loaded, initiating game loop");

	const resizeGame = () => {
		const gameRatio = canvas.width / canvas.height;
		const container = document.getElementById('gameContainer');
		if (!container) return;

		const windowWidth = container.clientWidth;
		const windowHeight = container.clientHeight;
		const windowRatio = windowWidth / windowHeight;

		const margin = 0.95;
		if (windowRatio > gameRatio) {
			canvas.style.height = `${windowHeight * margin}px`;
			canvas.style.width = `${(windowHeight * margin) * gameRatio}px`;
		}
		else {
			canvas.style.width = `${windowWidth * margin}px`;
			canvas.style.height = `${(windowWidth * margin) / gameRatio}px`;
		}
	};

	window.addEventListener('resize', resizeGame);
	setTimeout(resizeGame, 0);

	document.addEventListener('keydown', (event) => {
		keysPressed[event.key] = true;
		if (event.key === 'Escape') {
			if (gameState === 'playing') {
				gameState = 'paused';
				pauseLayer.style.display = 'flex';
			}
			else if (gameState === 'paused') {
				gameState = 'playing';
				pauseLayer.style.display = 'none';
				lastTime = 0;
			}
		}
	});
	document.addEventListener('keyup', (event) => { keysPressed[event.key] = false; });

	lastTime = 0;
	gameLoop(0);
}