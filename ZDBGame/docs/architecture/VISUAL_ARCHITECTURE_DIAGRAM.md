# Moonvale Visual Architecture Diagram

**Version:** 1.0
**Project:** ZDBGame Workshop Demo
**Last Updated:** 2026-03-12

---

## Complete System Architecture (Single Page View)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         MOONVALE GAME WORLD ARCHITECTURE                     ┃
┃                         Workshop Demo - Offline First                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────────────────┐
│                          LAYER 1: PRESENTATION                               │
│                          (React + Next.js)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      app/page.tsx (Dashboard)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│         ┌─────────────┬───────────┼───────────┬───────────┬─────────────┐  │
│         │             │           │           │           │             │  │
│         ▼             ▼           ▼           ▼           ▼             ▼  │
│  ┌───────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │  Player   │ │   NPC    │ │ Actions │ │  World  │ │ Memory  │ │ Event  ││
│  │  Panel    │ │   Chat   │ │  Panel  │ │ Events  │ │ Viewer  │ │  Log   ││
│  │           │ │  Panel   │ │         │ │  Panel  │ │         │ │        ││
│  │ - Create  │ │ - Input  │ │ - Explore│ │ - Wolf  │ │ - List  │ │ - Recent│
│  │ - Display │ │ - Send   │ │ - Fight │ │   Pack  │ │   all   │ │   events│
│  │   info    │ │ - History│ │ - Help  │ │   Retreat│ │   mems  │ │         │
│  └───────────┘ └──────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘│
│         │             │           │           │           │             │  │
│         └─────────────┴───────────┴───────────┴───────────┴─────────────┘  │
│                                   │                                          │
│                          HTTP Fetch (JSON)                                   │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LAYER 2: API ROUTES                                 │
│                     (Next.js Route Handlers)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ POST /api/      │  │ POST /api/      │  │ POST /api/      │            │
│  │ player/create   │  │ npc/talk        │  │ event/create    │            │
│  │                 │  │                 │  │                 │            │
│  │ - Generate ID   │  │ - Get NPC       │  │ - Generate ID   │            │
│  │ - Create player │  │ - Search lore   │  │ - Store event   │            │
│  │ - Return data   │  │ - Get memories  │  │ - Return data   │            │
│  └─────────────────┘  │ - Generate resp │  └─────────────────┘            │
│                       │ - Store memory  │                                   │
│  ┌─────────────────┐  └─────────────────┘  ┌─────────────────┐            │
│  │ GET /api/       │                        │ GET /api/       │            │
│  │ player/current  │  ┌─────────────────┐  │ world           │            │
│  │                 │  │ GET /api/       │  │                 │            │
│  │ - Fetch player  │  │ events          │  │ - Check rules   │            │
│  │ - Return data   │  │                 │  │ - Trigger event │            │
│  └─────────────────┘  │ - Get all events│  │ - Return state  │            │
│                       │ - Return list   │  └─────────────────┘            │
│  ┌─────────────────┐  └─────────────────┘                                   │
│  │ GET /api/       │                                                        │
│  │ memories        │                                                        │
│  │                 │                                                        │
│  │ - Fetch all     │                                                        │
│  │ - Return list   │                                                        │
│  └─────────────────┘                                                        │
│         │                       │                       │                   │
│         └───────────────────────┴───────────────────────┘                   │
│                                 │                                            │
│                        Direct Imports                                        │
└─────────────────────────────────┼──────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LAYER 3: BUSINESS LOGIC                                │
│                  (Game Rules + NPC System + Lore)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              lib/game-engine/rules.ts (GameRules)                    │   │
│  │                                                                      │   │
│  │  async checkWolfPackRetreat(storage, playerId) {                    │   │
│  │    const events = await storage.getGameEvents(playerId);            │   │
│  │    const wolfKills = events.filter(e => e.type === 'wolf_kill');    │   │
│  │                                                                      │   │
│  │    if (wolfKills.length >= 3) {                                     │   │
│  │      // Trigger "Wolf Pack Retreat" world event                     │   │
│  │      return await storage.createWorldEvent({                        │   │
│  │        name: 'Wolf Pack Retreat',                                   │   │
│  │        description: 'Wolf activity has decreased.'                  │   │
│  │      });                                                             │   │
│  │    }                                                                 │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │    lib/npc/response-generator.ts (NPCResponseGenerator)              │   │
│  │                                                                      │   │
│  │  generateResponse(message, lore, memories) {                        │   │
│  │    // Pattern matching                                              │   │
│  │    if (message.includes("ember tower")) {                           │   │
│  │      const template = TEMPLATES.emberTower;                         │   │
│  │      const hasWolfMemory = memories.some(m =>                       │   │
│  │        m.memory.includes("defeated wolves")                         │   │
│  │      );                                                              │   │
│  │      return hasWolfMemory                                           │   │
│  │        ? `${TEMPLATES.wolfVictory} ${template}`                     │   │
│  │        : template;                                                  │   │
│  │    }                                                                 │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │         lib/lore/search.ts (LoreSearchEngine)                        │   │
│  │                                                                      │   │
│  │  searchByKeywords(query, lore) {                                    │   │
│  │    const keywords = query.toLowerCase().split(' ');                 │   │
│  │    return lore.filter(entry => {                                    │   │
│  │      const text = `${entry.title} ${entry.content}`;                │   │
│  │      return keywords.some(kw => text.includes(kw));                 │   │
│  │    });                                                               │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                        Interface Usage                                       │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LAYER 4: DATA ACCESS                                  │
│                       (Storage Adapters)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │          lib/storage/adapter.ts (StorageAdapter Interface)           │   │
│  │                                                                      │   │
│  │  interface StorageAdapter {                                         │   │
│  │    createPlayer(player: Player): Promise<Player>;                   │   │
│  │    getNPCByName(name: string): Promise<NPC | null>;                 │   │
│  │    addMemory(memory: NPCMemory): Promise<NPCMemory>;                │   │
│  │    searchLore(query: string): Promise<LoreEntry[]>;                 │   │
│  │    createGameEvent(event: GameEvent): Promise<GameEvent>;           │   │
│  │    createWorldEvent(event: WorldEvent): Promise<WorldEvent>;        │   │
│  │    // ... more methods                                              │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                 ┌─────────────────┴─────────────────┐                       │
│                 │                                   │                       │
│                 ▼                                   ▼                       │
│  ┌──────────────────────────────┐   ┌──────────────────────────────────┐  │
│  │  lib/storage/                │   │  lib/storage/                    │  │
│  │  file-storage.ts             │   │  zerodb-storage.ts (future)      │  │
│  │                              │   │                                  │  │
│  │  class FileStorageAdapter    │   │  class ZeroDBStorageAdapter      │  │
│  │    implements StorageAdapter │   │    implements StorageAdapter     │  │
│  │                              │   │                                  │  │
│  │  - readJSON()                │   │  - ZeroDB API calls              │  │
│  │  - writeJSON()               │   │  - Vector search                 │  │
│  │  - Atomic writes             │   │  - Cloud storage                 │  │
│  │  - In-memory cache           │   │  - Scalable                      │  │
│  │                              │   │                                  │  │
│  │  DEFAULT IMPLEMENTATION      │   │  OPTIONAL (if ZERODB_API_KEY)    │  │
│  └──────────────────────────────┘   └──────────────────────────────────┘  │
│                 │                                   │                       │
│                 └─────────────────┬─────────────────┘                       │
│                                   │                                          │
│                            File I/O / API                                    │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LAYER 5: STORAGE                                    │
│                         (JSON Files)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  data/                                                                       │
│  ├── players.json          [{ id, username, class, level, xp }]             │
│  ├── npcs.json             [{ id, name, role, location }]                   │
│  ├── memories.json         [{ id, npcId, playerId, memory, importance }]    │
│  ├── lore.json             [{ id, title, content, tags[] }]                 │
│  ├── events.json           [{ id, playerId, type, description, timestamp }] │
│  └── world_events.json     [{ id, name, description, timestamp }]           │
│                                                                              │
│  Seed Data (Auto-populated on first run):                                   │
│  - Elarin (NPC Historian)                                                   │
│  - 3 Lore Entries (Ember Tower, Moonvale, Wolves)                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                              TYPE SYSTEM                                     ┃
┃                    (Shared Across All Layers)                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

lib/types.ts

  Player          NPC             NPCMemory       LoreEntry       GameEvent
  ├─ id           ├─ id           ├─ id           ├─ id           ├─ id
  ├─ username     ├─ name         ├─ npcId        ├─ title        ├─ playerId
  ├─ class        ├─ role         ├─ playerId     ├─ content      ├─ type
  ├─ level        ├─ location     ├─ memory       ├─ tags[]       ├─ description
  └─ xp           └─ ...          ├─ importance   └─ ...          └─ timestamp
                                  └─ createdAt

  WorldEvent      NPCTalkRequest  NPCTalkResponse
  ├─ id           ├─ playerId     ├─ npcName
  ├─ name         └─ message      └─ response
  ├─ description
  └─ timestamp

```

---

## Data Flow: Wolf Kill → World Event Trigger

```
┌──────────┐
│  User    │  1. Clicks "Fight Wolf" button
└────┬─────┘
     │
     ▼
┌─────────────────────────┐
│ ActionsPanel.tsx        │  2. Sends POST request
│ (UI Component)          │
└────┬────────────────────┘
     │
     │ HTTP: POST /api/event/create
     │ Body: { playerId, type: "wolf_kill" }
     │
     ▼
┌─────────────────────────────────────┐
│ app/api/event/create/route.ts       │  3. Creates game event
│                                     │
│ - Generate event ID                 │
│ - storage.createGameEvent({         │
│     type: "wolf_kill",              │
│     description: "Defeated a wolf"  │
│   })                                │
└────┬────────────────────────────────┘
     │
     │ Append to events.json
     │
     ▼
┌─────────────────────────┐
│ data/events.json        │  4. Event stored
│                         │
│ [                       │     Wolf Kill Count:
│   { type: "wolf_kill" },│     ▲ First kill
│   { type: "wolf_kill" },│     ▲ Second kill
│   { type: "wolf_kill" } │     ▲ THIRD KILL ← TRIGGER!
│ ]                       │
└─────────────────────────┘
     │
     │ UI polls: GET /api/world?playerId=xxx
     │
     ▼
┌──────────────────────────────────────────┐
│ app/api/world/route.ts                   │  5. Check trigger rule
│                                          │
│ GameRules.checkWolfPackRetreat(storage)  │
│   │                                      │
│   ├─ Get all game events                │
│   ├─ Filter: type === "wolf_kill"       │
│   ├─ Count: 3 kills found                │
│   │                                      │
│   └─ IF count >= 3 THEN:                │
│       storage.createWorldEvent({         │
│         name: "Wolf Pack Retreat",       │
│         description: "Wolf activity..."  │
│       })                                 │
└────┬─────────────────────────────────────┘
     │
     │ Write to world_events.json
     │
     ▼
┌─────────────────────────────────┐
│ data/world_events.json          │  6. World event created
│                                 │
│ [{                              │
│   id: "event-uuid",             │
│   name: "Wolf Pack Retreat",    │
│   description: "Wolf activity   │
│                around Moonvale   │
│                has decreased."   │
│ }]                              │
└────┬────────────────────────────┘
     │
     │ Response: { worldEvents: [...], newEventTriggered: true }
     │
     ▼
┌──────────────────────────┐
│ WorldEventsPanel.tsx     │  7. Display world event
│                          │
│ ┌──────────────────────┐ │
│ │  WORLD EVENT!        │ │
│ │                      │ │
│ │  Wolf Pack Retreat   │ │
│ │                      │ │
│ │  Wolf activity has   │ │
│ │  suddenly decreased. │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

---

## Module Dependency Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCY DIRECTION                        │
│                  (All arrows point downward only)                   │
└────────────────────────────────────────────────────────────────────┘

app/page.tsx
  │
  ├── import PlayerPanel from '@/components/PlayerPanel'
  ├── import NPCChatPanel from '@/components/NPCChatPanel'
  ├── import ActionsPanel from '@/components/ActionsPanel'
  └── import type { Player, WorldEvent } from '@/lib/types'
        │
        ▼
components/PlayerPanel.tsx
  │
  └── import type { Player } from '@/lib/types'
        │
        │ (HTTP call to API route, not import)
        │
        ▼
app/api/player/create/route.ts
  │
  ├── import { getStorage } from '@/lib/storage/file-storage'
  ├── import { generateId } from '@/lib/utils/id-generator'
  └── import type { Player } from '@/lib/types'
        │
        ├────────────────────┬────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
lib/storage/          lib/utils/          lib/types.ts
file-storage.ts       id-generator.ts     (Pure types)
  │                    │
  ├── import { StorageAdapter } from './adapter'
  ├── import fs from 'fs'
  ├── import path from 'path'
  └── import type { Player, NPC, ... } from '@/lib/types'
        │
        ▼
lib/storage/adapter.ts
  │
  └── import type { Player, NPC, ... } from '@/lib/types'

┌────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCY RULES                            │
├────────────────────────────────────────────────────────────────────┤
│  ✓ Presentation → API Routes (HTTP)                                │
│  ✓ API Routes → Business Logic (import)                            │
│  ✓ Business Logic → Storage Adapter (import interface)             │
│  ✓ Storage Adapter → Types (import types)                          │
│  ✗ Business Logic → API Routes (FORBIDDEN)                         │
│  ✗ Storage → Business Logic (FORBIDDEN)                            │
│  ✗ Any circular dependencies (FORBIDDEN)                           │
└────────────────────────────────────────────────────────────────────┘
```

---

## NPC Response Generation Flow

```
User types: "What happened to Ember Tower?"
  │
  ▼
POST /api/npc/talk { playerId, message }
  │
  ├─────────────────────┬─────────────────────┬────────────────────┐
  │                     │                     │                    │
  ▼                     ▼                     ▼                    ▼
Get NPC           Get All Lore        Get Memories      Response
(Elarin)          (3 entries)         (player+npc)      Generator
  │                     │                     │                    │
  │                     │                     │                    │
  │   ┌─────────────────┼─────────────────────┼────────────────────┘
  │   │                 │                     │
  │   │                 │                     │
  ▼   ▼                 ▼                     ▼
┌────────────────────────────────────────────────────────────┐
│  NPCResponseGenerator.generateResponse(message, lore, mems)│
│                                                            │
│  Step 1: Extract keywords from message                    │
│          → ["ember", "tower"]                              │
│                                                            │
│  Step 2: Pattern matching                                 │
│          if (message.includes("ember tower")) {           │
│            template = TEMPLATES.emberTower                │
│          }                                                 │
│                                                            │
│  Step 3: Check for context in memories                    │
│          hasWolfMemory = memories.some(m =>               │
│            m.memory.includes("defeated wolves")           │
│          )                                                 │
│                                                            │
│  Step 4: Build context-aware response                     │
│          if (hasWolfMemory) {                             │
│            return `${TEMPLATES.wolfVictory} ${template}`  │
│          } else {                                          │
│            return template                                │
│          }                                                 │
└────────────────────────────────────────────────────────────┘
  │
  ▼
Response: "The Ember Tower fell after a magical experiment..."
  │
  │ Store memory for future context
  │
  ▼
Add to memories.json:
  { memory: "Player asked about Ember Tower", importance: 1 }
  │
  ▼
Return to UI:
  { npcName: "Elarin", response: "The Ember Tower fell..." }
  │
  ▼
UI displays in chat panel
```

---

## File Storage Atomic Write Pattern

```
┌────────────────────────────────────────────────────────────────┐
│           Atomic Write (Prevents File Corruption)              │
└────────────────────────────────────────────────────────────────┘

Step 1: Read existing data
  │
  ▼
data/players.json
  [{ existing player }]
  │
  ▼
Step 2: Append new data in memory
  │
  ▼
  [{ existing player }, { new player }]
  │
  ▼
Step 3: Write to TEMPORARY file
  │
  ▼
data/players.json.tmp  (atomic write in progress)
  │
  ▼
Step 4: Atomic rename (OS-level operation, cannot corrupt)
  │
  ▼
mv players.json.tmp → players.json
  │
  ▼
Step 5: Update in-memory cache
  │
  ▼
cache.set('players.json', data)
  │
  ▼
SUCCESS: File safely updated

┌────────────────────────────────────────────────────────────────┐
│  If ANY error occurs before Step 4:                            │
│  - Original file remains intact                                │
│  - Temp file deleted                                           │
│  - No data corruption possible                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Visual

```
┌────────────────────────────────────────────────────────────────┐
│                     TECHNOLOGY STACK                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend                   Backend                   Storage   │
│  ┌────────────┐            ┌────────────┐           ┌────────┐ │
│  │ React 18+  │            │  Next.js   │           │  JSON  │ │
│  │            │            │  14+ App   │           │  Files │ │
│  │ - Server   │            │  Router    │           │        │ │
│  │   Components│           │            │           │ - Atomic│
│  │ - Client   │            │ - Route    │           │   writes│
│  │   Components│           │   Handlers │           │ - Cache │
│  └────────────┘            │ - API      │           └────────┘ │
│                            │   Routes   │                      │
│  Styling                   └────────────┘           Optional   │
│  ┌────────────┐                                    ┌─────────┐ │
│  │ Tailwind   │            Language                │ ZeroDB  │ │
│  │ CSS 3+     │            ┌────────────┐          │ (Future)│ │
│  │            │            │ TypeScript │          │         │ │
│  │ - Utility  │            │ 5+         │          │ - Vector│ │
│  │   classes  │            │            │          │   search│ │
│  │ - No custom│            │ - Strict   │          │ - Cloud │ │
│  │   CSS      │            │   mode     │          │   scale │ │
│  └────────────┘            │ - Type-safe│          └─────────┘ │
│                            └────────────┘                      │
│                                                                 │
│  Runtime                                                        │
│  ┌────────────┐                                                │
│  │ Node.js    │                                                │
│  │ 18+        │                                                │
│  └────────────┘                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

ZERO EXTERNAL DEPENDENCIES:
  ✗ No AI APIs (OpenAI, Anthropic, etc.)
  ✗ No database server required
  ✗ No authentication service
  ✗ No state management library (Redux, Zustand)
  ✗ No external API calls

  ✓ Works 100% offline
  ✓ Deterministic behavior
  ✓ Minimal npm install time
```

---

**End of Visual Architecture Diagram**
