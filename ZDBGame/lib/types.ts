/**
 * TypeScript Data Models and Types for AI-Native Game World Demo (Moonvale)
 *
 * This file defines all core interfaces for the ZDBGame project.
 * All types follow strict TypeScript standards with no 'any' usage.
 *
 * References:
 * - PRD: /prd.md
 * - Data Model: /datamodel.md
 * - Issue: #2
 */

/**
 * Player represents a game player with persistent state.
 *
 * @example
 * {
 *   id: "550e8400-e29b-41d4-a716-446655440000",
 *   username: "TobyTheExplorer",
 *   class: "Ranger",
 *   level: 1,
 *   xp: 0
 * }
 */
export interface Player {
  /** Unique player identifier (UUID v4) */
  id: string;

  /** Player's display name */
  username: string;

  /** Player's character class (e.g., Ranger, Warrior, Mage) */
  class: string;

  /** Current player level (starts at 1) */
  level: number;

  /** Current experience points */
  xp: number;
}

/**
 * NPC represents a non-player character in the game world.
 *
 * @example
 * {
 *   id: "650e8400-e29b-41d4-a716-446655440001",
 *   name: "Elarin",
 *   role: "Village Historian",
 *   location: "Moonvale"
 * }
 */
export interface NPC {
  /** Unique NPC identifier (UUID v4) */
  id: string;

  /** NPC's name */
  name: string;

  /** NPC's role or profession (e.g., Historian, Merchant, Guard) */
  role: string;

  /** NPC's current location in the game world */
  location: string;
}

/**
 * NPCMemory represents a memory that an NPC has about a specific player.
 * This is core to AI-native gameplay, allowing NPCs to remember player actions.
 *
 * @example
 * {
 *   id: "750e8400-e29b-41d4-a716-446655440002",
 *   npcId: "650e8400-e29b-41d4-a716-446655440001",
 *   playerId: "550e8400-e29b-41d4-a716-446655440000",
 *   memory: "Player asked about Ember Tower",
 *   importance: 2,
 *   createdAt: "2024-03-12T10:30:00Z"
 * }
 */
export interface NPCMemory {
  /** Unique memory identifier (UUID v4) */
  id: string;

  /** Reference to the NPC who has this memory */
  npcId: string;

  /** Reference to the player this memory is about */
  playerId: string;

  /** The actual memory content as a text description */
  memory: string;

  /** Importance rating (1-10), higher means more significant */
  importance: number;

  /** ISO 8601 timestamp when the memory was created */
  createdAt: string;
}

/**
 * LoreEntry represents a piece of game world knowledge.
 * Lore entries are vector-searchable for semantic retrieval.
 *
 * @example
 * {
 *   id: "850e8400-e29b-41d4-a716-446655440003",
 *   title: "The Fall of Ember Tower",
 *   content: "The Ember Tower collapsed after a magical experiment went wrong.",
 *   tags: ["ember tower", "magic", "history"]
 * }
 */
export interface LoreEntry {
  /** Unique lore entry identifier (UUID v4) */
  id: string;

  /** Title or name of the lore entry */
  title: string;

  /** Full content/description of the lore */
  content: string;

  /** Tags for categorization and filtering */
  tags: string[];
}

/**
 * GameEvent represents a gameplay action or event.
 * Used for telemetry and tracking player behavior.
 *
 * @example
 * {
 *   id: "950e8400-e29b-41d4-a716-446655440004",
 *   playerId: "550e8400-e29b-41d4-a716-446655440000",
 *   type: "wolf_kill",
 *   description: "Player defeated a wolf near the northern forest",
 *   timestamp: "2024-03-12T10:35:00Z"
 * }
 */
export interface GameEvent {
  /** Unique event identifier (UUID v4) */
  id: string;

  /** Reference to the player who triggered this event */
  playerId: string;

  /** Event type (e.g., "explore", "wolf_kill", "npc_conversation") */
  type: string;

  /** Human-readable description of the event */
  description: string;

  /** ISO 8601 timestamp when the event occurred */
  timestamp: string;
}

/**
 * WorldEvent represents a significant event that affects the game world.
 * World events are triggered by player behavior and emergent gameplay rules.
 *
 * @example
 * {
 *   id: "a50e8400-e29b-41d4-a716-446655440005",
 *   name: "Wolf Pack Retreat",
 *   description: "Wolf activity around Moonvale has suddenly decreased.",
 *   timestamp: "2024-03-12T10:40:00Z"
 * }
 */
export interface WorldEvent {
  /** Unique world event identifier (UUID v4) */
  id: string;

  /** Name of the world event */
  name: string;

  /** Description of what happened in the world */
  description: string;

