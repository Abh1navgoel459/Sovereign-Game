/**
 * Tests for Events and Memories API routes
 * GET /api/events
 * GET /api/memories
 *
 * Refs #9
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { POST as createPlayer } from '@/app/api/player/create/route';
import { GET as getEvents } from '@/app/api/events/route';
import { GET as getMemories } from '@/app/api/memories/route';
import { clearAllData, saveGameEvent } from '@/lib/data';
import { clearMemories, storeMemory } from '@/lib/memory';

describe('Events and Memories API Routes', () => {
  let playerId: string;

  beforeEach(async () => {
    // Clear all data
    clearAllData();
    clearMemories();

    // Create a player and get their ID
    const playerResponse = await createPlayer();
    const playerData = await playerResponse.json();
    playerId = playerData.player.id;
  });

  afterEach(() => {
    clearAllData();
    clearMemories();
  });

  describe('GET /api/events', () => {
    it('returns empty array when no events exist', async () => {
      const response = await getEvents();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.events).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('returns events for the current player', async () => {
      // Create some game events
      saveGameEvent({
        player_id: playerId,
        event_type: 'explore',
        location: 'Moonvale',
        metadata: { description: 'Player explored the forest' },
      });

      saveGameEvent({
        player_id: playerId,
        event_type: 'wolf_kill',
        location: 'Northern Forest',
        metadata: { description: 'Player defeated a wolf' },
      });

      const response = await getEvents();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.events).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it('sorts events by most recent first', async () => {
      // Create events with slight time gaps
      const event1 = saveGameEvent({
        player_id: playerId,
        event_type: 'explore',
        location: 'Moonvale',
        metadata: {},
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const event2 = saveGameEvent({
        player_id: playerId,
        event_type: 'wolf_kill',
        location: 'Forest',
        metadata: {},
      });

      const response = await getEvents();
      const data = await response.json();

      expect(data.events[0].id).toBe(event2.id);
      expect(data.events[1].id).toBe(event1.id);
    });

    it('includes event attributes', async () => {
      saveGameEvent({
        player_id: playerId,
        event_type: 'npc_conversation',
        location: 'Moonvale',
        metadata: { npc_name: 'Elarin' },
      });

      const response = await getEvents();
      const data = await response.json();

      const event = data.events[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('player_id');
      expect(event).toHaveProperty('event_type');
      expect(event).toHaveProperty('location');
      expect(event).toHaveProperty('metadata');
      expect(event).toHaveProperty('created_at');
    });

    it('returns empty array when no player exists', async () => {
      clearAllData();

      const response = await getEvents();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.events).toEqual([]);
    });
  });

  describe('GET /api/memories', () => {
    it('returns empty array when no memories exist', async () => {
      const response = await getMemories();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.memories).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('returns memories for the current player', async () => {
      // Store some NPC memories
      storeMemory('npc-elarin-001', playerId, 'Player asked about Ember Tower', 2);
      storeMemory('npc-elarin-001', playerId, 'Player defeated wolves', 3);

      const response = await getMemories();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.memories).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it('sorts memories by importance and recency', async () => {
      // Store memories with different importance levels
      storeMemory('npc-elarin-001', playerId, 'Low importance memory', 1);
      storeMemory('npc-elarin-001', playerId, 'High importance memory', 3);
      storeMemory('npc-elarin-001', playerId, 'Medium importance memory', 2);

      const response = await getMemories();
      const data = await response.json();

      // Should be sorted by importance descending
      expect(data.memories[0].importance).toBe(3);
      expect(data.memories[1].importance).toBe(2);
      expect(data.memories[2].importance).toBe(1);
    });

    it('includes memory attributes', async () => {
      storeMemory('npc-elarin-001', playerId, 'Test memory', 1);

      const response = await getMemories();
      const data = await response.json();

      const memory = data.memories[0];
      expect(memory).toHaveProperty('id');
      expect(memory).toHaveProperty('npcId');
      expect(memory).toHaveProperty('playerId');
      expect(memory).toHaveProperty('memory');
      expect(memory).toHaveProperty('importance');
      expect(memory).toHaveProperty('createdAt');
    });

    it('does not return duplicate memories', async () => {
      // Try to store duplicate memory
      storeMemory('npc-elarin-001', playerId, 'Same memory', 1);
      storeMemory('npc-elarin-001', playerId, 'Same memory', 1);

      const response = await getMemories();
      const data = await response.json();

      expect(data.memories).toHaveLength(1);
    });

    it('returns empty array when no player exists', async () => {
      clearAllData();

      const response = await getMemories();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.memories).toEqual([]);
    });
  });
});
