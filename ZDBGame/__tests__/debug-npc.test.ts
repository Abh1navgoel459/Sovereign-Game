import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateNPCResponse, storeActionMemory } from '../lib/npc';
import { clearMemories, getMemories } from '../lib/memory';

describe('NPC Dialogue Debug', () => {
  const npcId = 'elarin-1';
  const playerId = 'player-1';

  beforeEach(() => {
    clearMemories();
  });

  it('should store wolf kill memory and retrieve it', () => {
    // Store wolf kill action
    storeActionMemory(npcId, playerId, 'wolf_kill');

    // Check if memory was stored
    const memories = getMemories(npcId, playerId);
    console.log('Memories after wolf_kill:', JSON.stringify(memories, null, 2));

    expect(memories.length).toBeGreaterThan(0);
    const wolfMemory = memories.find(m => m.memory.toLowerCase().includes('wolf'));
    expect(wolfMemory).toBeTruthy();
  });

  it('should use wolf memory in response', () => {
    // Store wolf kill action
    storeActionMemory(npcId, playerId, 'wolf_kill');

    // Get memories
    const memories = getMemories(npcId, playerId);
    console.log('Memories before asking:', JSON.stringify(memories, null, 2));

    // Ask about wolves
    const response = generateNPCResponse(npcId, playerId, 'Tell me about wolves');

    console.log('Response:', response.response);
    console.log('Memories referenced:', JSON.stringify(response.memoriesReferenced, null, 2));

    expect(response.memoriesReferenced.length).toBeGreaterThan(0);
  });
});
