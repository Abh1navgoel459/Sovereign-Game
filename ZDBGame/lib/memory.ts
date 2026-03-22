import { NPCMemory } from './types';
import { saveNPCMemory, getNPCMemories, getAllNPCMemories as getDataNPCMemories } from './data';

/**
 * Store a new NPC memory (persisted to file system)
 */
export function storeMemory(
  npcId: string,
  playerId: string,
  memory: string,
  importance: number = 1
): NPCMemory {
  // Check if similar memory already exists to avoid duplicates
  const existingMemories = getNPCMemories(npcId, playerId);
  const existingMemory = existingMemories.find(
    m => m.memory.toLowerCase() === memory.toLowerCase()
  );

  if (existingMemory) {
    return {
      id: existingMemory.id,
      npcId: existingMemory.npc_id,
      playerId: existingMemory.player_id,
      memory: existingMemory.memory,
      importance: existingMemory.importance,
      createdAt: existingMemory.created_at
    };
  }

  // Save to file system
  const savedMemory = saveNPCMemory({
    npc_id: npcId,
    player_id: playerId,
    memory,
    importance,
    metadata: {}
  });

  // Transform to camelCase for frontend
  return {
    id: savedMemory.id,
    npcId: savedMemory.npc_id,
    playerId: savedMemory.player_id,
    memory: savedMemory.memory,
    importance: savedMemory.importance,
    createdAt: savedMemory.created_at
  };
}

/**
 * Retrieve memories for a specific NPC and player
 */
export function getMemories(npcId: string, playerId: string): NPCMemory[] {
  const memories = getNPCMemories(npcId, playerId);
  return memories.map(m => ({
    id: m.id,
    npcId: m.npc_id,
    playerId: m.player_id,
    memory: m.memory,
    importance: m.importance,
    createdAt: m.created_at
  }));
}

/**
 * Get all memories for an NPC
 */
export function getAllNPCMemories(npcId: string): NPCMemory[] {
  const allMemories = getDataNPCMemories();
  return allMemories
    .filter(m => m.npc_id === npcId)
    .map(m => ({
      id: m.id,
      npcId: m.npc_id,
      playerId: m.player_id,
      memory: m.memory,
      importance: m.importance,
      createdAt: m.created_at
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get all memories for a player
 */
export function getAllPlayerMemories(playerId: string): NPCMemory[] {
  const allMemories = getDataNPCMemories();
  return allMemories
    .filter(m => m.player_id === playerId)
    .map(m => ({
      id: m.id,
      npcId: m.npc_id,
      playerId: m.player_id,
      memory: m.memory,
      importance: m.importance,
      createdAt: m.created_at
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Clear all memories (useful for testing)
 */
export function clearMemories(): void {
  // This would need to delete all memory files from .data/
  // For now, just a placeholder
}

/**
 * Get total memory count
 */
export function getMemoryCount(): number {
  return getDataNPCMemories().length;
}
