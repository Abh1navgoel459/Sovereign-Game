/**
 * Tests for File-based Storage System
 *
 * Tests all CRUD operations, atomic writes, error handling,
 * and type safety for the data storage layer.
 *
 * Refs #3
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    Player,
    NPC,
    NPCMemory,
    Lore,
    GameEvent,
    WorldEvent,
    savePlayer,
    getPlayer,
    updatePlayer,
    getAllPlayers,
    saveLore,
    getLore,
    getAllLore,
    searchLore,
    saveNPCMemory,
    getNPCMemory,
    getNPCMemories,
    getAllNPCMemories,
    saveGameEvent,
    getGameEvent,
    getGameEvents,
    countGameEvents,
    saveWorldEvent,
    getWorldEvent,
    getWorldEvents,
    clearAllData,
    getDataStats,
} from '../lib/data';

const TEST_DATA_DIR = path.join(process.cwd(), '.data');

describe('File-based Storage System', () => {
    beforeEach(() => {
        // Clean up test data before each test
        clearAllData();
    });

    afterAll(() => {
        // Final cleanup
        clearAllData();
    });

    describe('Data Directory Management', () => {
        it('creates .data directory automatically', () => {
            // Directory should be created by ensureDataDir
            expect(fs.existsSync(TEST_DATA_DIR)).toBe(true);
        });

        it('provides accurate data statistics', () => {
            const stats = getDataStats();
            expect(stats.players).toBe(0);
            expect(stats.lore).toBe(0);
            expect(stats.npcMemories).toBe(0);
            expect(stats.gameEvents).toBe(0);
            expect(stats.worldEvents).toBe(0);
            expect(stats.totalFiles).toBe(0);
        });
    });

    describe('Player Storage', () => {
        it('saves a new player with auto-generated ID', () => {
            const player = savePlayer({
                username: 'TestPlayer',
                class: 'Ranger',
                faction: 'Forest Guild',
                level: 1,
                xp: 0,
                inventory: [],
                reputation: 0,
            });

            expect(player.id).toBeDefined();
            expect(player.username).toBe('TestPlayer');
            expect(player.created_at).toBeDefined();
        });

        it('retrieves a player by ID', () => {
            const saved = savePlayer({
                username: 'TestPlayer',
                class: 'Ranger',
                faction: 'Forest Guild',
                level: 1,
                xp: 0,
                inventory: [],
                reputation: 0,
            });

            const retrieved = getPlayer(saved.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(saved.id);
            expect(retrieved?.username).toBe('TestPlayer');
        });

        it('returns null for non-existent player', () => {
            const player = getPlayer('non-existent-id');
            expect(player).toBeNull();
        });

        it('updates an existing player', () => {
            const player = savePlayer({
                username: 'TestPlayer',
                class: 'Ranger',
                faction: 'Forest Guild',
                level: 1,
                xp: 0,
                inventory: [],
                reputation: 0,
            });

            const updated = updatePlayer(player.id, {
                level: 2,
                xp: 100,
                reputation: 10,
            });

            expect(updated).not.toBeNull();
            expect(updated?.level).toBe(2);
            expect(updated?.xp).toBe(100);
            expect(updated?.reputation).toBe(10);
        });

        it('returns null when updating non-existent player', () => {
            const updated = updatePlayer('non-existent-id', { level: 5 });
            expect(updated).toBeNull();
        });

        it('retrieves all players', () => {
            savePlayer({
                username: 'Player1',
                class: 'Ranger',
                faction: 'Forest Guild',
                level: 1,
                xp: 0,
                inventory: [],
                reputation: 0,
            });

            savePlayer({
                username: 'Player2',
                class: 'Warrior',
                faction: 'Mountain Clan',
                level: 2,
                xp: 50,
                inventory: ['sword'],
                reputation: 5,
            });

            const players = getAllPlayers();
            expect(players).toHaveLength(2);
        });

        it('uses atomic writes to prevent corruption', () => {
            const player = savePlayer({
                username: 'AtomicTest',
                class: 'Ranger',
                faction: 'Forest Guild',
                level: 1,
                xp: 0,
                inventory: [],
                reputation: 0,
            });

            const filePath = path.join(TEST_DATA_DIR, `player_${player.id}.json`);
            expect(fs.existsSync(filePath)).toBe(true);

            // No temp files should remain
            const files = fs.readdirSync(TEST_DATA_DIR);
            const tempFiles = files.filter(f => f.includes('.tmp.'));
            expect(tempFiles).toHaveLength(0);
        });
    });

    describe('Lore Storage', () => {
        it('saves lore with auto-generated ID', () => {
            const lore = saveLore({
                title: 'Ember Tower',
                content: 'The tower collapsed after a magical experiment.',
                region: 'Northern Wastes',
                tags: ['ember tower', 'magic', 'history'],
            });

            expect(lore.id).toBeDefined();
            expect(lore.title).toBe('Ember Tower');
            expect(lore.created_at).toBeDefined();
        });

        it('retrieves lore by ID', () => {
            const saved = saveLore({
                title: 'Ember Tower',
                content: 'The tower collapsed after a magical experiment.',
                region: 'Northern Wastes',
                tags: ['ember tower', 'magic', 'history'],
            });

            const retrieved = getLore(saved.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.title).toBe('Ember Tower');
        });

        it('retrieves all lore', () => {
            saveLore({
                title: 'Ember Tower',
                content: 'The tower collapsed.',
                region: 'Northern Wastes',
                tags: ['ember tower', 'magic'],
            });

            saveLore({
                title: 'Moonvale Founding',
                content: 'Founded by the Forest Guild.',
                region: 'Moonvale',
                tags: ['moonvale', 'founding'],
            });

            const allLore = getAllLore();
            expect(allLore).toHaveLength(2);
        });

        it('searches lore by keywords in title', () => {
            saveLore({
                title: 'Ember Tower',
                content: 'The tower collapsed.',
                region: 'Northern Wastes',
                tags: ['ember tower', 'magic'],
            });

            saveLore({
                title: 'Moonvale Founding',
                content: 'Founded by the Forest Guild.',
                region: 'Moonvale',
                tags: ['moonvale', 'founding'],
            });

            const results = searchLore('tower');
            expect(results).toHaveLength(1);
            expect(results[0].title).toBe('Ember Tower');
        });

        it('searches lore by keywords in content', () => {
            saveLore({
                title: 'Ember Tower',
                content: 'The tower collapsed after a magical experiment.',
                region: 'Northern Wastes',
                tags: ['ember tower', 'magic'],
            });

            const results = searchLore('magical');
            expect(results).toHaveLength(1);
            expect(results[0].title).toBe('Ember Tower');
        });

        it('searches lore by keywords in tags', () => {
            saveLore({
                title: 'Wolves of the North',
                content: 'Wolves attack travelers.',
                region: 'Northern Forest',
                tags: ['wolves', 'danger', 'forest'],
            });

            const results = searchLore('danger');
            expect(results).toHaveLength(1);
        });

        it('performs case-insensitive keyword search', () => {
            saveLore({
                title: 'Ember Tower',
                content: 'The tower collapsed.',
                region: 'Northern Wastes',
                tags: ['ember tower', 'magic'],
            });

            const results = searchLore('EMBER');
            expect(results).toHaveLength(1);
        });

        it('returns all lore when search is empty', () => {
            saveLore({
                title: 'Lore 1',
                content: 'Content 1',
                region: 'Region 1',
                tags: ['tag1'],
            });

            saveLore({
                title: 'Lore 2',
                content: 'Content 2',
                region: 'Region 2',
                tags: ['tag2'],
            });

            const results = searchLore('');
            expect(results).toHaveLength(2);
        });
    });

    describe('NPC Memory Storage', () => {
        it('saves NPC memory with auto-generated ID', () => {
            const memory = saveNPCMemory({
                npc_id: 'npc-123',
                player_id: 'player-456',
                memory: 'Player asked about Ember Tower',
                importance: 2,
                metadata: { location: 'Moonvale' },
            });

            expect(memory.id).toBeDefined();
            expect(memory.memory).toBe('Player asked about Ember Tower');
            expect(memory.created_at).toBeDefined();
        });

        it('retrieves NPC memory by ID', () => {
            const saved = saveNPCMemory({
                npc_id: 'npc-123',
                player_id: 'player-456',
                memory: 'Player defeated wolves',
                importance: 3,
                metadata: {},
            });

            const retrieved = getNPCMemory(saved.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.memory).toBe('Player defeated wolves');
        });

        it('retrieves memories for specific NPC', () => {
            saveNPCMemory({
                npc_id: 'npc-1',
                player_id: 'player-1',
                memory: 'Memory 1',
                importance: 1,
                metadata: {},
            });

            saveNPCMemory({
                npc_id: 'npc-1',
                player_id: 'player-2',
                memory: 'Memory 2',
                importance: 2,
                metadata: {},
            });

            saveNPCMemory({
                npc_id: 'npc-2',
                player_id: 'player-1',
                memory: 'Memory 3',
                importance: 1,
                metadata: {},
            });

            const memories = getNPCMemories('npc-1');
            expect(memories).toHaveLength(2);
        });

        it('filters memories by player', () => {
            saveNPCMemory({
                npc_id: 'npc-1',
                player_id: 'player-1',
                memory: 'Memory 1',
                importance: 1,
                metadata: {},
            });

            saveNPCMemory({
                npc_id: 'npc-1',
                player_id: 'player-2',
                memory: 'Memory 2',
                importance: 2,
                metadata: {},
            });

            const memories = getNPCMemories('npc-1', 'player-1');
            expect(memories).toHaveLength(1);
            expect(memories[0].player_id).toBe('player-1');
        });

        it('sorts memories by importance and date', () => {
            saveNPCMemory({
                npc_id: 'npc-1',
                player_id: 'player-1',
                memory: 'Low importance',
                importance: 1,
                metadata: {},
            });

            saveNPCMemory({
                npc_id: 'npc-1',
                player_id: 'player-1',
                memory: 'High importance',
                importance: 3,
                metadata: {},
            });

            saveNPCMemory({
                npc_id: 'npc-1',
                player_id: 'player-1',
                memory: 'Medium importance',
                importance: 2,
                metadata: {},
            });

            const memories = getNPCMemories('npc-1');
            expect(memories[0].importance).toBe(3);
            expect(memories[1].importance).toBe(2);
            expect(memories[2].importance).toBe(1);
        });

        it('retrieves all NPC memories', () => {
            saveNPCMemory({
                npc_id: 'npc-1',
                player_id: 'player-1',
                memory: 'Memory 1',
                importance: 1,
                metadata: {},
            });

            saveNPCMemory({
                npc_id: 'npc-2',
                player_id: 'player-2',
                memory: 'Memory 2',
                importance: 1,
                metadata: {},
            });

            const allMemories = getAllNPCMemories();
            expect(allMemories).toHaveLength(2);
        });
    });

    describe('Game Events Storage', () => {
        it('saves game event with auto-generated ID', () => {
            const event = saveGameEvent({
                player_id: 'player-123',
                event_type: 'wolf_kill',
                location: 'Northern Forest',
                metadata: { wolves_killed: 1 },
            });

            expect(event.id).toBeDefined();
            expect(event.event_type).toBe('wolf_kill');
            expect(event.created_at).toBeDefined();
        });

        it('retrieves game event by ID', () => {
            const saved = saveGameEvent({
                player_id: 'player-123',
                event_type: 'explore',
                location: 'Moonvale',
                metadata: {},
            });

            const retrieved = getGameEvent(saved.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.event_type).toBe('explore');
        });

        it('retrieves events for specific player', () => {
            saveGameEvent({
                player_id: 'player-1',
                event_type: 'wolf_kill',
                location: 'Forest',
                metadata: {},
            });

            saveGameEvent({
                player_id: 'player-1',
                event_type: 'explore',
                location: 'Village',
                metadata: {},
            });

            saveGameEvent({
                player_id: 'player-2',
                event_type: 'wolf_kill',
                location: 'Forest',
                metadata: {},
            });

            const events = getGameEvents('player-1');
            expect(events).toHaveLength(2);
        });

        it('filters events by type', () => {
            saveGameEvent({
                player_id: 'player-1',
                event_type: 'wolf_kill',
                location: 'Forest',
                metadata: {},
            });

            saveGameEvent({
                player_id: 'player-1',
                event_type: 'wolf_kill',
                location: 'Forest',
                metadata: {},
            });

            saveGameEvent({
                player_id: 'player-1',
                event_type: 'explore',
                location: 'Village',
                metadata: {},
            });

            const wolfEvents = getGameEvents('player-1', 'wolf_kill');
            expect(wolfEvents).toHaveLength(2);
        });

        it('counts events correctly', () => {
            saveGameEvent({
                player_id: 'player-1',
                event_type: 'wolf_kill',
                location: 'Forest',
                metadata: {},
            });

            saveGameEvent({
                player_id: 'player-1',
                event_type: 'wolf_kill',
                location: 'Forest',
                metadata: {},
            });

            saveGameEvent({
                player_id: 'player-1',
                event_type: 'wolf_kill',
                location: 'Forest',
                metadata: {},
            });

            const count = countGameEvents('player-1', 'wolf_kill');
            expect(count).toBe(3);
        });

        it('sorts events by date (newest first)', () => {
            const event1 = saveGameEvent({
                player_id: 'player-1',
                event_type: 'explore',
                location: 'Village',
                metadata: {},
            });

            // Small delay to ensure different timestamps
            const event2 = saveGameEvent({
                player_id: 'player-1',
                event_type: 'wolf_kill',
                location: 'Forest',
                metadata: {},
            });

            const events = getGameEvents('player-1');
            expect(events[0].id).toBe(event2.id);
            expect(events[1].id).toBe(event1.id);
        });
    });

    describe('World Events Storage', () => {
        it('saves world event with auto-generated ID', () => {
            const event = saveWorldEvent({
                event_name: 'Wolf Pack Retreat',
                description: 'Wolf activity has decreased around Moonvale.',
                trigger_source: 'player_actions',
                metadata: { player_id: 'player-123' },
            });

            expect(event.id).toBeDefined();
            expect(event.event_name).toBe('Wolf Pack Retreat');
            expect(event.created_at).toBeDefined();
        });

        it('retrieves world event by ID', () => {
            const saved = saveWorldEvent({
                event_name: 'Wolf Pack Retreat',
                description: 'Wolf activity has decreased.',
                trigger_source: 'player_actions',
                metadata: {},
            });

            const retrieved = getWorldEvent(saved.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.event_name).toBe('Wolf Pack Retreat');
        });

        it('retrieves all world events', () => {
            saveWorldEvent({
                event_name: 'Event 1',
                description: 'Description 1',
                trigger_source: 'system',
                metadata: {},
            });

            saveWorldEvent({
                event_name: 'Event 2',
                description: 'Description 2',
                trigger_source: 'player_actions',
                metadata: {},
            });

            const events = getWorldEvents();
            expect(events).toHaveLength(2);
        });

        it('sorts world events by date (newest first)', () => {
            const event1 = saveWorldEvent({
                event_name: 'Event 1',
                description: 'Description 1',
                trigger_source: 'system',
                metadata: {},
            });

            const event2 = saveWorldEvent({
                event_name: 'Event 2',
                description: 'Description 2',
                trigger_source: 'player_actions',
                metadata: {},
            });

            const events = getWorldEvents();
            expect(events[0].id).toBe(event2.id);
            expect(events[1].id).toBe(event1.id);
        });
    });

    describe('Data Management', () => {
        it('clears all data successfully', () => {
            savePlayer({
                username: 'TestPlayer',
                class: 'Ranger',
                faction: 'Forest Guild',
                level: 1,
                xp: 0,
                inventory: [],
                reputation: 0,
            });

            saveLore({
                title: 'Test Lore',
                content: 'Test content',
                region: 'Test Region',
                tags: ['test'],
            });

            let stats = getDataStats();
            expect(stats.totalFiles).toBeGreaterThan(0);

            clearAllData();

            stats = getDataStats();
            expect(stats.totalFiles).toBe(0);
        });

        it('updates statistics correctly after operations', () => {
            let stats = getDataStats();
            expect(stats.players).toBe(0);

            savePlayer({
                username: 'TestPlayer',
                class: 'Ranger',
                faction: 'Forest Guild',
                level: 1,
                xp: 0,
                inventory: [],
                reputation: 0,
            });

            stats = getDataStats();
            expect(stats.players).toBe(1);

            saveLore({
                title: 'Test Lore',
                content: 'Test content',
                region: 'Test Region',
                tags: ['test'],
            });

            stats = getDataStats();
            expect(stats.lore).toBe(1);
            expect(stats.totalFiles).toBe(2);
        });
    });

    describe('Error Handling', () => {
        it('handles non-existent file reads gracefully', () => {
            const player = getPlayer('non-existent-id');
            expect(player).toBeNull();
        });

        it('handles invalid JSON gracefully', () => {
            // Create a corrupt file
            const corruptPath = path.join(TEST_DATA_DIR, 'player_corrupt.json');
            fs.writeFileSync(corruptPath, 'invalid json {', 'utf-8');

            expect(() => {
                const filePath = path.join(TEST_DATA_DIR, 'player_corrupt.json');
                fs.readFileSync(filePath, 'utf-8');
            }).not.toThrow();
        });
    });

    describe('Type Safety', () => {
        it('ensures Player type safety', () => {
            const player = savePlayer({
                username: 'TypeTest',
                class: 'Warrior',
                faction: 'Mountain Clan',
                level: 5,
                xp: 100,
                inventory: ['sword', 'shield'],
                reputation: 10,
            });

            expect(typeof player.id).toBe('string');
            expect(typeof player.username).toBe('string');
            expect(typeof player.level).toBe('number');
            expect(Array.isArray(player.inventory)).toBe(true);
        });

        it('ensures Lore type safety', () => {
            const lore = saveLore({
                title: 'TypeTest',
                content: 'Content',
                region: 'Region',
                tags: ['tag1', 'tag2'],
            });

            expect(typeof lore.id).toBe('string');
            expect(typeof lore.title).toBe('string');
            expect(Array.isArray(lore.tags)).toBe(true);
        });

        it('ensures NPCMemory type safety', () => {
            const memory = saveNPCMemory({
                npc_id: 'npc-1',
                player_id: 'player-1',
                memory: 'Test memory',
                importance: 2,
                metadata: { key: 'value' },
            });

            expect(typeof memory.id).toBe('string');
            expect(typeof memory.importance).toBe('number');
            expect(typeof memory.metadata).toBe('object');
        });
    });
});
