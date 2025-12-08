import { createElement } from "./tools.js";

// Create square
const square = {
	x: -10,
	y: -10,
	width: 18,
	height: 18,
	speedX: 0,
	speedY: 0
};

let gameState = 'menu';
let gameMode: 'pvp' | 'ai' = 'pvp';
let winningScore = 5;
let aiInterval : number | null = null;
let aiKeys = {up: false, down: false};

// Variables for canvas and context
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;

// Ajustes de física
const BASE_SPEED = 500;
const MAX_SPEED_LIMIT = 1200;
const MAX_BOUNCE_ANGLE = 55 * (Math.PI / 180);
const SPEED_BONUS = 0.8;

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
	context.fillStyle = 'white';
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
	square.x = (canvas.width / 2) - square.width / 2;
	square.y = (canvas.height / 2) - square.width / 2;
	square.speedX = 0;
	square.speedY = 0;

	setTimeout(() => {
		if (gameState === 'playing') {
			let sign = Math.random() > 0.5 ? 1 : -1;
			let angle = getRandomAngle();

			square.speedX = sign * BASE_SPEED * Math.cos(angle);
			square.speedY = BASE_SPEED * Math.sin(angle);
		}
	}, 1000);
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


	let moveUp = false;
	let moveDown = false;

	if (gameMode === 'pvp') {
		moveUp = keysPressed['ArrowUp'];
		moveDown = keysPressed['ArrowDown'];
	} else {
		moveUp = aiKeys.up;
		moveDown = aiKeys.down;
	}

	if (moveUp)
		paddleRight.y -= paddleRight.speed * dt;
	if (moveDown)
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

		let angle = offset * MAX_BOUNCE_ANGLE;

		let newSpeed = BASE_SPEED * (1 + Math.abs(offset) * SPEED_BONUS);

		newSpeed = Math.min(newSpeed, MAX_SPEED_LIMIT);

		square.speedX = -newSpeed * Math.cos(angle);
		square.speedY = newSpeed * Math.sin(angle);

		//sticky paddles
		square.x = paddleRight.x - square.width;
	}
	else if (square.x > canvas.width) {
		scoreLeft++;
		if (scoreLeft == winningScore) {
			gameState = 'ended';
			stopAiLogic();
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

		let angle = offset * MAX_BOUNCE_ANGLE;
		let newSpeed = BASE_SPEED * (1 + Math.abs(offset) * SPEED_BONUS);

		newSpeed = Math.min(newSpeed, MAX_SPEED_LIMIT);

		square.speedX = newSpeed * Math.cos(angle);
		square.speedY = newSpeed * Math.sin(angle);

		//to avoid sticky paddles
		square.x = paddleLeft.x + paddleLeft.width;
	}
	else if (square.x + square.width < 0) {
		scoreRight++;
		if (scoreRight == winningScore) {
			gameState = 'ended';
			stopAiLogic();
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


//ai algo : trivial now but will improve it eventually, right now the ai follows the 
//y coordinate of the ball, and it only works if the interval is small(1000 ms makes for a stupid ai)
function startAiLogic() {
	if (aiInterval) clearInterval(aiInterval);

	aiInterval = window.setInterval(() => {
		if (gameState !== 'playing') return;

		const targetY = square.y;
		const paddleCenter = paddleRight.y + paddleRight.height / 2;

		const distance = Math.abs(targetY - paddleCenter);

		const timeNeededMs = (distance / paddleRight.speed) * 1000;

		aiKeys.up = false;
		aiKeys.down = false;

		const tolerance = 5;

		//we only move if distance > tolerance, otherwise the paddle would never keep stil
		if (distance > tolerance) {
			if (targetY < paddleCenter) {
				aiKeys.up = true;
				setTimeout(() => { aiKeys.up = false; }, timeNeededMs);
				//we use setTimeout to make the paddle able to stop mid movement, otherwise it 
				//would keep moving even if past the destined position
			} else {
				aiKeys.down = true;
				setTimeout(() => { aiKeys.down = false; }, timeNeededMs);
			}
		}

	}, 300);
}

function stopAiLogic() {
	if (aiInterval) {
		clearInterval(aiInterval);
		aiInterval = null;
	}
	aiKeys = { up: false, down: false };
}


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
		createElement('div', '', { style: 'display: flex; gap: 20px; justify-content: center;' }, [
			createElement('button', '', { id: 'btnPvp' }, ['VS PLAYER']),
			createElement('button', '', { id: 'btnAi' }, ['VS AI'])
		])
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


	canvas = gameCanvas as HTMLCanvasElement; 
	context = canvas.getContext('2d')!;

	const btnPvp = document.getElementById('btnPvp')!;
	const btnAi = document.getElementById('btnAi')!;
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

	const startGame = (mode: 'pvp' | 'ai') => {
		winningScore = parseInt(scoreInput.value);
		menuLayer.style.display = 'none';
		gameState = 'playing';
		gameMode = mode;
		scoreLeft = 0;
		scoreRight = 0;
		resetBall();

		if (mode === 'ai') {
			startAiLogic();
		}
	};

	btnPvp.addEventListener('click', () => startGame('pvp'));
	btnAi.addEventListener('click', () => startGame('ai'));

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