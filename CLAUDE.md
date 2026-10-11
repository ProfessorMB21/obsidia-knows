# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
# Development
npm run dev          # Watch mode with inline sourcemaps
npm run build        # Production bundle (main.js, ~59KB)
npm test             # Run all tests (Jest, 22 tests across 5 suites)

# Verification
npx tsc --noEmit     # Type-check without emitting
npm test -- --verbose # Test with detailed output
```

## Architecture Overview

**ObsidiaKnows** is an Obsidian plugin that transforms documents into hierarchical knowledge graphs using Claude API (extensible to OpenRouter, OmniRoute, DeepSeek, GPT-4, etc.).

### Core Data Flow

```
User Input (text paste in modal)
    ↓
Input Validation (tokenCounter, inputHandler)
    ↓
Document Chunking (analysisEngine splits by tokens)
    ↓
LLM Analysis (provider sends chunks to Claude/alternative, receives JSON)
    ↓
Graph Generation (graphGenerator validates hierarchy, creates relationships)
    ↓
Markdown Output (outputFormatter with YAML frontmatter + wikilinks)
    ↓
Vault Integration (vaultIntegration creates folders and .md files)
```

### Directory Structure

```
src/
├── main.ts                          # Plugin entry point, command registration
├── types.ts                         # Central interface definitions (all modules depend on this)
├── settings.ts                      # Settings UI and storage
├── analysis/
│   ├── llmProvider.ts              # Abstract base class for LLM implementations
│   ├── claudeProvider.ts           # Claude API (primary provider)
│   ├── openrouterProvider.ts       # OpenRouter gateway
│   ├── omnirouteProvider.ts        # OmniRoute gateway (supports multiple models)
│   ├── deepseekProvider.ts         # DeepSeek provider
│   ├── analysisEngine.ts           # Orchestrates chunking + LLM calls + checkpointing
│   └── analysisPrompt.ts           # JSON prompt for LLM
├── graph/
│   └── graphGenerator.ts           # Converts LLM response into validated KnowledgeGraph
├── input/
│   └── inputHandler.ts             # Validation, tokenization, title extraction
├── output/
│   ├── outputFormatter.ts          # JSON→Markdown conversion
│   └── markdownGenerator.ts        # Node→markdown with YAML frontmatter
├── ui/
│   ├── createModal.ts              # Modal for document input + config selection
│   └── progressNotification.ts     # Progress/error/success toasts
├── vault/
│   └── vaultIntegration.ts         # File/folder creation in Obsidian vault
├── checkpoint/
│   └── checkpointManager.ts        # Save/load analysis progress per chunk
└── utils/
    ├── tokenCounter.ts             # ~4 chars/token estimation + chunking
    ├── idGenerator.ts              # Deterministic MD5 node IDs (title + type)
    └── logger.ts                   # Debug logging utility
