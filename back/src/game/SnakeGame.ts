interface Point { x: number; y: number }

export class SnakeGame {
	public state: any;
	public gameMode: 'pvp' | 'ai' | 'local' = 'pvp';
	public winningScore: number = 10;

	public inputs = {
		left: { direction: { x: 1, y: 0 }, nextDirection: { x: 1, y: 0 } },
		right: { direction: { x: -1, y: 0 }, nextDirection: { x: -1, y: 0 } }
	};

	private grid = { width: 40, height: 30 }; 
	private startTimeout: ReturnType<typeof setTimeout> | null = null; 

	constructor() {
		this.resetState();
	}

	private resetState() {
		this.state = {
			status: 'playing',
			winner: null,
			pausedBy: null,
			pauses: { left: 1, right: 1 },
			snakeLeft: {
				body: [{ x: 5, y: 15 }, { x: 4, y: 15 }, { x: 3, y: 15 }],
				score: 0,
				color: '#00ff66'
			},
			snakeRight: {
				body: [{ x: 34, y: 15 }, { x: 35, y: 15 }, { x: 36, y: 15 }],
				score: 0,
				color: '#ff0066'
			},
			food: this.generateFood([{ x: 5, y: 15 }, { x: 34, y: 15 }]) 
		};
		this.inputs.left = { direction: { x: 1, y: 0 }, nextDirection: { x: 1, y: 0 } };
		this.inputs.right = { direction: { x: -1, y: 0 }, nextDirection: { x: -1, y: 0 } };
	}

	public startGame(mode: 'pvp' | 'ai' | 'local', scoreToWin: number) {
		this.gameMode = mode;
		this.winningScore = scoreToWin;
		this.resetState();

		this.state.status = 'countdown';
		if (this.startTimeout) clearTimeout(this.startTimeout);
		
		this.startTimeout = setTimeout(() => {
			if (this.state.status === 'countdown') {
				this.state.status = 'playing';
			}
		}, 3600);
	}

	public pauseGame() {
		if (this.state.status === 'playing') this.state.status = 'paused';
	}

	public resumeGame() {
		if (this.state.status === 'paused') this.state.status = 'playing';
	}

	public stopGame(winner?: 'left' | 'right') {
		this.state.status = 'ended';
		if (winner) this.state.winner = winner;
		if (this.startTimeout) clearTimeout(this.startTimeout);
	}

	public handleInput(key: string, action: string) {
		if (action !== 'PRESS') return;

		const updateDirection = (side: 'left' | 'right', newDir: Point) => {
			const currentDir = this.inputs[side].direction;
			if (currentDir.x !== -newDir.x || currentDir.y !== -newDir.y) {
				this.inputs[side].nextDirection = newDir;
			}
		};

		if (key === 'LEFT_UP' || key === 'L_UP') updateDirection('left', { x: 0, y: -1 });
		if (key === 'LEFT_DOWN' || key === 'L_DOWN') updateDirection('left', { x: 0, y: 1 });
		if (key === 'LEFT_LEFT' || key === 'L_LEFT') updateDirection('left', { x: -1, y: 0 });
		if (key === 'LEFT_RIGHT' || key === 'L_RIGHT') updateDirection('left', { x: 1, y: 0 });

		if (key === 'RIGHT_UP' || key === 'R_UP') updateDirection('right', { x: 0, y: -1 });
		if (key === 'RIGHT_DOWN' || key === 'R_DOWN') updateDirection('right', { x: 0, y: 1 });
		if (key === 'RIGHT_LEFT' || key === 'R_LEFT') updateDirection('right', { x: -1, y: 0 });
		if (key === 'RIGHT_RIGHT' || key === 'R_RIGHT') updateDirection('right', { x: 1, y: 0 });
	}

	public update() {
		if (this.state.status !== 'playing') return;

		if (this.gameMode === 'ai') this.runAI();

		this.inputs.left.direction = { ...this.inputs.left.nextDirection };
		this.inputs.right.direction = { ...this.inputs.right.nextDirection };

		this.moveSnake('left');
		this.moveSnake('right');

		this.checkCollisions();
	}

