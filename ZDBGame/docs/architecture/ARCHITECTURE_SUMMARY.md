# Moonvale System Architecture - Executive Summary

**Version:** 1.0
**Project:** ZDBGame Workshop Demo
**Date:** 2026-03-12
**Status:** Architecture Design Complete

---

## Project Overview

**Moonvale** is a workshop demonstration of an AI-native game world built with Next.js, showcasing persistent memory, lore retrieval, and event-driven gameplay without external AI APIs.

### Core Requirements Met

| Requirement | Solution | Status |
|------------|----------|--------|
| Works offline | File-based JSON storage | ✓ Designed |
| No external AI APIs | Deterministic template-based NPC responses | ✓ Designed |
| Reliable & deterministic | Pattern-matching response system | ✓ Designed |
| Type-safe | Complete TypeScript type system | ✓ Designed |
| Event-driven gameplay | Rule-based game engine (wolf counter) | ✓ Designed |
| Immediate workshop readiness | Auto-seed data on startup | ✓ Designed |

---

## Architecture Highlights

### 1. Layered Architecture

```
Presentation Layer (React/Next.js)
        ↓
API Layer (Next.js Route Handlers)
        ↓
Business Logic Layer (Game Engine, NPC System, Lore Search)
        ↓
Data Access Layer (Storage Adapter Interface)
        ↓
Storage Layer (File-based JSON)
```

**Key Benefit:** Clean separation of concerns enables easy testing and future migration to ZeroDB.

### 2. Pluggable Storage Pattern

```typescript
interface StorageAdapter {
  createPlayer(player: Player): Promise<Player>;
  getNPCByName(name: string): Promise<NPC | null>;
  addMemory(memory: NPCMemory): Promise<NPCMemory>;
  // ... all data operations
}

// Factory selects implementation
function getStorage(): StorageAdapter {
  return process.env.ZERODB_API_KEY
    ? new ZeroDBStorageAdapter()
    : new FileStorageAdapter();
}
```

**Key Benefit:** Can swap from file-based to ZeroDB without changing business logic.

### 3. Deterministic NPC System

```typescript
// Template-based responses (no AI API calls)
const templates = {
  emberTower: "The Ember Tower fell after a magical experiment...",
  wolves: "Wolves often attack travelers...",
  wolfVictory: "I heard you drove the wolves back..."
};

// Pattern matching
if (message.includes("ember tower")) {
  return hasWolfMemory
    ? `${templates.wolfVictory} ${templates.emberTower}`
    : templates.emberTower;
}
```

**Key Benefit:** 100% reliable, works offline, no API costs or rate limits.

### 4. Event-Driven Gameplay

```typescript
// Rule: 3 wolf kills → trigger world event
async checkWolfPackRetreat(storage, playerId) {
  const events = await storage.getGameEvents(playerId);
  const wolfKills = events.filter(e => e.type === 'wolf_kill').length;

  if (wolfKills >= 3) {
    // Create "Wolf Pack Retreat" world event
    await storage.createWorldEvent({
      name: 'Wolf Pack Retreat',
      description: 'Wolf activity has decreased.'
    });
  }
}
```

**Key Benefit:** Demonstrates emergent gameplay without complex state machines.

---

## Data Flow Summary

### Player Creation
```
User → PlayerPanel → POST /api/player/create → Storage → players.json
```

### NPC Conversation
```
User → NPCChatPanel → POST /api/npc/talk
  → NPCResponseGenerator (templates + lore + memories)
  → Response + Memory Storage
  → UI Display
```

### World Event Trigger
```
User → ActionsPanel → "Fight Wolf" x3
  → GameRules.checkWolfPackRetreat()
  → WorldEvent created
  → WorldEventsPanel displays "Wolf Pack Retreat"
```

---

## Module Organization

### File Structure

```
ZDBGame/
├── app/
│   ├── page.tsx                    # Main dashboard
│   └── api/                        # 7 API route handlers
├── lib/
│   ├── types.ts                    # Type definitions
│   ├── storage/
│   │   ├── adapter.ts              # Interface
│   │   └── file-storage.ts         # Implementation
│   ├── game-engine/
│   │   └── rules.ts                # Wolf counter logic
│   ├── npc/
│   │   ├── response-generator.ts   # Template system
│   │   └── templates.ts            # Response text
│   └── lore/
│       ├── search.ts               # Keyword matching
│       └── seed-data.ts            # Initial lore
├── components/                     # 6 UI components
├── data/                           # JSON storage
└── docs/
    ├── architecture/
    │   ├── SYSTEM_ARCHITECTURE.md  # Full design
    │   ├── DATA_FLOW.md            # Sequence diagrams
    │   └── MODULE_DEPENDENCIES.md  # Import rules
    └── guides/
        └── IMPLEMENTATION_GUIDE.md # Build instructions
```

