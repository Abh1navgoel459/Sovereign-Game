# Sovereign

Sovereign is a global trade strategy game with:
- a landing page and alpha signup flow
- a playable game app built on ZDBGame patterns (state, memory, events, telemetry)

Each round, players handle a major event, make a domestic decision, and negotiate trade deals while managing trust, resources, and corridor health.

## Repo Structure

- `index.html` - landing page
- `server.js` - landing server, signup email endpoint, and `/play` redirect
- `ZDBGame/` - main game app (Next.js + API routes + game logic)
- `scripts/start-all.sh` - starts landing + game together

## Prerequisites

- Node.js 18+
- npm 9+

## Install

```bash
npm install
npm run install:game
```

## Run

Run both apps:

```bash
npm run start:all
```

Or run separately:

```bash
npm run start:landing   # http://localhost:3000
npm run start:game      # http://localhost:3001
```

## URLs

- Landing: `http://localhost:3000`
- Game: `http://localhost:3001`
- Launch route: `http://localhost:3000/play`

`/play` checks game health and redirects if available. If not, it shows a fallback screen.

## Environment

Root `.env` (landing + email):

```env
PORT=3000
GAME_URL=http://localhost:3001

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=abhinavgoel459@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL=abhinavgoel459@gmail.com
```

Game env (`ZDBGame/.env.local`) for optional model-driven behavior:

```env
AIKIT_ENABLED=true
AIKIT_PROVIDER=openai
AIKIT_MODEL=gpt-4o-mini
AIKIT_API_KEY=your_key_here
AIKIT_BASE_URL=
```

If model calls are disabled or unavailable, deterministic fallbacks are used.

## Core Gameplay Loop

1. Resolve turn event
2. Resolve domestic scenario
3. Submit and evaluate one trade proposal
4. Advance round and apply market/corridor updates

## Current Features

- 8 turn event types with branching outcomes
- Dynamic domestic scenarios with direct consequences
- Resource impacts (not only sentiment-style stats)
- 5 nations with trust, pressure, memory, and hidden agendas
- Interactive map with clickable trade corridors
- Progression unlocks (modifiers, advisors, perks)
- Guided onboarding
- Demo mode + recap/metrics export

## Key API Routes

Landing:
- `POST /api/alpha-signup`
- `GET /play`

Game:
- `POST /api/game/start`
- `POST /api/game/:id/turn-event`
- `POST /api/game/:id/domestic`
- `POST /api/game/:id/deal`
- `POST /api/game/:id/advance`
- `GET /api/game/:id/state`
- `GET /api/game/metrics`
- `GET /api/game/metrics/export?format=json|csv`

## Build Check

```bash
npm --prefix ZDBGame run build
```

## Notes

- Secrets are ignored via root `.gitignore`.
- Do not commit real `.env` values.
- Landing and game are intentionally split for speed.
