*This project has been created as part of the 42 curriculum by jose-rig, jormoral, gmontoro, ppeckham.*

# ft_transcendence

> A full-stack web application featuring real-time multiplayer games, social features, and a complete user management system — built from scratch as a team's first real web project.

---

## Table of Contents

- [Description](#description)
- [Team](#team)
- [Tech Stack](#tech-stack)
- [Modules](#modules)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [API](#api)
- [Browser Support](#browser-support)
- [Internationalization](#internationalization)
- [Resources](#resources)

---

## Description

**ft_transcendence** is the final project of the 42 core curriculum, representing the culmination of all technical skills acquired throughout the program. This project challenges students to build a complete full-stack web application from the ground up.

**Goal:** Create a modern web platform featuring real-time multiplayer games, a comprehensive social system, and user management — demonstrating proficiency in frontend and backend development, real-time communication, database design, security, and DevOps practices.

**Overview:** This implementation is a single-page application where users can play **Pong** and **Snake** against each other or an AI opponent in real time, chat with friends, manage their profiles, and interact through a complete social system. The project implements a modular architecture achieving **21 points** across 13 modules (7 Major + 6 Minor), covering everything from OAuth authentication and WebSocket communication to internationalization and a public REST API.

---

## Team

| Login | Role | Main Contributions |
|---|---|---|
| [jose-rig](https://github.com/C42joseri) | Architect · Scrum Master | User profiles, social panel, API design, database |
| [jormoral](https://github.com/Baldizzone42) | Developer · Architect | Main page, UI/UX & layout, icon system, Snake game |
| [gmontoro](https://github.com/grabier) | Product Owner · Developer | Pong game, API design, database |
| [ppeckham](https://github.com/patrixampm) | Product Owner · Project Manager | Backend, server config, code standards & architecture i18n |

> Everyone worked across the full stack. The above reflects where each person invested the most.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Express |
| Database | MariaDB |
| Auth | GitHub OAuth 2.0 |
| Real-time | WebSockets |
| Deployment | Docker · Make |

---

## Modules

### Major (7)

| Module | Description |
|---|---|
| Web-based game | Two games: **Pong** and **Snake**. Clear rules, win/loss conditions, 2D. |
| Remote players | Two players on separate computers in real time. Latency handling, disconnection recovery, reconnection logic. |
| AI Opponent | AI available for both games. Simulates human-like behavior — not perfect play. Adapts to customization options. |
| Real-time features | WebSocket-based real-time updates across clients. Graceful connection/disconnection handling. Efficient message broadcasting. |
| User interaction | Chat (send/receive messages), user profile system, friends system (add/remove, friends list). |
| User management & auth | Profile editing, avatar upload (default if none), friends with online status, profile pages. |
| Public API | Secured REST API with API key, rate limiting, documentation, and 5+ endpoints (GET / POST / PUT / DELETE). |

### Minor (7)

| Module | Description |
|---|---|
| Frontend framework | Built with **React** |
| Backend framework | Built with **Fastify** |
| Design system | Custom component library: 10+ reusable components, color palette, typography, and icon set. |
| i18n | 3 languages: **English**, **Spanish**, **French**. Full translations, language switcher in UI. |
| Browser support | Full compatibility with **Chrome**, **Firefox**, and **Opera**. Consistent UI/UX across all three. |
| Advanced chat | Block users, invite to games from chat, tournament notifications, profile access from chat, history persistence, typing indicators & read receipts. |
| OAuth 2.0 | Remote authentication via **GitHub**. |

> **Total: 21 points**

---

## Database Schema

The application uses a relational MariaDB database with four main tables managing users, social relationships, and messaging.

### Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ PK: id          │
│    username     │
│    email        │
│    password     │
│    avatar_url   │
│    is_online    │
│    created_at   │
│    last_login   │
└────────┬────────┘
         │
         │ 1:N relationships
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────────┐
│  FRIENDSHIPS    │  │  DIRECT_MESSAGES    │
│─────────────────│  │─────────────────────│
│ PK: id          │  │ PK: id              │
│ FK: sender_id   │  │ FK: user1_id        │
│ FK: receiver_id │  │ FK: user2_id        │
│    status       │  │    created_at       │
│    created_at   │  └──────────┬──────────┘
│    updated_at   │             │
│    blocked_by   │             │ 1:N
└─────────────────┘             │
                                ▼
                       ┌─────────────────┐
                       │    MESSAGES     │
                       │─────────────────│
                       │ PK: id          │
                       │ FK: dm_id       │
                       │ FK: sender_id   │
                       │    content      │
                       │    type         │
                       │    created_at   │
                       │    invite_score │
                       │    is_read      │
                       └─────────────────┘
```

### Tables

#### **users**
Stores user account information and authentication data.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Unique display name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email for authentication |
| `password` | VARCHAR(255) | NULL | Hashed password (NULL for OAuth users) |
| `avatar_url` | VARCHAR(500) | NULL | Profile picture URL |
| `is_online` | BOOLEAN | DEFAULT FALSE | Current online status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration date |
| `last_login` | TIMESTAMP | NULL | Last login timestamp |

#### **friendships**
Manages friend requests, friendships, and blocked relationships between users.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique friendship record ID |
| `sender_id` | INT | FOREIGN KEY → users(id), NOT NULL | User initiating the relationship |
| `receiver_id` | INT | FOREIGN KEY → users(id), NOT NULL | User receiving the request |
| `status` | ENUM | ('pending', 'accepted', 'blocked') | Relationship status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Request creation time |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last status change |
| `blocked_by` | INT | NULL | User ID who initiated the block |

**Constraints:**
- `UNIQUE(sender_id, receiver_id)` - Prevents duplicate friendship records
- `ON DELETE CASCADE` - Removes friendships when user is deleted

#### **direct_messages**
Represents chat rooms between two users.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique DM room identifier |
| `user1_id` | INT | FOREIGN KEY → users(id), NOT NULL | First participant |
| `user2_id` | INT | FOREIGN KEY → users(id), NOT NULL | Second participant |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | DM room creation time |

**Constraints:**
- `UNIQUE(user1_id, user2_id)` - One DM room per user pair
- `ON DELETE CASCADE` - Removes DM room when either user is deleted

#### **messages**
Individual messages within DM rooms, including game invites and system messages.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique message identifier |
| `dm_id` | INT | FOREIGN KEY → direct_messages(id), NOT NULL | Associated DM room |
| `sender_id` | INT | FOREIGN KEY → users(id), NOT NULL | Message author |
| `content` | TEXT | NULL | Message text content |
| `type` | ENUM | ('text', 'game_invite', 'system') | Message category |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Message timestamp |
| `invite_score` | INT | NULL | Game score for invite messages |
| `is_read` | BOOLEAN | DEFAULT FALSE | Read receipt status |

**Constraints:**
- `ON DELETE CASCADE` - Removes messages when DM room or user is deleted

### Relationships

- **Users → Friendships**: One user can have many friendships (1:N as sender, 1:N as receiver)
- **Users → Direct Messages**: One user can participate in many DM rooms (1:N)
- **Direct Messages → Messages**: One DM room contains many messages (1:N)
- **Users → Messages**: One user can send many messages (1:N)

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- A configured `.env` file

### Setup

1. **Clone the repository**
```bash
   git clone https://github.com/<org>/ft_transcendence.git
   cd ft_transcendence
```

2. **Configure environment variables**

   Place your `.env` file inside the backend directory (`/back/.env`).
```env
   # GitHub OAuth
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   GITHUB_CALLBACK_URL=http://<YOUR_IP>:PORT/auth/github/callback

   # Remote play
   APP_HOST=<YOUR_IP>

   # Database
   DB_HOST=...
   DB_PORT=...
   DB_USER=...
   DB_PASSWORD=...
   DB_NAME=...

   # API
   API_SECRET_KEY=...
```

   > Set your machine's IP for the GitHub OAuth redirect and for remote multiplayer.

3. **Launch**
```bash
   make
```

---

## API

Secured with an API key and rate limiting. Documentation available at `/api/docs` once the server is running.
```
GET    /api/{resource}
POST   /api/{resource}
PUT    /api/{resource}
DELETE /api/{resource}
```

Include your key in the header:
```
Authorization: Bearer <API_SECRET_KEY>
```

---

## Browser Support

| Browser | Status |
|---|---|
| Chrome | Fully supported |
| Firefox | Fully supported |
| Opera | Fully supported |

---

## Internationalization

| Language | Status |
|---|---|
| English | Complete |
| Spanish | Complete |
| French | Complete |

Language switcher available in the UI. All user-facing text is translatable.

---

## Resources

### Documentation & References

**Frontend Development**
- [React Documentation](https://react.dev/) - Component architecture, hooks, and state management
- [Vite](https://vitejs.dev/) - Build tool and development server configuration
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type safety across the application
- [Material-UI (MUI)](https://mui.com/) - React component library for UI design system

**Backend Development**
- [Fastify Documentation](https://fastify.dev/) - High-performance HTTP server framework
- [Node.js Documentation](https://nodejs.org/docs/) - Server-side runtime environment
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) - Real-time bidirectional communication

**Database & Authentication**
- [MariaDB Documentation](https://mariadb.com/kb/en/) - Database design and SQL queries
- [OAuth 2.0 Specification](https://oauth.net/2/) - Authentication flow implementation
- [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps) - Third-party authentication setup

**Game Development**
- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial) - 2D game rendering
- [Game Loop Patterns](https://gameprogrammingpatterns.com/game-loop.html) - Core game architecture
- Classic Pong mechanics and collision detection algorithms

**DevOps & Deployment**
- [Docker Documentation](https://docs.docker.com/) - Container orchestration
- [Docker Compose](https://docs.docker.com/compose/) - Multi-container application management
- [Nginx Documentation](https://nginx.org/en/docs/) - Reverse proxy and static file serving

**Internationalization**
- [i18next](https://www.i18next.com/) - Internationalization framework for JavaScript
- [MDN Internationalization](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) - Native JavaScript i18n APIs

### AI Usage

AI tools (ChatGPT, GitHub Copilot) were used **didactically** throughout the project to accelerate learning and problem-solving:

> **Important:** All AI-generated code was thoroughly reviewed, tested, and understood by the team. Every team member can explain any part of the codebase during evaluation. AI was used as a learning tool, not as a replacement for understanding.

---

*ft_transcendence — 42 School