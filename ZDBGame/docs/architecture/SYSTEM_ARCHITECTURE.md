# Moonvale AI-Native Game World - System Architecture

**Version:** 1.0
**Project:** ZDBGame Workshop Demo
**Framework:** Next.js 14+ (App Router)
**Purpose:** Offline-first AI-native game world demonstration

---

## Executive Summary

This architecture document defines the technical design for **Moonvale**, a workshop demo showcasing AI-native game worlds with persistent memory, lore retrieval, and event-driven gameplay. The system is designed to work **completely offline** with file-based storage while maintaining the option to swap to ZeroDB when credentials are available.

### Key Architectural Decisions

1. **File-based JSON storage** as primary data layer (no external database required)
2. **Deterministic NPC response system** (no AI API calls)
3. **Event-driven gameplay engine** with rule-based world state transitions
4. **Type-safe data models** throughout the application
5. **Server-side state management** via Next.js API routes
6. **Pluggable storage adapter** pattern for future ZeroDB integration

---

## 1. Requirements Analysis

### Functional Requirements

| Requirement | Implementation Strategy |
|------------|------------------------|
| Player state persistence | JSON file storage with atomic writes |
| NPC memory system | Timestamped memory array with importance scoring |
| Lore retrieval | Simple keyword/tag matching (no vector search for demo) |
| Event-driven gameplay | Rule engine checks event counts and triggers world events |
| World event triggers | Wolf kill counter → "Wolf Pack Retreat" at count=3 |
| UI dashboard | Single-page Next.js component with real-time updates |

### Non-Functional Requirements

| Quality Attribute | Target | Implementation |
|------------------|--------|----------------|
| **Reliability** | 100% offline operation | File-based storage, no network dependencies |
| **Performance** | <100ms API response | In-memory caching of game state |
| **Determinism** | Identical outputs for same inputs | Template-based NPC responses |
| **Simplicity** | Works after `npm install && npm run dev` | Auto-seed data on startup |
| **Workshop-Ready** | 2-5 minute demo execution | Predefined player, NPC, and lore |

### Constraints

- **No external AI APIs** (OpenAI, Anthropic, etc.)
- **No authentication/authorization** (single-player demo)
- **No database server** (file-based storage only)
- **Minimal dependencies** (Next.js + Tailwind CSS)
- **Must work on instructor laptop** (no cloud dependencies)

---

## 2. Proposed Architecture

### High-Level Architecture (C4 Context Diagram)

