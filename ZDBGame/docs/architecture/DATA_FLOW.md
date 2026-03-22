# Moonvale Data Flow Documentation

**Version:** 1.0
**Project:** ZDBGame Workshop Demo
**Last Updated:** 2026-03-12

---

## Overview

This document details all data flows within the Moonvale AI-native game world demo. Each flow is documented with sequence diagrams, data transformations, and state transitions.

---

## 1. Player Creation Flow

### Trigger
User clicks "Create Demo Player" button

### Sequence Diagram

```
┌─────┐          ┌────────────┐          ┌─────────────┐          ┌──────────────┐          ┌─────────┐
│User │          │PlayerPanel │          │API Route    │          │FileStorage   │          │JSON File│
│     │          │            │          │/player/     │          │Adapter       │          │         │
│     │          │            │          │create       │          │              │          │         │
└──┬──┘          └─────┬──────┘          └──────┬──────┘          └──────┬───────┘          └────┬────┘
   │                   │                        │                        │                       │
   │  Click "Create"   │                        │                        │                       │
   ├──────────────────>│                        │                        │                       │
   │                   │                        │                        │                       │
   │                   │  POST /api/player/     │                        │                       │
   │                   │       create           │                        │                       │
   │                   ├───────────────────────>│                        │                       │
   │                   │                        │                        │                       │
   │                   │                        │  getCurrentPlayer()    │                       │
   │                   │                        ├───────────────────────>│                       │
   │                   │                        │                        │  Read players.json    │
   │                   │                        │                        ├──────────────────────>│
   │                   │                        │                        │                       │
   │                   │                        │                        │  []                   │
   │                   │                        │                        │<──────────────────────│
   │                   │                        │  null (no player)      │                       │
   │                   │                        │<───────────────────────│                       │
   │                   │                        │                        │                       │
   │                   │                        │  createPlayer({        │                       │
   │                   │                        │    id: uuid,           │                       │
   │                   │                        │    username: "Toby",   │                       │
   │                   │                        │    class: "Ranger",    │                       │
   │                   │                        │    level: 1,           │                       │
   │                   │                        │    xp: 0               │                       │
   │                   │                        │  })                    │                       │
   │                   │                        ├───────────────────────>│                       │
   │                   │                        │                        │                       │
   │                   │                        │                        │  Write players.json   │
   │                   │                        │                        │  [{player_data}]      │
   │                   │                        │                        ├──────────────────────>│
   │                   │                        │                        │                       │
   │                   │                        │                        │  Write complete       │
   │                   │                        │                        │<──────────────────────│
   │                   │                        │  {player}              │                       │
   │                   │                        │<───────────────────────│                       │
   │                   │                        │                        │                       │
   │                   │  Response: 200         │                        │                       │
   │                   │  {                     │                        │                       │
   │                   │    id: "uuid-123",     │                        │                       │
   │                   │    username: "Toby",   │                        │                       │
   │                   │    class: "Ranger",    │                        │                       │
   │                   │    level: 1,           │                        │                       │
   │                   │    xp: 0               │                        │                       │
   │                   │  }                     │                        │                       │
   │                   │<───────────────────────│                        │                       │
   │                   │                        │                        │                       │
   │  Display:         │                        │                        │                       │
   │  "TobyTheExplorer"│                        │                        │                       │
   │  "Ranger"         │                        │                        │                       │
   │  "Level 1"        │                        │                       │                       │
   │<──────────────────│                        │                        │                       │
```

### Data Transformation

**Input:** Button click event
```typescript
// No input data required
```

**Processing:**
```typescript
// 1. Generate new player object
const player: Player = {
  id: generateId(),           // "player-uuid-1234"
  username: 'TobyTheExplorer',
  class: 'Ranger',
  level: 1,
  xp: 0
};

// 2. Serialize to JSON
const jsonData = JSON.stringify([player], null, 2);

// 3. Write to file
await fs.promises.writeFile('data/players.json', jsonData);
```

**Output:** HTTP 200 Response
```json
{
  "id": "player-uuid-1234",
  "username": "TobyTheExplorer",
  "class": "Ranger",
  "level": 1,
  "xp": 0
}
```

### State Transitions

