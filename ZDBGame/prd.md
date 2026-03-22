# AI-Native Game Worlds

Version: 1.0
Purpose: Generate a live working demo during a workshop in minutes
Builder: Claude Code

---

# 1. Demo Goal

Show that **game worlds can remember, learn, and evolve** using ZeroDB.

The demo must prove:

1. Player data persists
2. NPC remembers player actions
3. Lore can be searched semantically
4. Player actions generate telemetry
5. World events react to player behavior

All within **one simple dashboard UI**.

---

# 2. The Demo Story

The game world is called:

**Moonvale**

The player meets an NPC historian named:

**Elarin**

The player can:

* ask questions
* explore
* fight wolves

If the player defeats **3 wolves**, a world event triggers.

NPC memory updates after interactions.

---

# 3. Technology Stack

Claude Code should generate:

Frontend
Next.js (single page)

Backend
Next.js API routes

Database
ZeroDB

No authentication required.

No complex state management.

---

# 4. Core Data Models

Only **five collections**.

---

## Player

```json
{
"id": "uuid",
"username": "string",
"class": "string",
"level": 1,
"xp": 0
}
```

---

## NPC

```json
{
"id": "uuid",
"name": "Elarin",
"role": "Historian",
"location": "Moonvale"
}
```

---

## NPC Memory

```json
{
"id": "uuid",
"npc_id": "uuid",
"player_id": "uuid",
"memory": "string",
"importance": 1
}
```

Examples:

* "Player asked about Ember Tower"
* "Player defeated wolves near Moonvale"

---

## Lore

Vector searchable.

```json
{
"id": "uuid",
"title": "string",
"content": "string",
"embedding": "vector"
}
```

Seed entries:

1.

"The Ember Tower collapsed after a magical experiment."

2.

"Moonvale was founded by the Forest Guild."

3.

"Wolves often attack travelers near the northern forest."

---

## Game Events

```json
{
"id": "uuid",
"player_id": "uuid",
"type": "string",
"timestamp": "datetime"
}
```

Examples

* explore
* wolf_kill
* npc_conversation

---

# 5. Emergent World Event

Rule:

```
IF player wolf_kill >= 3
THEN trigger world event
```

World event:

**Wolf Pack Retreat**

Description:

"Wolf activity around Moonvale has suddenly decreased."

Store event in DB.

Display in UI.

---

# 6. Minimal API Routes

Claude Code should generate only these.

---

## Create Player

POST

```
/api/player
```

---

## Talk to NPC

POST

```
/api/npc/talk
```

Logic:

1 retrieve lore via vector search
2 retrieve NPC memories
3 generate response
4 store memory

---

## Record Event

POST

```
/api/event
```

---

## Check World State

GET

```
/api/world
```

Checks wolf kill count.

Creates event if needed.

---

# 7. One Page UI

Simple dashboard.

---

## Section 1 — Player

Button

```
Create Player
```

Displays

```
Name
Class
Level
XP
```

---

## Section 2 — Talk to NPC

Input

```
Ask Elarin something
```

Button

```
Send
```

NPC response appears.

---

## Section 3 — Actions

Buttons

```
Explore Forest
Fight Wolf
Talk to NPC
```

Each button sends events.

---

## Section 4 — World Events

Display triggered events.

Example:

```
Wolf Pack Retreat
```

---

## Section 5 — NPC Memory Viewer

List memories.

Example:

```
Player asked about Ember Tower
Player defeated wolves near Moonvale
```

This part **blows people's minds** during demos.

---

# 8. Demo Script (2 minutes)

Instructor does this live.

Step 1

Create Player

---

Step 2

Ask NPC:

```
What happened to Ember Tower?
```

NPC answers using lore.

---

Step 3

Click

```
Fight Wolf
Fight Wolf
Fight Wolf
```

---

Step 4

World Event triggers

```
Wolf Pack Retreat
```

---

Step 5

Talk to NPC again.

NPC says something like:

```
I heard you drove the wolves away from Moonvale.
```

Memory proven.

---

# 9. Seed Data

NPC

```
Elarin
Village Historian
Moonvale
```

Lore

1

```
The Ember Tower collapsed after a magical experiment.
```

2

```
Moonvale was founded by the Forest Guild.
```

3

```
Wolves often attack travelers near the northern forest.
```

---

# 10. Claude Code Prompt

Use this **exact prompt to generate the demo**.

```
Build a minimal AI-native game world demo using Next.js and ZeroDB.

Create a single page dashboard with:

Create Player button
NPC chat interface
Gameplay action buttons (explore, fight wolf)
World events display
NPC memory viewer

Data models:

Player
NPC
NPCMemory
Lore (vector searchable)
GameEvents

Seed the world with:

NPC: Elarin (Historian in Moonvale)

Lore entries:
Ember Tower collapse
Moonvale founding
Wolf attacks

Gameplay logic:

When the player kills 3 wolves, create a world event called
"Wolf Pack Retreat".

NPC responses should use lore retrieval and stored NPC memory.

Ensure the demo runs locally and is easy to start.
```

---

# 11. Expected Build Time

Claude Code generation time:

**2–5 minutes**

Run time:

**instant**

---