```

### Type System

All modules depend on central types in `src/types.ts`:

**Node Structure:**
- `NodeType`: 'character' | 'event' | 'concept' | 'location' | 'timeline' | 'theme'
- `NodeDepth`: 'main' | 'major' | 'minor' (hierarchy)
- `KnowledgeNode`: Includes id, title, type, depth, summary, content (quotes/attributes), metadata
- `KnowledgeGraph`: Main node + major/minor nodes + relationships array

**Provider Interface:**
All LLM providers (Claude, OpenRouter, OmniRoute, etc.) implement:
```typescript
interface LLMProvider {
  name: string;
  isAvailable(): boolean;
  analyze(document: string, config: AnalysisConfig): Promise<AnalysisResult>;
}
```

**Settings:**
Stored in Obsidian plugin data folder (`.obsidian/plugins/obsidiknows/data.json`):
- `apiProvider`: 'claude' | 'openrouter' | 'omniroute' | 'deepseek' | 'gpt' | 'local'
- `[provider]ApiKey`: User's API key (encrypted local storage)
- `[provider]Model`: Model selection dropdown
- `defaultDepth`: 'quick' | 'deep'
- `defaultNodeTypes`: Array of NodeType
- `outputFolderTemplate`: Where to create knowledge graph folders
- `chunkSize`: Token limit per chunk (default 2000)
- `maxTokensPerRequest`: LLM max_tokens parameter (default 4000)
- `enableCheckpointing`: Save progress per chunk for resumption

## Multi-Provider LLM Architecture

The plugin supports multiple LLM providers through a pluggable design:

### Adding a New Provider

1. Create `src/analysis/[provider]Provider.ts` extending `BaseLLMProvider`
2. Implement `analyze(document, config)` returning `AnalysisResult`
3. Handle provider-specific API endpoints, headers, error codes
4. Add to provider dropdown in `src/settings.ts`
5. Add case in `src/main.ts` provider selection logic
6. Add API key field to settings UI (optional model dropdown)
7. Add type to `apiProvider` union in `src/types.ts`

### Current Providers

| Provider | Model | Status | Notes |
|----------|-------|--------|-------|
| Claude (Anthropic) | claude-3-5-sonnet-20241022 | ✅ Working | Primary; most capable |
| OpenRouter | anthropic/claude-3-5-sonnet | ⚠️ 403 error | API key restrictions |
| OmniRoute | Multiple (Claude, DeepSeek, GPT-4, Mistral, Llama, Gemini, GLM-5) | ✅ Working | Unified gateway; 14 models available |
| DeepSeek | deepseek-flash | ✅ Implemented | Provider added to dropdown |

## Key Non-Obvious Logic

### Token Chunking (`src/utils/tokenCounter.ts`)
- Estimates tokens at ~4 chars/token (heuristic; actual varies by LLM)
- `chunkDocumentByTokens()` splits documents by:
  1. Paragraphs (preserve semantic boundaries)
  2. Sentences (if paragraph > chunk size)
  3. Fixed size (worst case)
- Respects `config.chunkSize` limit; never exceeds `maxTokensPerRequest`

### Node ID Generation (`src/utils/idGenerator.ts`)
- **Deterministic**: MD5 hash of `title + type` (first 12 chars)
- Ensures same node extracted twice = same ID
- Allows graph merging in Phase 2
- Side effect: Renaming a node changes its ID (intentional for Phase 1)

### Graph Validation (`src/graph/graphGenerator.ts`)
- `validateGraphIntegrity()` checks:
  - Main node exists and has depth: 'main'
  - Major nodes array exists
  - All relationship source/target IDs exist
  - No duplicate node IDs
  - Hierarchy is consistent (no major→main edges)
- Throws error if validation fails; prevents malformed graphs

### Markdown Wikilinks (`src/output/markdownGenerator.ts`)
- Generated as `[[Node Title]]` format
- Obsidian auto-links if target note exists in vault
- Supports cross-graph linking if user renames nodes to match

### Checkpointing (`src/checkpoint/checkpointManager.ts`)
- After each chunk analyzed, saves `[graphId]-chunk-[index].json` to `.obsidian/plugins/obsidiknows/checkpoints/`
- On startup, `loadLatestCheckpoint()` can resume incomplete analyses
- Location: `.obsidian/plugins/obsidiknows/checkpoints/`
- Use case: Resume if Obsidian crashes mid-analysis

## Important Constraints

### TypeScript Version: PINNED to 4.9.5
- **Why**: ts-jest 29.4.14 compatibility
- **Do NOT upgrade**: TypeScript 5+ has breaking changes in compiler API; TypeScript 7+ completely broke ts-jest
- Check before any TypeScript update: `npm list typescript`
- If upgraded accidentally: `npm install typescript@4.9.5 --save-dev`

### Build Process
- **esbuild** bundles into single `main.js` (~59KB for Phase 1)
- **External deps**: Obsidian, electron, @codemirror/*, @lezer/*, builtin-modules (not bundled)
- **Format**: CommonJS (required by Obsidian)
- **Target**: ES6

### Test Framework
- **Jest** with **ts-jest** preset
- Tests live in `tests/unit/` and `tests/integration/`
- Each test file: `[module].test.ts`
- Run all: `npm test`
- Run one: `npm test -- inputHandler.test.ts`
- Coverage not required for Phase 1

## Common Tasks

### Add a New LLM Model to OmniRoute
1. Open `src/settings.ts`, find OmniRoute model dropdown (line ~172)
2. Add: `.addOption('model-id', 'Display Name')`
3. Update default in `src/types.ts` if needed
4. Rebuild: `npm run build`
5. Test in settings UI

### Add a New Node Type
1. Add to `NodeType` union in `src/types.ts`
2. Update LLM prompt in `src/analysis/analysisPrompt.ts` to include new type
3. Update settings UI toggle list in `src/settings.ts`
4. Rebuild: `npm run build`

### Debug a Failed Analysis
1. Enable verbose logging: Open browser DevTools (F12), check Console
2. Look for logs starting with `[AnalysisEngine]`, `[ClaudeProvider]`, etc.
3. Common issues:
   - Invalid API key: Check settings
   - Rate limit (429): Wait and retry
   - Malformed JSON response: Check LLM model supports JSON
   - Network timeout: Check internet connection

### Test with Real Claude API
```bash
export CLAUDE_API_KEY="sk-ant-..."
node test-claude-api.js
```

### Deploy to Test Vault
```bash
mkdir -p ~/.obsidian/plugins/obsidiknows
cp main.js manifest.json styles.css ~/.obsidian/plugins/obsidiknows/