```
Initial State:
  players.json: []
  UI: "Create Demo Player" button visible
  PlayerPanel: Empty state

After Creation:
  players.json: [{ player data }]
  UI: Player info displayed
  PlayerPanel: Shows username, class, level, xp
```

---

## 2. NPC Conversation Flow

### Trigger
User types message and clicks "Send" in NPC Chat Panel

### Sequence Diagram

```
┌────┐     ┌──────────┐     ┌─────────┐     ┌────────┐     ┌──────────┐     ┌────────┐
│User│     │ChatPanel │     │API Route│     │Response│     │Lore      │     │Storage │
│    │     │          │     │/npc/talk│     │Gen     │     │Search    │     │        │
└─┬──┘     └────┬─────┘     └────┬────┘     └───┬────┘     └────┬─────┘     └───┬────┘
  │             │                 │               │               │               │
  │ Type msg    │                 │               │               │               │
  ├────────────>│                 │               │               │               │
  │             │                 │               │               │               │
  │ Click Send  │                 │               │               │               │
  ├────────────>│                 │               │               │               │
  │             │                 │               │               │               │
  │             │  POST /api/npc/ │               │               │               │
  │             │       talk      │               │               │               │
  │             │  {              │               │               │               │
  │             │    playerId,    │               │               │               │
  │             │    message:     │               │               │               │
  │             │    "What        │               │               │               │
  │             │     happened to │               │               │               │
  │             │     Ember Tower?"│              │               │               │
  │             │  }              │               │               │               │
  │             ├────────────────>│               │               │               │
  │             │                 │               │               │               │
  │             │                 │ getNPCByName("Elarin")        │               │
  │             │                 ├───────────────────────────────────────────────>│
  │             │                 │                               │               │
  │             │                 │ { npc }                       │               │
  │             │                 │<───────────────────────────────────────────────│
  │             │                 │               │               │               │
  │             │                 │ getAllLore()  │               │               │
  │             │                 ├───────────────────────────────────────────────>│
  │             │                 │                               │               │
  │             │                 │ [lore entries]                │               │
  │             │                 │<───────────────────────────────────────────────│
  │             │                 │               │               │               │
  │             │                 │               │ searchByKeywords(message, lore)│
  │             │                 │               ├──────────────>│               │
  │             │                 │               │               │               │
  │             │                 │               │ [relevant lore]│              │
  │             │                 │               │<──────────────│               │
  │             │                 │               │               │               │
  │             │                 │ getMemories(playerId, npcId)  │               │
  │             │                 ├───────────────────────────────────────────────>│
  │             │                 │                               │               │
  │             │                 │ [memories]                    │               │
  │             │                 │<───────────────────────────────────────────────│
  │             │                 │               │               │               │
  │             │                 │ generateResponse(msg, lore, memories)         │
  │             │                 ├──────────────>│               │               │
  │             │                 │               │               │               │
  │             │                 │               │ Match "ember tower" keyword   │
  │             │                 │               │ Select template               │
  │             │                 │               │ Check wolf memory             │
  │             │                 │               │               │               │
  │             │                 │ "The Ember Tower..."          │               │
  │             │                 │<──────────────│               │               │
  │             │                 │               │               │               │
  │             │                 │ addMemory({                   │               │
  │             │                 │   npcId,                      │               │
  │             │                 │   playerId,                   │               │
  │             │                 │   memory: "Player asked about Ember Tower",   │
  │             │                 │   importance: 1               │               │
  │             │                 │ })                            │               │
  │             │                 ├───────────────────────────────────────────────>│
  │             │                 │                               │               │
  │             │                 │ { memory }                    │               │
  │             │                 │<───────────────────────────────────────────────│
  │             │                 │               │               │               │
  │             │  {              │               │               │               │
  │             │    npcName: "Elarin",          │               │               │
  │             │    response: "The Ember Tower  │               │               │
  │             │               fell..."          │               │               │
  │             │  }              │               │               │               │
  │             │<────────────────│               │               │               │
  │             │                 │               │               │               │
  │  Display:   │                 │               │               │               │
  │  "Elarin:"  │                 │               │               │               │
  │  "The Ember │                 │               │               │               │
  │   Tower..." │                 │               │               │               │
  │<────────────│                 │               │               │               │
```

### Data Transformation

**Input:** User message
```typescript
{
  playerId: "player-uuid-1234",
  message: "What happened to Ember Tower?"
}
```

