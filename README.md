# opencode-mem

Persistent memory plugin for [OpenCode](https://opencode.ai) - preserve context across sessions.

> Fork of [claude-mem](https://github.com/thedotmack/claude-mem) by Alex Newman, adapted for OpenCode.

## Status

**Work in Progress** - This plugin is being converted from Claude Code to OpenCode. See [CONVERSION_PLAN.md](CONVERSION_PLAN.md) for details.

### Progress

- [x] Phase 0: Project setup and renaming
- [ ] Phase 1: Core infrastructure (MemClient HTTP client)
- [ ] Phase 2: Hook conversion (session, message, tool handlers)
- [ ] Phase 3: Tools integration (mem_search, mem_timeline)
- [ ] Phase 4: Testing and polish

## What It Does

opencode-mem seamlessly preserves context across sessions by:

- Automatically capturing tool usage observations
- Generating semantic summaries via Claude Agent SDK
- Injecting relevant context into future sessions
- Providing search tools to query your project history

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Worker Service (unchanged)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ SQLite+FTS5 │  │ Chroma Vec  │  │ SDK Agent (extraction)  │  │
│  │   Database  │  │   Search    │  │ + prompts.ts            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                         ↑                                       │
│              HTTP API (localhost:37777)                         │
└─────────────────────────────────────────────────────────────────┘
                           ↑
┌─────────────────────────────────────────────────────────────────┐
│                    OpenCode Plugin (new)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  src/index.ts                                           │    │
│  │  • event handler (session.created/idle/deleted)         │    │
│  │  • chat.message handler (inject context)                │    │
│  │  • tool.execute.after handler (capture observations)    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Installation (Coming Soon)

Once complete, installation will be:

```bash
# Install the plugin
opencode plugin add opencode-mem

# Start the worker service
npm run worker:start
```

## Development

```bash
# Clone the repository
git clone https://github.com/rynfar/opencode-mem.git
cd opencode-mem

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Start worker service
npm run worker:start

# View worker logs
npm run worker:logs
```

## Configuration

Settings are stored in `~/.config/opencode/opencode-mem.json` or `~/.opencode-mem/settings.json`:

```json
{
  "workerUrl": "http://127.0.0.1:37777",
  "contextMaxObservations": 50,
  "enabled": true,
  "debug": false
}
```

## Original claude-mem Features

The worker service retains all features from claude-mem:

- **SQLite + FTS5** - Full-text search across observations
- **Chroma Vector DB** - Semantic search for intelligent retrieval
- **Claude Agent SDK** - AI-powered observation extraction
- **Web Viewer UI** - Real-time memory stream at http://localhost:37777
- **Privacy Tags** - `<private>` tags exclude sensitive content

## License

AGPL-3.0 - Same as the original claude-mem.

## Credits

- Original [claude-mem](https://github.com/thedotmack/claude-mem) by Alex Newman (@thedotmack)
- OpenCode adaptation by Trevor Walker (@rynfar)
