'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function APIReferencePage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    const nav = globalThis.navigator as
      | {
          clipboard?: {
            writeText: (value: string) => Promise<void>;
          };
        }
      | undefined;

    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
    }

    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="border-b border-purple-500/30 pb-6">
          <Link
            href="/"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors"
          >
            ← Back to Demo
          </Link>
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ZeroDB API Reference
          </h1>
          <p className="text-xl text-purple-300 mb-4">
            Complete API Documentation for Moonvale Demo
          </p>
          <p className="text-gray-300 max-w-3xl">
            This page documents all ZeroDB APIs used in the demo, with code snippets you can use with AIKit to extend the UI.
          </p>
        </header>

        {/* Quick Links */}
        <section className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/20">
          <h2 className="text-2xl font-bold mb-4 text-purple-300">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <a href="#player-api" className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg p-3 transition-colors">
              Player Management
            </a>
            <a href="#npc-api" className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg p-3 transition-colors">
              NPC Interaction
            </a>
            <a href="#event-api" className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg p-3 transition-colors">
              Event System
            </a>
            <a href="#world-api" className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg p-3 transition-colors">
              World State
            </a>
            <a href="#memory-api" className="bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 rounded-lg p-3 transition-colors">
              Memory System
            </a>
            <a href="#lore-api" className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg p-3 transition-colors">
              Lore Database
            </a>
            <a href="#stats-api" className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg p-3 transition-colors">
              Statistics
            </a>
            <a href="#aikit-examples" className="bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 rounded-lg p-3 transition-colors">
              AIKit Examples
            </a>
          </div>
        </section>

        {/* Player Management API */}
        <section id="player-api" className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-blue-500/20">
          <h2 className="text-3xl font-bold mb-4 text-blue-300">Player Management API</h2>

          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-blue-200">POST /api/player/create</h3>
                <button
                  onClick={() => copyToClipboard(`fetch('/api/player/create', { method: 'POST' })`, 'player-create')}
                  className="text-xs bg-blue-600/20 hover:bg-blue-600/40 px-3 py-1 rounded border border-blue-500/30 transition-colors"
                >
                  {copiedId === 'player-create' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-400 mb-3">Creates a demo player (TobyTheExplorer, Ranger, Level 1)</p>
              <div className="bg-black/50 rounded p-3 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`// Request
fetch('/api/player/create', {
  method: 'POST'
});

// Response
{
  "id": "uuid",
  "username": "TobyTheExplorer",
  "class": "Ranger",
  "level": 1,
  "xp": 0,
  "createdAt": "2026-03-12T..."
}`}
                </pre>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-blue-200">GET /api/player/current</h3>
                <button
                  onClick={() => copyToClipboard(`fetch('/api/player/current')`, 'player-current')}
                  className="text-xs bg-blue-600/20 hover:bg-blue-600/40 px-3 py-1 rounded border border-blue-500/30 transition-colors"
                >
                  {copiedId === 'player-current' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-400 mb-3">Retrieves the current player from storage</p>
              <div className="bg-black/50 rounded p-3 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`// Request
fetch('/api/player/current');

// Response (Player exists)
{
  "id": "uuid",
  "username": "TobyTheExplorer",
  "class": "Ranger",
  "level": 1,
  "xp": 0
}

// Response (No player)
null`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* NPC Interaction API */}
        <section id="npc-api" className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-green-500/20">
          <h2 className="text-3xl font-bold mb-4 text-green-300">NPC Interaction API</h2>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-green-200">POST /api/npc/talk</h3>
              <button
                onClick={() => copyToClipboard(`fetch('/api/npc/talk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerId: player.id,
    message: 'Your message here'
  })
})`, 'npc-talk')}
                className="text-xs bg-green-600/20 hover:bg-green-600/40 px-3 py-1 rounded border border-green-500/30 transition-colors"
              >
                {copiedId === 'npc-talk' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-gray-400 mb-3">Send a message to Elarin and receive a response with lore integration</p>
            <div className="bg-black/50 rounded p-3 overflow-x-auto">
              <pre className="text-sm text-green-400">
{`// Request
fetch('/api/npc/talk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerId: "uuid",
    message: "What happened to Ember Tower?"
  })
});

