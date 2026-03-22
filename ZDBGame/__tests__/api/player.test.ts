/**
 * Tests for Player API routes
 * POST /api/player/create
 * GET /api/player/current
 *
 * Refs #5
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { POST } from '@/app/api/player/create/route';
import { GET } from '@/app/api/player/current/route';
import { clearAllData } from '@/lib/data';
import { NextRequest } from 'next/server';

describe('Player API Routes', () => {
  beforeEach(() => {
    // Clear all data before each test
    clearAllData();
  });

  afterEach(() => {
    // Clean up after each test
    clearAllData();
  });

  describe('POST /api/player/create', () => {
    it('creates a demo player with correct attributes', async () => {
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.player).toBeDefined();
      expect(data.player.username).toBe('TobyTheExplorer');
      expect(data.player.class).toBe('Ranger');
      expect(data.player.faction).toBe('Forest Guild');
      expect(data.player.level).toBe(1);
      expect(data.player.xp).toBe(0);
      expect(data.player.id).toBeDefined();
      expect(data.player.created_at).toBeDefined();
    });

    it('creates player with correct inventory and reputation', async () => {
      const response = await POST();
      const data = await response.json();

      expect(data.player.inventory).toEqual([]);
      expect(data.player.reputation).toBe(0);
    });

    it('generates unique player IDs for multiple creations', async () => {
      const response1 = await POST();
      const data1 = await response1.json();

      const response2 = await POST();
      const data2 = await response2.json();

      expect(data1.player.id).not.toBe(data2.player.id);
    });

    it('persists player data to file storage', async () => {
      await POST();

      // Verify player can be retrieved
      const getResponse = await GET();
      const getData = await getResponse.json();

      expect(getData.success).toBe(true);
      expect(getData.player).toBeDefined();
      expect(getData.player.username).toBe('TobyTheExplorer');
    });
  });

  describe('GET /api/player/current', () => {
    it('returns 404 when no player exists', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No player found');
      expect(data.message).toBe('Please create a player first');
    });

    it('returns the most recently created player', async () => {
      // Create first player
      await POST();

      // Wait a tiny bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create second player
      await POST();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.player).toBeDefined();
      expect(data.player.username).toBe('TobyTheExplorer');
    });

    it('includes all player attributes', async () => {
      await POST();

      const response = await GET();
      const data = await response.json();

      expect(data.player).toHaveProperty('id');
      expect(data.player).toHaveProperty('username');
      expect(data.player).toHaveProperty('class');
      expect(data.player).toHaveProperty('faction');
      expect(data.player).toHaveProperty('level');
      expect(data.player).toHaveProperty('xp');
      expect(data.player).toHaveProperty('inventory');
      expect(data.player).toHaveProperty('reputation');
      expect(data.player).toHaveProperty('created_at');
    });
  });
});
