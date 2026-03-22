# AI Native Studio - Core Backend

## Quick Reference

| Item | Value |
|------|-------|
| **Backend URL** | `ainative-browser-builder.up.railway.app` |
| **API Gateway** | `api.ainative.studio:8000` (Kong) |
| **Database** | Port 6432 (PgBouncer), NOT 5432 |
| **DB Pool** | 20 connections per instance |
| **Framework** | FastAPI + SQLAlchemy |
| **Main Branch** | `main` |

---

## Mandatory Rules

### 1. No AI Attribution (Zero Tolerance)
**NEVER include in commits/PRs/code:**
- "Claude", "Anthropic", "Generated with", "Co-Authored-By: Claude"
- Any AI tool attribution

**Correct commit format:**
```
Add feature description

- Implementation detail
- Implementation detail

Refs #123
```

### 2. File Placement
| Type | Location |
|------|----------|
| Documentation | `docs/{category}/` |
| Scripts | `scripts/` |
| Root `.md` allowed | Only `README.md`, `CLAUDE.md` |

### 3. GitHub Issue Tracking
- **Every PR must link to an issue**
- **MANDATORY: Assign issue to yourself BEFORE starting work**
  ```bash
  gh issue edit <issue-number> --add-assignee $(gh api user --jq '.login')
  ```
- Branch: `[type]/[issue-number]-[slug]`
- Commits: `Refs #123` or `Closes #123`
- Types: `[BUG]`, `[FEATURE]`, `[TEST]`, `[REFACTOR]`, `[DOCS]`, `[DEVOPS]`

### 4. TDD Required
```bash
cd src/backend
python3 -m pytest tests/test_file.py -v --cov=app.module --cov-report=term-missing
```
- Tests MUST pass before commits
- Coverage >= 80%
- Never claim "tests passing" without actual output

### 5. PR Format
```
[TYPE] Brief description - Fixes #123

## Summary
## Test Plan
## Risk/Rollback

Closes #123
```

### 6. Security
- Never log secrets/PII
- Validate all inputs
- No credentials in code or tests

### 7. Agents Run in Foreground
Never use `run_in_background: true` with Task tool.

---

## Railway Configuration

### Backend Service: "AINative- Core -Production"
- Public: `https://ainative-browser-builder.up.railway.app`
- Internal: `cody.railway.internal:8080` (DNS fails from Kong)

### Kong Gateway
- URL: `api.ainative.studio:8000`
- Upstream: `https://ainative-browser-builder.up.railway.app:443`
- **Kong CANNOT access Railway private network DNS** - always use public URL

### Database
- **Use PgBouncer port 6432** (not 5432)
- Pool: 10 base + 10 overflow = 20 per instance
- Check pool before queries: `python3 scripts/check_db_connection_pool.py`

### Schema Sync
- Auto-runs on Railway deploy via `scripts/sync-production-schema.py`
- Never run `alembic upgrade head` in production

---

## Quick Commands

```bash
# Health check
curl -s https://ainative-browser-builder.up.railway.app/health

# Check Kong
curl -I https://api.ainative.studio/health | grep -i kong

# Logs
railway logs --service "AINative- Core -Production" | tail -50

# DB pool status
python3 scripts/check_db_connection_pool.py

# Run tests
cd src/backend && python3 -m pytest tests/ -v --cov=app
```

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| 502/503 from Kong | Backend down | Check backend health first |
| DNS resolution failed | Using internal hostname | Use public URL for Kong upstream |
| QueuePool limit reached | DB connections exhausted | Kill dev servers, wait 30s |
| 404 from Kong | Routes not loaded | Check kong.yml config |

**Full troubleshooting guide:** `docs/deployment/RAILWAY_TROUBLESHOOTING.md`

---

## Key Files

- `src/backend/app/main.py` - FastAPI app
- `src/backend/app/db/session.py` - DB connection
- `kong/config/kong.yml` - Kong routes
- `scripts/sync-production-schema.py` - Schema sync
- `scripts/check_db_connection_pool.py` - Pool checker

---

## Extended Documentation

| Topic | Location |
|-------|----------|
| Railway/Kong troubleshooting | `docs/deployment/RAILWAY_TROUBLESHOOTING.md` |
| Kong deployment guide | `docs/deployment/KONG_DEPLOYMENT_GUIDE.md` |
| FastAPI trailing slash (Issue #473) | `docs/issues/ISSUE_473_ROUTE_ORDERING_FIX.md` |
| Issue tracking rules | `.claude/ISSUE_TRACKING_ENFORCEMENT.md` |
| File placement rules | `.claude/CRITICAL_FILE_PLACEMENT_RULES.md` |
| SDK publishing | `.claude/SDK_PUBLISHING_GUIDELINES.md` |
| Git rules | `.claude/git-rules.md` |
| Database query best practices | `.claude/skills/database-query-best-practices.md` |
| Database schema sync | `.claude/skills/database-schema-sync.md` |
| Database testing standards | `docs/database/DATABASE_TESTING_STANDARDS.md` |
| Memory API architecture | `docs/architecture/MEMORY_EMBEDDING_STORAGE.md` |

## Developer Documentation (Issue #1015)

| Topic | Location | Purpose |
|-------|----------|---------|
| API Reference | `docs/api/API_REFERENCE.md` | Complete API endpoint documentation |
| ZeroDB File Storage | `docs/api/ZERODB_FILE_STORAGE_GUIDE.md` | S3-compatible object storage API guide |
| Quick Start Guide | `docs/guides/QUICK_START.md` | 15-minute onboarding for new developers |
| Authentication Guide | `docs/guides/AUTHENTICATION.md` | JWT tokens, API keys, OAuth2 flows |
| Troubleshooting Guide | `docs/guides/TROUBLESHOOTING.md` | Common issues and solutions |
| Memory API Developer Guide | `docs/guides/MEMORY_API_DEVELOPER_GUIDE.md` | Working with embedding storage, JSON serialization patterns |
| Code Examples | `docs/examples/` | Working code examples for common use cases |

**Documentation Standards:**
- All API endpoints must be documented with request/response examples
- Authentication methods must include code samples in Python and JavaScript
- Error codes must be documented with causes and solutions
- Examples must be tested and include issue references (Refs #1015)
- Keep documentation synchronized with actual API implementation

## Related Projects

| Project | Location | Purpose |
|---------|----------|---------|
| Frontend Website | `AINative-website/` | React/Vite SPA (has own CLAUDE.md) |
| Kong Config | `kong/config/kong.yml` | API Gateway routes |
- 1217 should be closed, that issues is not related to this codebase anymore, it has it own repo. 1186,then deploy to railway.