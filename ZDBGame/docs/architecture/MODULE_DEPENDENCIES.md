# Moonvale Module Dependencies

**Version:** 1.0
**Project:** ZDBGame Workshop Demo
**Last Updated:** 2026-03-12

---

## Overview

This document maps all module dependencies within the Moonvale application, defining clear boundaries, import patterns, and dependency rules to maintain clean architecture.

---

## 1. Dependency Hierarchy

### Architectural Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Layer 1: Presentation                │
│                  (UI Components & Pages)                │
│                                                          │
│  - app/page.tsx                                         │
│  - components/*.tsx                                     │
│                                                          │
│  Depends on: Layer 2 (API Routes) via HTTP              │
│  Depends on: lib/types.ts                               │
│  Dependencies: React, Next.js, Tailwind                 │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Fetch
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Layer 2: API Routes                 │
│                  (Next.js Route Handlers)               │
│                                                          │
│  - app/api/*/route.ts                                   │
│                                                          │
│  Depends on: Layer 3 (Business Logic)                   │
│  Depends on: Layer 4 (Storage Adapter)                  │
│  Depends on: lib/types.ts                               │
│  Dependencies: Next.js                                  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Direct Imports
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 Layer 3: Business Logic                 │
│               (Game Rules & NPC System)                 │
│                                                          │
│  - lib/game-engine/*                                    │
│  - lib/npc/*                                            │
│  - lib/lore/*                                           │
│                                                          │
│  Depends on: Layer 4 (Storage Adapter Interface)        │
│  Depends on: lib/types.ts                               │
│  Dependencies: None (pure TypeScript)                   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Interface Usage
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Layer 4: Data Access                   │
│                   (Storage Adapters)                    │
│                                                          │
│  - lib/storage/adapter.ts (interface)                   │
│  - lib/storage/file-storage.ts                          │
│  - lib/storage/zerodb-storage.ts (future)               │
│                                                          │
│  Depends on: lib/types.ts                               │
│  Dependencies: Node.js fs, path                         │
└─────────────────────────────────────────────────────────┘
                           │
                           │ File I/O
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Layer 5: Storage                     │
│                    (JSON Files)                         │
│                                                          │
│  - data/players.json                                    │
│  - data/npcs.json                                       │
│  - data/memories.json                                   │
│  - data/lore.json                                       │
│  - data/events.json                                     │
│  - data/world_events.json                               │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Module Dependency Graph

### Frontend Components

```
app/page.tsx
  ├── import PlayerPanel from '@/components/PlayerPanel'
  ├── import NPCChatPanel from '@/components/NPCChatPanel'
  ├── import ActionsPanel from '@/components/ActionsPanel'
  ├── import WorldEventsPanel from '@/components/WorldEventsPanel'
  ├── import MemoryViewer from '@/components/MemoryViewer'
  ├── import EventLog from '@/components/EventLog'
  └── import { Player, WorldEvent } from '@/lib/types'

components/PlayerPanel.tsx
  ├── import { Player } from '@/lib/types'
  └── HTTP: POST /api/player/create
          GET /api/player/current

components/NPCChatPanel.tsx
  ├── import { NPCTalkRequest, NPCTalkResponse } from '@/lib/types'
  └── HTTP: POST /api/npc/talk

components/ActionsPanel.tsx
  ├── import { GameEvent } from '@/lib/types'
  └── HTTP: POST /api/event/create
          GET /api/world

components/WorldEventsPanel.tsx
  ├── import { WorldEvent } from '@/lib/types'
  └── HTTP: GET /api/world

components/MemoryViewer.tsx
  ├── import { NPCMemory } from '@/lib/types'
  └── HTTP: GET /api/memories

components/EventLog.tsx
  ├── import { GameEvent } from '@/lib/types'
  └── HTTP: GET /api/events
```

### API Routes

```
app/api/player/create/route.ts
  ├── import { getStorage } from '@/lib/storage/adapter'
  ├── import { generateId } from '@/lib/utils/id-generator'
  └── import { Player } from '@/lib/types'

app/api/player/current/route.ts
  ├── import { getStorage } from '@/lib/storage/adapter'
  └── import { Player } from '@/lib/types'

app/api/npc/talk/route.ts
  ├── import { getStorage } from '@/lib/storage/adapter'
  ├── import { NPCResponseGenerator } from '@/lib/npc/response-generator'
  ├── import { LoreSearchEngine } from '@/lib/lore/search'
  ├── import { generateId } from '@/lib/utils/id-generator'
  └── import {
        NPCTalkRequest,
        NPCTalkResponse,
        NPCMemory
      } from '@/lib/types'

app/api/event/create/route.ts
  ├── import { getStorage } from '@/lib/storage/adapter'
  ├── import { generateId } from '@/lib/utils/id-generator'
  └── import { GameEvent } from '@/lib/types'

app/api/events/route.ts
  ├── import { getStorage } from '@/lib/storage/adapter'
  └── import { GameEvent } from '@/lib/types'

app/api/memories/route.ts
  ├── import { getStorage } from '@/lib/storage/adapter'
  └── import { NPCMemory } from '@/lib/types'

app/api/world/route.ts
  ├── import { getStorage } from '@/lib/storage/adapter'
  ├── import { GameRules } from '@/lib/game-engine/rules'
  └── import { WorldEvent } from '@/lib/types'
```

### Business Logic Modules

```
lib/game-engine/rules.ts
  ├── import { StorageAdapter } from '@/lib/storage/adapter'
  ├── import { generateId } from '@/lib/utils/id-generator'
  └── import { WorldEvent, GameEvent } from '@/lib/types'

lib/game-engine/world-events.ts
  ├── import { StorageAdapter } from '@/lib/storage/adapter'
  └── import { WorldEvent } from '@/lib/types'

lib/npc/response-generator.ts
  ├── import { ResponseTemplates } from '@/lib/npc/templates'
  └── import { LoreEntry, NPCMemory } from '@/lib/types'

lib/npc/memory-manager.ts
  ├── import { StorageAdapter } from '@/lib/storage/adapter'
  ├── import { generateId } from '@/lib/utils/id-generator'
  └── import { NPCMemory } from '@/lib/types'

lib/npc/templates.ts
  └── (No dependencies - pure data)

lib/lore/search.ts
  └── import { LoreEntry } from '@/lib/types'

lib/lore/seed-data.ts
  ├── import { generateId } from '@/lib/utils/id-generator'
  └── import { LoreEntry, NPC } from '@/lib/types'
```

### Storage Layer

```
lib/storage/adapter.ts
  └── import {
        Player,
        NPC,
        NPCMemory,
        LoreEntry,
        GameEvent,
        WorldEvent
      } from '@/lib/types'

lib/storage/file-storage.ts
  ├── import { StorageAdapter } from '@/lib/storage/adapter'
  ├── import { promises as fs } from 'fs'
  ├── import path from 'path'
  └── import {
        Player,
        NPC,
        NPCMemory,
        LoreEntry,
        GameEvent,
        WorldEvent
      } from '@/lib/types'

lib/storage/zerodb-storage.ts (future)
  ├── import { StorageAdapter } from '@/lib/storage/adapter'
  ├── import { ZeroDBClient } from 'zerodb-sdk'
  └── import {
        Player,
        NPC,
        NPCMemory,
        LoreEntry,
        GameEvent,
        WorldEvent
      } from '@/lib/types'
```

### Utility Modules

```
lib/utils/id-generator.ts
  └── import { randomUUID } from 'crypto'

lib/utils/logger.ts
  └── (No dependencies - pure console.log wrapper)
```

---

## 3. Dependency Rules (Enforced)

### Rule 1: Unidirectional Dependencies

Dependencies MUST flow downward through layers:

```
Presentation → API Routes → Business Logic → Data Access → Storage
```

**Violations:**
- ❌ Business Logic importing from API Routes
- ❌ Data Access importing from Business Logic
- ❌ Storage Layer importing from any layer above

### Rule 2: No Cross-Layer Imports

Each layer can ONLY import from:
- The layer directly below it
- Shared types (`lib/types.ts`)
- Shared utilities (`lib/utils/*`)

**Valid:**
```typescript
// API Route importing Business Logic (adjacent layer)
import { GameRules } from '@/lib/game-engine/rules'; // ✓

// Business Logic importing Storage Adapter (adjacent layer)
import { StorageAdapter } from '@/lib/storage/adapter'; // ✓

// Any layer importing types
import { Player } from '@/lib/types'; // ✓
```

**Invalid:**
```typescript
// API Route importing Storage directly (skipping Business Logic)
import { FileStorageAdapter } from '@/lib/storage/file-storage'; // ✗

// Business Logic importing API Route
import { POST } from '@/app/api/player/create/route'; // ✗
```

### Rule 3: Interface-Based Storage Access

All modules MUST depend on `StorageAdapter` interface, NOT concrete implementations:

**Valid:**
```typescript
import { StorageAdapter } from '@/lib/storage/adapter';

async function checkRules(storage: StorageAdapter) { // ✓
  const events = await storage.getGameEvents(playerId);
}
```

**Invalid:**
```typescript
import { FileStorageAdapter } from '@/lib/storage/file-storage';

async function checkRules(storage: FileStorageAdapter) { // ✗
  // Tightly coupled to file-based implementation
}
```

### Rule 4: No Circular Dependencies

Circular imports are strictly forbidden:

**Invalid:**
```typescript
// lib/npc/response-generator.ts
import { MemoryManager } from '@/lib/npc/memory-manager';

// lib/npc/memory-manager.ts
import { NPCResponseGenerator } from '@/lib/npc/response-generator'; // ✗ CIRCULAR
```

**Solution:**
- Extract shared logic to separate module
- Use dependency injection
- Restructure module boundaries

### Rule 5: Type-Only Imports

Use type-only imports when possible to reduce bundle size:

```typescript
// Instead of:
import { Player } from '@/lib/types';

// Use:
import type { Player } from '@/lib/types';
```

---

## 4. Import Path Conventions

### Absolute Imports (Preferred)

Use `@/` alias for all imports:

```typescript
import { Player } from '@/lib/types';
import { getStorage } from '@/lib/storage/adapter';
import PlayerPanel from '@/components/PlayerPanel';
```

Configuration in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Relative Imports (Discouraged)

Avoid relative imports except within same directory:

```typescript
// ✗ Discouraged
import { Player } from '../../lib/types';

// ✓ Acceptable (same directory)
import { ResponseTemplates } from './templates';
```

---

## 5. Module Boundaries

### Storage Module Boundary

```
lib/storage/
  ├── adapter.ts          (PUBLIC: exported interface)
  ├── file-storage.ts     (PRIVATE: implementation detail)
  └── index.ts            (PUBLIC: re-exports adapter + factory)
```

**Public API:**
```typescript
// lib/storage/index.ts
export { StorageAdapter } from './adapter';
export { getStorage } from './factory';
```

**Usage:**
```typescript
// Correct: import from public API
import { getStorage } from '@/lib/storage';

// Incorrect: import implementation directly
import { FileStorageAdapter } from '@/lib/storage/file-storage'; // ✗
```

### Game Engine Module Boundary

```
lib/game-engine/
  ├── rules.ts           (PUBLIC: game rules logic)
  ├── world-events.ts    (PUBLIC: world event system)
  ├── state-manager.ts   (PRIVATE: internal state)
  └── index.ts           (PUBLIC: re-exports)
```

**Public API:**
```typescript
// lib/game-engine/index.ts
export { GameRules } from './rules';
export { WorldEventSystem } from './world-events';
// state-manager NOT exported (private)
```

### NPC Module Boundary

```
lib/npc/
  ├── response-generator.ts  (PUBLIC)
  ├── memory-manager.ts      (PUBLIC)
  ├── templates.ts           (PRIVATE: data only)
  └── index.ts               (PUBLIC: re-exports)
```

---

## 6. Dependency Injection Pattern

### Storage Factory (Singleton)

```typescript
// lib/storage/factory.ts
let instance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!instance) {
    // Check for ZeroDB credentials
    if (process.env.ZERODB_API_KEY) {
      instance = new ZeroDBStorageAdapter();
    } else {
      instance = new FileStorageAdapter();
    }
  }
  return instance;
}
```

### Usage in API Routes

```typescript
// app/api/player/create/route.ts
import { getStorage } from '@/lib/storage';

export async function POST() {
  const storage = getStorage(); // Dependency injected
  const player = await storage.createPlayer({...});
  return Response.json(player);
}
```

### Testing (Future)

```typescript
// tests/api/player.test.ts
import { setStorageForTesting } from '@/lib/storage';
import { MockStorageAdapter } from '@/lib/storage/mock-storage';

describe('Player API', () => {
  beforeEach(() => {
    // Inject mock storage for testing
    setStorageForTesting(new MockStorageAdapter());
  });

  it('creates player', async () => {
    // Test uses mock storage instead of real files
  });
});
```

---

## 7. External Dependencies

### Production Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Usage Rules:**
- `next`, `react`, `react-dom`: Frontend/API routes only
- `typescript`: Build-time only (not imported)

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "autoprefixer": "^10.0.0",
    "eslint": "^8.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

**Usage Rules:**
- Type definitions: Used throughout
- ESLint/Prettier: Linting/formatting only
- Tailwind: CSS generation (not imported in TS files)

### Future Dependencies (ZeroDB Integration)

```json
{
  "dependencies": {
    "zerodb-sdk": "^1.0.0"  // Only if ZERODB_API_KEY present
  }
}
```

**Conditional Import:**
```typescript
// lib/storage/zerodb-storage.ts
// Only loaded if credentials exist
if (process.env.ZERODB_API_KEY) {
  const { ZeroDBClient } = await import('zerodb-sdk');
}
```

---

## 8. Import Validation Rules

### ESLint Configuration

```json
{
  "rules": {
    "import/no-cycle": "error",
    "import/no-self-import": "error",
    "import/no-relative-parent-imports": "warn",
    "import/order": ["error", {
      "groups": [
        "builtin",
        "external",
        "internal",
        "parent",
        "sibling",
        "index"
      ],
      "alphabetize": {
        "order": "asc"
      }
    }]
  }
}
```

### Import Order Example

```typescript
// 1. Node.js built-ins
import { promises as fs } from 'fs';
import path from 'path';

// 2. External dependencies
import { NextRequest, NextResponse } from 'next/server';

// 3. Internal modules (alphabetical)
import { GameRules } from '@/lib/game-engine/rules';
import { LoreSearchEngine } from '@/lib/lore/search';
import { NPCResponseGenerator } from '@/lib/npc/response-generator';
import { getStorage } from '@/lib/storage';

// 4. Types (last, type-only)
import type {
  GameEvent,
  NPCMemory,
  Player,
  WorldEvent
} from '@/lib/types';
```

---

## 9. Module Size Guidelines

### Maximum Lines per Module

| Module Type | Max Lines | Rationale |
|------------|-----------|-----------|
| Component | 300 | Single responsibility, easy to understand |
| API Route | 150 | Thin layer, delegates to business logic |
| Business Logic | 400 | Core logic, can be more complex |
| Storage Adapter | 500 | Interface + implementation |
| Types | 200 | Pure type definitions |

### Split Criteria

Split a module when:
- Exceeds max lines guideline
- Has multiple distinct responsibilities
- Contains complex nested logic (>3 levels deep)
- Has >5 dependencies

**Example:**
```typescript
// Before: lib/npc/npc-system.ts (600 lines)
// - Response generation (200 lines)
// - Memory management (200 lines)
// - Template system (200 lines)

// After: Split into 3 modules
lib/npc/
  ├── response-generator.ts (200 lines)
  ├── memory-manager.ts (200 lines)
  └── templates.ts (200 lines)
```

---

## 10. Dependency Change Process

### Adding New Dependency

1. **Justify the need**
   - Document why existing modules can't solve the problem
   - Evaluate bundle size impact
   - Check license compatibility

2. **Update architecture docs**
   - Add to dependency graph
   - Update import rules
   - Document usage guidelines

3. **Run dependency check**
   ```bash
   npm install <package>
   npm run build  # Ensure no circular deps
   npm run lint   # Check import order
   ```

### Removing Dependency

1. **Identify all usages**
   ```bash
   grep -r "from '<package>'" .
   ```

2. **Refactor code**
   - Replace with alternative
   - Update all imports

3. **Cleanup**
   ```bash
   npm uninstall <package>
   npm run build  # Verify build still works
   ```

---

## 11. Dependency Visualization

### Generate Dependency Graph

```bash
# Using madge (install as dev dependency)
npm install --save-dev madge

# Generate graph
npx madge --image deps.svg app/
```

### Expected Graph Structure

```
app/page.tsx
  ├─ components/PlayerPanel.tsx
  │   └─ lib/types.ts
  ├─ components/NPCChatPanel.tsx
  │   └─ lib/types.ts
  └─ components/ActionsPanel.tsx
      └─ lib/types.ts

app/api/npc/talk/route.ts
  ├─ lib/storage/adapter.ts
  │   └─ lib/types.ts
  ├─ lib/npc/response-generator.ts
  │   ├─ lib/npc/templates.ts
  │   └─ lib/types.ts
  └─ lib/lore/search.ts
      └─ lib/types.ts
```

---

## 12. Common Anti-Patterns to Avoid

### Anti-Pattern 1: God Module

```typescript
// ✗ BAD: lib/game.ts (1000 lines)
export class Game {
  createPlayer() { /* 100 lines */ }
  generateNPCResponse() { /* 200 lines */ }
  searchLore() { /* 150 lines */ }
  checkWorldEvents() { /* 200 lines */ }
  manageMemory() { /* 150 lines */ }
  // ... 200 more lines
}
```

**Solution:** Split into focused modules
```typescript
// ✓ GOOD: Multiple focused modules
lib/player/manager.ts
lib/npc/response-generator.ts
lib/lore/search.ts
lib/game-engine/rules.ts
lib/npc/memory-manager.ts
```

### Anti-Pattern 2: Tight Coupling

```typescript
// ✗ BAD: Direct dependency on implementation
import { FileStorageAdapter } from '@/lib/storage/file-storage';

function doSomething() {
  const storage = new FileStorageAdapter();
  // Can't swap to ZeroDB without changing this code
}
```

**Solution:** Depend on interface
```typescript
// ✓ GOOD: Depend on abstraction
import { getStorage } from '@/lib/storage';

function doSomething() {
  const storage = getStorage(); // Factory decides implementation
}
```

### Anti-Pattern 3: Barrel Export Abuse

```typescript
// ✗ BAD: lib/index.ts exports everything
export * from './game-engine/rules';
export * from './npc/response-generator';
export * from './lore/search';
export * from './storage/file-storage'; // ← Exposes private implementation
```

**Solution:** Explicit public API
```typescript
// ✓ GOOD: lib/index.ts (curated exports)
export { GameRules } from './game-engine/rules';
export { NPCResponseGenerator } from './npc/response-generator';
export { getStorage } from './storage'; // Factory only, not implementation
```

---

## Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-12 | Initial module dependency documentation | System Architect |

---

**End of Module Dependencies Documentation**