```
┌─────────────────────────────────────────────────────────┐
│                    Workshop Instructor                   │
│                 (Browser: localhost:3000)                │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Moonvale Game Dashboard (Next.js)          │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Player     │  │  NPC Chat    │  │   Actions    │ │
│  │   Panel      │  │   Panel      │  │    Panel     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ World Events │  │ NPC Memory   │                   │
│  │    Panel     │  │   Viewer     │                   │
│  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ API Routes
                           ▼
┌─────────────────────────────────────────────────────────┐
│              API Layer (Next.js Route Handlers)         │
│                                                          │
│  /api/player/create       /api/npc/talk                │
│  /api/player/current      /api/events                  │
│  /api/event/create        /api/world                   │
│  /api/memories                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Business Logic Layer                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Game Engine  │  │ NPC Response │  │ Lore Search  │ │
│  │   (Rules)    │  │  Generator   │  │   Engine     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Data Access Layer                           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Storage Adapter Interface                 │  │
│  │   (Pluggable: FileStorage | ZeroDBStorage)       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Data Storage                                │
│                                                          │
│  File-based JSON (Default)     OR    ZeroDB (Optional)  │
│  ├── data/players.json                                  │
│  ├── data/npcs.json                                     │
│  ├── data/memories.json                                 │
│  ├── data/lore.json                                     │
│  ├── data/events.json                                   │
│  └── data/world_events.json                             │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Design

### 3.1 Folder Structure (Next.js App Router)

```
/Users/aideveloper/Desktop/ZDBGame/
├── app/
│   ├── page.tsx                    # Main dashboard UI
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Tailwind styles
│   └── api/
│       ├── player/
│       │   ├── create/
│       │   │   └── route.ts        # POST /api/player/create
│       │   └── current/
│       │       └── route.ts        # GET /api/player/current
│       ├── npc/
│       │   └── talk/
│       │       └── route.ts        # POST /api/npc/talk
│       ├── event/
│       │   └── create/
│       │       └── route.ts        # POST /api/event/create
│       ├── events/
│       │   └── route.ts            # GET /api/events
│       ├── memories/
│       │   └── route.ts            # GET /api/memories
│       └── world/
│           └── route.ts            # GET /api/world
├── lib/
│   ├── types.ts                    # TypeScript type definitions
│   ├── storage/
│   │   ├── adapter.ts              # Storage adapter interface
│   │   ├── file-storage.ts         # File-based implementation
│   │   └── zerodb-storage.ts       # ZeroDB implementation (future)
│   ├── game-engine/
│   │   ├── rules.ts                # Gameplay rules (wolf counter)
│   │   ├── world-events.ts         # World event triggers
│   │   └── state-manager.ts        # Game state management
│   ├── npc/
│   │   ├── response-generator.ts   # Deterministic NPC responses
│   │   ├── memory-manager.ts       # NPC memory CRUD operations
│   │   └── templates.ts            # Response templates
│   ├── lore/
│   │   ├── search.ts               # Keyword/tag-based lore search
│   │   └── seed-data.ts            # Initial lore entries
│   └── utils/
│       ├── id-generator.ts         # UUID generation
│       └── logger.ts               # Simple logging utility
├── data/                           # JSON storage directory
│   ├── .gitkeep                    # Keep directory in git
│   └── seed/                       # Seed data templates
│       ├── npcs.json               # Elarin seed data
│       └── lore.json               # Initial lore entries
├── components/
│   ├── PlayerPanel.tsx             # Player creation/display
│   ├── NPCChatPanel.tsx            # NPC conversation UI
│   ├── ActionsPanel.tsx            # Gameplay action buttons
│   ├── WorldEventsPanel.tsx        # World events display
│   ├── MemoryViewer.tsx            # NPC memory list
│   └── EventLog.tsx                # Gameplay event history
├── docs/
│   ├── architecture/
│   │   ├── SYSTEM_ARCHITECTURE.md  # This document
│   │   ├── DATA_FLOW.md            # Data flow diagrams
│   │   └── MODULE_DEPENDENCIES.md  # Dependency graph
│   └── guides/
│       └── DEMO_SCRIPT.md          # Instructor demo walkthrough
├── scripts/
│   ├── seed-data.ts                # Initialize seed data
│   └── reset-demo.ts               # Reset to clean state
├── public/
│   └── moonvale-logo.svg           # Workshop branding
├── .env.example                    # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

### 3.2 Data Layer Architecture

#### Storage Adapter Pattern

```typescript
// lib/storage/adapter.ts
export interface StorageAdapter {
  // Player operations
  createPlayer(player: Player): Promise<Player>;
  getPlayer(id: string): Promise<Player | null>;
  getCurrentPlayer(): Promise<Player | null>;

  // NPC operations
  getNPC(id: string): Promise<NPC | null>;
  getNPCByName(name: string): Promise<NPC | null>;

  // Memory operations
  addMemory(memory: NPCMemory): Promise<NPCMemory>;
  getMemories(playerId: string, npcId: string): Promise<NPCMemory[]>;

  // Lore operations
  searchLore(query: string): Promise<LoreEntry[]>;
  getAllLore(): Promise<LoreEntry[]>;

  // Event operations
  createGameEvent(event: GameEvent): Promise<GameEvent>;
  getGameEvents(playerId: string): Promise<GameEvent[]>;

  // World event operations
  createWorldEvent(event: WorldEvent): Promise<WorldEvent>;
  getWorldEvents(): Promise<WorldEvent[]>;
}
```

#### File Storage Implementation

