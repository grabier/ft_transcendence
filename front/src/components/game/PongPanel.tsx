import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface SceneProps {
	isActive: boolean;
}

export const PongPanel: React.FC<SceneProps> = React.memo(({ isActive }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animationFrameId: number;

		const width = 800;
		const height = 600;

		const paddleWidth = 15;
		const paddleHeight = 100;
		const ballSize = 15;

		const paddleL = { x: 40, y: height / 2 - paddleHeight / 2, speed: 6 };
		const paddleR = { x: width - 40 - paddleWidth, y: height / 2 - paddleHeight / 2, speed: 6 };

		let ball = {
			x: width / 2,
			y: height / 2,
			vx: 7,
			vy: 5,
			speedMultiplier: 1.05
		};
		let initialized = false;

		const resetBall = () => {
			ball.x = width / 2;
			ball.y = height / 2;
			ball.vx = (Math.random() > 0.5 ? 7 : -7);
			ball.vy = (Math.random() * 10) - 5;
		};

		const resizeObserver = new ResizeObserver((entries) => {
			for (let entry of entries) {
				canvas.width = entry.contentRect.width;
				canvas.height = entry.contentRect.height;

				if (!initialized && canvas.height > 0) {
					paddleL.y = canvas.height / 2 - paddleHeight / 2;
					paddleR.y = canvas.height / 2 - paddleHeight / 2;
					resetBall();
					initialized = true;
				}
			}
		});
		if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

		const gameLoop = () => {
			animationFrameId = requestAnimationFrame(gameLoop);

			if (!isActive || !initialized) return;
			const width = canvas.width;
			const height = canvas.height;
			paddleR.x = width - 40 - paddleWidth;

			ball.x += ball.vx;
			ball.y += ball.vy;

			if (ball.y <= 0 || ball.y + ballSize >= height) {
				ball.vy *= -1;
			}
			if (ball.x < 0 || ball.x > width) {
				resetBall();
			}
			if (ball.x <= paddleL.x + paddleWidth && ball.y + ballSize >= paddleL.y && ball.y <= paddleL.y + paddleHeight) {
				ball.vx = Math.abs(ball.vx) * ball.speedMultiplier;
				ball.x = paddleL.x + paddleWidth; 
				let hitPoint = (ball.y - (paddleL.y + paddleHeight / 2)) / (paddleHeight / 2);
				ball.vy = hitPoint * 8;
			}
			if (ball.x + ballSize >= paddleR.x && ball.y + ballSize >= paddleR.y && ball.y <= paddleR.y + paddleHeight) {
				ball.vx = -Math.abs(ball.vx) * ball.speedMultiplier;
				ball.x = paddleR.x - ballSize;
				let hitPoint = (ball.y - (paddleR.y + paddleHeight / 2)) / (paddleHeight / 2);
				ball.vy = hitPoint * 8;
			}
			if (ball.vx < 0) {
				const targetY = ball.y - paddleHeight / 2;
				if (paddleL.y < targetY) paddleL.y += paddleL.speed;
				if (paddleL.y > targetY) paddleL.y -= paddleL.speed;
			}
			if (ball.vx > 0) {
				const targetY = ball.y - paddleHeight / 2;
				if (paddleR.y < targetY) paddleR.y += paddleR.speed;
				if (paddleR.y > targetY) paddleR.y -= paddleR.speed;
			}
			paddleL.y = Math.max(0, Math.min(height - paddleHeight, paddleL.y));
			paddleR.y = Math.max(0, Math.min(height - paddleHeight, paddleR.y));
			ctx.clearRect(0, 0, width, height);
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
			ctx.lineWidth = 4;
			ctx.setLineDash([15, 15]);
			ctx.beginPath();
			ctx.moveTo(width / 2, 0);
			ctx.lineTo(width / 2, height);
			ctx.stroke();
			ctx.setLineDash([]); 

			const drawNeonRect = (x: number, y: number, w: number, h: number) => {
				ctx.fillStyle = '#ffffff';
				ctx.shadowBlur = 20;
				ctx.shadowColor = '#ffffff';
				ctx.fillRect(x, y, w, h);
				ctx.shadowBlur = 0; 
			};
			drawNeonRect(paddleL.x, paddleL.y, paddleWidth, paddleHeight);
			drawNeonRect(paddleR.x, paddleR.y, paddleWidth, paddleHeight);
			drawNeonRect(ball.x, ball.y, ballSize, ballSize);
		};

		animationFrameId = requestAnimationFrame(gameLoop);

		return () => {
			cancelAnimationFrame(animationFrameId);
			resizeObserver.disconnect();
		};
	}, [isActive]);

	return (
		<Box sx={{
			position: 'absolute', inset: 0, width: '100%', height: '100%',
			overflow: 'hidden', pointerEvents: 'none', bgcolor: 'transparent'
		}}>
			<canvas
				ref={canvasRef}
				width={800}
				height={600}
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					opacity: isActive ? 1 : 0.3,
					transition: 'opacity 500ms',
					zIndex: 10,
				}}
			/>
		</Box>
	);
});