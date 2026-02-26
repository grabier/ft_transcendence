import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SearchingGameLoading } from '../ui/SearchingGameLoading';
import { Box } from '@mui/material';

interface PongGameProps {
	mode: 'pvp' | 'ai' | 'local';
	scoreToWin: number;
	roomId?: string;
	onExit: () => void;
	onRestart: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const PongGame: React.FC<PongGameProps> = ({ mode, scoreToWin, roomId, onExit, onRestart }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const socketRef = useRef<WebSocket | null>(null);
	const reqIdRef = useRef<number>(0);
	const isGameEndedRef = useRef(false);

	const currentPos = useRef({
		ball: { x: 400, y: 300 },
		paddleLeft: { y: 265 },
		paddleRight: { y: 265 },
		scoreLeft: 0,
		scoreRight: 0
	});

	const serverTarget = useRef({
		ball: { x: 400, y: 300 },
		paddleLeft: { y: 265, score: 0 },
		paddleRight: { y: 265, score: 0 }
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

	const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

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

		const LERP_FACTOR = 0.3;
		const target = serverTarget.current;
		const current = currentPos.current;

		const dx = target.ball.x - current.ball.x;
		const dy = target.ball.y - current.ball.y;

		if (Math.sqrt(dx * dx + dy * dy) > 100) {
			current.ball.x = target.ball.x;
			current.ball.y = target.ball.y;
		} else {
			current.ball.x = lerp(current.ball.x, target.ball.x, LERP_FACTOR);
			current.ball.y = lerp(current.ball.y, target.ball.y, LERP_FACTOR);
		}

		current.paddleLeft.y = lerp(current.paddleLeft.y, target.paddleLeft.y, LERP_FACTOR);
		current.paddleRight.y = lerp(current.paddleRight.y, target.paddleRight.y, LERP_FACTOR);
		current.scoreLeft = target.paddleLeft.score || 0; 
		current.scoreRight = target.paddleRight.score || 0;

		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		ctx.fillStyle = 'white';
		ctx.font = '50px Arial';
		ctx.textAlign = 'center';
		ctx.fillText(current.scoreLeft.toString(), CANVAS_WIDTH / 4, 100);
		ctx.fillText(current.scoreRight.toString(), (CANVAS_WIDTH / 4) * 3, 100);

		ctx.fillRect((CANVAS_WIDTH / 2) - 2, 0, 4, CANVAS_HEIGHT);
		ctx.fillRect(current.ball.x, current.ball.y, 18, 18);

		ctx.fillStyle = 'red';
		ctx.fillRect(10, current.paddleLeft.y, 10, 70);

		ctx.fillStyle = 'blue';
		ctx.fillRect(CANVAS_WIDTH - 20, current.paddleRight.y, 10, 70);

		reqIdRef.current = requestAnimationFrame(gameLoop);
	}, []);

	useEffect(() => {
		const token = localStorage.getItem('auth_token');
		const safeToken = token ? token : 'GUEST';
		let isComponentUnmounted = false;
		let reconnectTimeout: NodeJS.Timeout;
		const host = window.location.hostname; 

		const connectWebSocket = () => {
			if (isComponentUnmounted) return;
			const socket = new WebSocket(`wss://${host}:3000/api/game/?mode=${mode}&score=${scoreToWin}&token=${safeToken}&roomId=${roomId || ''}`);
			socketRef.current = socket;

			socket.onopen = () => {
				console.log("WS Connected ✅");
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
						const PREDICTION = 0.05;

						if (Math.abs(s.ball.speedX) > 0) {
							serverTarget.current.ball.x = s.ball.x + (s.ball.speedX * PREDICTION);
							serverTarget.current.ball.y = s.ball.y + (s.ball.speedY * PREDICTION);
						} else {
							serverTarget.current.ball.x = s.ball.x;
							serverTarget.current.ball.y = s.ball.y;
						}

						serverTarget.current.paddleLeft.y = s.paddleLeft.y;
						serverTarget.current.paddleRight.y = s.paddleRight.y;
						serverTarget.current.paddleLeft.score = s.paddleLeft.score;
						serverTarget.current.paddleRight.score = s.paddleRight.score;

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
					console.warn("WS Desconectado inesperadamente. Reintentando en 2s...");
					setUiState('reconnecting');
					setStatusMessage('Conexión perdida. Reconectando...');
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
					if (key === 'w' || key === 'W') socketRef.current?.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_UP' }));
					if (key === 's' || key === 'S') socketRef.current?.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_DOWN' }));
					if (key === 'ArrowUp') socketRef.current?.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_UP' }));
					if (key === 'ArrowDown') socketRef.current?.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_DOWN' }));
				} else {
					let command = '';
					if (key === 'ArrowUp' || key === 'w' || key === 'W') command = 'UP';
					else if (key === 'ArrowDown' || key === 's' || key === 'S') command = 'DOWN';

					if (command) socketRef.current?.send(JSON.stringify({ type: 'INPUT', action, key: command }));
				}
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
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
				<div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '10px 20px', boxSizing: 'border-box', color: 'white', fontFamily: 'Arial, sans-serif', marginBottom: '15px' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
						<img src={playersInfo.left.avatarUrl} alt="P1" style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid white', backgroundColor: '#333' }} />
						<span style={{ fontSize: '1.5em', fontWeight: 'bold', textShadow: '2px 2px 4px #000' }}>{playersInfo.left.username}</span>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexDirection: 'row-reverse' }}>
						<img src={playersInfo.right.avatarUrl} alt="P2" style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid white', backgroundColor: '#333' }} />
						<span style={{ fontSize: '1.5em', fontWeight: 'bold', textShadow: '2px 2px 4px #000' }}>{playersInfo.right.username}</span>
					</div>
				</div>
			)}

			<div style={{ position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT, border: '2px solid white', boxSizing: 'content-box' }}>
				<canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ display: 'block', backgroundColor: 'black' }} />

				{uiState === 'loading' && (
					<div style={overlayStyle}>
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
							<SearchingGameLoading />
						</Box>
					</div>
				)}

				{uiState === 'waiting_opponent' && (
					<div style={overlayStyle}>
						<h1>⏸️ Pausa</h1>
						<p style={{ fontSize: '1.2em' }}>{statusMessage}</p>
					</div>
				)}

				{uiState === 'countdown' && (
					<div style={{ ...overlayStyle, backgroundColor: 'transparent' }}>
						<h1 style={{ fontSize: '6em', color: countdown === 0 ? '#FFFF00' : 'white', textShadow: '2px 2px 4px #000' }}>
							{countdown === 0 ? 'GO!' : countdown}
						</h1>
					</div>
				)}

				{uiState === 'paused' && (
					<div style={overlayStyle}>
						<h1 style={{ fontSize: '5em', letterSpacing: '10px', margin: 0 }}>PAUSE</h1>
						{mode === 'pvp' ? (
							<>
								<p style={{ fontSize: '1.2em', opacity: 0.8, marginTop: '20px' }}>{statusMessage}</p>
								{pauseTimer !== null && (
									<h2 style={{ fontSize: '4em', marginTop: '10px', color: pauseTimer <= 5 ? '#ff4444' : '#f1c40f', textShadow: '2px 2px 4px #000' }}>
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
						<button style={{ ...buttonStyle, backgroundColor: '#fff', color: '#000' }} onClick={handleRestart}>
							JUGAR OTRA VEZ
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

export default PongGame;