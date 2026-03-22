# Moonvale: AI-Native Game World Demo

> **Workshop Demo for ZeroDB Platform**
> A deterministic fantasy RPG showcasing persistent NPC memory, lore-based dialogue, and emergent world events.

---

## What This Demo Demonstrates

This workshop demo showcases five key capabilities of AI-native game development:

1. **Persistent NPC Memory** - NPCs remember player actions across conversations (wolf kills, exploration, quests)
2. **Lore-Based Dialogue** - Deterministic responses using keyword matching against world lore database
3. **Emergent World Events** - Game world reacts to player actions (Wolf Pack Retreat after 3 kills)
4. **Memory Importance Scoring** - Action-based memories weighted by significance (combat > exploration > questions)
5. **File-Based Storage** - Simple JSON persistence ready to swap with ZeroDB

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Storage | File-based JSON (`.data/` directory) |
| Runtime | Node.js 18+ |
| Testing | Jest with 88% coverage |

**No external APIs required** - Fully offline demo optimized for live workshops.

---

## Installation

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Setup
```bash
# Navigate to project directory
cd /path/to/ZDBGame

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

**Expected installation time:** 2-5 minutes (depending on network speed)

---

## Demo Script for Instructors

Follow these exact steps during the workshop demonstration:

### Step 1: Create Player Character
1. Open browser to `http://localhost:3000`
2. Click **"Create Player"** button
3. Enter username: `Aric` (or any name)
4. Select class: `Warrior`
5. Click **"Create"**

**Expected Result:** Player panel appears with Level 1, 0 XP, Warrior class

---

### Step 2: Ask About Ember Tower
1. In the **NPC Chat** section, locate Elarin the Lorekeeper
2. Type in chat: `What happened to Ember Tower?`
3. Click **"Send"**

**Expected Response:**
```
"Ah, Ember Tower... The Ember Tower collapsed after a magical
experiment went terribly wrong many years ago, scattering ash
and arcane debris across the valley."
```

**Key Teaching Points:**
- Response is deterministic (always same for this keyword)
- System retrieved "The Fall of Ember Tower" lore entry
- No AI API calls - pure pattern matching
- Memory created: "Player asked about Ember Tower" (importance: 2)

---

### Step 3: Fight Wolves Three Times
1. In the **Actions** panel, click **"Fight Wolf"** button
2. Wait for response (XP gained, event logged)
3. Click **"Fight Wolf"** again (second time)
4. Click **"Fight Wolf"** a third time

**Expected Results After Each Kill:**
- Kill 1: +25 XP, event logged
- Kill 2: +25 XP, event logged
- Kill 3: +25 XP, **WORLD EVENT TRIGGERS**

**Watch for:** After the third wolf kill, a **World Event** appears:
```
"Wolf Pack Retreat - The northern wolf pack has been driven
back from Moonvale after suffering heavy losses."
```

**Key Teaching Points:**
- Game engine tracks action counts per player
- Rules engine triggers world events based on thresholds
- Demonstrates emergent gameplay from simple rules
- Each kill creates a memory (importance: 3 - highest)

---

### Step 4: Observe Wolf Pack Retreat
1. Scroll to **World Events** panel (bottom right)
2. Point out the triggered event with timestamp
3. Explain this event affects NPC dialogue

**Expected Display:**
```
[Timestamp] Wolf Pack Retreat
The northern wolf pack has been driven back from Moonvale
after suffering heavy losses.
```

**Key Teaching Points:**
- World events are player-triggered, not time-based
- Events are stored persistently in `.data/events.json`
- NPCs reference these events in conversation context

---

### Step 5: Talk to Elarin Again
1. Return to **NPC Chat** section
2. Type: `Are there wolves in the forest?`
3. Click **"Send"**

**Expected Response:**
```
"You've already changed the balance around Moonvale. I heard
you drove the wolves back. Wolves often attack travelers near
the northern forest, especially when food is scarce or the
woods are disturbed."
```

**Key Teaching Points:**
- NPC references past player actions ("drove the wolves back")
- Memory integration in real-time dialogue
- Context-aware responses without AI randomness
- Demonstrates "NPC remembers you" gameplay pattern

---

### Step 6: Inspect NPC Memory Viewer
1. Scroll to **Memory Viewer** panel (bottom)
2. Show the list of stored memories for this player

**Expected Memories (in order of importance):**
```
1. Memory: "Player defeated wolves near Moonvale"
   Importance: 3 (Action-based, combat)

2. Memory: "Player asked about Ember Tower"
   Importance: 2 (Lore-based question)

3. Memory: "Player asked about wolves in forest"
   Importance: 1 (General question)
```

**Key Teaching Points:**
- Memories ranked by importance score (3 = highest)
- System prevents duplicate memories
- Memories persist across sessions (stored in `.data/npc-memories.json`)
- NPCs query their memories when generating responses

---

## File Structure Overview