```typescript
// lib/storage/file-storage.ts
export class FileStorageAdapter implements StorageAdapter {
  private dataDir = path.join(process.cwd(), 'data');
  private cache = new Map<string, any>();

  private async readJSON<T>(filename: string): Promise<T[]> {
    const filepath = path.join(this.dataDir, filename);
    if (!fs.existsSync(filepath)) {
      return [];
    }
    const content = await fs.promises.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }

  private async writeJSON<T>(filename: string, data: T[]): Promise<void> {
    const filepath = path.join(this.dataDir, filename);
    await fs.promises.writeFile(
      filepath,
      JSON.stringify(data, null, 2),
      'utf-8'
    );
    this.cache.set(filename, data); // Update cache
  }

  // Implementation of all adapter methods...
}
```

---

### 3.3 Business Logic Layer

#### Game Engine (Rule-based System)

```typescript
// lib/game-engine/rules.ts
export class GameRules {
  async checkWolfPackRetreat(
    storage: StorageAdapter,
    playerId: string
  ): Promise<WorldEvent | null> {
    const events = await storage.getGameEvents(playerId);
    const wolfKills = events.filter(e => e.type === 'wolf_kill').length;

    if (wolfKills >= 3) {
      const existingEvents = await storage.getWorldEvents();
      const retreatExists = existingEvents.some(
        e => e.name === 'Wolf Pack Retreat'
      );

      if (!retreatExists) {
        return await storage.createWorldEvent({
          id: generateId(),
          name: 'Wolf Pack Retreat',
          description: 'Wolf activity around Moonvale has suddenly decreased.',
          timestamp: new Date().toISOString()
        });
      }
    }

    return null;
  }
}
```

#### NPC Response Generator (Deterministic)

```typescript
// lib/npc/response-generator.ts
export class NPCResponseGenerator {
  private templates = {
    emberTower: [
      "The Ember Tower fell after a magical experiment went terribly wrong.",
      "The valley still remembers the ash and debris from that catastrophic day.",
    ],
    moonvale: [
      "Moonvale was founded by the Forest Guild to protect these ancient woods.",
      "This settlement has always been devoted to preserving old knowledge.",
    ],
    wolves: [
      "Wolves often attack travelers near the northern forest.",
      "They become especially aggressive when food is scarce.",
    ],
    wolfVictory: [
      "I heard you drove the wolves back from Moonvale.",
      "The village owes you gratitude for dealing with the wolf threat.",
    ]
  };

  async generateResponse(
    playerMessage: string,
    lore: LoreEntry[],
    memories: NPCMemory[]
  ): Promise<string> {
    const messageLower = playerMessage.toLowerCase();

    // Check for wolf victory memory
    const hasWolfMemory = memories.some(m =>
      m.memory.includes('defeated wolves')
    );

    // Pattern matching for lore retrieval
    if (messageLower.includes('ember tower')) {
      const response = this.selectTemplate('emberTower');
      return hasWolfMemory
        ? `${this.selectTemplate('wolfVictory')} As for Ember Tower, ${response.toLowerCase()}`
        : response;
    }

    if (messageLower.includes('moonvale') || messageLower.includes('village')) {
      return this.selectTemplate('moonvale');
    }

    if (messageLower.includes('wolf') || messageLower.includes('danger')) {
      return hasWolfMemory
        ? this.selectTemplate('wolfVictory')
        : this.selectTemplate('wolves');
    }

    // Default response
    return "I'm not sure I understand your question. Ask me about Moonvale, Ember Tower, or the wolves.";
  }

  private selectTemplate(category: keyof typeof this.templates): string {
    const options = this.templates[category];
    // Use first template for determinism (or implement seeded random)
    return options[0];
  }
}
```

#### Lore Search Engine (Keyword-based)

```typescript
// lib/lore/search.ts
export class LoreSearchEngine {
  searchByKeywords(query: string, lore: LoreEntry[]): LoreEntry[] {
    const keywords = query.toLowerCase().split(' ');

    return lore.filter(entry => {
      const searchText = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    }).sort((a, b) => {
      // Sort by relevance (number of matching keywords)
      const aMatches = keywords.filter(k =>
        `${a.title} ${a.content}`.toLowerCase().includes(k)
      ).length;
      const bMatches = keywords.filter(k =>
        `${b.title} ${b.content}`.toLowerCase().includes(k)
      ).length;
      return bMatches - aMatches;
    });
  }
}
```

