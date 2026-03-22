# Moonvale Implementation Guide

**Version:** 1.0
**Project:** ZDBGame Workshop Demo
**Audience:** Developers implementing the system
**Last Updated:** 2026-03-12

---

## Quick Start Checklist

- [ ] Read SYSTEM_ARCHITECTURE.md (30 minutes)
- [ ] Review DATA_FLOW.md (20 minutes)
- [ ] Understand MODULE_DEPENDENCIES.md (20 minutes)
- [ ] Initialize Next.js project (5 minutes)
- [ ] Implement type system (10 minutes)
- [ ] Build storage layer (45 minutes)
- [ ] Implement business logic (60 minutes)
- [ ] Create API routes (30 minutes)
- [ ] Build UI components (60 minutes)
- [ ] Test demo flow (30 minutes)

**Total Time:** ~4.5 hours

---

## Phase 1: Project Initialization

### Step 1.1: Create Next.js Project

```bash
cd /Users/aideveloper/Desktop/ZDBGame
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Answer prompts:
# ✓ TypeScript? Yes
# ✓ ESLint? Yes
# ✓ Tailwind CSS? Yes
# ✓ `app/` directory? Yes
# ✓ Import alias (@/*)? Yes
```

### Step 1.2: Create Folder Structure

```bash
# Create directories
mkdir -p lib/storage
mkdir -p lib/game-engine
mkdir -p lib/npc
mkdir -p lib/lore
mkdir -p lib/utils
mkdir -p components
mkdir -p data/seed
mkdir -p scripts
mkdir -p docs/architecture
mkdir -p docs/guides

# Create placeholder files
touch lib/types.ts
touch lib/storage/adapter.ts
touch lib/storage/file-storage.ts
touch lib/game-engine/rules.ts
touch lib/npc/response-generator.ts
touch lib/npc/templates.ts
touch lib/lore/search.ts
touch lib/lore/seed-data.ts
touch lib/utils/id-generator.ts
touch .env.example
```

### Step 1.3: Configure TypeScript

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }],
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Phase 2: Type System Implementation

### Step 2.1: Define Core Types

Create `lib/types.ts`:

```typescript
/**
 * Core type definitions for Moonvale game world
 */

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

export type GameEventType = 'explore' | 'wolf_kill' | 'help_village' | 'npc_conversation';

export interface GameEvent {
  id: string;
  playerId: string;
  type: GameEventType;
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

### Step 2.2: Create Utility Functions

Create `lib/utils/id-generator.ts`:

```typescript
import { randomUUID } from 'crypto';

/**
 * Generate a UUID for entities
 */
export function generateId(): string {
  return randomUUID();
}
```

---

## Phase 3: Storage Layer Implementation

### Step 3.1: Define Storage Adapter Interface

Create `lib/storage/adapter.ts`:

```typescript
import type {
  Player,
  NPC,
  NPCMemory,
  LoreEntry,
  GameEvent,
  WorldEvent
} from '@/lib/types';

/**
 * Storage adapter interface - allows swapping implementations
 */
export interface StorageAdapter {
  // Player operations
  createPlayer(player: Player): Promise<Player>;
  getPlayer(id: string): Promise<Player | null>;
  getCurrentPlayer(): Promise<Player | null>;

  // NPC operations
  getNPC(id: string): Promise<NPC | null>;
  getNPCByName(name: string): Promise<NPC | null>;
  getAllNPCs(): Promise<NPC[]>;