```
ZDBGame/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Main game dashboard UI
│   ├── layout.tsx           # Root layout wrapper
│   └── globals.css          # Tailwind styles
├── lib/                      # Core business logic
│   ├── types.ts             # TypeScript type definitions
│   ├── data.ts              # File storage adapter
│   ├── seed.ts              # Initial game world data
│   ├── lore.ts              # Lore keyword search
│   ├── memory.ts            # NPC memory management
│   ├── npc.ts               # NPC dialogue generator
│   └── game-engine.ts       # Rules engine & world events
├── .data/                    # JSON storage (gitignored)
│   ├── players.json         # Player characters
│   ├── npc-memories.json    # NPC memory store
│   ├── events.json          # Game event log
│   └── world-events.json    # World event triggers
├── __tests__/               # Jest test suite
├── docs/                     # Architecture documentation
├── package.json             # Dependencies
└── README.md                # This file
```

---

## Troubleshooting

### Issue: Port 3000 already in use
**Solution:**
```bash
PORT=3001 npm run dev
```

### Issue: npm install fails
**Solution:**
```bash
# Verify Node.js version
node --version  # Should be 18.x or higher

# Clear npm cache
npm cache clean --force

# Retry installation
npm install
```

### Issue: Data files corrupted or missing
**Solution:**
```bash
# Stop the server (Ctrl+C)

# Delete data directory
rm -rf .data/

# Restart server - data auto-regenerates
npm run dev
```

### Issue: TypeScript errors during build
**Solution:**
```bash
# Check TypeScript configuration
npm run lint

# Force rebuild
rm -rf .next/
npm run build
```

### Issue: Blank screen after create player
**Solution:**
- Check browser console for errors (F12)
- Verify `.data/` directory exists and is writable
- Restart dev server

### Issue: NPC not responding to questions
**Solution:**
- Ensure question contains keywords: "ember", "tower", "moonvale", "wolves", "forest"
- Check case-insensitive matching is working
- Review lore entries in `lib/seed.ts`

---

## Running Tests

The demo includes comprehensive test coverage:

```bash
# Run full test suite
npm test

# Run tests in watch mode
npm run test:watch
```

**Expected Output:**
```
Test Suites: 1 passed
Tests: 18 passed
Coverage: 88.52% statements, 89.55% branches
```

**Test Coverage:**
- NPC dialogue generation (deterministic responses)
- Memory storage and retrieval (no duplicates)
- Lore keyword search (case-insensitive)
- Game rules engine (world event triggers)
- Action memory creation (importance scoring)

---

## Workshop Tips

### Before the Workshop
1. Run through demo script completely at least once
2. Have backup `.data/` directory in case of corruption
3. Test on workshop WiFi network (demo works offline)
4. Prepare screenshots of expected outputs
5. Clear `.data/` directory for fresh demo

### During the Workshop
1. Walk through each step slowly - audience needs to see changes
2. Point out the browser dev tools showing no network requests
3. Show the `.data/` JSON files updating in real-time (optional)
4. Emphasize deterministic behavior vs. AI randomness
5. Highlight how this scales to ZeroDB backend

### Common Audience Questions

**Q: Does this use ChatGPT or Claude?**
A: No. Responses are template-based using keyword matching. This ensures predictable demo behavior.

**Q: How would this work with real AI?**
A: Replace the template system with AI API calls in `lib/npc.ts`. The memory and lore retrieval stay the same.

**Q: Why file-based storage instead of database?**
A: Simplifies demo setup. In production, swap `lib/data.ts` with ZeroDB adapter (same interface).

**Q: What happens if two players fight wolves?**
A: Each player has independent memory. World events trigger per player (not shared state in this demo).

**Q: Can I add more NPCs or lore?**
A: Yes. Edit `lib/seed.ts` and restart server. See `docs/guides/IMPLEMENTATION_GUIDE.md` for details.

---

## Next Steps After Workshop

### For Participants
1. Review `docs/architecture/ARCHITECTURE_SUMMARY.md` - system design overview
2. Explore `lib/npc.ts` - see how dialogue generation works
3. Modify `lib/seed.ts` - add custom lore entries or NPCs
4. Read `docs/guides/IMPLEMENTATION_GUIDE.md` - step-by-step build guide

### Extending the Demo
- Add more NPCs with unique personalities
- Create additional world events (quest completion, boss fights)
- Implement item inventory system
- Add location-based lore (Ember Tower, Ancient Woods)
- Integrate ZeroDB backend storage

---

## Build Time Expectations

| Phase | Duration |
|-------|----------|
| npm install | 2-5 minutes |
| First build | 15-30 seconds |
| Hot reload (dev) | 1-2 seconds |
| Production build | 30-60 seconds |

**Total setup time:** ~5 minutes from clone to running demo

---

## Project Documentation

| Document | Purpose |
|----------|---------|
| `DEMO_SCRIPT.md` | Technical demo walkthrough with code examples |
| `docs/README.md` | Full documentation index |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` | Complete system design |
| `docs/guides/IMPLEMENTATION_GUIDE.md` | Step-by-step build instructions |
| `CLAUDE.md` | Project-specific development rules |

---

## License

ISC License - See [LICENSE](LICENSE) file for details

---

## Support

**GitHub Repository:** https://github.com/PAIPalooza/ZDBGame
**Issues:** https://github.com/PAIPalooza/ZDBGame/issues

For workshop-specific questions, see `docs/guides/IMPLEMENTATION_GUIDE.md` troubleshooting section.

---

**Demo Status:** Production Ready
**Test Coverage:** 88.52%
**Last Updated:** 2026-03-12

---

**End of README**
