import { useEffect, useRef, memo } from 'react';
import { Box } from '@mui/material';

interface Props {
	isActive: boolean;
}

const SnakePanel = ({ isActive }: Props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animationFrameId: number;
		let lastTime = 0;

		const FPS = 12;
		const interval = 1000 / FPS;
		const gridSize = 20;

		let snake = [{ x: 10, y: 15 }, { x: 9, y: 15 }, { x: 8, y: 15 }];
		let food = { x: 25, y: 15 };
		let dx = 1; let dy = 0;

		const spawnFood = (cols: number, rows: number) => {
			food = {
				x: Math.floor(Math.random() * cols),
				y: Math.floor(Math.random() * rows)
			};
		};

		const resizeObserver = new ResizeObserver((entries) => {
			for (let entry of entries) {
				canvas.width = entry.contentRect.width;
				canvas.height = entry.contentRect.height;
				const cols = Math.floor(canvas.width / gridSize);
				const rows = Math.floor(canvas.height / gridSize);
				if (food.x >= cols || food.y >= rows) spawnFood(cols, rows);
			}
		});
		if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

		const gameLoop = (time: number) => {
			animationFrameId = requestAnimationFrame(gameLoop);
			if (!isActive || canvas.width === 0) return;

			const deltaTime = time - lastTime;
			if (deltaTime < interval) return;
			lastTime = time - (deltaTime % interval);

			const cols = Math.floor(canvas.width / gridSize);
			const rows = Math.floor(canvas.height / gridSize);

			const head = snake[0];
			if (head.x < food.x && dx === 0) { dx = 1; dy = 0; }
			else if (head.x > food.x && dx === 0) { dx = -1; dy = 0; }
			else if (head.y < food.y && dy === 0) { dx = 0; dy = 1; }
			else if (head.y > food.y && dy === 0) { dx = 0; dy = -1; }

			let newHead = { x: head.x + dx, y: head.y + dy };

			if (newHead.x >= cols) newHead.x = 0;
			if (newHead.x < 0) newHead.x = cols - 1;
			if (newHead.y >= rows) newHead.y = 0;
			if (newHead.y < 0) newHead.y = rows - 1;

			snake.unshift(newHead);

			if (newHead.x === food.x && newHead.y === food.y) {
				spawnFood(cols, rows);
			} else {
				snake.pop();
			}

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			ctx.fillStyle = '#00ff66';
			ctx.shadowBlur = 15;
			ctx.shadowColor = '#00ff66';
			ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);

			snake.forEach((segment, index) => {
				const isHead = index === 0;
				ctx.fillStyle = isHead ? '#ffffff' : '#00ff66';
				ctx.shadowBlur = isHead ? 15 : 5;
				ctx.shadowColor = isHead ? '#ffffff' : '#00ff66';
				ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
			});
			ctx.shadowBlur = 0;
		};

		animationFrameId = requestAnimationFrame(gameLoop);

		return () => {
			cancelAnimationFrame(animationFrameId);
			resizeObserver.disconnect();
		};
	}, [isActive]);

	return (
		<Box sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
			<canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
		</Box>
	);
};

export default memo(SnakePanel);