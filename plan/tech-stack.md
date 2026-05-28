# Lieng — Technology Stack

## 1. Monorepo Architecture

**Package Manager**: Bun 1.x
**Structure**: Bun workspace with 2 apps

```
lieng-trung/
├── apps/
│   ├── web/        # Next.js 14 frontend
│   └── api/        # FastAPI Python backend
├── package.json    # Root workspace manifest
├── bun.lockb
└── tsconfig.base.json
```

## 2. Frontend Stack (apps/web)

| Package | Version | Purpose |
|---------|---------|---------|
| next | 14+ | React SSR framework, App Router |
| react | 18+ | UI library |
| typescript | 5+ | Type safety (strict) |
| tailwindcss | 3.x | Utility-first styling |
| zustand | 4+ | Client game state |
| socket.io-client | 4+ | Real-time Socket.IO client |
| @tanstack/react-query | 5+ | Server state + polling |
| nuqs | 1+ | URL state (roomId in path) |
| framer-motion | 11+ | Card flip animations, showdown |
| react-hot-toast | 2+ | Notifications |
| @radix-ui/react-dialog | 1+ | Accessible Modal primitive |

## 3. Backend Stack (apps/api)

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.100+ | REST + WebSocket framework |
| uvicorn | 0.25+ | ASGI server |
| motor | 3.x | Async MongoDB driver |
| python-socketio | 5.x | Socket.IO server |
| pydantic | 2+ | Data validation |
| python-multipart | 0.0.6 | File uploads (none at MVP) |
| secrets | (stdlib) | Cryptographic random for card shuffle |

## 4. Dev Tools

| Tool | Purpose |
|------|---------|
| bun | Package runner, test runner, build tool |
| prettier | Code formatting |
| eslint | Linting (Next.js recommended config) |
| playwright | E2E testing (MCP tool) |

## 5. Infrastructure

| Service | Usage | Free Tier |
|---------|-------|-----------|
| Vercel | Next.js frontend hosting | 100GB/mo bandwidth |
| Railway | FastAPI backend hosting | $5 credit/mo |
| MongoDB 10.60.184.61:27017 | Database (standalone, pre-provisioned) | N/A — provided IP |
| GitHub (mjnhlyxa) | Source control | Unlimited |
