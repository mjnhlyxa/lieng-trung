# Lieng Card Game

Vietnamese Lieng card game — real-time multiplayer card game with betting.

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Zustand + Socket.IO Client
- **Backend**: FastAPI + Python 3.11 + Motor (async MongoDB) + python-socketio
- **Database**: MongoDB 10.60.184.61:27017
- **Runtime**: Bun (monorepo package manager)

## Project Structure

```
lieng-trung/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # FastAPI backend
├── package.json      # Bun workspace manifest
├── plan/             # Technical plans (C4 docs)
├── design/           # Design system + screens
├── brainstorm.md      # Game concept
└── ac.md             # Acceptance criteria
```

## Setup

```bash
# Install dependencies
bun install

# Start backend (FastAPI + Socket.IO)
bun run dev:api

# Start frontend (Next.js dev server)
bun run dev
```

## Environment Variables

### apps/web (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

### apps/api (.env)
```
MONGODB_URL=mongodb://10.60.184.61:27017
MONGODB_DB_NAME=LiengCardGame
CORS_ORIGIN=http://localhost:3000
```

## Quick Start

```bash
bun install
bun run dev:api &  # Start backend on :8000
bun run dev         # Start frontend on :3000
```

Open http://localhost:3000 to play.
