# ZDBGame Documentation Index

**Project:** Moonvale AI-Native Game World Workshop Demo
**Version:** 1.0
**Last Updated:** 2026-03-12

---

## Quick Navigation

### For Developers Implementing the System

1. **Start Here:** [Architecture Summary](architecture/ARCHITECTURE_SUMMARY.md) (15 min read)
2. **Detailed Design:** [System Architecture](architecture/SYSTEM_ARCHITECTURE.md) (30 min read)
3. **Implementation:** [Implementation Guide](guides/IMPLEMENTATION_GUIDE.md) (Follow step-by-step)

### For Architects & Reviewers

1. **Complete Architecture:** [System Architecture](architecture/SYSTEM_ARCHITECTURE.md)
2. **Data Flow:** [Data Flow Documentation](architecture/DATA_FLOW.md)
3. **Module Dependencies:** [Module Dependencies](architecture/MODULE_DEPENDENCIES.md)

### For Workshop Instructors

1. **Architecture Overview:** [Architecture Summary](architecture/ARCHITECTURE_SUMMARY.md)
2. **Demo Script:** See [prd.md](../prd.md) in project root
3. **Troubleshooting:** [Implementation Guide - Troubleshooting Section](guides/IMPLEMENTATION_GUIDE.md#troubleshooting)

---

## Documentation Structure

```
docs/
├── README.md (this file)
├── architecture/
│   ├── ARCHITECTURE_SUMMARY.md       # Executive overview
│   ├── SYSTEM_ARCHITECTURE.md        # Complete system design
│   ├── DATA_FLOW.md                  # Sequence diagrams & flows
│   └── MODULE_DEPENDENCIES.md        # Import rules & dependencies
└── guides/
    └── IMPLEMENTATION_GUIDE.md       # Step-by-step build guide
```

---

## Document Descriptions

### Architecture Documents

#### [ARCHITECTURE_SUMMARY.md](architecture/ARCHITECTURE_SUMMARY.md)
**Purpose:** Executive summary for quick understanding
**Audience:** All stakeholders
**Reading Time:** 15 minutes
**Contents:**
- Project overview
- Architecture highlights
- Technical decisions
- Risk assessment
- Implementation roadmap

#### [SYSTEM_ARCHITECTURE.md](architecture/SYSTEM_ARCHITECTURE.md)
**Purpose:** Complete technical architecture design
**Audience:** Developers, architects
**Reading Time:** 30 minutes
**Contents:**
- Requirements analysis
- Proposed architecture (C4 diagrams)
- Folder structure
- Component design
- Data layer architecture
- API route design
- Type system
- Technology stack justification
- Implementation roadmap
- Risk assessment
- Success metrics

#### [DATA_FLOW.md](architecture/DATA_FLOW.md)
**Purpose:** Detailed data flow and state management
**Audience:** Developers implementing features
**Reading Time:** 20 minutes
**Contents:**
- Player creation flow
- NPC conversation flow
- Gameplay action flow (Fight Wolf)
- Memory persistence patterns
- Error handling flows
- State synchronization
- Data consistency rules
- Performance optimizations

#### [MODULE_DEPENDENCIES.md](architecture/MODULE_DEPENDENCIES.md)
**Purpose:** Module organization and import rules
**Audience:** Developers writing code
**Reading Time:** 20 minutes
**Contents:**
- Dependency hierarchy
- Module dependency graph
- Dependency rules (enforced)
- Import path conventions
- Module boundaries
- Dependency injection patterns
- External dependencies
- Import validation rules
- Anti-patterns to avoid

### Implementation Guides

#### [IMPLEMENTATION_GUIDE.md](guides/IMPLEMENTATION_GUIDE.md)
**Purpose:** Step-by-step implementation instructions
**Audience:** Developers building the system
**Reading Time:** Reference document
**Contents:**
- Quick start checklist
- Phase 1: Project initialization
- Phase 2: Type system implementation
- Phase 3: Storage layer implementation
- Phase 4: Business logic implementation
- Phase 5: API routes implementation
- Phase 6: UI components
- Testing procedures
- Troubleshooting

---

## Reading Paths

### Path 1: Quick Start (For Implementers)

**Goal:** Start building immediately
**Time:** 20 minutes reading + 4.5 hours implementation

1. [Architecture Summary](architecture/ARCHITECTURE_SUMMARY.md) - 15 min
2. [Implementation Guide](guides/IMPLEMENTATION_GUIDE.md) - 5 min overview
3. Start building following implementation guide

### Path 2: Deep Understanding (For Architects)

**Goal:** Comprehensive architectural knowledge
**Time:** 90 minutes

1. [System Architecture](architecture/SYSTEM_ARCHITECTURE.md) - 30 min
2. [Data Flow](architecture/DATA_FLOW.md) - 20 min
3. [Module Dependencies](architecture/MODULE_DEPENDENCIES.md) - 20 min
4. [Architecture Summary](architecture/ARCHITECTURE_SUMMARY.md) - 15 min (recap)
5. [Implementation Guide](guides/IMPLEMENTATION_GUIDE.md) - 5 min (overview)

### Path 3: Workshop Prep (For Instructors)

**Goal:** Understand demo for teaching
**Time:** 30 minutes

1. [Architecture Summary](architecture/ARCHITECTURE_SUMMARY.md) - 15 min
2. [../prd.md](../prd.md) - Demo script - 10 min
3. [Implementation Guide - Testing Section](guides/IMPLEMENTATION_GUIDE.md#testing-the-demo) - 5 min

---

## Key Concepts

### Architectural Principles

1. **Offline-First**
   - No external dependencies
   - File-based storage
   - Works without network

2. **Deterministic Behavior**
   - Template-based NPC responses
   - Pattern matching (no AI randomness)
   - Predictable demo flow

3. **Pluggable Design**
   - Storage adapter interface
   - Can swap to ZeroDB later
   - Business logic remains unchanged

4. **Type Safety**
   - TypeScript throughout
   - Strict mode enabled
   - Compile-time error detection

5. **Event-Driven Gameplay**
   - Rules engine checks event counts
   - Triggers world events
   - Demonstrates emergent behavior

### Core Technologies

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3+
- **Storage:** File-based JSON (default), ZeroDB (future)
- **Runtime:** Node.js 18+

### Data Models

```typescript
Player → { id, username, class, level, xp }
NPC → { id, name, role, location }
NPCMemory → { id, npcId, playerId, memory, importance }
LoreEntry → { id, title, content, tags }
GameEvent → { id, playerId, type, description, timestamp }
WorldEvent → { id, name, description, timestamp }
```

---

## Implementation Checklist

### Pre-Implementation

- [ ] Read Architecture Summary (15 min)
- [ ] Review System Architecture (30 min)
- [ ] Understand Data Flow (20 min)
- [ ] Review Module Dependencies (20 min)
- [ ] Set up development environment (Node.js 18+)

### Phase 1: Foundation (30 min)

- [ ] Initialize Next.js project
- [ ] Create folder structure
- [ ] Configure TypeScript
- [ ] Define type system

### Phase 2: Storage Layer (45 min)

- [ ] Implement StorageAdapter interface
- [ ] Implement FileStorageAdapter
- [ ] Create seed data
- [ ] Test file operations

### Phase 3: Business Logic (60 min)

- [ ] Implement NPC response generator
- [ ] Implement game rules engine
- [ ] Implement lore search
- [ ] Test business logic

### Phase 4: API Routes (30 min)

- [ ] Implement player routes
- [ ] Implement NPC routes
- [ ] Implement event routes
- [ ] Implement world state route
- [ ] Test all endpoints

### Phase 5: UI Components (60 min)

- [ ] Create dashboard layout
- [ ] Implement PlayerPanel
- [ ] Implement NPCChatPanel
- [ ] Implement ActionsPanel
- [ ] Implement WorldEventsPanel
- [ ] Implement MemoryViewer
- [ ] Implement EventLog
- [ ] Style with Tailwind

### Phase 6: Testing & Polish (30 min)

- [ ] Manual demo flow testing
- [ ] Error handling verification
- [ ] Loading states
- [ ] Write README
- [ ] Document demo script

**Total Estimated Time:** ~4.5 hours

---

## Troubleshooting Guide

### Common Issues

**Issue:** npm install fails
**Solution:** Ensure Node.js 18+ installed, clear npm cache

**Issue:** Port 3000 already in use
**Solution:** `PORT=3001 npm run dev`

**Issue:** JSON file corruption
**Solution:** Delete `data/*.json`, restart server (auto-seeds)

**Issue:** TypeScript errors
**Solution:** Check tsconfig.json paths, run `npm run build`

---

## Contributing

### Adding New Documentation

1. Choose appropriate directory:
   - Architecture decisions → `docs/architecture/`
   - Implementation guides → `docs/guides/`

2. Follow naming convention:
   - Architecture: `UPPERCASE_WITH_UNDERSCORES.md`
   - Guides: `Title_Case_Guide.md`

3. Update this index (README.md)

4. Follow file placement rules per `.ainative/RULES.MD`

### Documentation Standards

- Use Markdown format
- Include table of contents for long docs
- Add diagrams using ASCII art or Mermaid
- Document decisions with rationale
- Update change log at bottom

---

## Related Project Files

| File | Purpose |
|------|---------|
| [../prd.md](../prd.md) | Product requirements & demo script |
| [../datamodel.md](../datamodel.md) | Database schema specification |
| [../buildprompt.md](../buildprompt.md) | Build instructions for Claude Code |
| [../CLAUDE.md](../CLAUDE.md) | Project-specific instructions |
| [../.ainative/RULES.MD](../.ainative/RULES.MD) | Global coding standards |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-12 | Initial architecture documentation | System Architect |

---

## Support

**Questions about architecture?**
- Review [Architecture Summary](architecture/ARCHITECTURE_SUMMARY.md) first
- Check [System Architecture](architecture/SYSTEM_ARCHITECTURE.md) for details

**Questions about implementation?**
- Follow [Implementation Guide](guides/IMPLEMENTATION_GUIDE.md)
- Check troubleshooting section for common issues

**Questions about demo flow?**
- See [prd.md](../prd.md) demo script
- Review [Data Flow](architecture/DATA_FLOW.md) for sequence diagrams

---

## License

See [../LICENSE](../LICENSE) for project license information.

---

**Documentation Status:** ✓ Complete
**Last Review:** 2026-03-12
**Next Review:** After implementation completion

---

**End of Documentation Index**