---

### 3.4 API Routes Design

#### POST /api/player/create

```typescript
// app/api/player/create/route.ts
import { getStorage } from '@/lib/storage/adapter';
import { generateId } from '@/lib/utils/id-generator';

export async function POST(request: Request) {
  const storage = getStorage();

  const player = await storage.createPlayer({
    id: generateId(),
    username: 'TobyTheExplorer',
    class: 'Ranger',
    level: 1,
    xp: 0
  });

  return Response.json(player);
}
```

#### POST /api/npc/talk

```typescript
// app/api/npc/talk/route.ts
import { getStorage } from '@/lib/storage/adapter';
import { NPCResponseGenerator } from '@/lib/npc/response-generator';
import { LoreSearchEngine } from '@/lib/lore/search';
import { generateId } from '@/lib/utils/id-generator';

export async function POST(request: Request) {
  const { playerId, message } = await request.json();
  const storage = getStorage();

  // Get NPC
  const npc = await storage.getNPCByName('Elarin');
  if (!npc) {
    return Response.json({ error: 'NPC not found' }, { status: 404 });
  }

  // Search lore
  const loreEngine = new LoreSearchEngine();
  const allLore = await storage.getAllLore();
  const relevantLore = loreEngine.searchByKeywords(message, allLore);

  // Get memories
  const memories = await storage.getMemories(playerId, npc.id);

  // Generate response
  const responseGen = new NPCResponseGenerator();
  const response = await responseGen.generateResponse(
    message,
    relevantLore,
    memories
  );

  // Store memory
  await storage.addMemory({
    id: generateId(),
    npcId: npc.id,
    playerId,
    memory: `Player asked about: ${message}`,
    importance: 1,
    createdAt: new Date().toISOString()
  });

  return Response.json({
    npcName: npc.name,
    response
  });
}
```

#### GET /api/world

```typescript
// app/api/world/route.ts
import { getStorage } from '@/lib/storage/adapter';
import { GameRules } from '@/lib/game-engine/rules';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');

  if (!playerId) {
    return Response.json({ error: 'playerId required' }, { status: 400 });
  }

  const storage = getStorage();
  const rules = new GameRules();

  // Check for triggered world events
  const newEvent = await rules.checkWolfPackRetreat(storage, playerId);

  // Get all world events
  const worldEvents = await storage.getWorldEvents();

  return Response.json({
    worldEvents,
    newEventTriggered: newEvent !== null
  });
}
```

---

### 3.5 Type System (Complete Type Safety)

```typescript
// lib/types.ts

export interface Player {
  id: string;
  username: string;
  class: string;
  level: number;
  xp: number;
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  location: string;
}

export interface NPCMemory {
  id: string;
  npcId: string;
  playerId: string;
  memory: string;
  importance: number;
  createdAt: string;
}

export interface LoreEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

export interface GameEvent {
  id: string;
  playerId: string;
  type: 'explore' | 'wolf_kill' | 'help_village' | 'npc_conversation';
  description: string;
  timestamp: string;
}

export interface WorldEvent {
  id: string;
  name: string;
  description: string;
  timestamp: string;
}

export interface NPCTalkRequest {
  playerId: string;
  message: string;
}

export interface NPCTalkResponse {
  npcName: string;
  response: string;
}
```

---

## 4. Data Flow Diagrams

### 4.1 Player Creation Flow

```
User                    UI                   API Route              Storage
 │                      │                        │                     │
 │  Click "Create"      │                        │                     │
 ├──────────────────────>│                        │                     │
 │                      │  POST /api/player/     │                     │
 │                      │       create           │                     │
 │                      ├───────────────────────>│                     │
 │                      │                        │  createPlayer()     │
 │                      │                        ├────────────────────>│
 │                      │                        │                     │
 │                      │                        │  Write players.json │
 │                      │                        │<────────────────────│
 │                      │  { player }            │                     │
 │                      │<───────────────────────│                     │
 │  Display player info │                        │                     │
 │<─────────────────────│                        │                     │
```