  /** ISO 8601 timestamp when the world event was triggered */
  timestamp: string;
}

/**
 * NPC dialogue response with context information.
 * Used when NPCs respond to player interactions.
 */
export interface NPCResponse {
  /** The NPC's text response */
  response: string;

  /** Lore entries that were used to generate the response */
  loreUsed: LoreEntry[];

  /** Memories that were referenced in the response */
  memoriesReferenced: NPCMemory[];
}

/**
 * GameState represents the complete state of the game world.
 * Used for serialization and state management.
 */
export interface GameState {
  /** All players in the game */
  players: Player[];

  /** All NPCs in the game */
  npcs: NPC[];

  /** All NPC memories */
  npcMemories: NPCMemory[];

  /** All lore entries */
  loreEntries: LoreEntry[];

  /** All gameplay events */
  gameEvents: GameEvent[];

  /** All world events */
  worldEvents: WorldEvent[];
}

/**
 * Extended Player interface with optional additional fields.
 * Used when retrieving full player data from the database.
 */
export interface PlayerWithExtras extends Player {
  /** Player's faction affiliation (optional) */
  faction?: string;

  /** Player inventory as JSON data (optional) */
  inventory?: Record<string, unknown>[];

  /** Player reputation score (optional) */
  reputation?: number;

  /** ISO 8601 timestamp when the player was created (optional) */
  createdAt?: string;
}

/**
 * Extended NPC interface with optional personality data.
 * Used when retrieving full NPC data from the database.
 */
export interface NPCWithPersonality extends NPC {
  /** NPC personality traits as JSON data (optional) */
  personality?: Record<string, unknown>;

  /** ISO 8601 timestamp when the NPC was created (optional) */
  createdAt?: string;
}

/**
 * Extended LoreEntry interface with vector embedding.
 * Used when working with vector search functionality.
 */
export interface LoreEntryWithEmbedding extends LoreEntry {
  /** Vector embedding for semantic search (1536 dimensions) */
  embedding?: number[];

  /** Geographic region this lore belongs to (optional) */
  region?: string;

  /** ISO 8601 timestamp when the lore was created (optional) */
  createdAt?: string;
}

/**
 * Extended GameEvent interface with additional metadata.
 * Used when retrieving full event data from the database.
 */
export interface GameEventWithMetadata extends GameEvent {
  /** Location where the event occurred (optional) */
  location?: string;

  /** Additional metadata as JSON data (optional) */
  metadata?: Record<string, unknown>;
}

/**
 * Extended WorldEvent interface with trigger information.
 * Used when retrieving full world event data from the database.
 */
export interface WorldEventWithTrigger extends WorldEvent {
  /** What triggered this world event (optional) */
  triggerSource?: string;

  /** Additional metadata as JSON data (optional) */
  metadata?: Record<string, unknown>;
}

/**
 * API Request types for creating new entities
 */

export interface CreatePlayerRequest {
  username: string;
  class: string;
}

export interface CreateNPCMemoryRequest {
  npcId: string;
  playerId: string;
  memory: string;
  importance: number;
}

export interface CreateGameEventRequest {
  playerId: string;
  type: string;
  description: string;
}

export interface CreateWorldEventRequest {
  name: string;
  description: string;
}

export interface NPCTalkRequest {
  playerId: string;
  npcId: string;
  message: string;
}

/**
 * API Response types
 */

export interface NPCTalkResponse {
  npcResponse: string;
  memoryCreated: boolean;
  loreRetrieved: LoreEntry[];
}

export interface WorldStateResponse {
  worldEvents: WorldEvent[];
  playerEventCount: Record<string, number>;
  triggeredNewEvent: boolean;
}

/**
 * Type guards for runtime type checking
 */

export function isPlayer(obj: unknown): obj is Player {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'username' in obj &&
    'class' in obj &&
    'level' in obj &&
    'xp' in obj
  );
}

export function isNPC(obj: unknown): obj is NPC {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'role' in obj &&
    'location' in obj
  );
}

export function isNPCMemory(obj: unknown): obj is NPCMemory {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'npcId' in obj &&
    'playerId' in obj &&
    'memory' in obj &&
    'importance' in obj &&
    'createdAt' in obj
  );
}

export function isLoreEntry(obj: unknown): obj is LoreEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'content' in obj &&
    'tags' in obj &&
    Array.isArray((obj as LoreEntry).tags)
  );
}

export function isGameEvent(obj: unknown): obj is GameEvent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'playerId' in obj &&
    'type' in obj &&
    'description' in obj &&
    'timestamp' in obj
  );
}

export function isWorldEvent(obj: unknown): obj is WorldEvent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'description' in obj &&
    'timestamp' in obj
  );
}