# In Obsidian:
# Settings → Community Plugins → Manage → Enable "ObsidiaKnows"
```

## Test Suite Structure

```
tests/
├── unit/
│   ├── inputHandler.test.ts        # 3 tests: validation, tokenization, title extraction
│   ├── graphGenerator.test.ts      # 3 tests: hierarchy validation, duplicate detection, relationships
│   ├── outputFormatter.test.ts     # 3 tests: YAML frontmatter, wikilinks, metadata
│   └── tokenCounter.test.ts        # 3 tests: token estimation, chunking logic, edge cases
└── integration/
    └── endToEnd.test.ts            # 3 tests: full pipeline with mock LLM
```

All 22 tests passing as of 2026-10-10.

## Git Commit Guidelines

- **Do NOT include `Co-Authored-By:` lines** in commit messages
- **Do NOT commit phase/documentation files** (HANDOFF.md, BUILD_SUMMARY.md, DEPLOYMENT_REPORT.md, etc.) — keep as local reference only
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Example: `feat: add Claude Sonnet 4 model to OmniRoute dropdown`
- Keep messages concise and descriptive

## Known Limitations & TODOs

### Phase 1 (Current)
- ✅ Text paste input only (no file upload)
- ✅ Single LLM call per document (no multi-round refinement)
- ✅ Quick overview depth only (no deep analysis)
- ✅ Core node types: character, event, concept (others stubbed)
- ✅ Markdown output only (no canvas/visualization)
- ✅ Checkpointing for interruption recovery

### Phase 2 (Planned)
- [ ] File upload (.txt, .pdf, .docx)
- [ ] Deep dive analysis depth
- [ ] Canvas visualization with timeline
- [ ] Resume from checkpoint UI
- [ ] Remaining node types (location, timeline, theme)
- [ ] Rate limiting and token budget warnings
- [ ] Retry logic for failed API calls

### Phase 3 (Future)
- [ ] Vault note reference as input
- [ ] Advanced visualization (flowchart, reading order, combo)
- [ ] Graph merging and deduplication
- [ ] Local LLM support

## Debugging Tips

### TypeScript Errors During Development
```bash
npx tsc --noEmit --strict    # Full type check
npm run build                 # Will catch esbuild issues
```

### Jest Tests Fail
```bash
# Clear cache and retry
npm test -- --clearCache
npm test -- --verbose        # More detailed output

# Check TypeScript in test files
npx tsc tests/**/*.ts --noEmit
```

### Plugin Not Loading in Obsidian
1. Verify manifest.json has valid `id: "obsidiknows"`
2. Check `minAppVersion: "1.0.0"` is set
3. Verify main.js exists and is > 50KB
4. Restart Obsidian (restart also clears plugin cache)
5. Check browser console for errors (F12)

### API Calls Failing with 403
- Verify API key is valid and has active credits
- Check provider doesn't have IP whitelist restrictions
- Try different provider (OpenRouter, OmniRoute, or direct Claude)
- Ensure no proxy/firewall blocking HTTPS requests

## Integration Test Files

Created during Phase 1 validation (not part of main plugin):

- `test-sandbox.js` - Mock provider integration test
- `test-claude-api.js` - Real Claude API test harness
- `test-integration.js` - Comprehensive workflow validation
- `integration-test-results.json` - Test output
- `DEPLOYMENT_REPORT.md` - Full test summary

These can be deleted if not needed for future development.

## Resources

- **Obsidian Plugin API**: https://docs.obsidian.md/Plugins/Getting+started/Build+a+sample+plugin
- **Claude API**: https://docs.anthropic.com/en/api/getting-started
- **OpenRouter**: https://openrouter.ai/docs
- **OmniRoute**: https://omniroute.ai (unified LLM gateway)
- **esbuild**: https://esbuild.github.io/
- **Jest**: https://jestjs.io/docs/getting-started