  // Memory operations
  addMemory(memory: NPCMemory): Promise<NPCMemory>;
  getMemories(playerId: string, npcId: string): Promise<NPCMemory[]>;
  getAllMemoriesForPlayer(playerId: string): Promise<NPCMemory[]>;

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

### Step 3.2: Implement File Storage Adapter

Create `lib/storage/file-storage.ts`:

```typescript
import { promises as fs } from 'fs';
import path from 'path';
import type {
  Player,
  NPC,
  NPCMemory,
  LoreEntry,
  GameEvent,
  WorldEvent,
} from '@/lib/types';
import { StorageAdapter } from './adapter';

export class FileStorageAdapter implements StorageAdapter {
  private dataDir = path.join(process.cwd(), 'data');
  private cache = new Map<string, any>();

  constructor() {
    this.ensureDataDir();
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  private async readJSON<T>(filename: string): Promise<T[]> {
    // Check cache first
    if (this.cache.has(filename)) {
      return this.cache.get(filename);
    }

    const filepath = path.join(this.dataDir, filename);

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);
      this.cache.set(filename, data);
      return data;
    } catch (error) {
      // File doesn't exist or invalid JSON - return empty array
      return [];
    }
  }

  private async writeJSON<T>(filename: string, data: T[]): Promise<void> {
    const filepath = path.join(this.dataDir, filename);
    const tempPath = filepath + '.tmp';

    try {
      // Write to temp file first (atomic write pattern)
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');

      // Atomic rename
      await fs.rename(tempPath, filepath);

      // Update cache
      this.cache.set(filename, data);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {}

      throw error;
    }
  }

  // Player operations
  async createPlayer(player: Player): Promise<Player> {
    const players = await this.readJSON<Player>('players.json');
    players.push(player);
    await this.writeJSON('players.json', players);
    return player;
  }

  async getPlayer(id: string): Promise<Player | null> {
    const players = await this.readJSON<Player>('players.json');
    return players.find(p => p.id === id) || null;
  }

  async getCurrentPlayer(): Promise<Player | null> {
    const players = await this.readJSON<Player>('players.json');
    return players[0] || null; // Demo: single player
  }

  // NPC operations
  async getNPC(id: string): Promise<NPC | null> {
    const npcs = await this.readJSON<NPC>('npcs.json');
    return npcs.find(n => n.id === id) || null;
  }

  async getNPCByName(name: string): Promise<NPC | null> {
    const npcs = await this.readJSON<NPC>('npcs.json');
    return npcs.find(n => n.name === name) || null;
  }

  async getAllNPCs(): Promise<NPC[]> {
    return this.readJSON<NPC>('npcs.json');
  }

  // Memory operations
  async addMemory(memory: NPCMemory): Promise<NPCMemory> {
    const memories = await this.readJSON<NPCMemory>('memories.json');
    memories.push(memory);
    await this.writeJSON('memories.json', memories);
    return memory;
  }

  async getMemories(playerId: string, npcId: string): Promise<NPCMemory[]> {
    const memories = await this.readJSON<NPCMemory>('memories.json');
    return memories.filter(
      m => m.playerId === playerId && m.npcId === npcId
    );
  }

  async getAllMemoriesForPlayer(playerId: string): Promise<NPCMemory[]> {
    const memories = await this.readJSON<NPCMemory>('memories.json');
    return memories.filter(m => m.playerId === playerId);
  }

  // Lore operations
  async searchLore(query: string): Promise<LoreEntry[]> {
    const lore = await this.readJSON<LoreEntry>('lore.json');
    const keywords = query.toLowerCase().split(' ');

    return lore.filter(entry => {
      const searchText = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    });
  }

  async getAllLore(): Promise<LoreEntry[]> {
    return this.readJSON<LoreEntry>('lore.json');
  }

  // Event operations
  async createGameEvent(event: GameEvent): Promise<GameEvent> {
    const events = await this.readJSON<GameEvent>('events.json');
    events.push(event);
    await this.writeJSON('events.json', events);
    return event;
  }

  async getGameEvents(playerId: string): Promise<GameEvent[]> {
    const events = await this.readJSON<GameEvent>('events.json');
    return events.filter(e => e.playerId === playerId);
  }

  // World event operations
  async createWorldEvent(event: WorldEvent): Promise<WorldEvent> {
    const events = await this.readJSON<WorldEvent>('world_events.json');
    events.push(event);
    await this.writeJSON('world_events.json', events);
    return event;
  }

  async getWorldEvents(): Promise<WorldEvent[]> {
    return this.readJSON<WorldEvent>('world_events.json');
  }
}

// Factory function
let instance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!instance) {
    instance = new FileStorageAdapter();
  }
  return instance;
}
```

### Step 3.3: Create Seed Data

Create `lib/lore/seed-data.ts`:

```typescript
import { generateId } from '@/lib/utils/id-generator';
import type { NPC, LoreEntry } from '@/lib/types';

export const SEED_NPC: NPC = {
  id: generateId(),
  name: 'Elarin',
  role: 'Village Historian',
  location: 'Moonvale'
};

export const SEED_LORE: LoreEntry[] = [
  {
    id: generateId(),
    title: 'Fall of Ember Tower',
    content: 'The Ember Tower collapsed after a magical experiment went terribly wrong many years ago, scattering ash and arcane debris across the valley.',
    tags: ['ember tower', 'collapse', 'magic', 'history']
  },
  {
    id: generateId(),
    title: 'Founding of Moonvale',
    content: 'Moonvale was founded by the Forest Guild as a settlement devoted to protecting the ancient woods and preserving old knowledge.',
    tags: ['moonvale', 'founding', 'forest guild']
  },
  {
    id: generateId(),
    title: 'Wolves of the Northern Forest',
    content: 'Wolves often attack travelers near the northern forest, especially when food is scarce or the woods are disturbed.',
    tags: ['wolves', 'northern forest', 'danger']
  }
];
```

---

## Phase 4: Business Logic Implementation

### Step 4.1: NPC Response Generator

Create `lib/npc/templates.ts`:

```typescript
export const RESPONSE_TEMPLATES = {
  emberTower: [
    "The Ember Tower fell after a magical experiment went terribly wrong.",
    "The valley still remembers the ash and debris from that catastrophic day."
  ],
  moonvale: [
    "Moonvale was founded by the Forest Guild to protect these ancient woods.",
    "This settlement has always been devoted to preserving old knowledge."
  ],
  wolves: [
    "Wolves often attack travelers near the northern forest.",
    "They become especially aggressive when food is scarce."
  ],
  wolfVictory: [
    "I heard you drove the wolves back from Moonvale.",
    "The village owes you gratitude for dealing with the wolf threat."
  ],
  default: [
    "I'm not sure I understand your question.",
    "Ask me about Moonvale, Ember Tower, or the wolves."
  ]
};
```

Create `lib/npc/response-generator.ts`:

```typescript
import type { LoreEntry, NPCMemory } from '@/lib/types';
import { RESPONSE_TEMPLATES } from './templates';

export class NPCResponseGenerator {
  generateResponse(
    playerMessage: string,
    lore: LoreEntry[],
    memories: NPCMemory[]
  ): string {
    const messageLower = playerMessage.toLowerCase();

    // Check for wolf victory memory
    const hasWolfMemory = memories.some(m =>
      m.memory.toLowerCase().includes('defeated wolves')
    );

    // Pattern matching for lore retrieval
    if (messageLower.includes('ember') && messageLower.includes('tower')) {
      const response = RESPONSE_TEMPLATES.emberTower[0];
      return hasWolfMemory
        ? `${RESPONSE_TEMPLATES.wolfVictory[0]} As for Ember Tower, ${response.toLowerCase()}`
        : response;
    }

    if (messageLower.includes('moonvale') || messageLower.includes('village')) {
      return RESPONSE_TEMPLATES.moonvale[0];
    }

    if (messageLower.includes('wolf') || messageLower.includes('wolves')) {
      return hasWolfMemory
        ? RESPONSE_TEMPLATES.wolfVictory[0]
        : RESPONSE_TEMPLATES.wolves[0];
    }

    // Default response
    return RESPONSE_TEMPLATES.default.join(' ');
  }
}
```

### Step 4.2: Game Rules Engine

Create `lib/game-engine/rules.ts`:

```typescript
import type { StorageAdapter } from '@/lib/storage/adapter';
import type { WorldEvent } from '@/lib/types';
import { generateId } from '@/lib/utils/id-generator';

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

---

## Phase 5: API Routes Implementation

### Step 5.1: Player Routes

Create `app/api/player/create/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage/file-storage';
import { generateId } from '@/lib/utils/id-generator';
import type { Player } from '@/lib/types';

export async function POST() {
  try {
    const storage = getStorage();

    // Check if player already exists
    const existingPlayer = await storage.getCurrentPlayer();
    if (existingPlayer) {
      return NextResponse.json(existingPlayer);
    }

    // Create new player
    const player: Player = {
      id: generateId(),
      username: 'TobyTheExplorer',
      class: 'Ranger',
      level: 1,
      xp: 0
    };

    const created = await storage.createPlayer(player);
    return NextResponse.json(created);
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
```

Create `app/api/player/current/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage/file-storage';

export async function GET() {
  try {
    const storage = getStorage();
    const player = await storage.getCurrentPlayer();

    if (!player) {
      return NextResponse.json({ player: null });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}
```

### Step 5.2: NPC Routes

Create `app/api/npc/talk/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage/file-storage';
import { NPCResponseGenerator } from '@/lib/npc/response-generator';
import { generateId } from '@/lib/utils/id-generator';
import type { NPCTalkRequest, NPCTalkResponse, NPCMemory } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: NPCTalkRequest = await request.json();
    const { playerId, message } = body;

    const storage = getStorage();

    // Get NPC
    const npc = await storage.getNPCByName('Elarin');
    if (!npc) {
      return NextResponse.json(
        { error: 'NPC not found' },
        { status: 404 }
      );
    }

    // Get lore
    const lore = await storage.getAllLore();

    // Get memories
    const memories = await storage.getMemories(playerId, npc.id);

    // Generate response
    const responseGen = new NPCResponseGenerator();
    const response = responseGen.generateResponse(message, lore, memories);

    // Store memory
    const memory: NPCMemory = {
      id: generateId(),
      npcId: npc.id,
      playerId,
      memory: `Player asked about: ${message}`,
      importance: 1,
      createdAt: new Date().toISOString()
    };
    await storage.addMemory(memory);

    const result: NPCTalkResponse = {
      npcName: npc.name,
      response
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in NPC talk:', error);
    return NextResponse.json(
      { error: 'Failed to process NPC conversation' },
      { status: 500 }
    );
  }
}
```

### Step 5.3: Event and World Routes

Continue implementing remaining routes following the same pattern...

(Implementation continues in the actual codebase)

---

## Phase 6: UI Components

### Step 6.1: Dashboard Layout

Create `app/page.tsx` with all dashboard panels integrated.

### Step 6.2: Component Implementation

Implement each component following React best practices with TypeScript.

---

## Testing the Demo

### Manual Test Script

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:3000

# 3. Execute demo flow:
#    - Click "Create Demo Player"
#    - Type "What happened to Ember Tower?"
#    - Click Send
#    - Click "Fight Wolf" 3 times
#    - Observe "Wolf Pack Retreat"
#    - Talk to NPC again
#    - Verify memory viewer shows interactions
```

---

## Troubleshooting

### Issue: Port 3000 already in use
```bash
PORT=3001 npm run dev
```

### Issue: Data directory not writable
```bash
chmod 755 data/
```

### Issue: JSON parsing errors
```bash
# Reset data
rm data/*.json
npm run dev  # Auto-seeds data
```

---

## Next Steps

1. Review generated code quality
2. Add error boundaries to UI
3. Implement loading states
4. Add basic animations
5. Write demo documentation

---

**End of Implementation Guide**
