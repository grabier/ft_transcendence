# ft_transcendence

> A full-stack web application featuring real-time multiplayer games, social features, and a complete user management system — built from scratch as a team's first real web project.

---

## Table of Contents

- [Overview](#overview)
- [Team](#team)
- [Tech Stack](#tech-stack)
- [Modules](#modules)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [API](#api)
- [Browser Support](#browser-support)
- [Internationalization](#internationalization)
- [AI Usage](#ai-usage)

---

## Overview

ft_transcendence is a web platform where users can play **Pong** and **Snake** against each other or an AI opponent in real time, chat with friends, manage their profiles, and interact through a full social system — all in a single-page application.

**21 points** across 13 modules (7 Major + 6 Minor).

---

## Team

| Login | Role | Main Contributions |
|---|---|---|
| [jose-rig](https://github.com/jose-rig) | Architect · Scrum Master | User profiles, social panel, API design, database |
| [jormoral](https://github.com/jormoral) | Developer · Architect | Main page, UI/UX & layout, icon system, Snake game |
| [gmontoro](https://github.com/gmontoro) | Product Owner · Developer | Pong game, API design, database |
| [ppeckham](https://github.com/ppeckham) | Product Owner · Project Manager | Backend, server config, code standards & architecture |

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
| 🎮 Web-based game | Two games: **Pong** and **Snake**. Clear rules, win/loss conditions, 2D. |
| 🌐 Remote players | Two players on separate computers in real time. Latency handling, disconnection recovery, reconnection logic. |
| 🤖 AI Opponent | AI available for both games. Simulates human-like behavior — not perfect play. Adapts to customization options. |
| ⚡ Real-time features | WebSocket-based real-time updates across clients. Graceful connection/disconnection handling. Efficient message broadcasting. |
| 👥 User interaction | Chat (send/receive messages), user profile system, friends system (add/remove, friends list). |
| 🔐 User management & auth | Profile editing, avatar upload (default if none), friends with online status, profile pages. |
| 🔌 Public API | Secured REST API with API key, rate limiting, documentation, and 5+ endpoints (GET / POST / PUT / DELETE). |

### Minor (7)

| Module | Description |
|---|---|
| ⚛️ Frontend framework | Built with **React** |
| 🚀 Backend framework | Built with **Fastify** |
| 🎨 Design system | Custom component library: 10+ reusable components, color palette, typography, and icon set. |
| 🌍 i18n | 3 languages: **English**, **Spanish**, **French**. Full translations, language switcher in UI. |
| 🌐 Browser support | Full compatibility with **Chrome**, **Firefox**, and **Opera**. Consistent UI/UX across all three. |
| 💬 Advanced chat | Block users, invite to games from chat, tournament notifications, profile access from chat, history persistence, typing indicators & read receipts. |
| 🔑 OAuth 2.0 | Remote authentication via **GitHub**. |

> **Total: 21 points**

---

## Database Schema

| Table | Description |
|---|---|
| `Users` | Account info: username, avatar, stats, preferences, OAuth data |
| `Friendships` | Log of friendship and block relationships between users |
| `DMs` | Chat room records between users |
| `Messages` | Individual messages within each chat room |

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

   > ⚠️ Set your machine's IP for the GitHub OAuth redirect and for remote multiplayer.

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
| Chrome | ✅ Fully supported |
| Firefox | ✅ Fully supported |
| Opera | ✅ Fully supported |

---

## Internationalization

| Language | Status |
|---|---|
| 🇬🇧 English | ✅ Complete |
| 🇪🇸 Spanish | ✅ Complete |
| 🇫🇷 French | ✅ Complete |

Language switcher available in the UI. All user-facing text is translatable.

---

## AI Usage

AI tools were used **didactically** throughout the project: to learn new concepts, unblock technical problems, and verify this README against the subject's requirements.

> All implementations are fully understood and can be explained by the team during evaluation.

---

*ft_transcendence — 42 School · Chapter VI*