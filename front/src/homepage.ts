import { loadGame } from './game.js';
import { createElement } from './tools.js';
import { createIcon } from './tools.js';


type GameMode = 'SINGLE PLAYER' | 'MULTIPLAYER' | 'TOURNAMENT';
type Difficulty = 'EASY' | 'NORMAL' | 'INSANE';

interface GameOption {
    title: string;
    icon: string;
    action?: () => void;
}

const GAME_MODES: Record<GameMode, GameOption[]> = {
    'SINGLE PLAYER': [
        { title: 'Difficulty', icon: '🏓', action: () => loadGame() },
        { title: 'Skin', icon: '⚙️' },
        { title: 'Practice', icon: '🎯' }
    ],
    'MULTIPLAYER': [
        { title: 'Local', icon: '👥', action: () => loadGame() },
        { title: 'Online', icon: '🌐' },
        { title: 'Ranking', icon: '🏆' }
    ],
    'TOURNAMENT': [
        { title: 'Local', icon: '4️⃣' },
        { title: 'Online', icon: '8️⃣' },
        { title: 'Custom', icon: '👑' }
    ]
};

//Modos de juego
// Dificultad del juego
// color de bola, invitar amigos
 //Modes{ GameModes, Dificultad, Interfaz Amigos }
 // GameModes {SinglePlayer, Multiplayer, Tournament}
 // Dificultad{Easy, Medium, Hard}
 // Interfaz Amigos{Invitar, Enviar Mensaje, Eliminar}

function createModeSelector(
    currentMode: GameMode,
    onModeChange: (mode: GameMode)  => void)
    : HTMLElement {
    const container = createElement('div', 'mode-selector-container');
    const modes = Object.keys(GAME_MODES) as GameMode[];

    modes.forEach((mode) => {
        const isActive = mode === currentMode;
       
        const className = `mode-tab ${isActive ? 'active' : ''}`;
        const btn = createElement('button', className, {}, [mode]);
        
        btn.addEventListener('click', () => {
            if (currentMode !== mode) {
                onModeChange(mode);
            }
        });
        container.appendChild(btn);
    });
    return container;
}

export function Homepage() {
    const app = document.getElementById("app")!;
    app.innerHTML = '';

    let currentMode: GameMode = 'SINGLE PLAYER';

    // Main Container
    const mainContainer = createElement('div', 'min-h-screen grid-background text-black font-sans selection:bg-[#FACC15] pt-[48px] flex flex-col', {}, []);

    // Header
    const header = createElement('header', 'fixed top-0 left-0 w-full z-50 bg-white border-b-2 border-black flex h-12', {}, [
        // Logo Section (Left)
        createElement('div', 'h-full border-r-2 border-black w-32 flex justify-center items-center bg-black shrink-0', {}, [
            createElement('img', 'h-8 w-auto block object-contain invert', { src: './assets/lyrics-logo.png', alt: 'Transcendence' })
        ]),

        // Marquee Section (Middle - Flex Grow)
        createElement('div', 'marquee-container flex-grow bg-black text-white overflow-hidden flex items-center h-full relative', {}, [
            createElement('div', 'marquee-track flex w-max', {}, [
                createElement('div', 'marquee-content text-sm font-bold uppercase tracking-widest whitespace-nowrap', {}, [
                    'Pong Tournament • Join the Arena • Win Glory • Pong Tournament • Join the Arena • Win Glory • Pong Tournament • Join the Arena • Win Glory • '
                ]),
                createElement('div', 'marquee-content text-sm font-bold uppercase tracking-widest whitespace-nowrap', { 'aria-hidden': 'true' }, [
                    'Pong Tournament • Join the Arena • Win Glory • Pong Tournament • Join the Arena • Win Glory • Pong Tournament • Join the Arena • Win Glory • '
                ])
            ])
        ]),

        // Navigation Section (Right)
        createElement('div', 'h-full border-l-2 border-[#fffff7] w-12 flex justify-center items-center bg-black shrink-0 cursor-pointer hover:bg-neutral-800 transition-colors', { id: 'menu-btn' }, [
            createElement('div', 'flex flex-col gap-1', {}, [
                createElement('span', 'block w-4 h-0.5 bg-[#fffff7]', {}),
                createElement('span', 'block w-4 h-0.5 bg-[#fffff7]', {}),
                createElement('span', 'block w-4 h-0.5 bg-[#fffff7]', {})
            ])
        ])
    ]);
    mainContainer.appendChild(header);

    // Hero Section (Ahora contiene los botones simples)
    const heroSection = createElement('section', 'pt-12 pb-4 px-4 flex flex-col items-center justify-center', {}, []);

    // Content Grid Container
    const gridSection = createElement('section', 'px-4 pb-12', {}, []);
    const gridLayout = createElement('div', 'grid-layout max-w-7xl mx-auto', {}, []);
    gridSection.appendChild(gridLayout);

    // Function to render content
    const renderContent = () => {
        // Clear previous content
        heroSection.innerHTML = '';
        gridLayout.innerHTML = '';

        // Render Simple Selector
        const selector = createModeSelector(currentMode, (newMode) => {
            currentMode = newMode;
            renderContent(); // Re-render on change
        });
        heroSection.appendChild(selector);

        // Render Cards
        const options = GAME_MODES[currentMode];
        options.forEach(opt => {
            const card = createElement('div', 'product-card cursor-pointer', {}, [
                createElement('div', 'bg-gray-200 w-full aspect-[3/4] flex items-center justify-center border-b-2 border-black', {}, [
                    createElement('div', 'text-6xl', {}, [opt.icon])
                ]),
                createElement('div', 'product-title', {}, [opt.title])
            ]);
            if (opt.action) {
                card.addEventListener('click', opt.action);
            }

            gridLayout.appendChild(card);
        });
    };

    // Initial Render
    renderContent();

    mainContainer.appendChild(heroSection);
    mainContainer.appendChild(gridSection);

    // Footer
    const footer = createElement('footer', 'bg-black text-[#fffff7] py-12 px-4 mt-auto', {}, [
        createElement('div', 'max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8', {}, [
            createElement('img', 'h-8 w-auto block object-contain invert', { src: './assets/lyrics-logo.png', alt: 'Transcendence' }),
            createElement('div', 'font-mono text-sm', {}, ['© 2026 All Rights Reserved']),
        ])
    ]);
    mainContainer.appendChild(footer);

    app.appendChild(mainContainer);
}