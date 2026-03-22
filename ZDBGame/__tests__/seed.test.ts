/**
 * Tests for seed data initialization
 * Refs #4
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getSeedNPC, getSeedLore, initializeSeedData, createSeedData } from '../lib/seed';
import type { NPC, LoreEntry } from '../lib/types';

describe('Seed Data - getSeedNPC', () => {
    it('should return Elarin NPC with correct properties', () => {
        const npc = getSeedNPC();

        assert.strictEqual(npc.name, 'Elarin', 'NPC name should be Elarin');
        assert.strictEqual(npc.role, 'Village Historian', 'NPC role should be Village Historian');
        assert.strictEqual(npc.location, 'Moonvale', 'NPC location should be Moonvale');
        assert.ok(npc.id, 'NPC should have an id');
        assert.match(npc.id, /^[a-f0-9-]{36}$/i, 'NPC id should be a valid UUID format');
    });

    it('should generate unique IDs on multiple calls', () => {
        const npc1 = getSeedNPC();
        const npc2 = getSeedNPC();

        assert.notStrictEqual(npc1.id, npc2.id, 'Each call should generate a unique ID');
    });

    it('should have all required NPC interface properties', () => {
        const npc = getSeedNPC();

        assert.ok('id' in npc, 'Should have id property');
        assert.ok('name' in npc, 'Should have name property');
        assert.ok('role' in npc, 'Should have role property');
        assert.ok('location' in npc, 'Should have location property');
    });
});

describe('Seed Data - getSeedLore', () => {
    it('should return exactly 3 lore entries', () => {
        const lore = getSeedLore();

        assert.strictEqual(lore.length, 3, 'Should return exactly 3 lore entries');
    });

    it('should include Fall of Ember Tower lore entry', () => {
        const lore = getSeedLore();
        const emberTower = lore.find(l => l.title === 'Fall of Ember Tower');

        assert.ok(emberTower, 'Should have Fall of Ember Tower lore entry');
        assert.strictEqual(
            emberTower?.content,
            'The Ember Tower collapsed after a magical experiment went wrong.',
            'Ember Tower content should match PRD exactly'
        );
        assert.ok(Array.isArray(emberTower?.tags), 'Should have tags array');
        assert.ok(emberTower?.tags.length > 0, 'Should have at least one tag');
    });

    it('should include Founding of Moonvale lore entry', () => {
        const lore = getSeedLore();
        const moonvale = lore.find(l => l.title === 'Founding of Moonvale');

        assert.ok(moonvale, 'Should have Founding of Moonvale lore entry');
        assert.strictEqual(
            moonvale?.content,
            'Moonvale was founded by the Forest Guild.',
            'Moonvale content should match PRD exactly'
        );
        assert.ok(Array.isArray(moonvale?.tags), 'Should have tags array');
        assert.ok(moonvale?.tags.length > 0, 'Should have at least one tag');
    });

    it('should include Wolves of the Northern Forest lore entry', () => {
        const lore = getSeedLore();
        const wolves = lore.find(l => l.title === 'Wolves of the Northern Forest');

        assert.ok(wolves, 'Should have Wolves of the Northern Forest lore entry');
        assert.strictEqual(
            wolves?.content,
            'Wolves often attack travelers near the northern forest.',
            'Wolves content should match PRD exactly'
        );
        assert.ok(Array.isArray(wolves?.tags), 'Should have tags array');
        assert.ok(wolves?.tags.length > 0, 'Should have at least one tag');
    });

    it('should generate unique IDs for each lore entry', () => {
        const lore = getSeedLore();
        const ids = lore.map(l => l.id);

        const uniqueIds = new Set(ids);
        assert.strictEqual(uniqueIds.size, 3, 'All lore entries should have unique IDs');
    });

    it('should have all required LoreEntry interface properties', () => {
        const lore = getSeedLore();

        lore.forEach((entry, index) => {
            assert.ok('id' in entry, `Entry ${index} should have id property`);
            assert.ok('title' in entry, `Entry ${index} should have title property`);
            assert.ok('content' in entry, `Entry ${index} should have content property`);
            assert.ok('tags' in entry, `Entry ${index} should have tags property`);
            assert.ok(Array.isArray(entry.tags), `Entry ${index} tags should be an array`);
        });
    });

    it('should generate different IDs on multiple calls', () => {
        const lore1 = getSeedLore();
        const lore2 = getSeedLore();

        const ids1 = lore1.map(l => l.id);
        const ids2 = lore2.map(l => l.id);

        ids1.forEach((id1, index) => {
            assert.notStrictEqual(id1, ids2[index], `Lore entry ${index} should have different ID on each call`);
        });
    });
});

describe('Seed Data - initializeSeedData', () => {
    it('should skip initialization if data already exists', async () => {
        const checkExists = async () => true;
        const saveNPC = async (_npc: NPC) => {};
        const saveLore = async (_lore: LoreEntry) => {};

        const result = await initializeSeedData(checkExists, saveNPC, saveLore);

        assert.strictEqual(result.success, true, 'Should succeed');
        assert.strictEqual(result.itemsCreated, 0, 'Should create 0 items when data exists');
        assert.match(result.message, /already exists/i, 'Message should indicate data exists');
    });

    it('should initialize all seed data when data does not exist', async () => {
        const savedNPCs: NPC[] = [];
        const savedLore: LoreEntry[] = [];

        const checkExists = async () => false;
        const saveNPC = async (npc: NPC) => {
            savedNPCs.push(npc);
        };
        const saveLore = async (lore: LoreEntry) => {
            savedLore.push(lore);
        };

        const result = await initializeSeedData(checkExists, saveNPC, saveLore);

        assert.strictEqual(result.success, true, 'Should succeed');
        assert.strictEqual(result.itemsCreated, 4, 'Should create 4 items (1 NPC + 3 lore)');
        assert.strictEqual(savedNPCs.length, 1, 'Should save 1 NPC');
        assert.strictEqual(savedLore.length, 3, 'Should save 3 lore entries');
        assert.match(result.message, /successfully/i, 'Message should indicate success');
    });

    it('should save Elarin NPC correctly', async () => {
        const savedNPCs: NPC[] = [];
        const savedLore: LoreEntry[] = [];

        const checkExists = async () => false;
        const saveNPC = async (npc: NPC) => {
            savedNPCs.push(npc);
        };
        const saveLore = async (lore: LoreEntry) => {
            savedLore.push(lore);
        };

        await initializeSeedData(checkExists, saveNPC, saveLore);

        const elarin = savedNPCs[0];
        assert.strictEqual(elarin.name, 'Elarin', 'Should save Elarin');
        assert.strictEqual(elarin.role, 'Village Historian', 'Should have correct role');
        assert.strictEqual(elarin.location, 'Moonvale', 'Should have correct location');
    });

    it('should save all 3 lore entries correctly', async () => {
        const savedNPCs: NPC[] = [];
        const savedLore: LoreEntry[] = [];

        const checkExists = async () => false;
        const saveNPC = async (npc: NPC) => {
            savedNPCs.push(npc);
        };
        const saveLore = async (lore: LoreEntry) => {
            savedLore.push(lore);
        };

        await initializeSeedData(checkExists, saveNPC, saveLore);

        assert.strictEqual(savedLore.length, 3, 'Should save exactly 3 lore entries');

        const titles = savedLore.map(l => l.title);
        assert.ok(titles.includes('Fall of Ember Tower'), 'Should save Fall of Ember Tower');
        assert.ok(titles.includes('Founding of Moonvale'), 'Should save Founding of Moonvale');
        assert.ok(titles.includes('Wolves of the Northern Forest'), 'Should save Wolves lore');
    });

    it('should handle errors gracefully', async () => {
        const checkExists = async () => false;
        const saveNPC = async (_npc: NPC) => {
            throw new Error('Database error');
        };
        const saveLore = async (_lore: LoreEntry) => {};

        const result = await initializeSeedData(checkExists, saveNPC, saveLore);

        assert.strictEqual(result.success, false, 'Should fail');
        assert.strictEqual(result.itemsCreated, 0, 'Should create 0 items on error');
        assert.match(result.message, /failed/i, 'Message should indicate failure');
        assert.match(result.message, /database error/i, 'Message should include error details');
    });

    it('should be idempotent (safe to run multiple times)', async () => {
        let checkCount = 0;
        let saveCount = 0;

        const checkExists = async () => {
            checkCount++;
            return checkCount > 1; // First call returns false, subsequent calls return true
        };

        const saveNPC = async (_npc: NPC) => {
            saveCount++;
        };

        const saveLore = async (_lore: LoreEntry) => {
            saveCount++;
        };

        // First run - should initialize
        const result1 = await initializeSeedData(checkExists, saveNPC, saveLore);
        assert.strictEqual(result1.success, true, 'First run should succeed');
        assert.strictEqual(result1.itemsCreated, 4, 'First run should create 4 items');

        // Second run - should skip
        const result2 = await initializeSeedData(checkExists, saveNPC, saveLore);
        assert.strictEqual(result2.success, true, 'Second run should succeed');
        assert.strictEqual(result2.itemsCreated, 0, 'Second run should create 0 items');
        assert.strictEqual(saveCount, 4, 'Should only save once across both runs');
    });
});

describe('Seed Data - createSeedData', () => {
    it('should return object with npc and lore properties', () => {
        const seedData = createSeedData();

        assert.ok('npc' in seedData, 'Should have npc property');
        assert.ok('lore' in seedData, 'Should have lore property');
    });

    it('should return Elarin NPC', () => {
        const seedData = createSeedData();

        assert.strictEqual(seedData.npc.name, 'Elarin', 'Should return Elarin NPC');
        assert.strictEqual(seedData.npc.role, 'Village Historian', 'Should have correct role');
        assert.strictEqual(seedData.npc.location, 'Moonvale', 'Should have correct location');
    });

    it('should return all 3 lore entries', () => {
        const seedData = createSeedData();

        assert.strictEqual(seedData.lore.length, 3, 'Should return 3 lore entries');

        const titles = seedData.lore.map(l => l.title);
        assert.ok(titles.includes('Fall of Ember Tower'), 'Should include Ember Tower');
        assert.ok(titles.includes('Founding of Moonvale'), 'Should include Moonvale');
        assert.ok(titles.includes('Wolves of the Northern Forest'), 'Should include Wolves');
    });
});

describe('Seed Data - Integration', () => {
    it('should provide all data needed for Moonvale demo', () => {
        const npc = getSeedNPC();
        const lore = getSeedLore();

        // Verify we have the historian
        assert.strictEqual(npc.name, 'Elarin', 'Should have Elarin the historian');

        // Verify we have the 3 essential lore pieces for the demo
        assert.strictEqual(lore.length, 3, 'Should have exactly 3 lore entries');

        const hasEmberTower = lore.some(l => l.title === 'Fall of Ember Tower');
        const hasMoonvale = lore.some(l => l.title === 'Founding of Moonvale');
        const hasWolves = lore.some(l => l.title === 'Wolves of the Northern Forest');

        assert.ok(hasEmberTower, 'Should have Ember Tower lore for NPC conversations');
        assert.ok(hasMoonvale, 'Should have Moonvale lore for world context');
        assert.ok(hasWolves, 'Should have Wolves lore for wolf kill event');
    });

    it('should match exact text from PRD specification', () => {
        const lore = getSeedLore();

        const emberTower = lore.find(l => l.title === 'Fall of Ember Tower');
        const moonvale = lore.find(l => l.title === 'Founding of Moonvale');
        const wolves = lore.find(l => l.title === 'Wolves of the Northern Forest');

        // These MUST match PRD exactly
        assert.strictEqual(
            emberTower?.content,
            'The Ember Tower collapsed after a magical experiment went wrong.',
            'Ember Tower text must match PRD'
        );

        assert.strictEqual(
            moonvale?.content,
            'Moonvale was founded by the Forest Guild.',
            'Moonvale text must match PRD'
        );

        assert.strictEqual(
            wolves?.content,
            'Wolves often attack travelers near the northern forest.',
            'Wolves text must match PRD'
        );
    });
});
