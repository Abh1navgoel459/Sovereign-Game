# Moonvale NPC Dialogue System

This directory contains the deterministic NPC dialogue system for the Moonvale AI-Native Game World demo.

## Files

- **types.ts** - TypeScript interfaces for all game entities
- **lore.ts** - Lore database and search functionality  
- **memory.ts** - NPC memory storage and retrieval
- **npc.ts** - Main NPC dialogue system with deterministic responses
- **data.ts** - File-based persistence layer
- **game-engine.ts** - Game logic and world event triggers
- **seed.ts** - Initial seed data for the demo

## Core NPC System (npc.ts)

### Main Function
```typescript
generateNPCResponse(npcId: string, playerId: string, playerMessage: string): NPCResponse
```

Returns a deterministic NPC response based on:
- Keyword matching in player message
- Relevant lore retrieval
- Player's conversation and action history

### Supported Keywords

| Keyword | Response |
|---------|----------|
| "ember tower", "tower" | Returns Ember Tower lore |
| "moonvale", "village", "founding" | Returns Moonvale lore |
| "wolf", "wolves" | Returns wolves lore (references past actions if player defeated wolves) |
| "hello", "hi", "greetings" | Greeting response |
| "help", "assist" | Help response listing available topics |

### Memory System

NPC stores memories for:
- Questions asked ("Player asked about Ember Tower")
- Actions taken via storeActionMemory():
  - `wolf_kill` -> "Player defeated wolves near Moonvale"
  - `explore` -> "Player explored the northern forest"  
  - `help_village` -> "Player helped the village"

### Example Usage

```typescript
import { generateNPCResponse, storeActionMemory } from './npc';

const npcId = 'elarin-1';
const playerId = 'player-123';

// Initial question
const response = generateNPCResponse(npcId, playerId, 'What happened to Ember Tower?');
console.log(response.response);
// "Ah, Ember Tower... The Ember Tower collapsed after a magical experiment..."

// Store action memory
storeActionMemory(npcId, playerId, 'wolf_kill');

// Ask again after wolf defeat
const response2 = generateNPCResponse(npcId, playerId, 'Tell me about wolves');
console.log(response2.response);
// "You've already changed the balance around Moonvale. I heard you drove the wolves back..."
```

## Testing

Run tests with coverage:
```bash
npm test
```

All tests in `__tests__/npc.test.ts` verify:
- Lore retrieval functionality
- Deterministic response generation
- Memory storage and retrieval
- Memory integration in responses
- Edge cases

Coverage: 88.52% statements, 89.55% branches

## Design Principles

1. **No AI APIs** - All responses are template-based and deterministic
2. **Memory-aware** - NPCs reference past conversations and actions
3. **Demo-reliable** - Works consistently for live demonstrations
4. **Test-driven** - Comprehensive test coverage ensures reliability
5. **Extensible** - Easy to add new lore entries and response templates
