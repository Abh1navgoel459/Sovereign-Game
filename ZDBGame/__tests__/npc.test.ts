import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateNPCResponse, storeActionMemory } from '../lib/npc';
import { searchLore } from '../lib/lore';
import { clearMemories, getMemories } from '../lib/memory';

describe('NPC Dialogue System', () => {
  const npcId = 'elarin-1';
  const playerId = 'player-1';

  beforeEach(() => {
    // Clear memories before each test
    clearMemories();
  });

  describe('Lore Retrieval', () => {
    it('should search lore by keyword - ember tower', () => {
      const results = searchLore('ember tower');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('Ember Tower');
    });

    it('should search lore by keyword - moonvale', () => {
      const results = searchLore('moonvale');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tags).toContain('moonvale');
    });

    it('should search lore by keyword - wolves', () => {
      const results = searchLore('wolves');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tags).toContain('wolves');
    });

    it('should return empty array for unknown keywords', () => {
      const results = searchLore('unicorns');
      expect(results.length).toBe(0);
    });
  });

  describe('NPC Response Generation', () => {
    it('should return Ember Tower lore when asked', () => {
      const response = generateNPCResponse(npcId, playerId, 'What happened to Ember Tower?');
      
      expect(response.response).toBeTruthy();
      expect(response.response.toLowerCase()).toContain('tower');
      expect(response.loreUsed.length).toBeGreaterThan(0);
      expect(response.loreUsed[0].tags).toContain('ember tower');
    });

    it('should return Moonvale lore when asked', () => {
      const response = generateNPCResponse(npcId, playerId, 'Tell me about Moonvale');
      
      expect(response.response).toBeTruthy();
      expect(response.response.toLowerCase()).toContain('moonvale');
      expect(response.loreUsed.length).toBeGreaterThan(0);
      expect(response.loreUsed[0].tags).toContain('moonvale');
    });

    it('should return wolves lore when asked', () => {
      const response = generateNPCResponse(npcId, playerId, 'Are there wolves in the forest?');
      
      expect(response.response).toBeTruthy();
      expect(response.response.toLowerCase()).toContain('wolves');
      expect(response.loreUsed.length).toBeGreaterThan(0);
      expect(response.loreUsed[0].tags).toContain('wolves');
    });

    it('should provide greeting response', () => {
      const response = generateNPCResponse(npcId, playerId, 'Hello');
      
      expect(response.response).toBeTruthy();
      expect(response.response.toLowerCase()).toMatch(/greetings|welcome|elarin/);
    });

    it('should provide help response', () => {
      const response = generateNPCResponse(npcId, playerId, 'Can you help me?');
      
      expect(response.response).toBeTruthy();
      expect(response.response.toLowerCase()).toContain('knowledge');
    });
  });

  describe('Memory Integration', () => {
    it('should store memory when player asks about Ember Tower', () => {
      generateNPCResponse(npcId, playerId, 'What happened to Ember Tower?');
      
      const memories = getMemories(npcId, playerId);
      expect(memories.length).toBeGreaterThan(0);
      expect(memories[0].memory).toContain('Ember Tower');
    });

    it('should reference player actions in responses', () => {
      // Simulate player defeating wolves
      storeActionMemory(npcId, playerId, 'wolf_kill');
      
      // Ask about wolves
      const response = generateNPCResponse(npcId, playerId, 'Tell me about wolves');
      
      expect(response.response).toContain('drove the wolves back');
      expect(response.memoriesReferenced.length).toBeGreaterThan(0);
    });

    it('should not create duplicate memories', () => {
      // Ask the same question twice
      generateNPCResponse(npcId, playerId, 'What happened to Ember Tower?');
      generateNPCResponse(npcId, playerId, 'What happened to Ember Tower?');
      
      const memories = getMemories(npcId, playerId);
      // Should only have one memory entry for Ember Tower question
      const emberMemories = memories.filter(m => m.memory.includes('Ember Tower'));
      expect(emberMemories.length).toBe(1);
    });

    it('should store action memories correctly', () => {
      storeActionMemory(npcId, playerId, 'explore');
      storeActionMemory(npcId, playerId, 'help_village');
      storeActionMemory(npcId, playerId, 'wolf_kill');
      
      const memories = getMemories(npcId, playerId);
      expect(memories.length).toBe(3);
      
      const actionTypes = memories.map(m => m.memory);
      expect(actionTypes).toContain('Player explored the northern forest');
      expect(actionTypes).toContain('Player helped the village');
      expect(actionTypes).toContain('Player defeated wolves near Moonvale');
    });
  });

  describe('Deterministic Behavior', () => {
    it('should return same response for same input without memory', () => {
      clearMemories();
      
      const response1 = generateNPCResponse(npcId, 'player-test-1', 'What happened to Ember Tower?');
      clearMemories();
      const response2 = generateNPCResponse(npcId, 'player-test-2', 'What happened to Ember Tower?');
      
      // Both should contain the same lore content
      expect(response1.loreUsed[0].id).toBe(response2.loreUsed[0].id);
    });

    it('should always work without external API calls', () => {
      // This test verifies no external dependencies
      const testCases = [
        'What happened to Ember Tower?',
        'Tell me about Moonvale',
        'Are there wolves?',
        'Hello',
        'Can you help me?'
      ];
      
      testCases.forEach(message => {
        const response = generateNPCResponse(npcId, playerId, message);
        expect(response.response).toBeTruthy();
        expect(typeof response.response).toBe('string');
        expect(response.response.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const response = generateNPCResponse(npcId, playerId, '');
      expect(response.response).toBeTruthy();
    });

    it('should handle message with mixed case', () => {
      const response = generateNPCResponse(npcId, playerId, 'What Happened To EMBER TOWER?');
      expect(response.response.toLowerCase()).toContain('tower');
      expect(response.loreUsed.length).toBeGreaterThan(0);
    });

    it('should handle message with extra whitespace', () => {
      const response = generateNPCResponse(npcId, playerId, '  ember   tower  ');
      expect(response.response.toLowerCase()).toContain('tower');
      expect(response.loreUsed.length).toBeGreaterThan(0);
    });
  });
});
