/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   game.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: gmontoro <gmontoro@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/17 18:17:35 by gmontoro          #+#    #+#             */
/*   Updated: 2025/11/20 18:50:38 by gmontoro         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Create square
const square = {
	x: 10,
	y: 10,
	width: 30,
	height: 30,
	speedX: 250,
	speedY: 250
};

let gameState = 'menu';
let winningScore = 5;

// Variables for canvas and context
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;

// Create paddles
const paddleLeft = {
	x: 1,
	y: 50,
	width: 10,
	height: 70,
	speed: 700
};

const paddleRight = {
	x: 800 - 10,
	y: 50,
	width: 10,
	height: 70,
	speed: 700
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


// This function calculates the NEW position
function update(dt: number) {
	// Move the square
	square.x += square.speedX * dt;
	square.y += square.speedY * dt;

	// Paddle movement: w/s for left, arrowup/down for right
	if (keysPressed['w']) {
		paddleLeft.y -= paddleLeft.speed * dt;
	}

	if (keysPressed['s']) {
		paddleLeft.y += paddleLeft.speed * dt;
	}

	if (keysPressed['ArrowUp']) {
		paddleRight.y -= paddleRight.speed * dt;
	}

	if (keysPressed['ArrowDown']) {
		paddleRight.y += paddleRight.speed * dt;
	}

	// Handle what happens when the paddle hits a border
	if (paddleLeft.y < 0) {
		paddleLeft.y = 0;
	}
	if (paddleLeft.y + paddleLeft.height > canvas.height) {
		paddleLeft.y = canvas.height - paddleLeft.height;
	}

	if (paddleRight.y < 0) {
		paddleRight.y = 0;
	}
	if (paddleRight.y + paddleRight.height > canvas.height) {
		paddleRight.y = canvas.height - paddleRight.height;
	}

	// COLLISIONS WITH PADDLES AND TOP/BOTTOM BORDERS
	// Right paddle
	if (square.x + square.width >= paddleRight.x) {
		if ((square.y > paddleRight.y && square.y + square.height < paddleRight.y + paddleRight.height) ||
			(square.y < paddleRight.y && square.y + square.height > paddleRight.y) ||
			(square.y > paddleRight.y && square.y < paddleRight.y + paddleRight.height)) {
			if (Math.abs(square.speedX) < 500)
				square.speedX = -square.speedX - 30;
			else
				square.speedX = -square.speedX;
			square.x = paddleRight.x - square.width; // To avoid sticky paddles
		}
		else {
			square.x = canvas.width / 2;
			square.y = canvas.height / 2;
			square.speedX = -250;
			square.speedY = -250;
			scoreLeft++;
			if (scoreLeft == winningScore){
				gameState = 'ended';
				const endLayer = document.getElementById('endLayer');
				const winnerText = document.getElementById('winnerText');
				// 2. Si existen, mostramos la capa y cambiamos el texto
				if (endLayer && winnerText) {
					endLayer.style.display = 'flex'; // Lo hacemos visible
					winnerText.innerText = "¡GANA EL JUGADOR IZQUIERDO!";
				}
			}
		}
	}

	// Left paddle
	if (square.x < paddleLeft.x + paddleLeft.width) {
		if ((square.y > paddleLeft.y && square.y + square.height < paddleLeft.y + paddleLeft.height) ||
			(square.y < paddleLeft.y && square.y + square.height > paddleLeft.y) ||
			(square.y > paddleLeft.y && square.y < paddleLeft.y + paddleLeft.height)) {
			if (Math.abs(square.speedX) < 500)
				square.speedX = -square.speedX + 30;
			else
				square.speedX = -square.speedX;
			square.x = paddleLeft.x + paddleLeft.width; // To avoid sticky paddles
		}
		else {
			square.x = canvas.width / 2;
			square.y = canvas.height / 2;
			square.speedX = 250;
			square.speedY = 250;
			scoreRight++;
			if (scoreRight == winningScore){
				gameState = 'ended';
				const endLayer = document.getElementById('endLayer');
				const winnerText = document.getElementById('winnerText');
				// 2. Si existen, mostramos la capa y cambiamos el texto
				if (endLayer && winnerText) {
					endLayer.style.display = 'flex'; // Lo hacemos visible
					winnerText.innerText = "¡GANA EL JUGADOR DERECHO!";
				}
			}
		}
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


export function loadGame() {
	const app = document.getElementById('app')!;

	// USAMOS POSITION FIXED PARA IGNORAR MARGENES DEL TEMA
	app.innerHTML = `
        <style>
            /* Estilo del contenedor principal (Fondo gris) */
            #gameContainer {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: #222;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }

            /* Estilo del Canvas (El juego) */
            #gameCanvas {
                background-color: #000;
                border: 2px solid #fff;
                box-sizing: border-box;
                display: block;
            }

            /* CLASE COMPARTIDA: Estilo para TODAS las ventanas flotantes (Menú, Fin, Pausa) */
            .overlay-menu {
                position: absolute;
                z-index: 10;
                background-color: rgba(0, 0, 0, 0.9); /* Un poco más oscuro para mejor contraste */
                padding: 40px;
                border-radius: 15px;
                border: 1px solid #666;
                box-shadow: 0 0 20px rgba(0,0,0,0.5); /* Sombra chula */
                
                /* Flexbox para ordenar verticalmente */
                display: flex;
                flex-direction: column;
                gap: 15px;
                
                /* Tipografía */
                color: white;
                font-family: 'Courier New', Courier, monospace; /* Fuente más "retro" */
                text-align: center;
            }

            /* Estilos para los inputs y botones dentro de los menús */
            .overlay-menu h1 { margin: 0 0 10px 0; text-transform: uppercase; }
            .overlay-menu button { padding: 10px 20px; font-size: 1.2em; cursor: pointer; font-family: inherit; font-weight: bold; }
            .overlay-menu input { padding: 10px; font-size: 1.2em; text-align: center; font-family: inherit; }
        </style>

        <div id="gameContainer">
            
            <div id="menuLayer" class="overlay-menu">
                <h1>Pong Transcendence</h1>
                <label>Puntos para ganar:</label>
                <input type="number" id="scoreInput" value="5" min="1">
                <button id="startBtn">EMPEZAR PARTIDA</button>
            </div>

            <div id="endLayer" class="overlay-menu" style="display: none;">
                <h1 id="winnerText">GANADOR</h1>
                <button id="restartBtn">VOLVER AL MENÚ</button>
            </div>

            <div id="pauseLayer" class="overlay-menu" style="display: none;">
                <h1>JUEGO PAUSADO</h1>
                <button id="continueBtn">CONTINUAR</button>
            </div>

            <canvas id="gameCanvas" width="800" height="600"></canvas>
        </div>
    `;

	canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
	context = canvas.getContext('2d')!;
	const startBtn = document.getElementById('startBtn')!;
	const scoreInput = document.getElementById('scoreInput') as HTMLInputElement;
	const menuLayer = document.getElementById('menuLayer')!;
	const restartBtn = document.getElementById('restartBtn')!;
	const endLayer = document.getElementById('endLayer')!;
	const pauseLayer = document.getElementById('pauseLayer')!;
	const continueBtn = document.getElementById('continueBtn')!;
	

	restartBtn.addEventListener('click', () => {
		// 1. Ocultamos la pantalla de victoria
		endLayer.style.display = 'none';

		// 2. Mostramos el menú principal otra vez
		menuLayer.style.display = 'flex';

		// 3. Cambia el estado para que el juego no arranque solo
		gameState = 'menu';

		// 4. Reseteamos variables por si acaso
		scoreLeft = 0;
		scoreRight = 0;
		square.x = canvas.width / 2; // Centramos pelota visualmente
		square.y = canvas.height / 2;

		// 5. (Opcional) Hacemos un draw() rápido para borrar la pantalla de juego vieja
		draw();
	});
	
	startBtn.addEventListener('click', () => {
		winningScore = parseInt(scoreInput.value);
		menuLayer.style.display = 'none';
		gameState = 'playing';
		square.x = canvas.width / 2;
		square.y = canvas.height / 2;
		scoreLeft = 0;
		scoreRight = 0;
	})

	continueBtn.addEventListener('click', () => {
		// Misma lógica que despausar con ESC
		gameState = 'playing';
		pauseLayer.style.display = 'none';
		lastTime = 0;
	});

	if (!context) {
		console.error("No se pudo obtener el contexto 2D");
		return;
	}

	console.log("¡El juego ha cargado! Iniciando game loop...");

	const resizeGame = () => {
		const gameRatio = canvas.width / canvas.height; // 1.333

		// Usamos clientWidth/Height del contenedor, que es más fiable que window.inner
		const container = document.getElementById('gameContainer');
		if (!container) return;

		const windowWidth = container.clientWidth;
		const windowHeight = container.clientHeight;
		const windowRatio = windowWidth / windowHeight;

		// Margen de seguridad del 5% para que no toque los bordes (estilo retro)
		const margin = 0.95;

		if (windowRatio > gameRatio) {
			// Pantalla ancha: limitamos por altura
			canvas.style.height = `${windowHeight * margin}px`;
			canvas.style.width = `${(windowHeight * margin) * gameRatio}px`;
		}
		else {
			// Pantalla alta: limitamos por ancho
			canvas.style.width = `${windowWidth * margin}px`;
			canvas.style.height = `${(windowWidth * margin) / gameRatio}px`;
		}
	};

	window.addEventListener('resize', resizeGame);
	// Timeout pequeño para asegurar que el DOM ha pintado el fixed antes de medir
	setTimeout(resizeGame, 0);

	// --- EVENT LISTENERS ---
	document.addEventListener('keydown', (event) => {
		 keysPressed[event.key] = true;
		 if (event.key === 'Escape') {
			// CASO A: Estás jugando -> PAUSAS
			if (gameState === 'playing') {
				gameState = 'paused';
				pauseLayer.style.display = 'flex'; // Muestras el menú
			} 
			// CASO B: Estás pausado -> CONTINUAS
			else if (gameState === 'paused') {
				gameState = 'playing';
				pauseLayer.style.display = 'none'; // Ocultas el menú
				// IMPORTANTE: Resetear lastTime para evitar saltos de tiempo (dt gigante)
				lastTime = 0; 
			}
		}
	});
	document.addEventListener('keyup', (event) => { keysPressed[event.key] = false; });

	// Resetear lastTime para evitar saltos si recargas
	lastTime = 0;
	gameLoop(0);
}