// Response
{
  "npcName": "Elarin",
  "response": {
    "response": "Ah, the Ember Tower... A sad tale...",
    "loreUsed": ["lore-001"],
    "memoriesReferenced": []
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Event System API */}
        <section id="event-api" className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-yellow-500/20">
          <h2 className="text-3xl font-bold mb-4 text-yellow-300">Event System API</h2>

          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-yellow-200">POST /api/event/create</h3>
                <button
                  onClick={() => copyToClipboard(`fetch('/api/event/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerId: player.id,
    eventType: 'wolf_kill',
    description: 'Player defeated a wolf',
    location: 'moonvale'
  })
})`, 'event-create')}
                  className="text-xs bg-yellow-600/20 hover:bg-yellow-600/40 px-3 py-1 rounded border border-yellow-500/30 transition-colors"
                >
                  {copiedId === 'event-create' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-400 mb-3">Create a gameplay event (explore, wolf_kill, help_village, npc_conversation)</p>
              <div className="bg-black/50 rounded p-3 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`// Request
fetch('/api/event/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerId: "uuid",
    eventType: "wolf_kill",
    description: "Player defeated a wolf near Moonvale",
    location: "moonvale",
    metadata: { damage: 50 } // optional
  })
});

// Response
{
  "success": true,
  "gameEvent": {
    "id": "uuid",
    "playerId": "uuid",
    "type": "wolf_kill",
    "description": "...",
    "location": "moonvale",
    "timestamp": "..."
  },
  "worldEvent": {
    "id": "uuid",
    "name": "Wolf Pack Retreat",
    "description": "...",
    "triggeredBy": "uuid"
  }, // null if no world event triggered
  "message": "Game event created and world event triggered!"
}`}
                </pre>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-yellow-200">GET /api/events?playerId=X</h3>
                <button
                  onClick={() => copyToClipboard(`fetch('/api/events?playerId=' + player.id)`, 'events-get')}
                  className="text-xs bg-yellow-600/20 hover:bg-yellow-600/40 px-3 py-1 rounded border border-yellow-500/30 transition-colors"
                >
                  {copiedId === 'events-get' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-400 mb-3">Retrieve all gameplay events for a player</p>
              <div className="bg-black/50 rounded p-3 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`// Request
fetch('/api/events?playerId=uuid');

// Response
[
  {
    "id": "uuid",
    "playerId": "uuid",
    "type": "wolf_kill",
    "description": "Player defeated a wolf",
    "location": "moonvale",
    "timestamp": "2026-03-12T...",
    "metadata": {}
  },
  // ... more events
]`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* World State API */}
        <section id="world-api" className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-orange-500/20">
          <h2 className="text-3xl font-bold mb-4 text-orange-300">World State API</h2>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-orange-200">GET /api/world?playerId=X</h3>
              <button
                onClick={() => copyToClipboard(`fetch('/api/world?playerId=' + player.id)`, 'world-get')}
                className="text-xs bg-orange-600/20 hover:bg-orange-600/40 px-3 py-1 rounded border border-orange-500/30 transition-colors"
              >
                {copiedId === 'world-get' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-gray-400 mb-3">Get world events and player-specific world state (e.g., wolf kill count)</p>
            <div className="bg-black/50 rounded p-3 overflow-x-auto">
              <pre className="text-sm text-green-400">
{`// Request
fetch('/api/world?playerId=uuid');

