You are building a minimal live-demo app for a 1-hour workshop called “Building AI-Native Game Worlds.”

Your goal is to generate a working prototype in minutes that demonstrates an AI-native game backend using a very small Moonvale game world.

Build the app with these constraints:

STACK
- Use Next.js App Router
- Use TypeScript
- Use Tailwind for basic styling
- Keep everything lightweight and easy to run locally
- Use simple server routes or route handlers under /app/api
- Use local mock data or a simple in-memory/file-backed store if ZeroDB credentials are not present
- If environment variables for ZeroDB are present, organize the data layer so it can be swapped to ZeroDB easily
- The app must still work without external services
- Optimize for demo reliability, simplicity, and clarity over completeness

PRIMARY DEMO GOAL
Show that a game world can:
1. remember the player
2. retrieve lore context
3. react to gameplay actions
4. display persistent NPC memory
5. trigger a world event after repeated player actions

APP NAME
- Moonvale Demo
- Subtitle: AI-Native Game World Prototype

WORLD SETTING
- World name: Moonvale
- NPC name: Elarin
- NPC role: Village Historian
- Location: Moonvale
- Tone: fantasy, mysterious, lightly cinematic, but simple and readable for demo purposes

REQUIRED DEMO FLOW
The instructor must be able to:
1. create a player
2. ask Elarin “What happened to Ember Tower?”
3. get a lore-informed answer
4. click “Fight Wolf” three times
5. trigger a world event called “Wolf Pack Retreat”
6. talk to Elarin again
7. see Elarin reference the player’s past actions
8. view NPC memory records in the UI

BUILD A SINGLE-PAGE DASHBOARD
Create one clean page with these sections:

1. Header
- Title: Moonvale Demo
- Subtitle: AI-Native Game World Prototype
- Short explanatory text:
  “This demo shows persistent player state, NPC memory, lore retrieval, gameplay telemetry, and emergent world events.”

2. Player Panel
- Button: Create Demo Player
- Display current player info after creation:
  - username
  - class
  - level
  - xp
- Use a seeded default player like:
  - username: TobyTheExplorer
  - class: Ranger
  - level: 1
  - xp: 0

3. NPC Chat Panel
- Label: Talk to Elarin
- Text input for player message
- Send button
- Show a chat history or at least latest player message + NPC response
- NPC response logic must use:
  - lore retrieval
  - NPC memory
  - some basic response composition
- Do not rely on external AI APIs
- Implement deterministic or template-based generation so it always works live

4. Actions Panel
Include buttons:
- Explore Forest
- Fight Wolf
- Help Village

Each action should:
- create a gameplay event
- update visible event history
- possibly update NPC memory when relevant

5. World Events Panel
- Display triggered world events
- The key event is:
  - Wolf Pack Retreat
  - Description: “Wolf activity around Moonvale has suddenly decreased.”
- This event should trigger automatically once the player has 3 wolf_kill events
- Make sure it triggers only once

6. NPC Memory Viewer
- Show all NPC memories for the player in a visible list
- Example memories:
  - Player asked about Ember Tower
  - Player defeated wolves near Moonvale
  - Player helped the village
- This section should be very obvious because it is one of the main demo moments

7. Gameplay Event Log
- Show the recent gameplay events in reverse chronological order
- Examples:
  - npc_conversation
  - explore
  - wolf_kill
  - help_village

DATA MODELS
Implement simple TypeScript types/interfaces for:

Player
- id: string
- username: string
- class: string
- level: number
- xp: number

NPC
- id: string
- name: string
- role: string
- location: string

NPCMemory
- id: string
- npcId: string
- playerId: string
- memory: string
- importance: number
- createdAt: string

LoreEntry
- id: string
- title: string
- content: string
- tags: string[]

GameEvent
- id: string
- playerId: string
- type: string
- description: string
- timestamp: string

WorldEvent
- id: string
- name: string
- description: string
- timestamp: string

