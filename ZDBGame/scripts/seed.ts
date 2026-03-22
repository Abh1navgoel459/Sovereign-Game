#!/usr/bin/env ts-node

/**
 * Seed Script for ZDBGame
 *
 * Seeds the database with:
 * - Elarin NPC
 * - 3 Lore entries
 */

import { getSeedNPC, getSeedLore } from '../lib/seed';
import { saveNPC, saveLore as saveL } from '../lib/data';

async function main() {
  console.log('Starting database seed...');

  try {
    let itemsCreated = 0;

    // Seed Elarin NPC
    const elarin = getSeedNPC();
    saveNPC(elarin);
    console.log(`✓ Created NPC: ${elarin.name}`);
    itemsCreated++;

    // Seed lore entries
    const loreEntries = getSeedLore();
    for (const lore of loreEntries) {
      saveL(lore);
      console.log(`✓ Created Lore: ${lore.title}`);
      itemsCreated++;
    }

    console.log(`\n✓ Seed completed successfully!`);
    console.log(`  Items created: ${itemsCreated}`);
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  }
}

main();
