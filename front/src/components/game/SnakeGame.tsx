import React, { useEffect, useRef, useState, useCallback } from 'react';

interface SnakeGameProps {
	mode: 'pvp' | 'ai' | 'local';
	scoreToWin: number;
	roomId?: string;
	onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 20; // Tamaño de cada bloque de la cuadrícula (40 columnas x 30 filas)

// Estructura esperada del servidor
interface Point { x: number; y: number }
interface SnakeState {
    body: Point[]; // Array de coordenadas, el índice 0 es la cabeza
    score: number;
    color: string;
}

const SnakeGame: React.FC<SnakeGameProps> = ({ mode, scoreToWin, roomId, onExit }) => {
	// --- REFS (Memoria rápida) ---
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const socketRef = useRef<WebSocket | null>(null);
	const reqIdRef = useRef<number>(0);
	const isGameEndedRef = useRef(false);

	// Estado del juego (Lo que nos manda el servidor)
    // A diferencia del Pong, en el Snake no suele hacer falta interpolación (lerp) 
    // porque el movimiento por cuadrícula se ve mejor si es "seco" y preciso.
	const gameState = useRef({
		snakeLeft: { body: [{ x: 10, y: 15 }], score: 0, color: '#00ff66' } as SnakeState,
		snakeRight: { body: [{ x: 30, y: 15 }], score: 0, color: '#ff0066' } as SnakeState, // Para PVP
		food: { x: 20, y: 15 } as Point
	});

	// --- ESTADO REACT (UI) ---
	const [uiState, setUiState] = useState<'loading' | 'countdown' | 'playing' | 'ended' | 'reconnecting' | 'waiting_opponent'>('loading');
	const [countdown, setCountdown] = useState(3);
	const [winnerText, setWinnerText] = useState('');
	const [statusMessage, setStatusMessage] = useState('Connecting...');

	const startCountdownSequence = () => {
		setUiState('countdown');
		let count = 3;
		setCountdown(3);

		const interval = setInterval(() => {
			count--;
			setCountdown(count);
			if (count <= 0) {
				clearInterval(interval);
				setTimeout(() => setUiState('playing'), 500);
			}
		}, 1000);
	};

	const handleRestart = () => {
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify({ type: 'RESTART' }));
		}
	};

	// --- BUCLE DE JUEGO (Game Loop) ---
	const gameLoop = useCallback(() => {
		if (!canvasRef.current) return;
		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) return;

		const state = gameState.current;

		// 1. DIBUJADO (Render)
		// Fondo Oscuro
		ctx.fillStyle = '#0a0a0a';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Cuadrícula sutil (Estética Tron/Neon)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
        }
        for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
        }

		// Marcadores
		ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
		ctx.font = 'bold 80px "Montserrat", sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(state.snakeLeft.score.toString(), CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2 + 30);
        if (mode !== 'local' || state.snakeRight.score > 0) { // Mostrar marcador derecho si hay rival
		    ctx.fillText(state.snakeRight.score.toString(), (CANVAS_WIDTH / 4) * 3, CANVAS_HEIGHT / 2 + 30);
        }

        // Función auxiliar para dibujar bloques de serpiente con efecto neón
        const drawBlock = (x: number, y: number, color: string, isHead: boolean) => {
            ctx.fillStyle = color;
            ctx.shadowBlur = isHead ? 15 : 5;
            ctx.shadowColor = color;
            // Se resta 2 al tamaño para que haya un pequeño espacio entre los segmentos de la serpiente
            ctx.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
            ctx.shadowBlur = 0; // Reset
        };

		// Comida (Manzana)
        drawBlock(state.food.x, state.food.y, '#ffffff', true);

		// Serpiente Izquierda (P1)
        state.snakeLeft.body.forEach((segment, index) => {
            drawBlock(segment.x, segment.y, state.snakeLeft.color, index === 0);
        });

		// Serpiente Derecha (P2 / IA) - Solo si aplica
        if (mode !== 'local' || state.snakeRight.body.length > 1) {
            state.snakeRight.body.forEach((segment, index) => {
                drawBlock(segment.x, segment.y, state.snakeRight.color, index === 0);
            });
        }

		// 2. Solicitar siguiente frame
		reqIdRef.current = requestAnimationFrame(gameLoop);
	}, [mode]);

	// --- EFECTO PRINCIPAL (Montaje y Conexión) ---
	useEffect(() => {
		const token = localStorage.getItem('auth_token');
		let isComponentUnmounted = false;
		let reconnectTimeout: NodeJS.Timeout;
		const host = window.location.hostname;

		// NOTA: Cambiamos la URL de conexión al endpoint del Snake
		const connectWebSocket = () => {
			if (isComponentUnmounted) return;
			const socket = new WebSocket(`wss://${host}:3000/api/snake/?mode=${mode}&score=${scoreToWin}&token=${token}&roomId=${roomId || ''}`);
			socketRef.current = socket;

			socket.onopen = () => {
				console.log("Snake WS Connected ✅");
				if (mode === 'pvp') {
					setUiState(prev => prev === 'reconnecting' ? 'loading' : prev);
					setStatusMessage('Looking for opponent...');
				} else {
                    startCountdownSequence(); // Local o IA empiezan directo
                }
			};

			socket.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data);

					if (msg.type === 'STATUS') {
						setStatusMessage(msg.message);
					}

					if (msg.type === 'SIDE_ASSIGNED') {
						if (msg.roomId) {
							window.history.replaceState(null, '', `/?game=snake&mode=${mode}&roomId=${msg.roomId}&score=${scoreToWin}`);
						}
						startCountdownSequence();
					}

					if (msg.type === 'UPDATE') {
						const s = msg.state;
                        
                        // Actualizamos el estado directamente desde el servidor
                        gameState.current.snakeLeft = s.snakeLeft;
                        if (s.snakeRight) gameState.current.snakeRight = s.snakeRight;
                        gameState.current.food = s.food;

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
						startCountdownSequence();
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

		// 2. Listeners de Teclado
		const keysPressed: Record<string, boolean> = {};
		const sendInput = (action: string, key: string) => {
			if (socketRef.current?.readyState === WebSocket.OPEN) {
				if (mode === 'local') {
                    // Controles P1
					if (['w', 'W'].includes(key)) socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_UP' }));
					if (['s', 'S'].includes(key)) socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_DOWN' }));
					if (['a', 'A'].includes(key)) socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_LEFT' }));
					if (['d', 'D'].includes(key)) socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_RIGHT' }));
                    
                    // Controles P2
					if (key === 'ArrowUp') socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_UP' }));
					if (key === 'ArrowDown') socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_DOWN' }));
					if (key === 'ArrowLeft') socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_LEFT' }));
					if (key === 'ArrowRight') socketRef.current.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_RIGHT' }));
				} else {
                    // Controles multijugador remoto (el servidor sabe quién eres)
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
			if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault(); // Evitar scroll de la página
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

		// Arrancar el bucle
		reqIdRef.current = requestAnimationFrame(gameLoop);

		return () => {
            isComponentUnmounted = true;
            clearTimeout(reconnectTimeout);
            if (socketRef.current) socketRef.current.close();
            cancelAnimationFrame(reqIdRef.current);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
		};
	}, [mode, scoreToWin, gameLoop]);

	// --- RENDERIZADO UI (Superposiciones HTML) ---
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
		<div style={{ position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT, margin: '0 auto', border: '2px solid rgba(0, 255, 102, 0.5)', boxSizing: 'content-box', boxShadow: '0 0 20px rgba(0, 255, 102, 0.2)' }}>
			<canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ display: 'block' }} />

			{(uiState === 'loading' || uiState === 'reconnecting') && (
				<div style={overlayStyle}><h1>{statusMessage}</h1></div>
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

			{uiState === 'ended' && (
				<div style={overlayStyle}>
					<h1 style={{ fontSize: '3em', marginBottom: '20px' }}>{winnerText}</h1>
					<button style={{ ...buttonStyle, backgroundColor: '#00ff66', color: '#000' }} onClick={handleRestart}>
						PLAY AGAIN
					</button>
					<button style={{ ...buttonStyle, backgroundColor: '#ff4444', color: 'white' }} onClick={onExit}>
						EXIT TO MENU
					</button>
				</div>
			)}
		</div>
	);
};

export default SnakeGame;