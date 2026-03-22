# Complete ZeroDB API Reference - Moonvale Demo

## Overview

This demo now showcases **14 ZeroDB API endpoints** demonstrating full CRUD operations across all data collections.

---

## All API Endpoints (14 Total)

### 1. Player Management APIs (4 endpoints)

#### Create Player
```http
POST /api/player/create
Response: Player
```

#### Get Current Player
```http
GET /api/player/current
Response: Player | null
```

#### Update Player (CRUD - UPDATE)
```http
PATCH /api/player/update
Request: { playerId: string, updates: { level?: number, xp?: number, class?: string } }
Response: Player
```

#### List All Players
```http
GET /api/players
Response: Player[]
```

---

### 2. NPC Management APIs (2 endpoints)

#### Talk to NPC
```http
POST /api/npc/talk
Request: { playerId: string, message: string }
Response: { npcName: string, response: { response: string, loreUsed: [], memoriesReferenced: [] } }
```

#### Create NPC
```http
POST /api/npc/create
Request: { name: string, role: string, location: string, personality?: object }
Response: NPC
```

---

### 3. Event System APIs (2 endpoints)

#### Create Event
```http
POST /api/event/create
Request: { playerId: string, eventType: string, description: string, location: string }
Response: { success: true, gameEvent: GameEvent, worldEvent?: WorldEvent }
```

#### List Events
```http
GET /api/events?playerId=X
Response: GameEvent[]
```

---

### 4. World State API (1 endpoint)

#### Get World State
```http
GET /api/world?playerId=X
Response: { worldEvents: WorldEvent[], wolfKills: number }
```

---

### 5. Memory System API (1 endpoint)

#### Get NPC Memories
```http
GET /api/memories?playerId=X
Response: NPCMemory[]
```

---

### 6. Lore Management APIs (3 endpoints)

#### Browse All Lore
```http
GET /api/lore
Response: Lore[]
```

#### Search Lore
```http
GET /api/lore?query=keyword
Response: Lore[] (filtered)
```

#### Create Lore Entry
```http
POST /api/lore/create
Request: { title: string, content: string, region: string, tags: string[] }
Response: Lore
```

---

### 7. Database Statistics API (1 endpoint)

#### Get Stats
```http
GET /api/stats
Response: {
  players: number,
  lore: number,
  npcMemories: number,
  gameEvents: number,
  worldEvents: number,
  totalFiles: number
}
```

---

### 8. Admin Management API (1 endpoint)

#### Reset Database
```http
DELETE /api/admin/reset
Request: { confirm: "DELETE_ALL_DATA" }
Response: { success: true, message: string }
```

---

## CRUD Operation Coverage

| Operation | Collection | API Endpoint |
|-----------|-----------|--------------|
| **CREATE** | Player | POST /api/player/create |
| **READ** | Player | GET /api/player/current |
| **UPDATE** | Player | PATCH /api/player/update |
| **DELETE** | All Data | DELETE /api/admin/reset |
| **LIST** | Player | GET /api/players |
| | | |
| **CREATE** | NPC | POST /api/npc/create |
| **READ** | NPC | POST /api/npc/talk (implicit) |
| | | |
| **CREATE** | Event | POST /api/event/create |
| **LIST** | Event | GET /api/events |
| | | |
| **READ** | World | GET /api/world |
| | | |
| **LIST** | Memory | GET /api/memories |
| | | |
| **CREATE** | Lore | POST /api/lore/create |
| **READ** | Lore | GET /api/lore |
| **SEARCH** | Lore | GET /api/lore?query=X |
| | | |
| **READ** | Stats | GET /api/stats |

---

## Data Models

### Player
```typescript
{
  id: string;
  username: string;
  class: string;
  level: number;
  xp: number;
  created_at: string;
}
```

### NPC
```typescript
{
  id: string;
  name: string;
  role: string;
  location: string;
  personality: object;
  created_at: string;
}
```

### GameEvent
```typescript
{
  id: string;
  playerId: string;
  type: string;
  description: string;
  location: string;
  timestamp: string;
  metadata?: object;
}
```

### WorldEvent
```typescript
{
  id: string;
  name: string;
  description: string;
  triggeredBy: string;
  region: string;
  timestamp: string;
}
```

### NPCMemory
```typescript
{
  id: string;
  npcId: string;
  playerId: string;
  memory: string;
  importance: number;
  createdAt: string;
  tags: string[];
}
```

### Lore
```typescript
{
  id: string;
  title: string;
  content: string;
  region: string;
  tags: string[];
  created_at: string;
}
```

---

## Testing All APIs

### 1. Player CRUD
```bash
# Create
curl -X POST http://localhost:3000/api/player/create

# Read current
curl http://localhost:3000/api/player/current

# Update
curl -X PATCH http://localhost:3000/api/player/update \
  -H "Content-Type: application/json" \
  -d '{"playerId":"YOUR_ID","updates":{"level":2,"xp":150}}'

# List all
curl http://localhost:3000/api/players
```

