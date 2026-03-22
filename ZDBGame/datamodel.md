Below is a **clean ZeroDB data model specification you can drop into the repo** so Claude Code understands exactly how to build the backend schema.

This version is designed to work well with:

* **Postgres-compatible systems** (ZeroDB)
* **vector search**
* **event-driven gameplay**
* **AI memory storage**

It is intentionally **minimal and stable for demos**.

You can place this file at:

```
/schema/zerodb-schema.sql
```

or

```
/docs/data-model.md
```

depending on how you want Claude to ingest it.

---

# ZeroDB Data Model

# AI-Native Game World Demo (Moonvale)

Version: 1.0
Database: ZeroDB (Postgres Compatible)

Purpose:
Provide a simple schema to support:

* player state
* NPC memory
* lore retrieval
* gameplay telemetry
* world events
* RLHF feedback

---

# 1. Players

Stores persistent player data.

```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    class TEXT,
    faction TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    inventory JSONB DEFAULT '[]',
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Example record

```
username: TobyTheExplorer
class: Ranger
faction: Forest Guild
level: 1
xp: 0
```

---

# 2. NPCs

Stores non-player characters.

```sql
CREATE TABLE npcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT,
    location TEXT,
    personality JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Example

```
name: Elarin
role: Village Historian
location: Moonvale
```

---

# 3. NPC Memory

Stores memories NPCs have about players.

This is **core to AI-native gameplay.**

```sql
CREATE TABLE npc_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npc_id UUID REFERENCES npcs(id),
    player_id UUID REFERENCES players(id),
    memory TEXT,
    importance INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Example

```
memory: Player asked about Ember Tower
importance: 2
```

---

# 4. Lore Knowledge

Game lore searchable using **vector embeddings**.

```sql
CREATE TABLE lore (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT,
    region TEXT,
    tags TEXT[],
    embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT NOW()
);
```

Example entries

```
The Fall of Ember Tower
Moonvale Founding
Wolves of the Northern Forest
```

---

# 5. Gameplay Events

Telemetry for gameplay actions.

```sql
CREATE TABLE game_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id),
    event_type TEXT,
    location TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Example events

```
npc_conversation
explore
wolf_kill
help_village
```

---

# 6. World Events

Events triggered by player behavior.

```sql
CREATE TABLE world_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT,
    description TEXT,
    trigger_source TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Example

```
Wolf Pack Retreat
Wolf activity around Moonvale has decreased.
```

---

# 7. Player Feedback (RLHF)

Stores player feedback used to improve game AI.

```sql
CREATE TABLE player_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id),
    target_type TEXT,
    target_id UUID,
    rating INTEGER,
    feedback TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Example

```
target_type: npc_dialogue
rating: 5
feedback: NPC remembered my actions.
```

---

# 8. Optional Asset Storage

For player-generated content.

```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id),
    asset_type TEXT,
    asset_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Examples

```
guild_banner
player_house
map_design
```

---

# 9. Vector Search Index

Required for lore retrieval.

```sql
CREATE INDEX lore_embedding_idx
ON lore
USING ivfflat (embedding vector_cosine_ops);
```

---

# 10. Example Seed Data

NPC

```sql
INSERT INTO npcs (name, role, location)
VALUES ('Elarin', 'Village Historian', 'Moonvale');
```

Lore

```sql
INSERT INTO lore (title, content, tags)
VALUES
('Fall of Ember Tower',
 'The Ember Tower collapsed after a magical experiment went wrong.',
 ARRAY['ember tower','magic','history']),

('Founding of Moonvale',
 'Moonvale was founded by the Forest Guild to protect the ancient woods.',
 ARRAY['moonvale','forest guild','founding']),

('Wolves of the Northern Forest',
 'Wolves often attack travelers near the northern forest.',
 ARRAY['wolves','danger','forest']);
```

---

# 11. Emergent Gameplay Rule

Game logic (handled by API layer):

```
IF player wolf_kill events >= 3
THEN create world event:

Wolf Pack Retreat
```

Stored in:

```
world_events
```

---

# 12. Data Relationships

```
players
   │
   ├── game_events
   │
   ├── npc_memories
   │
   └── player_feedback

npcs
   │
   └── npc_memories

lore
   │
   └── vector search → NPC dialogue

world_events
   │
   └── triggered by game_events
```

---

# 13. Claude Code Instructions

Add this note at the top of the file so Claude understands the intent.

```
This schema defines the ZeroDB backend for the Moonvale AI-Native Game Demo.

Claude Code should:

1. apply this schema to ZeroDB
2. seed the NPC and lore data
3. generate API routes that read/write from these tables
4. implement gameplay rules using the game_events table
5. implement NPC dialogue using lore + npc_memories
```

---

# 14. Expected Database Size (Demo)

Typical workshop demo size:

```
players: 1–10
npc_memories: <50
game_events: <100
lore: 3–10
world_events: <5
```

Extremely lightweight.

---