	private moveSnake(side: 'left' | 'right') {
		const snake = side === 'left' ? this.state.snakeLeft : this.state.snakeRight;
		const dir = this.inputs[side].direction;
		const head = { ...snake.body[0] };

		head.x += dir.x;
		head.y += dir.y;

		snake.body.unshift(head);

		if (head.x === this.state.food.x && head.y === this.state.food.y) {
			snake.score++;
			if (snake.score >= this.winningScore) {
				this.stopGame(side);
				return;
			}
			this.state.food = this.generateFood([...this.state.snakeLeft.body, ...this.state.snakeRight.body]);
		} else {
			snake.body.pop();
		}
	}

	private checkCollisions() {
		const checkCrash = (head: Point, ownBody: Point[], enemyBody: Point[]) => {

			if (head.x < 0 || head.x >= this.grid.width || head.y < 0 || head.y >= this.grid.height) return true;

			for (let i = 1; i < ownBody.length; i++) {
				if (head.x === ownBody[i].x && head.y === ownBody[i].y) return true;
			}

			for (let segment of enemyBody) {
				if (head.x === segment.x && head.y === segment.y) return true;
			}
			return false;
		};

		const leftCrashed = checkCrash(this.state.snakeLeft.body[0], this.state.snakeLeft.body, this.state.snakeRight.body);
		const rightCrashed = checkCrash(this.state.snakeRight.body[0], this.state.snakeRight.body, this.state.snakeLeft.body);

		if (leftCrashed && rightCrashed) this.stopGame('left'); 
		else if (leftCrashed) this.stopGame('right');
		else if (rightCrashed) this.stopGame('left');
	}

	private generateFood(occupiedPositions: Point[]): Point {
		let newFood: Point;
		let isOccupied = true;
		while (isOccupied) {
			newFood = {
				x: Math.floor(Math.random() * this.grid.width),
				y: Math.floor(Math.random() * this.grid.height)
			};
			isOccupied = occupiedPositions.some(p => p.x === newFood.x && p.y === newFood.y);
		}
		return newFood!;
	}

	private isSafeMove(head: Point, ownBody: Point[], enemyBody: Point[]): boolean {
		if (head.x < 0 || head.x >= this.grid.width || head.y < 0 || head.y >= this.grid.height) return false;

		for (let i = 0; i < ownBody.length - 1; i++) {
			if (head.x === ownBody[i].x && head.y === ownBody[i].y) return false;
		}

		for (let segment of enemyBody) {
			if (head.x === segment.x && head.y === segment.y) return false;
		}

		return true;
	}

	private runAI() {
		const head = this.state.snakeRight.body[0];
		const food = this.state.food;
		const currentDir = this.inputs.right.direction;

		const possibleMoves = [
			{ dir: { x: 0, y: -1 } },
			{ dir: { x: 0, y: 1 } },
			{ dir: { x: -1, y: 0 } },
			{ dir: { x: 1, y: 0 } }
		];

		let bestMove = currentDir;
		let minDistance = Infinity;
		let foundSafeMove = false;

		for (const move of possibleMoves) {
			if (currentDir.x === -move.dir.x && currentDir.y === -move.dir.y) continue;

			const nextHead = { x: head.x + move.dir.x, y: head.y + move.dir.y };

			if (!this.isSafeMove(nextHead, this.state.snakeRight.body, this.state.snakeLeft.body)) continue;

			const dist = Math.abs(nextHead.x - food.x) + Math.abs(nextHead.y - food.y);

			if (dist < minDistance) {
				minDistance = dist;
				bestMove = move.dir;
				foundSafeMove = true;
			}
		}

		if (foundSafeMove) {
			this.inputs.right.nextDirection = bestMove;
		} else {
			for (const move of possibleMoves) {
				if (currentDir.x === -move.dir.x && currentDir.y === -move.dir.y) continue;
				const nextHead = { x: head.x + move.dir.x, y: head.y + move.dir.y };
				if (this.isSafeMove(nextHead, this.state.snakeRight.body, this.state.snakeLeft.body)) {
					this.inputs.right.nextDirection = move.dir;
					break;
				}
			}
		}
	}
}