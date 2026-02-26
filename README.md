# trascendence
pesca montañera
Todo: chat , notification system
Real time collaborative features? que es? 1v1??
Uploading an image with a specific format for Profile Pic? + validations, deletions, only .png .jpg etc

MODULES: WEB
- Major Framework
- Major Websockets(falta chat) (Efficient message broadcasting.)
- 

-----------TODOLIST-----------


- terms of service
- que se pueda buscar a aprtir de una letra, 
- Ocultar la url cuando entramos en una partida
- si seleccionas el chat de un amigo o buscar amigo, automaticamente pueda escribir
- about us con el github de cada uno
- readme 
- limpieza general
- console warnings
- Cuando seleccionas cualquier modalidad de juego (AI, Local o 1V1), en el modal que aparece a continuación siempre aparece Modo: 1 vs 1




-----------TERMINADO-----------19 points
2 - Use a framework for both the frontend and backend
2 - Implement real-time features using WebSockets or similar technology.
2 - Allow users to interact with other users.
2 - Introduce an AI Opponent for games.
2 - Implement a complete web-based game where users can play against each other
2 - Remote players — Enable two players on separate computers to play the same game in real-time
2 - A public API to interact with the database
2 - Standard user management and authentication.
1 - Implement remote authentication with OAuth 2.0
1 - Advanced chat features(acces profile from chat, typing indicator and read receipst)
1 - Custom-made design system with reusable components, including a proper color palette, typography, and icons(hay que hacer cuentas de cuantos tenemos)


----------EN PROGRESO----------5 points
1 - Support for additional browsers(funciona todo en chrome, firefox y opera, faltaria documentar)
1 - Support for multiple languages

-----------NO EMPEZADO----------------8 points
2 - Multiplayer game (more than two players).
2 - Complete accessibility compliance (WCAG 2.1 AA) with screen reader support, keyboard navigation, and assistive technologies.
1 - Right-to-left (RTL) language support
1 - Game statistics and match history
1 - Implement a tournament system
1 - Implement spectator mode for games.



1 - O AUTH
SUBJECT MODULES 
-------Web-----------
Major Use a framework for both the frontend and backend.

Major: Implement real-time features using WebSockets or similar technology.
◦ Real-time updates across clients.
◦ Handle connection/disconnection gracefully.
!!◦ Efficient message broadcasting OJO -> con sockets?

Major: Allow users to interact with other users. The minimum requirements are:
◦ A basic chat system (send/receive messages between users).
!!A profile system (view user information). poner boton pa ver profile de otros
!! ◦ A friends system (add/remove friends, see friends list). FALTA remove friends

!!Major: A public API to interact with the database with a secured API key, rate limiting, documentation, and at least 5 endpoints: FALTA DOCUMENTATION
◦ GET /api/{something}
◦ POST /api/{something}
◦ PUT /api/{something}
◦ DELETE /api/{something}

???• Minor: A complete notification system for all creation, update, and deletion actions ????

??• Minor: Real-time collaborative features (shared workspaces, live editing, collaborative drawing, etc.). 2V1 CONTRA IA??

??Minor: Server-Side Rendering (SSR) for improved performance and SEO.

???• Minor: Progressive Web App (PWA) with offline support and installability.???

??• Minor: Custom-made design system with reusable components, including a proper color palette, typography, and icons (minimum: 10 reusable components).

???Minor: Implement advanced search functionality with filters, sorting, and pagination.??

??Minor: File upload and management system.
◦ Support multiple file types (images, documents, etc.).
◦ Client-side and server-side validation (type, size, format).
◦ Secure file storage with proper access control.
◦ File preview functionality where applicable.
◦ Progress indicators for uploads.
◦ Ability to delete uploaded files.??

----Accessibility and Internationalization---
<PATRICK
Major: Complete accessibility compliance (WCAG 2.1 AA) with screen reader support, keyboard navigation, and assistive technologies. CIEGOS
• Minor: Support for multiple languages (at least 3 languages).
	Implement i18n (internationalization) system.
	At least 3 complete language translations.
	Language switcher in the UI.
	All user-facing text must be translatable.
??• Minor: Right-to-left (RTL) language support. ?? PATRICK>

?? Minor: Support for additional browsers.
◦ Full compatibility with at least 2 additional browsers (Firefox, Safari, Edge,
etc.).
◦ Test and fix all features in each browser.
◦ Document any browser-specific limitations.
◦ Consistent UI/UX across all supported browsers.??

----User Management-------