### 2. NPC Management
```bash
# Create NPC
curl -X POST http://localhost:3000/api/npc/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Garrick","role":"Blacksmith","location":"Moonvale"}'

# Talk to NPC
curl -X POST http://localhost:3000/api/npc/talk \
  -H "Content-Type: application/json" \
  -d '{"playerId":"YOUR_ID","message":"Hello"}'
```

### 3. Event System
```bash
# Create event
curl -X POST http://localhost:3000/api/event/create \
  -H "Content-Type: application/json" \
  -d '{"playerId":"YOUR_ID","eventType":"explore","description":"Explored forest","location":"moonvale"}'

# List events
curl "http://localhost:3000/api/events?playerId=YOUR_ID"
```

### 4. World State
```bash
curl "http://localhost:3000/api/world?playerId=YOUR_ID"
```

### 5. Memories
```bash
curl "http://localhost:3000/api/memories?playerId=YOUR_ID"
```

### 6. Lore Management
```bash
# Browse all
curl http://localhost:3000/api/lore

# Search
curl "http://localhost:3000/api/lore?query=tower"

# Create
curl -X POST http://localhost:3000/api/lore/create \
  -H "Content-Type: application/json" \
  -d '{"title":"New Lore","content":"Story here","region":"Moonvale","tags":["history"]}'
```

### 7. Statistics
```bash
curl http://localhost:3000/api/stats
```

### 8. Admin Reset
```bash
curl -X DELETE http://localhost:3000/api/admin/reset \
  -H "Content-Type: application/json" \
  -d '{"confirm":"DELETE_ALL_DATA"}'
```

---

## Database Operations Demonstrated

1. **Create (C)** - 5 endpoints
   - POST /api/player/create
   - POST /api/npc/create
   - POST /api/event/create
   - POST /api/lore/create
   - POST /api/npc/talk (creates memory)

2. **Read (R)** - 6 endpoints
   - GET /api/player/current
   - GET /api/players
   - GET /api/events
   - GET /api/world
   - GET /api/memories
   - GET /api/lore
   - GET /api/stats

3. **Update (U)** - 1 endpoint
   - PATCH /api/player/update

4. **Delete (D)** - 1 endpoint
   - DELETE /api/admin/reset

5. **Search** - 1 endpoint
   - GET /api/lore?query=X

6. **Aggregate** - 1 endpoint
   - GET /api/stats (counts across collections)

---

## Workshop Demo Flow (Updated)

```
1. Create Player → TobyTheExplorer (POST /api/player/create)
2. List All Players → See all created (GET /api/players)
3. Level Up Player → Gain XP (PATCH /api/player/update)
4. Create Custom NPC → Add Garrick the Blacksmith (POST /api/npc/create)
5. Talk to Elarin → Uses lore (POST /api/npc/talk)
6. Fight Wolves x3 → Trigger world event (POST /api/event/create)
7. View World State → See wolf retreat (GET /api/world)
8. Check Memories → Elarin remembers (GET /api/memories)
9. Browse Lore → All lore entries (GET /api/lore)
10. Search Lore → Filter by keyword (GET /api/lore?query=tower)
11. Create New Lore → Add story dynamically (POST /api/lore/create)
12. View Statistics → Database metrics (GET /api/stats)
13. Reset Demo → Clear all data (DELETE /api/admin/reset)
```

---

## API Coverage Summary

| Category | Endpoints | CRUD Operations |
|----------|-----------|-----------------|
| Player Management | 4 | CREATE, READ, UPDATE, LIST |
| NPC Management | 2 | CREATE, INTERACT |
| Event System | 2 | CREATE, LIST |
| World State | 1 | READ |
| Memory System | 1 | LIST |
| Lore Management | 3 | CREATE, READ, SEARCH |
| Statistics | 1 | AGGREGATE |
| Admin | 1 | DELETE (all) |
| **Total** | **14** | **Full CRUD** |

---

## Next Steps for Workshop

### Phase 1: Basic Demo (Current)
✅ All 14 APIs functional
✅ Full CRUD coverage
✅ 6 data collections

### Phase 2: UI Enhancement (TODO)
- [ ] Add "Level Up" button (calls PATCH /api/player/update)
- [ ] Add "Create NPC" form (calls POST /api/npc/create)
- [ ] Add "Create Lore" form (calls POST /api/lore/create)
- [ ] Add "All Players" table (calls GET /api/players)
- [ ] Add "Reset Demo" button (calls DELETE /api/admin/reset)

### Phase 3: Advanced Features (Optional)
- [ ] Vector embeddings for semantic search
- [ ] Real ZeroDB cloud integration
- [ ] Multi-player support
- [ ] Quest system with dependencies

---

**Generated**: 2026-03-12
**Status**: ✅ 14 APIs Complete - Full CRUD Coverage
**Demo URL**: http://localhost:3000
**API Reference**: http://localhost:3000/api-reference
