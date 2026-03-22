/**
 * File-based Storage System for ZDBGame Demo
 *
 * Provides reliable, type-safe file-based storage for game data.
 * All data stored in .data/ directory as JSON files.
 *
 * Features:
 * - Atomic file writes (write to temp, then rename)
 * - Auto-create .data/ directory on first access
 * - Type-safe return values
 * - Simple keyword-based search for lore
 * - Error handling for all file operations
 *
 * Refs #3
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Player {
    id: string;
    username: string;
    class: string;
    faction: string;
    level: number;
    xp: number;
    inventory: string[];
    reputation: number;
    created_at: string;
}

export interface NPC {
    id: string;
    name: string;
    role: string;
    location: string;
    personality: Record<string, any>;
    created_at: string;
}

export interface NPCMemory {
    id: string;
    npc_id: string;
    player_id: string;
    memory: string;
    importance: number;
    metadata: Record<string, any>;
    created_at: string;
}

export interface Lore {
    id: string;
    title: string;
    content: string;
    region: string;
    tags: string[];
    created_at: string;
}

export interface GameEvent {
    id: string;
    player_id: string;
    event_type: string;
    location: string;
    metadata: Record<string, any>;
    created_at: string;
}

export interface WorldEvent {
    id: string;
    event_name: string;
    description: string;
    trigger_source: string;
    metadata: Record<string, any>;
    created_at: string;
}

// ============================================================================
// Configuration
// ============================================================================

const DATA_DIR = path.join(process.cwd(), '.data');

// Ensure data directory exists on module load
function ensureDataDir(): void {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    } catch (error) {
        throw new Error(`Failed to create data directory: ${error}`);
    }
}

// ============================================================================
// Atomic File Operations
// ============================================================================

/**
 * Atomically write data to a file
 * Uses temp file + rename pattern to prevent corruption
 */
