const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 70;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 18;
const BASE_SPEED = 400;
const MAX_SPEED_LIMIT = 1000;
const MAX_BOUNCE_ANGLE = 55 * (Math.PI / 180);

export interface GameState {
	ball: { x: number; y: number; width: number; height: number; speedX: number; speedY: number; };
	paddleLeft: { x: number; y: number; width: number; height: number; score: number; speed: number; };
	paddleRight: { x: number; y: number; width: number; height: number; score: number; speed: number; };
	status: 'menu' | 'playing' | 'ended';
	winner: 'left' | 'right' | null;
}

export class PongGame {
	public state: GameState;
	private lastTime: number;
	private gameInterval: ReturnType<typeof setInterval> | null = null;

	private ballTimeout: ReturnType<typeof setTimeout> | null = null;

	public gameMode: 'pvp' | 'ai' = 'pvp';
	public winningScore: number = 5;

	public inputs = {
		left: { up: false, down: false },
		right: { up: false, down: false }
	};

	constructor() {
		this.state = this.getInitialState();
		this.lastTime = Date.now();
	}

	public handleInput(key: string, action: string) {
		const isPressed = action === 'PRESS';
		switch (key) {
			case 'LEFT_UP': this.inputs.left.up = isPressed; break;
			case 'LEFT_DOWN': this.inputs.left.down = isPressed; break;
			case 'RIGHT_UP': this.inputs.right.up = isPressed; break;
			case 'RIGHT_DOWN': this.inputs.right.down = isPressed; break;
		}
	}

	public updateAi() {
		const paddleCenter = this.state.paddleRight.y + this.state.paddleRight.height / 2;
		const ballCenter = this.state.ball.y + this.state.ball.height / 2;
		const deadZone = 10;

		this.inputs.right.up = false;
		this.inputs.right.down = false;

		if (ballCenter < paddleCenter - deadZone)
			this.inputs.right.up = true;
		else if (ballCenter > paddleCenter + deadZone)
			this.inputs.right.down = true;
	}

	public startGame(mode: 'pvp' | 'ai' = 'pvp', scoreToWin: number = 5) {
		console.log(`🏁 START GAME -> Modo: ${mode}, WinScore: ${scoreToWin}`);

		this.state.paddleLeft.score = 0;
		this.state.paddleRight.score = 0;
		this.state.winner = null;
		this.state.status = 'playing';

		if (this.gameInterval)
			clearInterval(this.gameInterval);

		this.gameMode = mode;
		this.winningScore = scoreToWin;

		this.inputs = { left: { up: false, down: false }, right: { up: false, down: false } };

		this.lastTime = Date.now();

		this.resetBall(3200);

		this.gameInterval = setInterval(() => {
			if (this.gameMode === 'ai')
				this.updateAi();
			this.update();
		}, 1000 / 60);
	}

	private resetBall(delay: number = 500) {
		if (this.ballTimeout) {
			clearTimeout(this.ballTimeout);
			this.ballTimeout = null;
		}

		this.state.ball.x = CANVAS_WIDTH / 2 - BALL_SIZE / 2;
		this.state.ball.y = CANVAS_HEIGHT / 2 - BALL_SIZE / 2;
		this.state.ball.speedX = 0;
		this.state.ball.speedY = 0;

		this.ballTimeout = setTimeout(() => {
			if (this.state.status === 'playing') {
				const angle = ((Math.random() * 90) - 45) * Math.PI / 180;
				const sign = Math.random() > 0.5 ? 1 : -1;
				this.state.ball.speedX = sign * BASE_SPEED * Math.cos(angle);
				this.state.ball.speedY = BASE_SPEED * Math.sin(angle);
			}
		}, delay);
	}

