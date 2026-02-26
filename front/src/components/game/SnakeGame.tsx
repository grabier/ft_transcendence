import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SearchingGameLoading } from '../ui/SearchingGameLoading';
import { Box } from '@mui/material';

interface SnakeGameProps {
	mode: 'pvp' | 'ai' | 'local';
	scoreToWin: number;
	roomId?: string;
	onExit: () => void;
	onRestart: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 20;

interface Point { x: number; y: number }
interface SnakeState {
	body: Point[];
	score: number;
	color: string;
}

const SnakeGame: React.FC<SnakeGameProps> = ({ mode, scoreToWin, roomId, onExit, onRestart }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const socketRef = useRef<WebSocket | null>(null);
	const reqIdRef = useRef<number>(0);
	const isGameEndedRef = useRef(false);

	const gameState = useRef({
		snakeLeft: { body: [{ x: 10, y: 15 }], score: 0, color: '#00ff66' } as SnakeState,
		snakeRight: { body: [{ x: 30, y: 15 }], score: 0, color: '#ff0066' } as SnakeState,
		food: { x: 20, y: 15 } as Point
	});

	const [uiState, setUiState] = useState<'loading' | 'countdown' | 'playing' | 'ended' | 'reconnecting' | 'waiting_opponent' | 'paused'>('loading');
	const [countdown, setCountdown] = useState(3);
	const [winnerText, setWinnerText] = useState('');
	const [statusMessage, setStatusMessage] = useState('Connecting...');
	const [pauseTimer, setPauseTimer] = useState<number | null>(null);

	const [playersInfo, setPlayersInfo] = useState<{
		left: { username: string, avatarUrl: string },
		right: { username: string, avatarUrl: string }
	} | null>(null);

	const startCountdownSequence = () => {
		setUiState('countdown');
		let count = 3;
		setCountdown(3);

		const interval = setInterval(() => {
			count--;
			setCountdown(count);
			if (count <= 0) {
				clearInterval(interval);
				setTimeout(() => {
					if (!isGameEndedRef.current) setUiState('playing');
				}, 500);
			}
		}, 1000);
	};

	const handleRestart = () => {
		if (socketRef.current) socketRef.current.close(1000, "Restarting");
		onRestart();
	};

	const gameLoop = useCallback(() => {
		if (!canvasRef.current) return;
		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) return;

		const state = gameState.current;

		ctx.fillStyle = '#0a0a0a';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
		ctx.lineWidth = 1;
		for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
			ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
		}
		for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
			ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
		}

		ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
		ctx.font = 'bold 80px "Montserrat", sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(state.snakeLeft.score.toString(), CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2 + 30);
		if (mode !== 'local' || state.snakeRight.score > 0) {
			ctx.fillText(state.snakeRight.score.toString(), (CANVAS_WIDTH / 4) * 3, CANVAS_HEIGHT / 2 + 30);
		}

		const drawBlock = (x: number, y: number, color: string, isHead: boolean) => {
			ctx.fillStyle = color;
			ctx.shadowBlur = isHead ? 15 : 5;
			ctx.shadowColor = color;
			ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
			ctx.shadowBlur = 0;
		};

		drawBlock(state.food.x, state.food.y, '#ffffff', true);

		state.snakeLeft.body.forEach((segment, index) => {
			drawBlock(segment.x, segment.y, state.snakeLeft.color, index === 0);
		});

		if (mode !== 'local' || state.snakeRight.body.length > 1) {
			state.snakeRight.body.forEach((segment, index) => {
				drawBlock(segment.x, segment.y, state.snakeRight.color, index === 0);
			});
		}

