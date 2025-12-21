# OpenCode-Mem: AI Development Instructions

## What This Project Is

OpenCode-mem is a fork of [claude-mem](https://github.com/thedotmack/claude-mem) being converted to work with [OpenCode](https://opencode.ai) instead of Claude Code. It provides persistent memory across sessions by capturing tool usage, compressing observations using the Claude Agent SDK, and injecting relevant context into future sessions.

**Status**: Work in progress. See `CONVERSION_PLAN.md` for migration details.

## Architecture

**OpenCode Plugin** (`src/index.ts`) - Main entry point with lifecycle handlers:
- `event: session.created/idle/deleted` - Session lifecycle
- `chat.message` - Context injection on first message  
- `tool.execute.after` - Observation capture

**Worker Service** (`src/services/worker-service.ts`) - Express API on port 37777, Bun-managed, handles AI processing asynchronously (unchanged from claude-mem)

**Database** (`src/services/sqlite/`) - SQLite3 at `~/.claude-mem/claude-mem.db` with FTS5 full-text search

**Chroma** (`src/services/sync/ChromaSync.ts`) - Vector embeddings for semantic search

**Viewer UI** (`src/ui/viewer/`) - React interface at http://localhost:37777

## Conversion Progress

- [x] Phase 0: Project setup (rename, remove Claude Code hooks)
- [ ] Phase 1: Core infrastructure (MemClient HTTP client)
- [ ] Phase 2: Hook conversion (OpenCode handlers)
- [ ] Phase 3: Tools integration (mem_search, mem_timeline)
- [ ] Phase 4: Testing and polish

## Build Commands

```bash
npm run build              # Build the plugin
npm run worker:start       # Start worker service
npm run worker:logs        # View worker logs
npm test                   # Run tests
```

## Configuration

Settings in `~/.config/opencode/opencode-mem.json` or `~/.opencode-mem/settings.json`:

```json
{
  "workerUrl": "http://127.0.0.1:37777",
  "contextMaxObservations": 50,
  "enabled": true
}
```

## File Locations

- **Source**: `<project-root>/src/`
- **Plugin Entry**: `src/index.ts`
- **Config Schema**: `src/config/schema.ts`
- **Database**: `~/.claude-mem/claude-mem.db`
- **Chroma**: `~/.claude-mem/chroma/`

## Requirements

- **Node.js**: 18+
- **Bun**: Auto-installed if missing
- **uv**: Auto-installed if missing (for Chroma)

## Credits

- Original [claude-mem](https://github.com/thedotmack/claude-mem) by Alex Newman (@thedotmack)
- OpenCode adaptation by Trevor Walker (@rynfar)
