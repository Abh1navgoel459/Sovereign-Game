# Sovereign + ZDBGame Setup

This repo now has two apps:

- Landing/marketing site: `http://localhost:3000`
- ZDBGame base prototype: `http://localhost:3001`

## One-time setup

```bash
npm install
npm run install:game
```

## Run both together

```bash
npm run start:all
```

## Run separately

Landing only:

```bash
npm run start:landing
```

Game only:

```bash
npm run start:game
```

## Notes

- Your current landing page remains the marketing entry point.
- The "Launch Prototype" button now routes through `/play` on the landing server.
- By default, `/play` redirects to `http://localhost:3001`. Override with `GAME_URL` in `.env`.
- Keep building game logic inside `ZDBGame/` using existing memory/events patterns.

## Enable AIKit nation responses

Create `ZDBGame/.env.local` with:

```bash
AIKIT_ENABLED=true
AIKIT_PROVIDER=openai
AIKIT_MODEL=gpt-4o-mini
AIKIT_API_KEY=your_key_here
# Optional if using OpenAI-compatible gateway
AIKIT_BASE_URL=
```

If AIKit env vars are missing/disabled, the game uses deterministic response text while keeping the same trust/agenda mechanics.