		reqIdRef.current = requestAnimationFrame(gameLoop);
	}, [mode]);

	useEffect(() => {
		const token = localStorage.getItem('auth_token');
		const safeToken = token ? token : 'GUEST';
		let isComponentUnmounted = false;
		let reconnectTimeout: NodeJS.Timeout;
		const host = window.location.hostname;

		const connectWebSocket = () => {
			if (isComponentUnmounted) return;
			const socket = new WebSocket(`wss://${host}:3000/api/snake/?mode=${mode}&score=${scoreToWin}&token=${safeToken}&roomId=${roomId || ''}`);
			socketRef.current = socket;

			socket.onopen = () => {
				console.log("Snake WS Connected ✅");
				if (mode === 'pvp') {
					setUiState(prev => prev === 'reconnecting' ? 'loading' : prev);
					setStatusMessage('Looking for opponent...');
				}
			};

			socket.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data);
					if (msg.playersData) setPlayersInfo(msg.playersData);

					if (msg.type === 'STATUS') {
						setStatusMessage(msg.message);
					}

					if (msg.type === 'SIDE_ASSIGNED') {
						// SE HA ELIMINADO LA INYECCIÓN EN LA URL AQUÍ
						if (msg.status === 'paused') {
							if (msg.pauseTimeLeft !== undefined) setPauseTimer(msg.pauseTimeLeft);
							setUiState('paused');
						} else {
							startCountdownSequence();
						}
					}

					if (msg.type === 'UPDATE') {
						const s = msg.state;

						gameState.current.snakeLeft = s.snakeLeft;
						if (s.snakeRight) gameState.current.snakeRight = s.snakeRight;
						gameState.current.food = s.food;

						setUiState((prev) => {
							if (s.status === 'paused' && prev === 'playing') return 'paused';
							if (s.status === 'playing' && prev === 'paused') return 'playing';
							return prev;
						});

						if (s.status === 'paused') {
							setPauseTimer(msg.pauseTimeLeft !== undefined ? msg.pauseTimeLeft : null);
						} else {
							setPauseTimer(null);
						}

						if (s.status === 'ended' && !isGameEndedRef.current) {
							isGameEndedRef.current = true;
							let text = s.winner === 'left' ? "P1 WINS" : "P2 WINS";
							if (mode === 'ai' && s.winner === 'right') text = "AI WINS 🤖";
							setWinnerText(text);
							setUiState('ended');
						}
					}

					if (msg.type === 'OPPONENT_DISCONNECTED') {
						setUiState('waiting_opponent');
						setStatusMessage(msg.message);
					}
					if (msg.type === 'OPPONENT_RECONNECTED') {
						if (msg.playersData) setPlayersInfo(msg.playersData);
						if (msg.status === 'paused') {
							if (msg.pauseTimeLeft !== undefined) setPauseTimer(msg.pauseTimeLeft);
							setUiState('paused');
						} else {
							startCountdownSequence();
						}
					}
				} catch (e) { console.error(e); }
			};

			socket.onclose = () => {
				if (isComponentUnmounted) return;
				if (!isGameEndedRef.current) {
					setUiState('reconnecting');
					setStatusMessage('Connection lost. Reconnecting...');
					reconnectTimeout = setTimeout(connectWebSocket, 2000);
				}
			};

			socket.onerror = (err) => {
				console.error("WS Error", err);
				socket.close();
			};
		}
		connectWebSocket();

		const keysPressed: Record<string, boolean> = {};
		const sendInput = (action: string, key: string) => {
			if (socketRef.current?.readyState === WebSocket.OPEN) {
				if (mode === 'local') {
					if (['w', 'W'].includes(key)) socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_UP' }));
					if (['s', 'S'].includes(key)) socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_DOWN' }));
					if (['a', 'A'].includes(key)) socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_LEFT' }));
					if (['d', 'D'].includes(key)) socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_RIGHT' }));

					if (key === 'ArrowUp') socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_UP' }));
					if (key === 'ArrowDown') socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_DOWN' }));
					if (key === 'ArrowLeft') socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_LEFT' }));
					if (key === 'ArrowRight') socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_RIGHT' }));
				} else {
					let command = '';
					if (['ArrowUp', 'w', 'W'].includes(key)) command = 'UP';
					else if (['ArrowDown', 's', 'S'].includes(key)) command = 'DOWN';
					else if (['ArrowLeft', 'a', 'A'].includes(key)) command = 'LEFT';
					else if (['ArrowRight', 'd', 'D'].includes(key)) command = 'RIGHT';

					if (command) socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: command }));
				}
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();

			if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
				if (socketRef.current?.readyState === WebSocket.OPEN) {
					socketRef.current.send(JSON.stringify({ type: 'PAUSE' }));
				}
				return;
			}

			if (keysPressed[e.key]) return;
			keysPressed[e.key] = true;
			sendInput('PRESS', e.key);
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			keysPressed[e.key] = false;
			sendInput('RELEASE', e.key);
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		reqIdRef.current = requestAnimationFrame(gameLoop);

		return () => {
			isComponentUnmounted = true;
			clearTimeout(reconnectTimeout);
			
			if (socketRef.current?.readyState === WebSocket.OPEN && !isGameEndedRef.current) {
				socketRef.current.send(JSON.stringify({ type: 'SURRENDER' }));
			}

			if (socketRef.current) socketRef.current.close();
			cancelAnimationFrame(reqIdRef.current);
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, scoreToWin, gameLoop]);

	const overlayStyle: React.CSSProperties = {
		position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
		backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
		justifyContent: 'center', alignItems: 'center', color: 'white', zIndex: 10
	};

	const buttonStyle: React.CSSProperties = {
		padding: '10px 20px', fontSize: '1.2em', margin: '10px',
		cursor: 'pointer', fontWeight: 'bold', border: 'none', borderRadius: '5px'
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: CANVAS_WIDTH, margin: '0 auto' }}>

			{playersInfo && (
				<div style={{
					width: '100%',
					display: 'flex', justifyContent: 'space-between', padding: '10px 20px',
					boxSizing: 'border-box', color: 'white', fontFamily: 'Arial, sans-serif',
					marginBottom: '15px'
				}}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
						<img src={playersInfo.left.avatarUrl} alt="P1"
							style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid white', backgroundColor: '#333' }} />
						<span style={{ fontSize: '1.5em', fontWeight: 'bold', textShadow: '2px 2px 4px #000' }}>
							{playersInfo.left.username}
						</span>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexDirection: 'row-reverse' }}>
						<img src={playersInfo.right.avatarUrl} alt="P2"
							style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid white', backgroundColor: '#333' }} />
						<span style={{ fontSize: '1.5em', fontWeight: 'bold', textShadow: '2px 2px 4px #000' }}>
							{playersInfo.right.username}
						</span>
					</div>
				</div>
			)}

			<div style={{ position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT, border: '2px solid rgba(0, 255, 102, 0.5)', boxSizing: 'content-box', boxShadow: '0 0 20px rgba(0, 255, 102, 0.2)' }}>

				<canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ display: 'block' }} />

				{uiState === 'loading' && (
					<div style={overlayStyle}>
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
							<SearchingGameLoading />
						</Box>
					</div>
				)}

				{uiState === 'waiting_opponent' && (
					<div style={overlayStyle}>
						<h1>⏸️ Pausa</h1><p style={{ fontSize: '1.2em' }}>{statusMessage}</p>
					</div>
				)}

				{uiState === 'countdown' && (
					<div style={{ ...overlayStyle, backgroundColor: 'transparent' }}>
						<h1 style={{ fontSize: '6em', color: countdown === 0 ? '#00ff66' : 'white', textShadow: '2px 2px 10px rgba(0,255,102,0.8)' }}>
							{countdown === 0 ? 'GO!' : countdown}
						</h1>
					</div>
				)}

				{uiState === 'paused' && (
					<div style={overlayStyle}>
						<h1 style={{ fontSize: '5em', letterSpacing: '10px', margin: 0 }}>PAUSE</h1>

						{mode === 'pvp' ? (
							<>
								<p style={{ fontSize: '1.2em', opacity: 0.8, marginTop: '20px' }}>
									{statusMessage}
								</p>
								{pauseTimer !== null && (
									<h2 style={{
										fontSize: '4em',
										marginTop: '10px',
										color: pauseTimer <= 5 ? '#ff4444' : '#f1c40f',
										textShadow: '2px 2px 4px #000'
									}}>
										{pauseTimer}s
									</h2>
								)}
							</>
						) : (
							<p style={{ fontSize: '1.2em', opacity: 0.8 }}>Pulsa P o ESC para continuar</p>
						)}
					</div>
				)}

				{uiState === 'ended' && (
					<div style={overlayStyle}>
						<h1 style={{ fontSize: '3em', marginBottom: '20px' }}>{winnerText}</h1>
						<button style={{ ...buttonStyle, backgroundColor: '#00ff66', color: '#000' }} onClick={handleRestart}>
							PLAY AGAIN
						</button>
						<button style={{ ...buttonStyle, backgroundColor: '#ff4444', color: 'white' }} onClick={onExit}>
							SALIR AL MENÚ
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default SnakeGame;