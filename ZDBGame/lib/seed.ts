/**
 * Seed data initialization for ZDBGame - Moonvale Demo
 * Creates initial NPCs and lore entries for the game world
 *
 * This module is idempotent and safe to run multiple times.
 * Refs #4
 */

import { NPC, LoreEntry } from './types';

/**
 * Generate a simple UUID v4
 * For production, use a proper UUID library
 */
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Seed NPC data
 * Returns the Elarin NPC entity
 */
export function getSeedNPC(): NPC {
    return {
        id: generateId(),
        name: 'Elarin',
        role: 'Village Historian',
        location: 'Moonvale'
    };
}

/**
 * Seed lore entries
 * Returns all 3 initial lore entries from the PRD
 */
export function getSeedLore(): LoreEntry[] {
    return [
        {
            id: generateId(),
            title: 'Fall of Ember Tower',
            content: 'The Ember Tower collapsed after a magical experiment went wrong.',
            tags: ['ember tower', 'magic', 'history']
        },
        {
            id: generateId(),
            title: 'Founding of Moonvale',
            content: 'Moonvale was founded by the Forest Guild.',
            tags: ['moonvale', 'forest guild', 'founding']
        },
        {
            id: generateId(),
            title: 'Wolves of the Northern Forest',
            content: 'Wolves often attack travelers near the northern forest.',
            tags: ['wolves', 'danger', 'forest']
        }
    ];
}

/**
 * Initialize seed data
 * This function should be called on app startup
 *
 * @param checkExists - Function to check if data already exists
 * @param saveNPC - Function to save NPC
 * @param saveLore - Function to save lore entry
 * @returns Promise with initialization result
 */
export async function initializeSeedData(
    checkExists: () => Promise<boolean>,
    saveNPC: (npc: NPC) => Promise<void>,
    saveLore: (lore: LoreEntry) => Promise<void>
): Promise<{ success: boolean; message: string; itemsCreated: number }> {
    try {
        // Check if seed data already exists (idempotent check)
        const dataExists = await checkExists();

        if (dataExists) {
            return {
                success: true,
                message: 'Seed data already exists, skipping initialization',
                itemsCreated: 0
            };
        }

        let itemsCreated = 0;

        // Seed Elarin NPC
        const elarin = getSeedNPC();
        await saveNPC(elarin);
        itemsCreated++;

        // Seed lore entries
        const loreEntries = getSeedLore();
        for (const lore of loreEntries) {
            await saveLore(lore);
            itemsCreated++;
        }

        return {
            success: true,
            message: `Seed data initialized successfully: 1 NPC and ${loreEntries.length} lore entries created`,
            itemsCreated
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to initialize seed data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            itemsCreated: 0
        };
    }
}

/**
 * Simple initialization for when storage layer functions are available
 * This is a convenience wrapper for the full initializeSeedData function
 */
export function createSeedData() {
    return {
        npc: getSeedNPC(),
        lore: getSeedLore()
    };
}
