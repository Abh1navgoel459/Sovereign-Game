# Sovereign

Sovereign is an AI-native global trade strategy game with:
- a landing/alpha signup site
- a playable game app built on ZDBGame patterns (state, memory, events, telemetry)

Players handle high-stakes turn events, make domestic policy decisions, and negotiate with persistent AI nations while managing trust, resources, and trade corridors.

## Repo Structure

- `index.html` - Marketing / hackathon landing page
- `server.js` - Landing server + alpha signup email endpoint + `/play` redirect
- `ZDBGame/` - Main game app (Next.js + API routes + game logic)
- `scripts/start-all.sh` - Runs landing + game together

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

Or separately:

```bash
npm run start:landing   # http://localhost:3000
npm run start:game      # http://localhost:3001
```

## URLs

- Landing: `http://localhost:3000`
- Game: `http://localhost:3001`
- Launch route from landing: `http://localhost:3000/play`

`/play` does a health check and redirects to the game. If game is down, it shows a branded fallback page.

## Environment

Root `.env` (landing/email):

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

Game env (`ZDBGame/.env.local`) optional AI:

```env
AIKIT_ENABLED=true
AIKIT_PROVIDER=openai
AIKIT_MODEL=gpt-4o-mini
AIKIT_API_KEY=your_key_here
AIKIT_BASE_URL=
```

If AI is disabled/unavailable, deterministic fallbacks are used.

## Core Gameplay Loop

Each round:
1. Resolve turn event (branching high-stakes incident)
2. Resolve domestic scenario (treasury/debt/sentiment/resource tradeoffs)
3. Propose and evaluate trade deal with an AI nation
4. Advance round and process market + corridor updates

## Current Feature Set

- 8 turn event types with severity and branching outcomes
- Dynamic domestic scenarios and consequences
- Resource impacts (not just sentiment/approval style stats)
- 5 AI nations with trust, pressure, memory, and hidden agendas
- Interactive map with clickable trade corridors (health/activity/history)
- Progression unlocks (scenario modifiers, advisors, perks)
- Guided first-run UX
- Judge mode + recap/metrics export

## Important API Routes

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
- Root app and game app are intentionally split for hackathon speed.

