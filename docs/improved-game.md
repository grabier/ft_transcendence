Pong Game Enhancements: Physics, UI, and State Management

This update addresses critical gameplay issues regarding framerate independence, screen scaling, and game flow control. Below is a detailed breakdown of how and where each feature was implemented in game.ts.

1. Frame Rate Independence (Delta Time)

The Issue: The game speed was previously tied to the frame rate. On 144Hz monitors, the game ran 2.4x faster than on 60Hz monitors. The Solution: Implemented "Delta Time" (dt). Movement is now calculated in pixels per second rather than pixels per frame.

    Implementation:

        gameLoop(currentTime): Calculates the time difference (dt) between the current frame and the last frame in seconds:
        TypeScript

dt = (currentTime - lastTime) / 1000;

update(dt): All movement calculations now multiply velocity by dt:
TypeScript

        square.x += square.speedX * dt;

        Global Variables: Added let lastTime = 0; to track the timestamp.

2. Responsive Scaling (Fit to Screen)

The Issue: The game used fixed 800x600 rendering, which looked small on large screens or broke on small ones. The Solution: The internal logic remains 800x600 (coordinate system), but the Canvas is visually scaled via CSS and JavaScript to fit the window while maintaining the aspect ratio.

    Implementation:

        loadGame() -> HTML/CSS: Wrapped the canvas in a #gameContainer with position: fixed and display: flex to center it.

        resizeGame() Function: This function calculates the aspect ratio of the window vs. the game (4:3).

            If the window is wider, it fits by height.

            If the window is taller, it fits by width.

            Applies the result to canvas.style.width / height.

        Event Listener: Added window.addEventListener('resize', ...) to adjust automatically if the browser is resized.

3. Game State Machine (Pause & Game Over)

The Issue: The game ran infinitely with no start, pause, or end conditions. The Solution: Implemented a State Machine to manage the game flow.

    Implementation:

        Global Variable: let gameState = 'menu'; (States: 'menu', 'playing', 'paused', 'ended').

        gameLoop(): The physics update(dt) function is ONLY called if gameState === 'playing'. The draw() function runs constantly to render the frozen state during menus.

        Pause Logic: Added a keydown listener for Escape. It toggles state between 'playing' and 'paused'.

        Game Over Logic: Inside update(), scoring checks now compare against winningScore. If reached, state switches to 'ended'.

4. UI Overlays (HTML/CSS)

The Issue: Interaction was needed for the new states (Start button, Restart, etc.). The Solution: Created HTML overlays on top of the Canvas.

    Implementation:

        loadGame(): Injected HTML divs (#menuLayer, #endLayer, #pauseLayer) directly into the DOM.

        CSS Class .overlay-menu: created a shared CSS class to style all menus consistently (centered, dark background, retro font).

        Button Logic: Added Event Listeners to buttons (startBtn, restartBtn, continueBtn) to modify the gameState and hide/show layers.

5. Max Velocity & Physics Improvements

The Issue: The ball could accelerate infinitely or become "stuck" inside paddles/walls. The Solution: Added clamping logic and a speed cap.

    Implementation:

        update() -> Paddle Collisions:

            Clamping: Before reversing speed, the ball's position is forced outside the paddle (square.x = paddle...) to prevent sticking.

            Acceleration Cap: The ball only accelerates (+/- 30) if Math.abs(square.speedX) is below the limit (800). If it exceeds the limit, it only bounces without accelerating.
        TypeScript

if (Math.abs(square.speedX) < 800) ... // Accelerate
else ... // Just bounce