### Dependency Rules

1. **Unidirectional flow:** UI → API → Business Logic → Storage
2. **Interface-based:** All code depends on `StorageAdapter` interface
3. **No circular deps:** Enforced via ESLint
4. **Type-safe:** TypeScript strict mode throughout

---

## Technical Decisions

### Decision 1: File-Based Storage (Not Database)

**Rationale:**
- Workshop demo must work offline
- No database setup required
- Atomic writes prevent corruption
- Easy to reset demo state

**Trade-offs:**
- Not suitable for production scale
- Limited concurrent access
- No transactions

**Mitigation:**
- Pluggable adapter pattern allows migration to ZeroDB later
- In-memory caching for performance
- Atomic write pattern (temp file + rename)

### Decision 2: Template-Based NPC (Not AI API)

**Rationale:**
- 100% reliable (no API failures)
- Deterministic behavior for demos
- No API costs or rate limits
- Works completely offline

**Trade-offs:**
- Less dynamic/creative responses
- Requires manual template maintenance

**Mitigation:**
- Context-aware templates (check memories)
- Pattern matching for relevance
- Can add AI later as enhancement

### Decision 3: Keyword Search (Not Vector Embeddings)

**Rationale:**
- Simple implementation
- No embedding model required
- Fast for small dataset (3-10 lore entries)
- Deterministic results

**Trade-offs:**
- Less sophisticated matching
- Requires exact keyword overlap

**Mitigation:**
- Tag system for better matching
- Can upgrade to vector search with ZeroDB later

### Decision 4: Next.js App Router (Not Pages Router)

**Rationale:**
- Modern React patterns (Server Components)
- Built-in API routes
- Better TypeScript support
- Future-proof architecture

**Trade-offs:**
- Slightly more complex than Pages Router
- Newer API (less StackOverflow answers)

**Mitigation:**
- Extensive documentation provided
- Implementation guide with examples

---

## Performance Characteristics

### Expected Performance

| Operation | Target | Implementation |
|-----------|--------|----------------|
| Player creation | <50ms | Single file write |
| NPC conversation | <100ms | Template matching + file read |
| World event check | <100ms | Filter array + conditional write |
| UI page load | <2s | Static generation + client hydration |

### Scalability Limits

**Current Design:**
- **Players:** 1 (demo single-player)
- **NPCs:** 1-5
- **Lore entries:** 3-10
- **Memories:** <100
- **Events:** <200

**Future Enhancement (ZeroDB):**
- **Players:** Unlimited
- **NPCs:** Unlimited
- **Lore entries:** Thousands (vector search)
- **Memories:** Unlimited (indexed)
- **Events:** Millions (time-series)

---

## Risk Assessment

### High-Priority Risks

| Risk | Impact | Mitigation | Status |
|------|--------|-----------|--------|
| npm install fails on workshop laptop | Critical | Pre-test on clean machine, document Node.js requirements | Documented |
| JSON file corruption | High | Atomic write pattern (temp + rename) | Mitigated |
| Port 3000 conflict | Medium | Document `PORT=3001` workaround | Documented |

### Low-Priority Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Demo timing >5 min | Low | Provide demo script with timing |
| Template responses seem "dumb" | Low | Multiple templates, context-aware selection |
| File path issues (Windows) | Low | Use `path.join()` everywhere |

---

## Implementation Roadmap

### Phase 1: Foundation (30 min)
- [x] Architecture design complete
- [ ] Initialize Next.js project
- [ ] Create folder structure
- [ ] Define type system

### Phase 2: Storage Layer (45 min)
- [ ] Implement `StorageAdapter` interface
- [ ] Implement `FileStorageAdapter`
- [ ] Create seed data

### Phase 3: Business Logic (60 min)
- [ ] Implement NPC response generator
- [ ] Implement game rules engine
- [ ] Implement lore search

### Phase 4: API Routes (30 min)
- [ ] Player creation/fetch routes
- [ ] NPC conversation route
- [ ] Event routes
- [ ] World state route

### Phase 5: UI Components (60 min)
- [ ] Dashboard layout
- [ ] Player panel
- [ ] NPC chat panel
- [ ] Actions panel
- [ ] World events panel
- [ ] Memory viewer