**Processing Step 1: Lore Search**
```typescript
// Extract keywords
const keywords = ["what", "happened", "ember", "tower"];

// Search lore entries
const lore = [
  {
    id: "lore-1",
    title: "Fall of Ember Tower",
    content: "The Ember Tower collapsed after a magical experiment...",
    tags: ["ember tower", "collapse", "magic"]
  }
];

// Match: "ember" and "tower" found in tags
const relevantLore = [lore[0]]; // Ember Tower entry
```

**Processing Step 2: Memory Retrieval**
```typescript
// Get existing memories
const memories = [
  // Empty on first interaction
];
```

**Processing Step 3: Response Generation**
```typescript
// Pattern matching
if (message.includes("ember tower")) {
  const template = "The Ember Tower fell after a magical experiment went terribly wrong.";

  // Check for wolf memory context
  const hasWolfMemory = memories.some(m => m.memory.includes("defeated wolves"));

  if (hasWolfMemory) {
    response = `You've already changed the balance around Moonvale. As for Ember Tower, ${template}`;
  } else {
    response = template;
  }
}
```

**Processing Step 4: Memory Storage**
```typescript
const newMemory: NPCMemory = {
  id: generateId(),
  npcId: "npc-elarin",
  playerId: "player-uuid-1234",
  memory: "Player asked about Ember Tower",
  importance: 1,
  createdAt: new Date().toISOString()
};

// Append to memories.json
```

**Output:**
```json
{
  "npcName": "Elarin",
  "response": "The Ember Tower fell after a magical experiment went terribly wrong."
}
```

### State Transitions

```
Before Conversation:
  memories.json: []
  NPC Memory Viewer: Empty

After Conversation:
  memories.json: [
    {
      id: "memory-1",
      npcId: "npc-elarin",
      playerId: "player-uuid-1234",
      memory: "Player asked about Ember Tower",
      importance: 1,
      createdAt: "2026-03-12T10:30:00Z"
    }
  ]
  NPC Memory Viewer: Shows "Player asked about Ember Tower"
```

---

## 3. Gameplay Action Flow (Fight Wolf)

### Trigger
User clicks "Fight Wolf" button

### Sequence Diagram

```
┌────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐     ┌────────┐
│User│     │Actions   │     │API Route│     │Game      │     │Storage │
│    │     │Panel     │     │/event/  │     │Engine    │     │        │
│    │     │          │     │create   │     │          │     │        │
└─┬──┘     └────┬─────┘     └────┬────┘     └────┬─────┘     └───┬────┘
  │             │                 │               │               │
  │ Click       │                 │               │               │
  │ "Fight Wolf"│                 │               │               │
  ├────────────>│                 │               │               │
  │             │                 │               │               │
  │             │  POST /api/event/create         │               │
  │             │  {              │               │               │
  │             │    playerId,    │               │               │
  │             │    type: "wolf_kill"            │               │
  │             │  }              │               │               │
  │             ├────────────────>│               │               │
  │             │                 │               │               │
  │             │                 │ createGameEvent({             │
  │             │                 │   id: uuid,   │               │
  │             │                 │   playerId,   │               │
  │             │                 │   type: "wolf_kill",          │
  │             │                 │   description: "Player defeated a wolf",
  │             │                 │   timestamp   │               │
  │             │                 │ })            │               │
  │             │                 ├───────────────────────────────>│
  │             │                 │               │               │
  │             │                 │               │ Append to events.json
  │             │                 │               │               │
  │             │                 │ { event }     │               │
  │             │                 │<───────────────────────────────│
  │             │                 │               │               │
  │             │  { event }      │               │               │
  │             │<────────────────│               │               │
  │             │                 │               │               │
  │             │  GET /api/world │               │               │
  │             ├────────────────>│               │               │
  │             │                 │               │               │
  │             │                 │ checkWolfPackRetreat()        │
  │             │                 ├──────────────>│               │
  │             │                 │               │               │
  │             │                 │               │ getGameEvents()
  │             │                 │               ├──────────────>│
  │             │                 │               │               │
  │             │                 │               │ [events]      │
  │             │                 │               │<──────────────│
  │             │                 │               │               │
  │             │                 │               │ Count wolf_kill:
  │             │                 │               │ filter(e => e.type === 'wolf_kill')
  │             │                 │               │ length = 3    │
  │             │                 │               │               │
  │             │                 │               │ IF count >= 3:│
  │             │                 │               │   createWorldEvent()
  │             │                 │               ├──────────────>│
  │             │                 │               │               │
  │             │                 │               │ { worldEvent }│
  │             │                 │               │<──────────────│
  │             │                 │               │               │
  │             │                 │ {             │               │
  │             │                 │   worldEvents: [{             │
  │             │                 │     name: "Wolf Pack Retreat",│
  │             │                 │     description: "Wolf activity..."
  │             │                 │   }],         │               │
  │             │                 │   newEventTriggered: true     │
  │             │                 │ }             │               │
  │             │                 │<──────────────│               │
  │             │                 │               │               │
  │             │  {worldEvents}  │               │               │
  │             │<────────────────│               │               │
  │             │                 │               │               │
  │  Display:   │                 │               │               │
  │  "World Event:│              │               │               │
  │   Wolf Pack │                 │               │               │
  │   Retreat"  │                 │               │               │
  │<────────────│                 │               │               │