	public update() {
		const now = Date.now();
		const dt = (now - this.lastTime) / 1000;
		this.lastTime = now;

		if (this.state.status !== 'playing')
			return;

		// Movimiento Palas
		if (this.inputs.left.up)
			this.state.paddleLeft.y -= this.state.paddleLeft.speed * dt;
		if (this.inputs.left.down)
			this.state.paddleLeft.y += this.state.paddleLeft.speed * dt;
		if (this.inputs.right.up)
			this.state.paddleRight.y -= this.state.paddleRight.speed * dt;
		if (this.inputs.right.down)
			this.state.paddleRight.y += this.state.paddleRight.speed * dt;

		// Clamp (Límites)
		const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
		this.state.paddleLeft.y = clamp(this.state.paddleLeft.y, 0, CANVAS_HEIGHT - PADDLE_HEIGHT);
		this.state.paddleRight.y = clamp(this.state.paddleRight.y, 0, CANVAS_HEIGHT - PADDLE_HEIGHT);

		// Movimiento Bola
		this.state.ball.x += this.state.ball.speedX * dt;
		this.state.ball.y += this.state.ball.speedY * dt;

		// Rebotes Verticales
		if (this.state.ball.y < 0) {
			this.state.ball.y = 0;
			this.state.ball.speedY *= -1;
		}
		else if (this.state.ball.y + this.state.ball.height > CANVAS_HEIGHT) {
			this.state.ball.y = CANVAS_HEIGHT - this.state.ball.height;
			this.state.ball.speedY *= -1;
		}

		// Colisiones Palas
		if (this.state.ball.speedX > 0 && this.checkCollision(this.state.paddleRight))
			this.handlePaddleHit(this.state.paddleRight, -1);
		else if (this.state.ball.speedX < 0 && this.checkCollision(this.state.paddleLeft))
			this.handlePaddleHit(this.state.paddleLeft, 1);

		// Goles
		if (this.state.ball.x > CANVAS_WIDTH) {
			this.state.paddleLeft.score++;
			if (this.state.paddleLeft.score >= this.winningScore)
				this.stopGame('left');
			else
				this.resetBall(500);
		} else if (this.state.ball.x + this.state.ball.width < 0) {
			this.state.paddleRight.score++;
			if (this.state.paddleRight.score >= this.winningScore)
				this.stopGame('right');
			else
				this.resetBall(500);
		}
	}

	private checkCollision(paddle: any): boolean {
		return (
			this.state.ball.x < paddle.x + paddle.width &&
			this.state.ball.x + this.state.ball.width > paddle.x &&
			this.state.ball.y < paddle.y + paddle.height &&
			this.state.ball.y + this.state.ball.height > paddle.y
		);
	}

	private handlePaddleHit(paddle: any, direction: number) {
		let paddleCenter = paddle.y + paddle.height / 2;
		let ballCenter = this.state.ball.y + this.state.ball.height / 2;
		let offset = (ballCenter - paddleCenter) / (paddle.height / 2);
		if (offset > 1)
			offset = 1;
		else if (offset < -1)
			offset = -1;

		let angle = offset * MAX_BOUNCE_ANGLE;
		let currentSpeed = Math.sqrt(this.state.ball.speedX ** 2 + this.state.ball.speedY ** 2);
		let newSpeed = Math.min(Math.max(currentSpeed * 1.1, BASE_SPEED), MAX_SPEED_LIMIT);

		this.state.ball.speedX = direction * newSpeed * Math.cos(angle);
		this.state.ball.speedY = newSpeed * Math.sin(angle);

		// Evitar sticky paddle
		if (direction === 1)
			this.state.ball.x = paddle.x + paddle.width + 1;
		else
			this.state.ball.x = paddle.x - this.state.ball.width - 1;
	}

	public stopGame(winner?: 'left' | 'right') {
		if (this.gameInterval) {
			clearInterval(this.gameInterval);
			this.gameInterval = null;
		}
		if (this.ballTimeout)
			clearTimeout(this.ballTimeout);
		this.state.status = 'ended';
		if (winner)
			this.state.winner = winner;
	}

	private getInitialState(): GameState {
		return {
			ball: { x: CANVAS_WIDTH / 2 - BALL_SIZE / 2, y: CANVAS_HEIGHT / 2 - BALL_SIZE / 2, width: BALL_SIZE, height: BALL_SIZE, speedX: 0, speedY: 0 },
			paddleLeft: { x: 10, y: (CANVAS_HEIGHT / 2) - (PADDLE_HEIGHT / 2), width: PADDLE_WIDTH, height: PADDLE_HEIGHT, score: 0, speed: 600 },
			paddleRight: { x: CANVAS_WIDTH - PADDLE_WIDTH - 10, y: (CANVAS_HEIGHT / 2) - (PADDLE_HEIGHT / 2), width: PADDLE_WIDTH, height: PADDLE_HEIGHT, score: 0, speed: 600 },
			status: 'menu',
			winner: null
		};
	}
}