SEED DATA
Seed exactly one NPC:
- Elarin
- role: Village Historian
- location: Moonvale

Seed at least these lore entries:
1. Title: The Fall of Ember Tower
   Content: “The Ember Tower collapsed after a magical experiment went wrong many years ago, scattering ash and arcane debris across the valley.”
   Tags: ember tower, collapse, magic, history

2. Title: Founding of Moonvale
   Content: “Moonvale was founded by the Forest Guild as a settlement devoted to protecting the ancient woods and preserving old knowledge.”
   Tags: moonvale, founding, forest guild

3. Title: Wolves of the Northern Forest
   Content: “Wolves often attack travelers near the northern forest, especially when food is scarce or the woods are disturbed.”
   Tags: wolves, northern forest, danger

NPC RESPONSE LOGIC
Implement a deterministic NPC response generator:
- When player asks about Ember Tower, retrieve the Ember Tower lore entry and summarize it in a lore-informed answer
- When player asks about Moonvale, retrieve Moonvale lore
- When player asks about wolves or danger, retrieve wolves lore
- Also incorporate memory references when present

Example behavior:
- First time asking about Ember Tower:
  “Ember Tower fell after a magical experiment went terribly wrong. The valley still remembers the damage.”
- After the player kills 3 wolves and talks again:
  “You’ve already changed the balance around Moonvale. I heard you drove the wolves back. As for Ember Tower...”
- Keep responses short, reliable, and demo-friendly

MEMORY RULES
Store NPC memories when:
- player asks about Ember Tower
  add memory: “Player asked about Ember Tower”
- player uses Explore Forest
  add memory: “Player explored the northern forest”
- player fights wolves
  after at least one wolf fight, add memory: “Player defeated wolves near Moonvale”
- player helps village
  add memory: “Player helped the village”
- avoid creating exact duplicate memory entries repeatedly
- prefer updating memory list only when a meaningful new event occurs

WORLD EVENT RULE
When wolf_kill count for the player reaches 3 or more:
- create a world event:
  - name: Wolf Pack Retreat
  - description: Wolf activity around Moonvale has suddenly decreased.
- only create this once
- surface it in the World Events panel immediately

STATE MANAGEMENT
- Keep state simple and reliable
- Use server-side route handlers plus client fetches, or a clean local state pattern
- If using file-backed JSON for persistence, keep it very simple
- The demo should survive page refresh if practical, but this is optional
- Reliability matters more than sophistication

API ROUTES
Create clean route handlers for:
- POST /api/player/create
- GET /api/player/current
- POST /api/npc/talk
- POST /api/event/create
- GET /api/events
- GET /api/world
- GET /api/memories

These can use local storage abstractions internally

PROJECT STRUCTURE
Generate a tidy project structure with:
- app/page.tsx
- app/api/... routes
- lib/types.ts
- lib/data.ts
- lib/game-engine.ts
- lib/npc.ts
- README.md
- .env.example

CODE QUALITY
- Keep code readable and modular
- Add comments only where useful
- Do not overengineer
- Avoid unnecessary dependencies
- Make the UI visually clean with cards/panels and clear buttons
- Use basic Tailwind styling only
- Make it look presentable for a workshop

README REQUIREMENTS
Write a README that includes:
- project name
- what the demo shows
- how to install
- how to run
- demo script for the instructor:
  1. create player
  2. ask about Ember Tower
  3. fight wolf 3 times
  4. observe Wolf Pack Retreat
  5. talk to Elarin again
  6. inspect NPC memory viewer

IMPORTANT
- The demo must work without OpenAI, Anthropic, or any paid API
- The app should feel “AI-native” through memory + lore retrieval + world reaction logic
- Favor deterministic logic over fragile AI calls
- Make the implementation polished enough to demo live in front of an audience
- Seed the app automatically so it works immediately after startup

FINAL TASK
Generate the full codebase now.
Create all files with complete code.
Do not leave placeholders.
Do not just describe the solution.
Actually produce the implementation.