```

### Data Transformation

**Input:**
```typescript
{
  playerId: "player-uuid-1234",
  type: "wolf_kill"
}
```

**Processing Step 1: Create Game Event**
```typescript
const gameEvent: GameEvent = {
  id: generateId(),
  playerId: "player-uuid-1234",
  type: "wolf_kill",
  description: "Player defeated a wolf near Moonvale",
  timestamp: new Date().toISOString()
};

// Append to events.json
const events = await readJSON('events.json'); // Current: 2 wolf_kill events
events.push(gameEvent);
await writeJSON('events.json', events); // Now: 3 wolf_kill events
```

**Processing Step 2: Check World Event Trigger**
```typescript
const wolfKillEvents = events.filter(e => e.type === 'wolf_kill');
// wolfKillEvents.length = 3

if (wolfKillEvents.length >= 3) {
  const existingWorldEvents = await readJSON('world_events.json');
  const retreatExists = existingWorldEvents.some(
    e => e.name === 'Wolf Pack Retreat'
  );

  if (!retreatExists) {
    const worldEvent: WorldEvent = {
      id: generateId(),
      name: 'Wolf Pack Retreat',
      description: 'Wolf activity around Moonvale has suddenly decreased.',
      timestamp: new Date().toISOString()
    };

    existingWorldEvents.push(worldEvent);
    await writeJSON('world_events.json', existingWorldEvents);
  }
}
```

**Output:**
```json
{
  "worldEvents": [
    {
      "id": "world-event-1",
      "name": "Wolf Pack Retreat",
      "description": "Wolf activity around Moonvale has suddenly decreased.",
      "timestamp": "2026-03-12T10:35:00Z"
    }
  ],
  "newEventTriggered": true
}
```

### State Transitions

```
After First Wolf Kill:
  events.json: [
    { type: "wolf_kill", ... }
  ]
  world_events.json: []
  UI: Event log shows 1 wolf kill

After Second Wolf Kill:
  events.json: [
    { type: "wolf_kill", ... },
    { type: "wolf_kill", ... }
  ]
  world_events.json: []
  UI: Event log shows 2 wolf kills

After Third Wolf Kill (TRIGGER):
  events.json: [
    { type: "wolf_kill", ... },
    { type: "wolf_kill", ... },
    { type: "wolf_kill", ... }
  ]
  world_events.json: [
    {
      name: "Wolf Pack Retreat",
      description: "Wolf activity around Moonvale has suddenly decreased."
    }
  ]
  UI:
    - Event log shows 3 wolf kills
    - World Events Panel shows "Wolf Pack Retreat"
    - Visual indicator/animation (optional)