// Response
{
  "worldEvents": [
    {
      "id": "uuid",
      "name": "Wolf Pack Retreat",
      "description": "The wolves have retreated...",
      "triggeredBy": "uuid",
      "region": "Moonvale",
      "timestamp": "2026-03-12T..."
    }
  ],
  "wolfKills": 3
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Memory System API */}
        <section id="memory-api" className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-pink-500/20">
          <h2 className="text-3xl font-bold mb-4 text-pink-300">Memory System API</h2>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-pink-200">GET /api/memories?playerId=X</h3>
              <button
                onClick={() => copyToClipboard(`fetch('/api/memories?playerId=' + player.id)`, 'memories-get')}
                className="text-xs bg-pink-600/20 hover:bg-pink-600/40 px-3 py-1 rounded border border-pink-500/30 transition-colors"
              >
                {copiedId === 'memories-get' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-gray-400 mb-3">Retrieve NPC memories related to the player (Elarin remembers your actions)</p>
            <div className="bg-black/50 rounded p-3 overflow-x-auto">
              <pre className="text-sm text-green-400">
{`// Request
fetch('/api/memories?playerId=uuid');

// Response
[
  {
    "id": "uuid",
    "npcId": "elarin-001",
    "playerId": "uuid",
    "memory": "Player asked about Ember Tower",
    "importance": 5,
    "createdAt": "2026-03-12T...",
    "tags": ["lore", "ember_tower"]
  },
  {
    "id": "uuid",
    "npcId": "elarin-001",
    "playerId": "uuid",
    "memory": "Player defeated 3 wolves",
    "importance": 8,
    "createdAt": "2026-03-12T...",
    "tags": ["combat", "wolves"]
  }
]`}
              </pre>
            </div>
          </div>
        </section>

        {/* Lore Database API */}
        <section id="lore-api" className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-indigo-500/20">
          <h2 className="text-3xl font-bold mb-4 text-indigo-300">Lore Database API</h2>

          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-indigo-200">GET /api/lore</h3>
                <button
                  onClick={() => copyToClipboard(`fetch('/api/lore')`, 'lore-get-all')}
                  className="text-xs bg-indigo-600/20 hover:bg-indigo-600/40 px-3 py-1 rounded border border-indigo-500/30 transition-colors"
                >
                  {copiedId === 'lore-get-all' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-400 mb-3">Retrieve all lore entries from the database</p>
              <div className="bg-black/50 rounded p-3 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`// Request
fetch('/api/lore');

// Response
[
  {
    "id": "lore-001",
    "title": "The Fall of Ember Tower",
    "content": "The Ember Tower collapsed after...",
    "region": "Moonvale",
    "tags": ["ember tower", "collapse", "magic", "history"],
    "created_at": "2026-03-12T00:00:00.000Z"
  },
  // ... more lore entries
]`}
                </pre>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-indigo-200">GET /api/lore?query=keyword</h3>
                <button
                  onClick={() => copyToClipboard(`fetch('/api/lore?query=tower')`, 'lore-search')}
                  className="text-xs bg-indigo-600/20 hover:bg-indigo-600/40 px-3 py-1 rounded border border-indigo-500/30 transition-colors"
                >
                  {copiedId === 'lore-search' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-400 mb-3">Search lore by keywords (semantic search via title/content/tags matching)</p>
              <div className="bg-black/50 rounded p-3 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`// Request
fetch('/api/lore?query=tower');

// Response (filtered results)
[
  {
    "id": "lore-001",
    "title": "The Fall of Ember Tower",
    "content": "The Ember Tower collapsed...",
    "region": "Moonvale",
    "tags": ["ember tower", "collapse", "magic"],
    "created_at": "2026-03-12T00:00:00.000Z"
  }
]`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics API */}
        <section id="stats-api" className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/20">
          <h2 className="text-3xl font-bold mb-4 text-purple-300">Database Statistics API</h2>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-purple-200">GET /api/stats</h3>
              <button
                onClick={() => copyToClipboard(`fetch('/api/stats')`, 'stats-get')}
                className="text-xs bg-purple-600/20 hover:bg-purple-600/40 px-3 py-1 rounded border border-purple-500/30 transition-colors"
              >
                {copiedId === 'stats-get' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-gray-400 mb-3">Get aggregate statistics across all ZeroDB collections</p>
            <div className="bg-black/50 rounded p-3 overflow-x-auto">
              <pre className="text-sm text-green-400">
{`// Request
fetch('/api/stats');

// Response
{
  "players": 3,
  "lore": 3,
  "npcMemories": 0,
  "gameEvents": 14,
  "worldEvents": 0,
  "totalFiles": 21
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* AIKit Integration Examples */}
        <section id="aikit-examples" className="bg-gradient-to-r from-teal-900/30 to-cyan-900/30 backdrop-blur rounded-lg p-6 border border-teal-500/30">
          <h2 className="text-3xl font-bold mb-4 text-teal-300">AIKit Integration Examples</h2>
          <p className="text-gray-300 mb-6">
            Use these prompts with AIKit to extend the Moonvale demo UI with new features:
          </p>

          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4 border border-teal-500/20">
              <h3 className="text-xl font-bold text-teal-200 mb-2">Example 1: Player Inventory System</h3>
              <p className="text-gray-400 mb-3">Add a visual inventory grid showing items collected during gameplay</p>
              <div className="bg-black/50 rounded p-3">
                <pre className="text-sm text-cyan-300 whitespace-pre-wrap">
{`Prompt for AIKit:

"Add a new section to app/page.tsx called 'Player Inventory' that displays a
grid of inventory items. Use the existing player state and create a mock
inventory array with items like:
- Wolf Pelt (from wolf_kill events)
- Ancient Scroll (from lore interactions)
- Healing Potion

Style it with Tailwind CSS to match the existing purple/pink gradient theme.
Add hover effects and item tooltips showing rarity and description."`}
                </pre>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-teal-500/20">
              <h3 className="text-xl font-bold text-teal-200 mb-2">Example 2: Real-Time Event Chart</h3>
              <p className="text-gray-400 mb-3">Create a visual chart showing event frequency over time</p>
              <div className="bg-black/50 rounded p-3">
                <pre className="text-sm text-cyan-300 whitespace-pre-wrap">
{`Prompt for AIKit:

"Add a new API endpoint GET /api/events/analytics that returns event counts
grouped by type. Then create a UI section with a bar chart visualization using
the events data. Use the existing fetchEvents function and add a new
fetchEventAnalytics function. Style the chart with gradient bars matching
the existing color scheme (blue for explore, red for wolf_kill, etc)."`}
                </pre>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-teal-500/20">
              <h3 className="text-xl font-bold text-teal-200 mb-2">Example 3: NPC Relationship Tracker</h3>
              <p className="text-gray-400 mb-3">Display relationship level with Elarin based on interactions</p>
              <div className="bg-black/50 rounded p-3">
                <pre className="text-sm text-cyan-300 whitespace-pre-wrap">
{`Prompt for AIKit:

"Create a 'Relationships' section that shows NPC relationship levels.
Calculate the relationship score based on the number of memories in
/api/memories. Display it as a progress bar with levels:
- Stranger (0-2 memories)
- Acquaintance (3-5)
- Friend (6-10)
- Trusted Ally (11+)

Add visual indicators like hearts or stars, and show recent interactions
below the progress bar."`}
                </pre>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-teal-500/20">
              <h3 className="text-xl font-bold text-teal-200 mb-2">Example 4: Quest Log System</h3>
              <p className="text-gray-400 mb-3">Create a quest tracking system with active and completed quests</p>
              <div className="bg-black/50 rounded p-3">
                <pre className="text-sm text-cyan-300 whitespace-pre-wrap">
{`Prompt for AIKit:

"Add a new API POST /api/quest/create and GET /api/quests?playerId=X.
Create a Quest type with: id, title, description, objectives, status
(active/completed), rewards. Add a 'Quest Log' UI section showing active
quests as cards with:
- Title and description
- Objectives checklist (e.g., 'Defeat 3 wolves' with progress)
- Rewards preview
- Complete button

Use the existing event system to track quest progress automatically."`}
                </pre>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-teal-500/20">
              <h3 className="text-xl font-bold text-teal-200 mb-2">Example 5: Interactive Map View</h3>
              <p className="text-gray-400 mb-3">Add a visual map of Moonvale with location markers</p>
              <div className="bg-black/50 rounded p-3">
                <pre className="text-sm text-cyan-300 whitespace-pre-wrap">
{`Prompt for AIKit:

"Create a 'World Map' section showing a stylized SVG map of Moonvale region.
Mark these locations:
- Moonvale Village (center)
- Northern Forest (top)
- Ember Tower Ruins (right)

Add clickable markers that show location details in a tooltip. Highlight
locations where the player has events using the /api/events data. Use CSS
animations for pulsing markers on locations with recent activity."`}
                </pre>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-teal-500/20">
              <h3 className="text-xl font-bold text-teal-200 mb-2">Example 6: Achievement System</h3>
              <p className="text-gray-400 mb-3">Track and display player achievements based on actions</p>
              <div className="bg-black/50 rounded p-3">
                <pre className="text-sm text-cyan-300 whitespace-pre-wrap">
{`Prompt for AIKit:

"Add an 'Achievements' section that tracks player milestones:
- 'First Blood' (defeat 1 wolf)
- 'Wolf Hunter' (defeat 3 wolves, trigger world event)
- 'Lore Seeker' (ask Elarin about 3 different lore topics)
- 'Helpful Hero' (complete help_village event 5 times)

Check these conditions using /api/events and /api/memories data. Display
achievements as cards with:
- Icon/badge
- Title and description
- Progress bar
- Unlock timestamp or 'Locked' state

Add visual celebration (confetti animation) when achievement unlocks."`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ZeroDB Credentials Section */}
        <section className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/20">
          <h2 className="text-2xl font-bold mb-4 text-purple-300">ZeroDB Credentials</h2>
          <p className="text-gray-300 mb-4">
            The demo currently uses file-based storage. To connect to actual ZeroDB cloud storage, add these credentials to your .env file:
          </p>
          <div className="bg-black/50 rounded p-4">
            <pre className="text-sm text-gray-400">
{`# ZeroDB MCP Server
AINATIVE_USERNAME="admin@ainative.studio"
AINATIVE_PASSWORD="H%dJcjSwLZIe1%9u"
AINATIVE_API_URL="https://api.ainative.studio/"
AINATIVE_API_TOKEN="kLPiP0bzgKJ0CnNYVt1wq3qxbs2QgDeF2XwyUnxBEOM"`}
            </pre>
          </div>
          <p className="text-gray-400 mt-3 text-sm">
            Note: The current demo works without these credentials using deterministic file-based storage for workshop reliability.
          </p>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-purple-500/30">
          <Link
            href="/"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 text-lg font-semibold transition-colors"
          >
            ← Back to Moonvale Demo
          </Link>
          <p className="text-gray-500 mt-3 text-sm">
            Workshop Demo - ZeroDB API Reference - 2026-03-12
          </p>
        </footer>

      </div>
    </main>
  );
}
