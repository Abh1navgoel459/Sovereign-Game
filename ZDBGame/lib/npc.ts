import { NPCResponse, LoreEntry, NPCMemory } from './types';
import { searchLore } from './lore';
import { getMemories, storeMemory } from './memory';

/**
 * Generate a deterministic NPC response based on player input
 * Uses keyword-based lore retrieval and memory context
 */
export function generateNPCResponse(
  npcId: string,
  playerId: string,
  playerMessage: string
): NPCResponse {
  const normalizedMessage = playerMessage.toLowerCase().trim();

  // Retrieve NPC memories about this player
  const memories = getMemories(npcId, playerId);

  // Generate response based on keywords and context
  const { response, loreUsed } = buildResponse(normalizedMessage, memories);

  // Store memory of this conversation
  storeConversationMemory(npcId, playerId, normalizedMessage);

  return {
    response,
    loreUsed,
    memoriesReferenced: memories
  };
}

/**
 * Build deterministic response using templates
 */
function buildResponse(
  message: string,
  memories: NPCMemory[]
): { response: string; loreUsed: LoreEntry[] } {
  // Check for specific keywords and build appropriate response
  let response = '';
  let loreUsed: LoreEntry[] = [];

  // Reference past actions if memories exist
  const memoryContext = buildMemoryContext(memories);

  // Ember Tower query
  if (message.includes('ember tower') || message.includes('tower')) {
    const emberLore = searchLore('ember tower');
    if (emberLore.length > 0) {
      const lore = emberLore[0];
      loreUsed = [lore];
      const loreContent = lore.content.toLowerCase();
      response = memoryContext
        ? memoryContext + ' As for Ember Tower, ' + loreContent
        : 'Ah, Ember Tower... ' + lore.content;
    }
  }

  // Moonvale query
  else if (message.includes('moonvale') || message.includes('village') || message.includes('founding')) {
    const moonvaleLore = searchLore('moonvale');
    if (moonvaleLore.length > 0) {
      const lore = moonvaleLore[0];
      loreUsed = [lore];
      const loreContent = lore.content.toLowerCase();
      response = memoryContext
        ? memoryContext + ' Regarding Moonvale, ' + loreContent
        : 'Let me tell you about Moonvale. ' + lore.content;
    }
  }

  // Wolves query - prioritize this check before forest
  else if (message.includes('wolf') || message.includes('wolves')) {
    const wolvesLore = searchLore('wolves');
    const hasWolfMemories = memories.some(m => {
      const mem = m.memory.toLowerCase();
      return mem.includes('wolf') || mem.includes('wolves');
    });

    if (wolvesLore.length > 0) {
      const lore = wolvesLore[0];
      loreUsed = [lore];
      if (hasWolfMemories) {
        response = "You've already changed the balance around Moonvale. I heard you drove the wolves back. " + lore.content;
      } else {
        response = 'Be careful, traveler. ' + lore.content;
      }
    }
  }

  // Generic greeting
  else if (message.includes('hello') || message.includes('hi') || message.includes('greetings')) {
    response = memoryContext
      ? memoryContext + ' Welcome back, friend. How may I assist you today?'
      : 'Greetings, traveler. I am Elarin, the village historian. How may I help you?';
  }

  // Help query
  else if (message.includes('help') || message.includes('assist') || message.includes('what can')) {
    response = 'I keep the knowledge of Moonvale and its history. Ask me about Ember Tower, the founding of Moonvale, or the dangers in the forest.';
  }

  // Default - search for any relevant lore
  else {
    const foundLore = searchLore(message);
    if (foundLore.length > 0) {
      loreUsed = [foundLore[0]];
      response = memoryContext
        ? memoryContext + ' ' + foundLore[0].content
        : foundLore[0].content;
    } else {
      // Fallback response
      response = memoryContext
        ? memoryContext + " I'm not sure about that, but feel free to ask me about Moonvale's history, Ember Tower, or the wolves in the forest."
        : "I keep the knowledge of this land. Ask me about Ember Tower, Moonvale, or the wolves that roam the northern forest.";
    }
  }

  return { response, loreUsed };
}

/**
 * Build memory context string from recent memories
 */
function buildMemoryContext(memories: NPCMemory[]): string {
  if (memories.length === 0) {
    return '';
  }

  // Check for wolf-related achievements
  const wolfMemories = memories.filter(m => {
    const mem = m.memory.toLowerCase();
    return mem.includes('wolf') || mem.includes('wolves');
  });
  if (wolfMemories.length > 0) {
    return "You've already changed Moonvale. I heard you drove the wolves back.";
  }

  // Check for exploration
  const explorationMemories = memories.filter(m => m.memory.toLowerCase().includes('explored'));
  if (explorationMemories.length > 0) {
    return "I see you've been exploring our lands.";
  }

  // Check for helping village
  const helpMemories = memories.filter(m => m.memory.toLowerCase().includes('helped'));
  if (helpMemories.length > 0) {
    return 'Thank you for helping our village.';
  }

  // Generic recognition
  return 'I remember you, traveler.';
}

/**
 * Store memory of player conversation
 */
function storeConversationMemory(
  npcId: string,
  playerId: string,
  message: string
): void {
  // Store specific memorable questions
  if (message.includes('ember tower') || message.includes('tower')) {
    storeMemory(npcId, playerId, 'Player asked about Ember Tower', 2);
  }
  
  if (message.includes('moonvale')) {
    storeMemory(npcId, playerId, 'Player asked about Moonvale', 1);
  }
  
  if (message.includes('wolf') || message.includes('wolves')) {
    storeMemory(npcId, playerId, 'Player asked about wolves', 1);
  }
}

/**
 * Store memory of player action (for game events)
 */
export function storeActionMemory(
  npcId: string,
  playerId: string,
  action: string
): void {
  switch (action) {
    case 'wolf_kill':
      storeMemory(npcId, playerId, 'Player defeated wolves near Moonvale', 3);
      break;
    case 'explore':
      storeMemory(npcId, playerId, 'Player explored the northern forest', 1);
      break;
    case 'help_village':
      storeMemory(npcId, playerId, 'Player helped the village', 2);
      break;
  }
}