```

---

## 4. Memory Persistence Flow

### File Write Pattern (Atomic Writes)

```typescript
async function writeJSON<T>(filename: string, data: T[]): Promise<void> {
  const filepath = path.join(dataDir, filename);
  const tempPath = filepath + '.tmp';

  try {
    // 1. Write to temporary file
    await fs.promises.writeFile(
      tempPath,
      JSON.stringify(data, null, 2),
      'utf-8'
    );

    // 2. Atomic rename (ensures no corruption)
    await fs.promises.rename(tempPath, filepath);

    // 3. Update in-memory cache
    this.cache.set(filename, data);

  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      await fs.promises.unlink(tempPath);
    }
    throw error;
  }
}
```

### File Read Pattern (With Cache)

```typescript
async function readJSON<T>(filename: string): Promise<T[]> {
  // 1. Check in-memory cache first
  if (this.cache.has(filename)) {
    return this.cache.get(filename);
  }

  const filepath = path.join(dataDir, filename);

  // 2. Check if file exists
  if (!fs.existsSync(filepath)) {
    return [];
  }

  // 3. Read and parse JSON
  const content = await fs.promises.readFile(filepath, 'utf-8');
  const data = JSON.parse(content);

  // 4. Validate structure (basic check)
  if (!Array.isArray(data)) {
    throw new Error(`Invalid JSON structure in ${filename}`);
  }

  // 5. Update cache
  this.cache.set(filename, data);

  return data;
}
```

---

## 5. Error Handling Flows

### Case 1: File Read Error

```
API Route → Storage.readJSON()
              │
              ├─ File doesn't exist
              │    └─> Return []
              │
              ├─ Invalid JSON
              │    └─> Throw error → API returns 500
              │
              └─ Permission denied
                   └─> Throw error → API returns 500
```

### Case 2: File Write Error

```
API Route → Storage.writeJSON()
              │
              ├─ Disk full
              │    ├─> Delete .tmp file
              │    └─> Throw error → API returns 500
              │
              ├─ Permission denied
              │    ├─> Delete .tmp file
              │    └─> Throw error → API returns 500
              │
              └─ Success
                   └─> Update cache → Return data
```

### Case 3: NPC Not Found

```
POST /api/npc/talk
  │
  ├─> getNPCByName("Elarin")
  │     │
  │     └─> null (NPC not found)
  │
  └─> Return 404
      {
        "error": "NPC not found",
        "npcName": "Elarin"
      }
```

---

## 6. State Synchronization

### UI Refresh Flow

```
User Action (Fight Wolf)
  │
  ├─> POST /api/event/create
  │     └─> Events updated
  │
  ├─> GET /api/world
  │     └─> Check world events
  │
  ├─> GET /api/events
  │     └─> Fetch latest event log
  │
  └─> UI Re-renders
        ├─> Event Log Panel (updated)
        ├─> World Events Panel (updated)
        └─> Memory Viewer (if applicable)
```

### Optimistic Updates (Optional Enhancement)

```
User clicks "Fight Wolf"
  │
  ├─> Immediately add event to UI (optimistic)
  │
  ├─> POST /api/event/create
  │     │
  │     ├─> Success: Keep UI change
  │     │
  │     └─> Error: Rollback UI change
  │           └─> Show error toast
```

---

## 7. Data Consistency Rules

### Rule 1: Player Singleton
- Only one player allowed in demo
- `createPlayer()` checks for existing player
- Returns existing if found, creates new if not

### Rule 2: World Event Uniqueness
- "Wolf Pack Retreat" can only be created once
- Check `world_events.json` before creating
- Skip if event with same name exists

### Rule 3: Memory Deduplication (Optional)
- Prevent exact duplicate memories
- Before adding memory, check if identical memory exists
- If exists within last hour, skip creation

### Rule 4: Event Ordering
- All events stored with ISO 8601 timestamps
- UI displays in reverse chronological order
- Latest events appear first

---

## 8. Performance Optimizations

### In-Memory Caching

```typescript
class FileStorageAdapter {
  private cache = new Map<string, any>();

  // Cache hits avoid disk I/O
  async readJSON<T>(filename: string): Promise<T[]> {
    if (this.cache.has(filename)) {
      return this.cache.get(filename); // Fast path
    }

    const data = await this.readFromDisk(filename); // Slow path
    this.cache.set(filename, data);
    return data;
  }
}
```

### Event Log Pagination (Future)

```typescript
// Limit events to last 100 entries
async getGameEvents(playerId: string, limit = 100): Promise<GameEvent[]> {
  const allEvents = await this.readJSON<GameEvent>('events.json');
  return allEvents
    .filter(e => e.playerId === playerId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
```

---

## Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-12 | Initial data flow documentation | System Architect |

---

**End of Data Flow Documentation**
