/**
 * Unit tests for game-engine.ts
 * Tests gameplay event tracking and Wolf Pack Retreat trigger logic
 *
 * CRITICAL TEST: Wolf Pack Retreat triggers at EXACTLY 3 wolf_kill events, only once
 *
 * Refs #8
 */

import {
    createGameplayEvent,
    countWolfKillsForPlayer,
    checkWolfPackRetreatTrigger,
    processGameplayEvent,
    getWolfKillProgress,
    isValidEventType,
    getAllWorldEvents,
    getPlayerGameEvents,
} from '../lib/game-engine';
import { clearAllData, savePlayer } from '../lib/data';

describe('Game Engine', () => {
    let testPlayerId: string;

    beforeEach(() => {
        // Clear all data before each test
        clearAllData();

        // Create a test player
        const player = savePlayer({
            username: 'TestPlayer',
            class: 'Ranger',
            faction: 'Forest Guild',
            level: 1,
            xp: 0,
            inventory: [],
            reputation: 0,
        });
        testPlayerId = player.id;
    });

    afterEach(() => {
        // Clean up after each test
        clearAllData();
    });

    describe('createGameplayEvent', () => {
        it('should create an explore event', () => {
            const event = createGameplayEvent(
                testPlayerId,
                'explore',
                'Player explored the northern forest'
            );

            expect(event).toBeDefined();
            expect(event.id).toBeDefined();
            expect(event.player_id).toBe(testPlayerId);
            expect(event.event_type).toBe('explore');
            expect(event.metadata.description).toBe('Player explored the northern forest');
            expect(event.created_at).toBeDefined();
        });

        it('should create a wolf_kill event', () => {
            const event = createGameplayEvent(
                testPlayerId,
                'wolf_kill',
                'Player defeated a wolf'
            );

            expect(event).toBeDefined();
            expect(event.event_type).toBe('wolf_kill');
        });

        it('should create a help_village event', () => {
            const event = createGameplayEvent(
                testPlayerId,
                'help_village',
                'Player helped repair the village wall'
            );

            expect(event).toBeDefined();
            expect(event.event_type).toBe('help_village');
        });

        it('should create an npc_conversation event', () => {
            const event = createGameplayEvent(
                testPlayerId,
                'npc_conversation',
                'Player talked to Elarin about Ember Tower'
            );

            expect(event).toBeDefined();
            expect(event.event_type).toBe('npc_conversation');
        });

        it('should include custom metadata', () => {
            const event = createGameplayEvent(
                testPlayerId,
                'wolf_kill',
                'Defeated alpha wolf',
                'Northern Forest',
                { difficulty: 'hard', reward_xp: 50 }
            );

            expect(event.metadata.difficulty).toBe('hard');
            expect(event.metadata.reward_xp).toBe(50);
        });
    });

    describe('countWolfKillsForPlayer', () => {
        it('should return 0 when player has no wolf kills', () => {
            const count = countWolfKillsForPlayer(testPlayerId);
            expect(count).toBe(0);
        });

        it('should count 1 wolf kill', () => {
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf');
            const count = countWolfKillsForPlayer(testPlayerId);
            expect(count).toBe(1);
        });

        it('should count 3 wolf kills', () => {
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 1');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 2');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 3');
            const count = countWolfKillsForPlayer(testPlayerId);
            expect(count).toBe(3);
        });

        it('should only count wolf_kill events, not other event types', () => {
            createGameplayEvent(testPlayerId, 'explore', 'Explored forest');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf');
            createGameplayEvent(testPlayerId, 'help_village', 'Helped village');
            const count = countWolfKillsForPlayer(testPlayerId);
            expect(count).toBe(1);
        });
    });

    describe('checkWolfPackRetreatTrigger', () => {
        it('should return null when player has 0 wolf kills', () => {
            const result = checkWolfPackRetreatTrigger(testPlayerId);
            expect(result).toBeNull();
        });

        it('should return null when player has 1 wolf kill', () => {
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf');
            const result = checkWolfPackRetreatTrigger(testPlayerId);
            expect(result).toBeNull();
        });

        it('should return null when player has 2 wolf kills', () => {
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 1');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 2');
            const result = checkWolfPackRetreatTrigger(testPlayerId);
            expect(result).toBeNull();
        });

        it('CRITICAL: should trigger Wolf Pack Retreat at EXACTLY 3 wolf kills', () => {
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 1');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 2');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 3');

            const result = checkWolfPackRetreatTrigger(testPlayerId);

            expect(result).not.toBeNull();
            expect(result?.event_name).toBe('Wolf Pack Retreat');
            expect(result?.description).toBe('Wolf activity around Moonvale has suddenly decreased.');
            expect(result?.trigger_source).toBe(testPlayerId);
            expect(result?.metadata.wolf_kill_count).toBe(3);
            expect(result?.metadata.threshold).toBe(3);
        });

        it('CRITICAL: should only trigger Wolf Pack Retreat once per player', () => {
            // Create 3 wolf kills and trigger event
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 1');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 2');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 3');

            const firstTrigger = checkWolfPackRetreatTrigger(testPlayerId);
            expect(firstTrigger).not.toBeNull();

            // Try to trigger again - should return null
            const secondTrigger = checkWolfPackRetreatTrigger(testPlayerId);
            expect(secondTrigger).toBeNull();

            // Add more wolf kills - should still not trigger again
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 4');
            const thirdTrigger = checkWolfPackRetreatTrigger(testPlayerId);
            expect(thirdTrigger).toBeNull();
        });

        it('should not trigger at 4 or more wolf kills if already triggered at 3', () => {
            // Create 3 wolf kills
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 1');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 2');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 3');
            checkWolfPackRetreatTrigger(testPlayerId); // Trigger event

            // Add more wolf kills
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 4');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 5');

            const result = checkWolfPackRetreatTrigger(testPlayerId);
            expect(result).toBeNull();

            // Verify only one world event exists
            const worldEvents = getAllWorldEvents();
            const wolfPackRetreats = worldEvents.filter(e => e.event_name === 'Wolf Pack Retreat');
            expect(wolfPackRetreats.length).toBe(1);
        });
    });

    describe('processGameplayEvent', () => {
        it('should create event without triggering world event for non-wolf_kill', () => {
            const result = processGameplayEvent(
                testPlayerId,
                'explore',
                'Explored forest'
            );

            expect(result.gameEvent).toBeDefined();
            expect(result.gameEvent.event_type).toBe('explore');
            expect(result.worldEvent).toBeUndefined();
        });

        it('should create wolf_kill event without trigger at 1 kill', () => {
            const result = processGameplayEvent(
                testPlayerId,
                'wolf_kill',
                'Defeated wolf'
            );

            expect(result.gameEvent).toBeDefined();
            expect(result.gameEvent.event_type).toBe('wolf_kill');
            expect(result.worldEvent).toBeUndefined();
        });

        it('CRITICAL: should trigger Wolf Pack Retreat on 3rd wolf kill', () => {
            // First two kills - no trigger
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 1');
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 2');

            // Third kill - should trigger
            const result = processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 3');

            expect(result.gameEvent).toBeDefined();
            expect(result.worldEvent).toBeDefined();
            expect(result.worldEvent?.event_name).toBe('Wolf Pack Retreat');
        });

        it('should not trigger on 4th wolf kill', () => {
            // Create 3 kills to trigger event
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 1');
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 2');
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 3');

            // 4th kill should not trigger
            const result = processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 4');

            expect(result.gameEvent).toBeDefined();
            expect(result.worldEvent).toBeUndefined();
        });
    });

    describe('getWolfKillProgress', () => {
        it('should return progress with 0 kills', () => {
            const progress = getWolfKillProgress(testPlayerId);

            expect(progress.count).toBe(0);
            expect(progress.threshold).toBe(3);
            expect(progress.isComplete).toBe(false);
            expect(progress.eventTriggered).toBe(false);
        });

        it('should return progress with 2 kills', () => {
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 1');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 2');

            const progress = getWolfKillProgress(testPlayerId);

            expect(progress.count).toBe(2);
            expect(progress.threshold).toBe(3);
            expect(progress.isComplete).toBe(false);
            expect(progress.eventTriggered).toBe(false);
        });

        it('should return progress with 3 kills and event triggered', () => {
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 1');
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 2');
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 3');

            const progress = getWolfKillProgress(testPlayerId);

            expect(progress.count).toBe(3);
            expect(progress.threshold).toBe(3);
            expect(progress.isComplete).toBe(true);
            expect(progress.eventTriggered).toBe(true);
        });
    });

    describe('isValidEventType', () => {
        it('should validate correct event types', () => {
            expect(isValidEventType('explore')).toBe(true);
            expect(isValidEventType('wolf_kill')).toBe(true);
            expect(isValidEventType('help_village')).toBe(true);
            expect(isValidEventType('npc_conversation')).toBe(true);
        });

        it('should reject invalid event types', () => {
            expect(isValidEventType('invalid')).toBe(false);
            expect(isValidEventType('dragon_fight')).toBe(false);
            expect(isValidEventType('')).toBe(false);
        });
    });

    describe('getPlayerGameEvents', () => {
        it('should return empty array for player with no events', () => {
            const events = getPlayerGameEvents(testPlayerId);
            expect(events).toEqual([]);
        });

        it('should return all events for a player', () => {
            createGameplayEvent(testPlayerId, 'explore', 'Explored forest');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf');
            createGameplayEvent(testPlayerId, 'help_village', 'Helped village');

            const events = getPlayerGameEvents(testPlayerId);
            expect(events.length).toBe(3);
        });

        it('should return events in reverse chronological order', async () => {
            createGameplayEvent(testPlayerId, 'explore', 'Event 1');
            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));
            createGameplayEvent(testPlayerId, 'wolf_kill', 'Event 2');
            await new Promise(resolve => setTimeout(resolve, 10));
            createGameplayEvent(testPlayerId, 'help_village', 'Event 3');

            const events = getPlayerGameEvents(testPlayerId);
            expect(events[0].metadata.description).toBe('Event 3');
            expect(events[1].metadata.description).toBe('Event 2');
            expect(events[2].metadata.description).toBe('Event 1');
        });
    });

    describe('getAllWorldEvents', () => {
        it('should return empty array when no world events exist', () => {
            const events = getAllWorldEvents();
            expect(events).toEqual([]);
        });

        it('should return world events after trigger', () => {
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 1');
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 2');
            processGameplayEvent(testPlayerId, 'wolf_kill', 'Defeated wolf 3');

            const events = getAllWorldEvents();
            expect(events.length).toBe(1);
            expect(events[0].event_name).toBe('Wolf Pack Retreat');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle multiple players with separate wolf kill counts', () => {
            // Create second player
            const player2 = savePlayer({
                username: 'Player2',
                class: 'Warrior',
                faction: 'Forest Guild',
                level: 1,
                xp: 0,
                inventory: [],
                reputation: 0,
            });

            // Player 1: 2 wolf kills
            createGameplayEvent(testPlayerId, 'wolf_kill', 'P1 kill 1');
            createGameplayEvent(testPlayerId, 'wolf_kill', 'P1 kill 2');

            // Player 2: 3 wolf kills (should trigger)
            processGameplayEvent(player2.id, 'wolf_kill', 'P2 kill 1');
            processGameplayEvent(player2.id, 'wolf_kill', 'P2 kill 2');
            const result = processGameplayEvent(player2.id, 'wolf_kill', 'P2 kill 3');

            expect(result.worldEvent).toBeDefined();
            expect(countWolfKillsForPlayer(testPlayerId)).toBe(2);
            expect(countWolfKillsForPlayer(player2.id)).toBe(3);
        });

        it('should handle rapid successive wolf kills correctly', () => {
            const results = [
                processGameplayEvent(testPlayerId, 'wolf_kill', 'Quick kill 1'),
                processGameplayEvent(testPlayerId, 'wolf_kill', 'Quick kill 2'),
                processGameplayEvent(testPlayerId, 'wolf_kill', 'Quick kill 3'),
            ];

            // Only the 3rd should trigger world event
            expect(results[0].worldEvent).toBeUndefined();
            expect(results[1].worldEvent).toBeUndefined();
            expect(results[2].worldEvent).toBeDefined();
        });
    });
});