### 4.2 NPC Conversation Flow

```
User                UI               API Route           Business Logic        Storage
 │                  │                    │                      │                 │
 │  Enter message   │                    │                      │                 │
 ├─────────────────>│                    │                      │                 │
 │                  │  POST /api/npc/    │                      │                 │
 │                  │       talk         │                      │                 │
 │                  ├───────────────────>│                      │                 │
 │                  │                    │  getNPCByName()      │                 │
 │                  │                    ├─────────────────────────────────────>│
 │                  │                    │<────────────────────────────────────│
 │                  │                    │                      │                 │
 │                  │                    │  searchLore(query)   │                 │
 │                  │                    ├─────────────────────────────────────>│
 │                  │                    │<────────────────────────────────────│
 │                  │                    │                      │                 │
 │                  │                    │  getMemories()       │                 │
 │                  │                    ├─────────────────────────────────────>│
 │                  │                    │<────────────────────────────────────│
 │                  │                    │                      │                 │
 │                  │                    │  generateResponse()  │                 │
 │                  │                    ├─────────────────────>│                 │
 │                  │                    │<─────────────────────│                 │
 │                  │                    │                      │                 │
 │                  │                    │  addMemory()         │                 │
 │                  │                    ├─────────────────────────────────────>│
 │                  │                    │<────────────────────────────────────│
 │                  │  { response }      │                      │                 │
 │                  │<───────────────────│                      │                 │
 │  Display response│                    │                      │                 │
 │<─────────────────│                    │                      │                 │
```

### 4.3 World Event Trigger Flow

```
User            UI              API Route         Game Engine         Storage
 │              │                   │                   │                 │
 │  Click       │                   │                   │                 │
 │  "Fight      │                   │                   │                 │
 │   Wolf"      │                   │                   │                 │
 ├─────────────>│                   │                   │                 │
 │              │  POST /api/event/ │                   │                 │
 │              │       create      │                   │                 │
 │              ├──────────────────>│                   │                 │
 │              │                   │  createGameEvent()│                 │
 │              │                   ├──────────────────────────────────>│
 │              │                   │<─────────────────────────────────│
 │              │  { event }        │                   │                 │
 │              │<──────────────────│                   │                 │
 │              │                   │                   │                 │
 │              │  GET /api/world   │                   │                 │
 │              ├──────────────────>│                   │                 │
 │              │                   │  checkWolfPack    │                 │
 │              │                   │  Retreat()        │                 │
 │              │                   ├──────────────────>│                 │
 │              │                   │                   │  getGameEvents()│
 │              │                   │                   ├────────────────>│
 │              │                   │                   │<────────────────│
 │              │                   │                   │                 │
 │              │                   │                   │  Count wolf_kill│
 │              │                   │                   │  events >= 3?   │
 │              │                   │                   │                 │
 │              │                   │                   │  createWorld    │
 │              │                   │                   │  Event()        │
 │              │                   │                   ├────────────────>│
 │              │                   │                   │<────────────────│
 │              │                   │<──────────────────│                 │
 │              │  { worldEvents }  │                   │                 │
 │              │<──────────────────│                   │                 │
 │  Show "Wolf  │                   │                   │                 │
 │  Pack        │                   │                   │                 │
 │  Retreat"    │                   │                   │                 │
 │<─────────────│                   │                   │                 │
```

---

