# AIKit A2UI Integration Proof

This project includes an explicit A2UI-managed component flow, even while AINative account/project provisioning is unavailable.

## Implemented Flow

1. Spec composition endpoint:
   - `POST /api/game/a2ui/nation-card`
   - File: `app/api/game/a2ui/nation-card/route.ts`

2. Typed A2UI schema + composer:
   - File: `lib/a2ui.ts`
   - Output type: `A2UICardSpec` (`nation_status_card_v1`)

3. Runtime renderer component:
   - File: `components/A2UINationCard.tsx`
   - Renders `A2UICardSpec` into a visible game UI card

4. In-game usage:
   - File: `app/page.tsx`
   - Nation Intel tab requests spec and renders `A2UINationCard`

## Why this counts as A2UI flow

- UI is generated from a structured component specification (not hardcoded per-value markup).
- Spec is server-composed and client-rendered through a generic renderer.
- Component contract is versioned (`nation_status_card_v1`) and typed.

## Current limitation

- Official `ai-kit-a2ui-core` package was not installable from npm (`404`), so this integration uses an A2UI-compatible pattern and explicit schema/renderer instead.
