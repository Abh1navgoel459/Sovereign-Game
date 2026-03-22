/**
 * Game Engine for ZDBGame - Moonvale Demo
 * Handles gameplay event tracking and world event triggering
 *
 * CRITICAL: Wolf Pack Retreat triggers at EXACTLY 3 wolf_kill events, only once per player
 *
 * Refs #8
 */

import {
    GameEvent,
    WorldEvent,
    saveGameEvent,
    getGameEvents,
    countGameEvents,
    saveWorldEvent,
    getWorldEvents,
} from './data';

// World event constants
const WOLF_PACK_RETREAT_EVENT = 'Wolf Pack Retreat';
const WOLF_PACK_RETREAT_DESCRIPTION = 'Wolf activity around Moonvale has suddenly decreased.';
const WOLF_KILL_THRESHOLD = 3;
const WOLF_KILL_EVENT_TYPE = 'wolf_kill';

/**
 * Create a gameplay event
 * Tracks player actions: explore, wolf_kill, help_village, npc_conversation
 */
export function createGameplayEvent(
    playerId: string,
    eventType: 'explore' | 'wolf_kill' | 'help_village' | 'npc_conversation',
    description: string,
    location: string = 'Moonvale',
    metadata: Record<string, any> = {}
): GameEvent {
    const event = saveGameEvent({
        player_id: playerId,
        event_type: eventType,
        location,
        metadata: {
            ...metadata,
            description,
        },
    });

    return event;
}

/**
 * Count wolf_kill events for a specific player
 */
export function countWolfKillsForPlayer(playerId: string): number {
    return countGameEvents(playerId, WOLF_KILL_EVENT_TYPE);
}

/**
 * Check if Wolf Pack Retreat world event already exists for a player
 */
function worldEventExistsForPlayer(eventName: string, playerId: string): boolean {
    const allWorldEvents = getWorldEvents();
    return allWorldEvents.some(
        e => e.event_name === eventName && e.trigger_source === playerId
    );
}

/**
 * Check if Wolf Pack Retreat should be triggered
 * Returns null if already triggered or threshold not met
 */
export function checkWolfPackRetreatTrigger(playerId: string): WorldEvent | null {
    // Check if already triggered for this player
    if (worldEventExistsForPlayer(WOLF_PACK_RETREAT_EVENT, playerId)) {
        return null;
    }

    // Count wolf kills
    const wolfKillCount = countWolfKillsForPlayer(playerId);

    // Trigger at exactly 3 wolf kills
    if (wolfKillCount === WOLF_KILL_THRESHOLD) {
        const worldEvent = saveWorldEvent({
            event_name: WOLF_PACK_RETREAT_EVENT,
            description: WOLF_PACK_RETREAT_DESCRIPTION,
            trigger_source: playerId,
            metadata: {
                wolf_kill_count: wolfKillCount,
                threshold: WOLF_KILL_THRESHOLD,
            },
        });

        return worldEvent;
    }

    return null;
}

/**
 * Process a gameplay event and check for triggered world events
 * This is the main entry point for event processing
 */
export function processGameplayEvent(
    playerId: string,
    eventType: 'explore' | 'wolf_kill' | 'help_village' | 'npc_conversation',
    description: string,
    location: string = 'Moonvale',
    metadata: Record<string, any> = {}
): { gameEvent: GameEvent; worldEvent?: WorldEvent } {
    // Create the gameplay event
    const gameEvent = createGameplayEvent(playerId, eventType, description, location, metadata);

    // Check if this event triggers a world event
    let worldEvent: WorldEvent | undefined;

    if (eventType === 'wolf_kill') {
        const triggered = checkWolfPackRetreatTrigger(playerId);
        if (triggered) {
            worldEvent = triggered;
        }
    }

    return { gameEvent, worldEvent };
}

/**
 * Get wolf kill progress for a player
 * Returns count and whether threshold is reached
 */
export function getWolfKillProgress(playerId: string): {
    count: number;
    threshold: number;
    isComplete: boolean;
    eventTriggered: boolean;
} {
    const count = countWolfKillsForPlayer(playerId);
    const eventTriggered = worldEventExistsForPlayer(WOLF_PACK_RETREAT_EVENT, playerId);

    return {
        count,
        threshold: WOLF_KILL_THRESHOLD,
        isComplete: count >= WOLF_KILL_THRESHOLD,
        eventTriggered,
    };
}

/**
 * Validate event type
 */
export function isValidEventType(eventType: string): boolean {
    const validTypes = ['explore', 'wolf_kill', 'help_village', 'npc_conversation'];
    return validTypes.includes(eventType);
}

/**
 * Get all world events
 */
export function getAllWorldEvents(): WorldEvent[] {
    return getWorldEvents();
}

/**
 * Get all game events for a player
 */
export function getPlayerGameEvents(playerId: string): GameEvent[] {
    return getGameEvents(playerId);
}
