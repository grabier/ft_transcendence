import React, { useEffect, useRef, useState, useCallback } from 'react';

// Tipos para las props del componente
interface PongGameProps {
	mode: 'pvp' | 'ai' | 'local';
	scoreToWin: number;
	roomId?: string;
	onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const PongGame: React.FC<PongGameProps> = ({ mode, scoreToWin, roomId, onExit }) => {
	// --- REFS (Memoria rápida) ---
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const socketRef = useRef<WebSocket | null>(null);
	const reqIdRef = useRef<number>(0);
	const isGameEndedRef = useRef(false); // Ref para controlar el fin de juego sin stale closures

	// Posiciones actuales (Lo que se dibuja)
	const currentPos = useRef({
		ball: { x: 400, y: 300 },
		paddleLeft: { y: 265 },
		paddleRight: { y: 265 },
		scoreLeft: 0,
		scoreRight: 0
	});

	// Objetivo del servidor (Hacia donde vamos)
	const serverTarget = useRef({
		ball: { x: 400, y: 300 },
		paddleLeft: { y: 265, score: 0 },
		paddleRight: { y: 265, score: 0 }
	});

	// --- ESTADO REACT (UI) ---
	const [uiState, setUiState] = useState<'loading' | 'countdown' | 'playing' | 'ended'>('loading');
	const [countdown, setCountdown] = useState(3);
	const [winnerText, setWinnerText] = useState('');
	const [statusMessage, setStatusMessage] = useState('Connecting...');

	// --- FUNCIONES AUXILIARES ---
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
				// Pequeño timeout para que se vea el "GO!" o el 0 un instante
				setTimeout(() => setUiState('playing'), 500);
			}
		}, 1000);
	};

	const handleRestart = () => {
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify({ type: 'RESTART' }));
			// No cambiamos el estado aquí manualmente, esperamos a que el servidor 
			// nos diga "playing" y el socket.onmessage reactive el juego.
		}
	};

	// --- BUCLE DE JUEGO (Game Loop) ---
	// Usamos useCallback para que la función sea estable
	const gameLoop = useCallback(() => {
		if (!canvasRef.current) return;
		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) return;

		// 1. Lógica de Interpolación (Suavizado)
		const LERP_FACTOR = 0.3;
		const target = serverTarget.current;
		const current = currentPos.current;

		const dx = target.ball.x - current.ball.x;
		const dy = target.ball.y - current.ball.y;

		// Teletransporte si la bola se ha movido muchísimo (ej: gol y respawn)
		if (Math.sqrt(dx * dx + dy * dy) > 100) {
			current.ball.x = target.ball.x;
			current.ball.y = target.ball.y;
		} else {
			current.ball.x = lerp(current.ball.x, target.ball.x, LERP_FACTOR);
			current.ball.y = lerp(current.ball.y, target.ball.y, LERP_FACTOR);
		}

		current.paddleLeft.y = lerp(current.paddleLeft.y, target.paddleLeft.y, LERP_FACTOR);
		current.paddleRight.y = lerp(current.paddleRight.y, target.paddleRight.y, LERP_FACTOR);
		current.scoreLeft = target.paddleLeft.score || 0; // Aseguramos que actualice score
		current.scoreRight = target.paddleRight.score || 0;

		// 2. DIBUJADO (Render)
		// Fondo Negro
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		// Marcadores
		ctx.fillStyle = 'white';
		ctx.font = '50px Arial';
		ctx.textAlign = 'center';
		ctx.fillText(current.scoreLeft.toString(), CANVAS_WIDTH / 4, 100);
		ctx.fillText(current.scoreRight.toString(), (CANVAS_WIDTH / 4) * 3, 100);

		// Red central
		ctx.fillRect((CANVAS_WIDTH / 2) - 2, 0, 4, CANVAS_HEIGHT);

		// Bola
		ctx.fillRect(current.ball.x, current.ball.y, 18, 18);

		// Palas
		ctx.fillStyle = 'red';
		ctx.fillRect(10, current.paddleLeft.y, 10, 70);

		ctx.fillStyle = 'blue';
		ctx.fillRect(CANVAS_WIDTH - 20, current.paddleRight.y, 10, 70);

		// 3. Solicitar siguiente frame
		reqIdRef.current = requestAnimationFrame(gameLoop);
	}, []);

	// --- EFECTO PRINCIPAL (Montaje y Conexión) ---
	useEffect(() => {
		const token = localStorage.getItem('auth_token');

		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const host = window.location.hostname; // Esto cogerá "10.12.x.x" automáticamente
		const port = '3000';

		console.log(`Connecting to WS: Mode=${mode}, Score=${scoreToWin}`);

		// 2. Lo añadimos a la URL: ?token=...
		const socket = new WebSocket(`ws://${host}:3000/api/game/?mode=${mode}&score=${scoreToWin}&token=${token}&roomId=${roomId || ''}`);
		socketRef.current = socket;



		socket.onopen = () => {
			console.log("WS Connected ✅");
			// ❌ ANTES: startCountdownSequence(); -> ESTO ERA EL ERROR
			// ✅ AHORA: Solo indicamos que estamos esperando instrucciones del servidor
			if (mode === 'pvp') {
				setUiState('loading');
				setStatusMessage('Looking for opponent...');
			}
		};

		socket.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data);

				// 1. GESTIÓN DE COLA (Mensajes de estado)
				if (msg.type === 'STATUS') {
					setStatusMessage(msg.message);
				}

				// 2. INICIO DE PARTIDA (El servidor nos asigna lado)
				if (msg.type === 'SIDE_ASSIGNED') {
					console.log("Partida encontrada. Soy:", msg.side);
					// ¡AHORA SÍ ARRANCAMOS LA CUENTA ATRÁS! 🚀
					startCountdownSequence();
				}

				if (msg.type === 'UPDATE') {
					const s = msg.state;
					const PREDICTION = 0.05;

					// ... (tu lógica de interpolación y update igual que antes) ...
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

					if (s.status === 'ended' && !isGameEndedRef.current) {
						isGameEndedRef.current = true;
						let text = s.winner === 'left' ? "P1 WINS" : "P2 WINS";
						if (mode === 'ai' && s.winner === 'right') text = "AI WINS 🤖";
						setWinnerText(text);
						setUiState('ended');
					}
				}
			} catch (e) { console.error(e); }
		};

		// 2. Listeners de Teclado
		const keysPressed: Record<string, boolean> = {};
		const sendInput = (action: string, key: string) => {
			if (socket.readyState === WebSocket.OPEN) {
				// MODO LOCAL
				if (mode === 'local') {
					if (key === 'w' || key === 'W') socket.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_UP' }));
					if (key === 's' || key === 'S') socket.send(JSON.stringify({ type: 'INPUT', action, key: 'LEFT_DOWN' }));
					if (key === 'ArrowUp') socket.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_UP' }));
					if (key === 'ArrowDown') socket.send(JSON.stringify({ type: 'INPUT', action, key: 'RIGHT_DOWN' }));
				}
				// MODO REMOTO
				else {
					let command = '';
					if (key === 'ArrowUp' || key === 'w' || key === 'W') command = 'UP';
					else if (key === 'ArrowDown' || key === 's' || key === 'S') command = 'DOWN';

					if (command) socket.send(JSON.stringify({ type: 'INPUT', action, key: command }));
				}
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
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

		// 3. ARRANCAR EL BUCLE VISUAL (¡ESTO ES LO QUE FALTABA!) 🚀
		reqIdRef.current = requestAnimationFrame(gameLoop);

		// 4. Cleanup (Limpieza al salir)
		return () => {
			console.log("Cleaning up game...");
			if (socketRef.current) socketRef.current.close();
			cancelAnimationFrame(reqIdRef.current);
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [mode, scoreToWin, gameLoop]);

	// --- RENDERIZADO (HTML/CSS) ---
	const overlayStyle: React.CSSProperties = {
		position: 'absolute',
		top: 0, left: 0, width: '100%', height: '100%',
		backgroundColor: 'rgba(0,0,0,0.85)',
		display: 'flex', flexDirection: 'column',
		justifyContent: 'center', alignItems: 'center',
		color: 'white', zIndex: 10
	};

	const buttonStyle: React.CSSProperties = {
		padding: '10px 20px', fontSize: '1.2em', margin: '10px',
		cursor: 'pointer', fontWeight: 'bold', border: 'none', borderRadius: '5px'
	};

	return (
		<div style={{ /* ... estilos container ... */ position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT, margin: '0 auto', border: '2px solid white', boxSizing: 'content-box' }}>
			<canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ display: 'block', backgroundColor: 'black' }} />

			{uiState === 'loading' && (
				<div style={overlayStyle}>
					<h1>{statusMessage}</h1> {/* Mostramos "Buscando oponente..." */}
				</div>
			)}

			{uiState === 'countdown' && (
				<div style={{ ...overlayStyle, backgroundColor: 'transparent' }}>
					<h1 style={{ fontSize: '6em', color: countdown === 0 ? '#FFFF00' : 'white', textShadow: '2px 2px 4px #000' }}>
						{countdown === 0 ? 'GO!' : countdown}
					</h1>
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
	);
};

export default PongGame;