function atomicWrite(filePath: string, data: any): void {
    ensureDataDir();

    const tempPath = `${filePath}.tmp.${Date.now()}`;

    try {
        // Write to temp file
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');

        // Atomic rename
        fs.renameSync(tempPath, filePath);
    } catch (error) {
        // Clean up temp file on error
        try {
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
        throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
}

/**
 * Read and parse JSON file safely
 */
function readJSON<T>(filePath: string): T | null {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as T;
    } catch (error) {
        throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
}

/**
 * Get path for a specific data file
 */
function getDataPath(filename: string): string {
    return path.join(DATA_DIR, filename);
}

// ============================================================================
// Player Storage
// ============================================================================

export function savePlayer(player: Omit<Player, 'id' | 'created_at'>): Player {
    const newPlayer: Player = {
        ...player,
        id: randomUUID(),
        created_at: new Date().toISOString(),
    };

    const filePath = getDataPath(`player_${newPlayer.id}.json`);
    atomicWrite(filePath, newPlayer);

    return newPlayer;
}

export function getPlayer(playerId: string): Player | null {
    const filePath = getDataPath(`player_${playerId}.json`);
    return readJSON<Player>(filePath);
}

export function updatePlayer(playerId: string, updates: Partial<Player>): Player | null {
    const player = getPlayer(playerId);
    if (!player) {
        return null;
    }

    const updatedPlayer = { ...player, ...updates };
    const filePath = getDataPath(`player_${playerId}.json`);
    atomicWrite(filePath, updatedPlayer);

    return updatedPlayer;
}

export function getAllPlayers(): Player[] {
    ensureDataDir();

    try {
        const files = fs.readdirSync(DATA_DIR);
        const playerFiles = files.filter(f => f.startsWith('player_') && f.endsWith('.json'));

        return playerFiles
            .map(file => readJSON<Player>(getDataPath(file)))
            .filter((p): p is Player => p !== null);
    } catch (error) {
        throw new Error(`Failed to read players: ${error}`);
    }
}

// ============================================================================
// NPC Storage
// ============================================================================

export function saveNPC(npc: Omit<NPC, 'id' | 'created_at'>): NPC {
    const newNPC: NPC = {
        ...npc,
        id: randomUUID(),
        personality: npc.personality || {},
        created_at: new Date().toISOString(),
    };

    const filePath = getDataPath(`npc_${newNPC.id}.json`);
    atomicWrite(filePath, newNPC);

    return newNPC;
}

export function getNPC(npcId: string): NPC | null {
    const filePath = getDataPath(`npc_${npcId}.json`);
    return readJSON<NPC>(filePath);
}

export function getAllNPCs(): NPC[] {
    ensureDataDir();

    try {
        const files = fs.readdirSync(DATA_DIR);
        const npcFiles = files.filter(f => f.startsWith('npc_') && f.endsWith('.json'));

        return npcFiles
            .map(file => readJSON<NPC>(getDataPath(file)))
            .filter((n): n is NPC => n !== null);
    } catch (error) {
        throw new Error(`Failed to read NPCs: ${error}`);
    }
}

// ============================================================================
// Lore Storage with Keyword Search
// ============================================================================

export function saveLore(lore: Omit<Lore, 'id' | 'created_at'>): Lore {
    const newLore: Lore = {
        ...lore,
        id: randomUUID(),
        created_at: new Date().toISOString(),
    };

    const filePath = getDataPath(`lore_${newLore.id}.json`);
    atomicWrite(filePath, newLore);

    return newLore;
}

export function getLore(loreId: string): Lore | null {
    const filePath = getDataPath(`lore_${loreId}.json`);
    return readJSON<Lore>(filePath);
}

export function getAllLore(): Lore[] {
    ensureDataDir();

    try {
        const files = fs.readdirSync(DATA_DIR);
        const loreFiles = files.filter(f => f.startsWith('lore_') && f.endsWith('.json'));

        return loreFiles
            .map(file => readJSON<Lore>(getDataPath(file)))
            .filter((l): l is Lore => l !== null);
    } catch (error) {
        throw new Error(`Failed to read lore: ${error}`);
    }
}

/**
 * Search lore by keywords
 * Matches against title, content, region, and tags (case-insensitive)
 */
export function searchLore(keywords: string): Lore[] {
    const allLore = getAllLore();

    if (!keywords.trim()) {
        return allLore;
    }

    const searchTerms = keywords.toLowerCase().split(/\s+/);

    return allLore.filter(lore => {
        const searchableText = [
            lore.title,
            lore.content,
            lore.region,
            ...lore.tags
        ].join(' ').toLowerCase();

        return searchTerms.some(term => searchableText.includes(term));
    });
}

// ============================================================================
// NPC Memory Storage
// ============================================================================

export function saveNPCMemory(memory: Omit<NPCMemory, 'id' | 'created_at'>): NPCMemory {
    const newMemory: NPCMemory = {
        ...memory,
        id: randomUUID(),
        created_at: new Date().toISOString(),
    };

    const filePath = getDataPath(`npc_memory_${newMemory.id}.json`);
    atomicWrite(filePath, newMemory);

    return newMemory;
}

export function getNPCMemory(memoryId: string): NPCMemory | null {
    const filePath = getDataPath(`npc_memory_${memoryId}.json`);
    return readJSON<NPCMemory>(filePath);
}

export function getNPCMemories(npcId: string, playerId?: string): NPCMemory[] {
    ensureDataDir();

    try {
        const files = fs.readdirSync(DATA_DIR);
        const memoryFiles = files.filter(f => f.startsWith('npc_memory_') && f.endsWith('.json'));

        let memories = memoryFiles
            .map(file => readJSON<NPCMemory>(getDataPath(file)))
            .filter((m): m is NPCMemory => m !== null)
            .filter(m => m.npc_id === npcId);

        if (playerId) {
            memories = memories.filter(m => m.player_id === playerId);
        }

        // Sort by importance (descending), then by date (newest first)
        return memories.sort((a, b) => {
            if (a.importance !== b.importance) {
                return b.importance - a.importance;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    } catch (error) {
        throw new Error(`Failed to read NPC memories: ${error}`);
    }
}

export function getAllNPCMemories(): NPCMemory[] {
    ensureDataDir();

    try {
        const files = fs.readdirSync(DATA_DIR);
        const memoryFiles = files.filter(f => f.startsWith('npc_memory_') && f.endsWith('.json'));

        return memoryFiles
            .map(file => readJSON<NPCMemory>(getDataPath(file)))
            .filter((m): m is NPCMemory => m !== null);
    } catch (error) {
        throw new Error(`Failed to read all NPC memories: ${error}`);
    }
}

// ============================================================================
// Game Events Storage
// ============================================================================

export function saveGameEvent(event: Omit<GameEvent, 'id' | 'created_at'>): GameEvent {
    const newEvent: GameEvent = {
        ...event,
        id: randomUUID(),
        created_at: new Date().toISOString(),
    };

    const filePath = getDataPath(`game_event_${newEvent.id}.json`);
    atomicWrite(filePath, newEvent);

    return newEvent;
}

export function getGameEvent(eventId: string): GameEvent | null {
    const filePath = getDataPath(`game_event_${eventId}.json`);
    return readJSON<GameEvent>(filePath);
}

export function getGameEvents(playerId?: string, eventType?: string): GameEvent[] {
    ensureDataDir();

    try {
        const files = fs.readdirSync(DATA_DIR);
        const eventFiles = files.filter(f => f.startsWith('game_event_') && f.endsWith('.json'));

        let events = eventFiles
            .map(file => readJSON<GameEvent>(getDataPath(file)))
            .filter((e): e is GameEvent => e !== null);

        if (playerId) {
            events = events.filter(e => e.player_id === playerId);
        }

        if (eventType) {
            events = events.filter(e => e.event_type === eventType);
        }

        // Sort by date (newest first)
        return events.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    } catch (error) {
        throw new Error(`Failed to read game events: ${error}`);
    }
}

export function countGameEvents(playerId: string, eventType: string): number {
    return getGameEvents(playerId, eventType).length;
}

export function getAllGameEvents(): GameEvent[] {
    return getGameEvents();
}

// ============================================================================
// World Events Storage
// ============================================================================

export function saveWorldEvent(event: Omit<WorldEvent, 'id' | 'created_at'>): WorldEvent {
    const newEvent: WorldEvent = {
        ...event,
        id: randomUUID(),
        created_at: new Date().toISOString(),
    };

    const filePath = getDataPath(`world_event_${newEvent.id}.json`);
    atomicWrite(filePath, newEvent);

    return newEvent;
}

export function getWorldEvent(eventId: string): WorldEvent | null {
    const filePath = getDataPath(`world_event_${eventId}.json`);
    return readJSON<WorldEvent>(filePath);
}

export function getWorldEvents(): WorldEvent[] {
    ensureDataDir();

    try {
        const files = fs.readdirSync(DATA_DIR);
        const eventFiles = files.filter(f => f.startsWith('world_event_') && f.endsWith('.json'));

        return eventFiles
            .map(file => readJSON<WorldEvent>(getDataPath(file)))
            .filter((e): e is WorldEvent => e !== null)
            .sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
    } catch (error) {
        throw new Error(`Failed to read world events: ${error}`);
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all data (useful for testing or resetting demo)
 */
export function clearAllData(): void {
    ensureDataDir();

    try {
        const files = fs.readdirSync(DATA_DIR);
        files.forEach(file => {
            const filePath = path.join(DATA_DIR, file);
            if (fs.statSync(filePath).isFile() && file.endsWith('.json')) {
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        throw new Error(`Failed to clear data: ${error}`);
    }
}

/**
 * Get data directory statistics
 */
export function getDataStats(): {
    players: number;
    lore: number;
    npcMemories: number;
    gameEvents: number;
    worldEvents: number;
    totalFiles: number;
} {
    ensureDataDir();

    try {
        const files = fs.readdirSync(DATA_DIR);

        return {
            players: files.filter(f => f.startsWith('player_')).length,
            lore: files.filter(f => f.startsWith('lore_')).length,
            npcMemories: files.filter(f => f.startsWith('npc_memory_')).length,
            gameEvents: files.filter(f => f.startsWith('game_event_')).length,
            worldEvents: files.filter(f => f.startsWith('world_event_')).length,
            totalFiles: files.filter(f => f.endsWith('.json')).length,
        };
    } catch (error) {
        throw new Error(`Failed to get data stats: ${error}`);
    }
}