### Phase 6: Testing & Polish (30 min)
- [ ] Manual demo flow testing
- [ ] Error handling
- [ ] Loading states
- [ ] Demo documentation

**Total Estimated Time:** 4.5 hours

---

## Success Criteria

### Functional Requirements

- [x] Architecture supports offline operation
- [x] Architecture supports deterministic NPC responses
- [x] Architecture supports event-driven gameplay
- [x] Architecture supports type safety
- [x] Architecture supports future ZeroDB migration

### Demo Requirements

- [ ] Works after `npm install && npm run dev`
- [ ] Player creation succeeds
- [ ] NPC responds with lore-based answers
- [ ] Wolf kill counter triggers world event at 3
- [ ] Memory viewer shows all interactions
- [ ] Demo completes in <5 minutes

### Code Quality Requirements

- [x] Clean architecture (layered)
- [x] Type-safe throughout
- [x] No circular dependencies
- [x] Documented module boundaries
- [x] Implementation guide provided

---

## Documentation Deliverables

| Document | Purpose | Status |
|----------|---------|--------|
| SYSTEM_ARCHITECTURE.md | Complete technical design | ✓ Complete |
| DATA_FLOW.md | Sequence diagrams & state transitions | ✓ Complete |
| MODULE_DEPENDENCIES.md | Import rules & dependency graph | ✓ Complete |
| IMPLEMENTATION_GUIDE.md | Step-by-step build instructions | ✓ Complete |
| ARCHITECTURE_SUMMARY.md | Executive overview (this doc) | ✓ Complete |

---

## Next Steps

### For Implementation Team

1. **Read documentation** (70 minutes)
   - SYSTEM_ARCHITECTURE.md (30 min)
   - DATA_FLOW.md (20 min)
   - MODULE_DEPENDENCIES.md (20 min)

2. **Follow implementation guide** (4.5 hours)
   - Initialize project
   - Implement storage layer
   - Build business logic
   - Create API routes
   - Build UI components

3. **Test demo flow** (30 minutes)
   - Manual testing
   - Edge case validation
   - Performance check

### For Workshop Instructor

1. **Review demo script** (15 minutes)
   - Understand flow
   - Practice timing
   - Prepare talking points

2. **Pre-flight check** (15 minutes)
   - Test on workshop laptop
   - Verify Node.js version
   - Ensure port 3000 available

---

## Architecture Review Checklist

- [x] Requirements fully analyzed
- [x] Non-functional requirements addressed
- [x] Technology stack justified
- [x] Data flow documented
- [x] Module boundaries defined
- [x] Dependency rules established
- [x] Error handling patterns defined
- [x] Performance targets set
- [x] Scalability limits documented
- [x] Risk assessment completed
- [x] Implementation roadmap created
- [x] Success criteria defined

---

## Conclusion

The Moonvale architecture successfully balances **workshop demo requirements** (simplicity, reliability, offline operation) with **architectural quality** (clean separation of concerns, type safety, pluggable design).

**Key Strengths:**
1. Works 100% offline with no external dependencies
2. Deterministic behavior perfect for live demos
3. Clean architecture enables future migration to ZeroDB
4. Complete type safety prevents runtime errors
5. Event-driven design demonstrates AI-native concepts

**Recommended Next Action:**
Proceed with implementation following the IMPLEMENTATION_GUIDE.md step-by-step instructions.

---

**Architecture Design Status:** ✓ COMPLETE

**Approval Required From:** Workshop Lead, Technical Reviewer

**Estimated Implementation Time:** 4.5 hours

**Target Workshop Date:** TBD

---

## Appendix: Quick Reference

### Key File Locations

- **Main Dashboard:** `app/page.tsx`
- **Storage Interface:** `lib/storage/adapter.ts`
- **Game Rules:** `lib/game-engine/rules.ts`
- **NPC System:** `lib/npc/response-generator.ts`
- **Type Definitions:** `lib/types.ts`

### Key Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Reset demo data
rm data/*.json && npm run dev
```

### API Endpoints

```
POST   /api/player/create       Create demo player
GET    /api/player/current      Get current player
POST   /api/npc/talk            Conversation with NPC
POST   /api/event/create        Record gameplay event
GET    /api/events              Get event history
GET    /api/memories            Get NPC memories
GET    /api/world               Get world state + check triggers
```

---

**Document Version:** 1.0
**Last Updated:** 2026-03-12
**Maintained By:** System Architect

**End of Architecture Summary**