## 5. Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│                                                                 │
│  app/page.tsx                                                   │
│      ├── components/PlayerPanel.tsx                             │
│      ├── components/NPCChatPanel.tsx                            │
│      ├── components/ActionsPanel.tsx                            │
│      ├── components/WorldEventsPanel.tsx                        │
│      ├── components/MemoryViewer.tsx                            │
│      └── components/EventLog.tsx                                │
│                      │                                          │
│                      │ (API Fetch)                              │
└──────────────────────┼──────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────┐
│                      ▼         API Layer                        │
│                                                                 │
│  app/api/*/route.ts files                                       │
│      ├── Depends on: lib/storage/adapter.ts                    │
│      ├── Depends on: lib/game-engine/rules.ts                  │
│      ├── Depends on: lib/npc/response-generator.ts             │
│      ├── Depends on: lib/lore/search.ts                        │
│      └── Depends on: lib/types.ts                              │
│                      │                                          │
└──────────────────────┼──────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────┐
│                      ▼    Business Logic Layer                  │
│                                                                 │
│  lib/game-engine/                                               │
│      ├── rules.ts → storage/adapter.ts                          │
│      └── world-events.ts → storage/adapter.ts                   │
│                                                                 │
│  lib/npc/                                                       │
│      ├── response-generator.ts → templates.ts                   │
│      └── memory-manager.ts → storage/adapter.ts                 │
│                                                                 │
│  lib/lore/                                                      │
│      ├── search.ts → types.ts                                   │
│      └── seed-data.ts → types.ts                                │
│                                                                 │
│  All depend on: lib/types.ts                                    │
│                      │                                          │
└──────────────────────┼──────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────┐
│                      ▼    Data Access Layer                     │
│                                                                 │
│  lib/storage/                                                   │
│      ├── adapter.ts (interface)                                 │
│      ├── file-storage.ts → adapter.ts                           │
│      └── zerodb-storage.ts → adapter.ts (future)                │
│                      │                                          │
│  Depends on: lib/types.ts                                       │
│                      │                                          │
└──────────────────────┼──────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────┐
│                      ▼    Storage Layer                         │
│                                                                 │
│  data/ (JSON files)                                             │
│      ├── players.json                                           │
│      ├── npcs.json                                              │
│      ├── memories.json                                          │
│      ├── lore.json                                              │
│      ├── events.json                                            │
│      └── world_events.json                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Technology Stack Justification

### Core Technologies

| Technology | Version | Justification |
|-----------|---------|---------------|
| **Next.js** | 14+ | App Router for modern React patterns, built-in API routes, TypeScript support |
| **TypeScript** | 5+ | Type safety throughout application, better IDE support, fewer runtime errors |
| **Tailwind CSS** | 3+ | Minimal CSS bundle, fast prototyping, workshop-friendly styling |
| **Node.js** | 18+ | Required for Next.js, file system operations |

### No Additional Dependencies

- **No database library** (file-based JSON storage)
- **No state management library** (React hooks + server state)
- **No AI SDK** (deterministic template-based responses)
- **No validation library** (simple TypeScript type checking)

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code quality enforcement |
| Prettier | Code formatting consistency |

---

## 7. Implementation Roadmap

### Phase 1: Foundation (30 minutes)

1. **Project Setup**
   - Initialize Next.js project with TypeScript
   - Configure Tailwind CSS
   - Set up folder structure

2. **Type System**
   - Define all TypeScript interfaces in `lib/types.ts`
   - Create type-safe data models

3. **Storage Layer**
   - Implement `StorageAdapter` interface
   - Implement `FileStorageAdapter`
   - Create seed data templates

### Phase 2: Business Logic (45 minutes)

4. **Game Engine**
   - Implement wolf kill counter rule
   - Implement world event trigger system
   - Create state management utilities

5. **NPC System**
   - Implement response template system
   - Create deterministic response generator
   - Implement memory manager

6. **Lore System**
   - Implement keyword-based search
   - Create seed lore entries
   - Integrate with NPC responses

### Phase 3: API Layer (30 minutes)

7. **API Routes**
   - Implement all 7 API routes
   - Add error handling
   - Test with curl/Postman

### Phase 4: Frontend (60 minutes)

8. **UI Components**
   - Create 6 dashboard panels
   - Implement action buttons
   - Add real-time updates

9. **Styling**
   - Apply Tailwind CSS
   - Create responsive layout
   - Add workshop-ready polish

### Phase 5: Testing & Documentation (45 minutes)

10. **Testing**
    - Manual testing of demo flow
    - Verify deterministic behavior
    - Test offline operation

11. **Documentation**
    - Write README with demo script
    - Create instructor guide
    - Document API endpoints

**Total Estimated Time:** 3.5 hours

---

## 8. Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| File write conflicts (concurrent operations) | Medium | Medium | Atomic writes with temp files + rename |
| JSON file corruption | Low | High | Validate JSON on read, keep backups |
| Template responses seem "dumb" | Medium | Low | Use multiple templates, contextual selection |
| Performance with large event logs | Low | Low | Limit event history to last 100 entries |
| Cross-platform file path issues | Low | Medium | Use `path.join()` everywhere |

### Workshop Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| npm install fails on instructor laptop | Low | Critical | Pre-test on clean machine, document requirements |
| Port 3000 already in use | Medium | Low | Document using `PORT=3001 npm run dev` |
| Seed data doesn't initialize | Low | High | Auto-seed on first API call, provide reset script |
| Demo timing exceeds 5 minutes | Medium | Medium | Practice demo flow, provide step-by-step script |

---

## 9. Success Metrics

### Functional Success Criteria

- [ ] Player creation works without errors
- [ ] NPC responds to "Ember Tower" question with lore-based answer
- [ ] Wolf kill counter increments correctly
- [ ] "Wolf Pack Retreat" triggers after exactly 3 wolf kills
- [ ] NPC memory viewer shows all player interactions
- [ ] Game events log displays in reverse chronological order
- [ ] All UI panels render correctly without console errors

### Performance Success Criteria

- [ ] API responses complete within 100ms
- [ ] Page loads in under 2 seconds
- [ ] No visible lag when clicking action buttons
- [ ] Memory usage stays under 200MB

### Workshop Success Criteria

- [ ] Demo executes in under 5 minutes
- [ ] Works immediately after `npm install && npm run dev`
- [ ] No external network calls required
- [ ] Survives page refresh with state intact
- [ ] Instructor can reset demo to clean state in under 10 seconds

---

## 10. Future Enhancements (Post-Workshop)

### ZeroDB Integration

```typescript
// lib/storage/zerodb-storage.ts
export class ZeroDBStorageAdapter implements StorageAdapter {
  private client: ZeroDBClient;

  constructor() {
    this.client = new ZeroDBClient({
      apiKey: process.env.ZERODB_API_KEY,
      projectId: process.env.ZERODB_PROJECT_ID
    });
  }

  // Implement all adapter methods using ZeroDB API
  // This demonstrates the pluggable architecture
}
```

### Vector-Based Lore Search

- Replace keyword search with actual vector embeddings
- Use ZeroDB vector search capabilities
- Improve response relevance

### Multiplayer Support

- Add session management
- Implement player-to-player interactions
- Shared world events

### Advanced NPC AI

- Integrate Claude API for dynamic responses
- Keep template fallback for offline mode
- Hybrid approach for reliability + creativity

---

## Appendix A: File Placement Rules (Per .ainative/RULES.MD)

### Documentation

- **Architecture docs:** `/Users/aideveloper/Desktop/ZDBGame/docs/architecture/`
- **Guides:** `/Users/aideveloper/Desktop/ZDBGame/docs/guides/`
- **NEVER in root** (except README.md, CLAUDE.md)

### Scripts

- **Seed data script:** `/Users/aideveloper/Desktop/ZDBGame/scripts/seed-data.ts`
- **Reset script:** `/Users/aideveloper/Desktop/ZDBGame/scripts/reset-demo.ts`
- **NEVER in app/ or lib/**

---

## Appendix B: Git Workflow (Zero AI Attribution)

### Correct Commit Format

```
Add NPC response template system

- Implement deterministic response generator
- Create template-based lore retrieval
- Add memory-aware context injection

Refs #1
```

### Forbidden Commit Format

```
Add NPC response template system

- Implement deterministic response generator

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-12 | Initial architecture design | System Architect |

---

**End of System Architecture Document**