Major: Standard user management and authentication.
◦ Users can update their profile information.
◦ Users can upload an avatar (with a default avatar if none provided). OJO
◦ Users can add other users as friends and see their online status.
◦ Users have a profile page displaying their information.

Minor: Game statistics and match history (requires a game module).
◦ Track user game statistics (wins, losses, ranking, level, etc.).
◦ Display match history (1v1 games, dates, results, opponents).
◦ Show achievements and progression.
◦ Leaderboard integration.

Minor: Implement remote authentication with OAuth 2.0 (Google, GitHub, 42,
etc.).

Major: An organization system:
◦ Create, edit, and delete organizations.
◦ Add users to organizations.
◦ Remove users from organizations.
◦ View organizations and allow users to perform specific actions within an or-
ganization (minimum: create, read, update).

??Minor: Implement a complete 2FA (Two-Factor Authentication) system for the
users??

??Minor: User activity analytics and insights dashboard. GRAFANA??

----Cybersecurity------
Major: Implement WAF/ModSecurity (hardened) + HashiCorp Vault for secrets:
◦ Configure strict ModSecurity/WAF.
◦ Manage secrets in Vault (API keys, credentials, environment variables), en-
crypted and isolated.


----Gaming and user experience-------

• Major: Implement a complete web-based game where users can play against each
other.
◦ The game can be real-time multiplayer (e.g., Pong, Chess, Tic-Tac-Toe, Card
games, etc.).
◦ Players must be able to play live matches.
◦ The game must have clear rules and win/loss conditions.
◦ The game can be 2D or 3D

FALTA Major: Remote players — Enable two players on separate computers to play thesame game in real-time.
◦ Handle network latency and disconnections gracefully.
◦ Provide a smooth user experience for remote gameplay.
◦ Implement reconnection logic.

FALTA Major: Multiplayer game (more than two players).
◦ Support for three or more players simultaneously.
◦ Fair gameplay mechanics for all participants.
◦ Proper synchronization across all clients.
???Major: Add another game with user history and matchmaking.
◦ Implement a second distinct game.
◦ Track user history and statistics for this game.
◦ Implement a matchmaking system.
◦ Maintain performance and responsiveness.??

Minor: Advanced chat features (enhances the basic chat from "User interaction"
module).
◦ Ability to block users from messaging you.
◦ Invite users to play games directly from chat.
◦ Game/tournament notifications in chat.
◦ Access to user profiles from chat interface.
◦ Chat history persistence.
◦ Typing indicators and read receipt

FALTA Minor: Implement a tournament system.
◦ Clear matchup order and bracket system.
◦ Track who plays against whom.
◦ Matchmaking system for tournament participants.
◦ Tournament registration and management

FALTA Minor: Game customization options.
◦ Power-ups, attacks, or special abilities.
◦ Different maps or themes.
◦ Customizable game settings.
◦ Default options must be available

FALTA? Minor: A gamification system to reward users for their actions.
◦ Implement at least 3 of the following: achievements, badges, leaderboards,
XP/level system, daily challenges, rewards
◦ System must be persistent (stored in database)
◦ Visual feedback for users (notifications, progress bars, etc.)
◦ Clear rules and progression mechanics

Minor: Implement spectator mode for games.
◦ Allow users to watch ongoing games.
◦ Real-time updates for spectators.
◦ Optional: spectator chat.

--DEVOPS----xD
--Data and Analytics---


-----Artificial Intelligence-----

• Major: Introduce an AI Opponent for games.
◦ The AI must be challenging and able to win occasionally.
◦ The AI should simulate human-like behavior (not perfect play).
◦ If you implement game customization options, the AI must be able to use
them.
◦ You must be able to explain your AI implementation during evaluation

??Major: Implement a complete RAG (Retrieval-Augmented Generation) system.
◦ Interact with a large dataset of information.
◦ Users can ask questions and get relevant answers.
◦ Implement proper context retrieval and response generation??

• Major: Implement a complete LLM system interface.
◦ Generate text and/or images based on user input.
◦ Handle streaming responses properly.
◦ Implement error handling and rate limiting.
• Major: Recommendation system using machine learning.
◦ Personalized recommendations based on user behavior.
◦ Collaborative filtering or content-based filtering.
◦ Continuously improve recommendations over time.
• Minor: Content moderation AI (auto moderation, auto deletion, auto warning,
etc.)
• Minor: Voice/speech integration for accessibility or interaction.
• Minor: Sentiment analysis for user-generated content.
• Minor: Image recognition and tagging system????