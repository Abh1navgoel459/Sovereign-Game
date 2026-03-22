/**
 * Tests for NPC Talk API route
 * POST /api/npc/talk
 *
 * Refs #7
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { POST as createPlayer } from '@/app/api/player/create/route';
import { POST as npcTalk } from '@/app/api/npc/talk/route';
import { clearAllData, saveLore } from '@/lib/data';
import { clearMemories } from '@/lib/memory';
import { NextRequest } from 'next/server';

describe('NPC Talk API Route', () => {
  beforeEach(async () => {
    // Clear all data before each test
    clearAllData();
    clearMemories();

    // Seed lore entries
    saveLore({
      title: 'The Fall of Ember Tower',
      content: 'The Ember Tower collapsed after a magical experiment went wrong many years ago.',
      region: 'Moonvale',
      tags: ['ember tower', 'collapse', 'magic', 'history'],
    });

    saveLore({
      title: 'Founding of Moonvale',
      content: 'Moonvale was founded by the Forest Guild.',
      region: 'Moonvale',
      tags: ['moonvale', 'founding', 'forest guild'],
    });

    saveLore({
      title: 'Wolves of the Northern Forest',
      content: 'Wolves often attack travelers near the northern forest.',
      region: 'Northern Forest',
      tags: ['wolves', 'northern forest', 'danger'],
    });

    // Create a demo player
    await createPlayer();
  });

  afterEach(() => {
    clearAllData();
    clearMemories();
  });

  describe('Input Validation', () => {
    it('returns 400 when message is missing', async () => {
      const request = new Request('http://localhost:3000/api/npc/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await npcTalk(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid input');
    });

    it('returns 400 when message is empty string', async () => {
      const request = new Request('http://localhost:3000/api/npc/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      });

      const response = await npcTalk(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 when message is not a string', async () => {
      const request = new Request('http://localhost:3000/api/npc/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 123 }),
      });

      const response = await npcTalk(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('NPC Response Generation', () => {
    it('generates response for Ember Tower query', async () => {
      const request = new Request('http://localhost:3000/api/npc/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'What happened to Ember Tower?' }),
      });

      const response = await npcTalk(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
      expect(data.response).toContain('Ember Tower');
      expect(data.npcName).toBe('Elarin');
    });

    it('generates response for Moonvale query', async () => {
      const request = new Request('http://localhost:3000/api/npc/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Tell me about Moonvale' }),
      });

      const response = await npcTalk(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
      expect(data.npcName).toBe('Elarin');
    });

    it('generates response for wolves query', async () => {
      const request = new Request('http://localhost:3000/api/npc/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Are there wolves nearby?' }),
      });

      const response = await npcTalk(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
    });

    it('includes lore used in response', async () => {
      const request = new Request('http://localhost:3000/api/npc/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'What happened to Ember Tower?' }),
      });

      const response = await npcTalk(request);
      const data = await response.json();

      expect(data.loreUsed).toBeDefined();
      expect(Array.isArray(data.loreUsed)).toBe(true);
    });

    it('tracks memories referenced count', async () => {
      const request = new Request('http://localhost:3000/api/npc/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await npcTalk(request);
      const data = await response.json();

      expect(data.memoriesReferenced).toBeDefined();
      expect(typeof data.memoriesReferenced).toBe('number');
    });
  });

  describe('Player Requirement', () => {
    it('returns error when no player exists', async () => {
      // Clear players
      clearAllData();
      clearMemories();

      // Reseed lore
      saveLore({
        title: 'Test Lore',
        content: 'Test content',
        region: 'Test',
        tags: ['test'],
      });

      const request = new Request('http://localhost:3000/api/npc/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await npcTalk(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No player found');
    });
  });
});
