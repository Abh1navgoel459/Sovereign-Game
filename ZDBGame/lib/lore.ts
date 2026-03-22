import { LoreEntry } from './types';

// Seed lore data
export const loreDatabase: LoreEntry[] = [
  {
    id: 'lore-1',
    title: 'The Fall of Ember Tower',
    content: 'The Ember Tower collapsed after a magical experiment went terribly wrong many years ago, scattering ash and arcane debris across the valley.',
    tags: ['ember tower', 'collapse', 'magic', 'history']
  },
  {
    id: 'lore-2',
    title: 'Founding of Moonvale',
    content: 'Moonvale was founded by the Forest Guild as a settlement devoted to protecting the ancient woods and preserving old knowledge.',
    tags: ['moonvale', 'founding', 'forest guild']
  },
  {
    id: 'lore-3',
    title: 'Wolves of the Northern Forest',
    content: 'Wolves often attack travelers near the northern forest, especially when food is scarce or the woods are disturbed.',
    tags: ['wolves', 'northern forest', 'danger']
  }
];

/**
 * Search lore entries by keywords
 * Searches in title, content, and tags
 */
export function searchLore(query: string): LoreEntry[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return [];
  }

  // Split query into keywords
  const keywords = normalizedQuery.split(/\s+/);

  // Search for lore entries matching any keyword
  const matches = loreDatabase.filter(entry => {
    const searchableText = [
      entry.title.toLowerCase(),
      entry.content.toLowerCase(),
      ...entry.tags.map(tag => tag.toLowerCase())
    ].join(' ');

    // Return true if any keyword matches
    return keywords.some(keyword => searchableText.includes(keyword));
  });

  return matches;
}

/**
 * Get lore entry by ID
 */
export function getLoreById(id: string): LoreEntry | undefined {
  return loreDatabase.find(entry => entry.id === id);
}

/**
 * Get all lore entries
 */
export function getAllLore(): LoreEntry[] {
  return [...loreDatabase];
}
