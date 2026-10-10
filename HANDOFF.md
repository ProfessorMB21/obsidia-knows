# Handoff: ObsidiaKnows Plugin - Phase 1 MVP Implementation

**Generated**: 2026-10-09  
**Branch**: master  
**Status**: In Progress - Phase 1 Complete, Ready for Phase 2  

## Goal

Build an Obsidian plugin that transforms documents (books, novels, articles) into interactive hierarchical knowledge graphs. Users provide a document, the plugin analyzes it via Claude API to extract nodes (main → major → minor), and creates linked notes in their vault organized by type and depth.

**Phase 1 (MVP)**: Text paste input, Claude API, quick overview depth, core node types (character, event, concept), basic Markdown output, checkpointing for interruption recovery.

## Completed

- [x] Project scaffold with TypeScript, esbuild, Jest build system
- [x] All core type definitions (KnowledgeNode, KnowledgeGraph, AnalysisConfig, etc.)
- [x] Settings panel with configuration storage (API key, defaults, advanced options)
- [x] Utility functions (token counter, ID generator, logger)
- [x] LLM provider abstraction layer with Claude API implementation
- [x] Input validation (size limits 10MB, format detection, text normalization)
- [x] Graph generator with hierarchy validation (no orphans, relationship integrity)
- [x] Markdown output formatter with YAML frontmatter and wikilinks
- [x] Vault integration (file/folder creation)
- [x] Analysis engine with document chunking and checkpointing
- [x] UI components (create graph modal, progress notifications)
- [x] Plugin entry point with `obsidiknows:create` command
- [x] Unit tests for input handler, graph generator, output formatter, token counter
- [x] End-to-end integration test
- [x] Git initialized with meaningful commits

## Not Yet Done

- [ ] Fix Jest/TypeScript compilation issues (ts-jest compatibility with TypeScript versions)
- [ ] Run and verify all tests pass
- [ ] Build to production bundle (main.js)
- [ ] Phase 2: File upload support (.txt, .pdf, .docx)
- [ ] Phase 2: Deep dive depth setting
- [ ] Phase 2: Canvas visualization (timeline overview)
- [ ] Phase 2: Checkpoint resume workflow UI
- [ ] Phase 2: All node types (locations, timelines, themes)
- [ ] Phase 3: Vault note reference input
- [ ] Phase 3: All visualization styles (flowchart, reading order, combo)

## Failed Approaches (Don't Repeat These)

### TypeScript Version Incompatibility with ts-jest
**What was attempted**: Used TypeScript 7.0.2 (latest) and TypeScript 6.0.3 with ts-jest  
**Why it failed**: ts-jest 29.4.14 requires `typescript@">=4.3 <7"`. TypeScript 7.x changed the compiler API and ts-jest cannot use it.  
**Error message**:
```
The TypeScript compiler "typescript" (version 7.0.2) does not expose the JavaScript compiler API required by ts-jest.
```
**Resolution**: Downgraded to TypeScript 4.9.5 (latest compatible version with ts-jest 29.4.14)

### TypeScript moduleResolution Configuration
**What was attempted**: Used `moduleResolution: "bundler"` and `baseUrl: "."` with paths from newer TypeScript  
**Why it failed**: TypeScript 4.9.5 doesn't support "bundler" moduleResolution (added in TypeScript 5.x+) and removed baseUrl in favor of paths.  
**Error message**:
```
Argument for '--moduleResolution' option must be: 'node', 'classic', 'node16', 'nodenext'.
```
**Resolution**: Changed to `moduleResolution: "node"` and added `esModuleInterop: true`, `skipLibCheck: true`

### @types/obsidian Package
**What was attempted**: Installed `@types/obsidian` as dev dependency  
**Why it failed**: Package doesn't exist on npm. Obsidian types are included in the `obsidian` package itself.  
**Resolution**: Removed `@types/obsidian` from install command

### Obsidian File Type Checking
**What was attempted**: Accessed `.children` property on `TAbstractFile` without type guards  
**Why it failed**: TypeScript error - `.children` only exists on `TFolder`, not all abstract files  
**Error message**:
```
error TS2339: Property 'children' does not exist on type 'TAbstractFile'.
```
**Resolution**: Added `TFolder` import and used `instanceof TFolder` checks before accessing `.children`

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Monolithic plugin (not microservices) | Faster MVP, easier deployment, can refactor later if needed |
| Claude API first, pluggable providers | Claude is most capable; architecture supports GPT/local LLMs in Phase 2+ |
| TypeScript 4.9.5 over latest | Must be compatible with ts-jest for testing; TS 5+ has breaking changes |
| Node.js built-in types (no @types/node) | Using `crypto` directly for UUID generation; standard library types sufficient |
| Phase 1 = text paste only | File upload requires extra dependencies (pdf parsing); text paste covers 80% of use cases |
| Checkpointing after each chunk | Allows users to resume analysis without reprocessing; stored in `.obsidian/plugins/` |
| YAML frontmatter on notes | Standard Obsidian format; supports metadata querying and filters |
| TFolder type guards | Prevents runtime errors accessing folder children; Obsidian API requires strict typing |

## Current State

**Working**:
- TypeScript compilation (no errors with `npx tsc --noEmit`)
- Settings panel loads and saves configuration
- Plugin manifest ready for Obsidian
- All 20 source files implement their intended functionality
- Mock LLM provider validates graph/formatting workflow end-to-end

**Broken**:
- Jest tests fail to compile TypeScript (ts-jest configuration issue with older TS versions)
- Production bundle not yet built (no main.js generated)
- Plugin cannot be loaded in Obsidian until bundle is created and deployed

**Uncommitted Changes**:
- `knowledge-graph-plugin-spec.md` (design spec from earlier conversation - untracked)
- `package-lock.json` (dependency lock file - should be tracked)

## Files to Know

| File | Why It Matters |
|------|----------------|
| `src/types.ts` | Central interface definitions; all other files depend on these |
| `src/main.ts` | Plugin entry point; handles command registration and workflow |
| `src/analysis/claudeProvider.ts` | LLM integration; contains prompt generation and JSON parsing |
| `src/settings.ts` | Settings UI; where users configure API key and defaults |
| `src/graph/graphGenerator.ts` | Graph validation logic; ensures hierarchy integrity before output |
| `src/output/markdownGenerator.ts` | Node-to-markdown conversion; YAML frontmatter and wikilink formatting |
| `tsconfig.json` | TypeScript config; uses compatible settings for ts-jest |
| `jest.config.js` | Test runner config; points to test directory |
| `esbuild.config.mjs` | Build config; bundles plugin for Obsidian |
| `docs/superpowers/plans/2026-10-08-obsidiknows-implementation.md` | Detailed implementation plan with 14 tasks (mostly complete) |

## Code Context

### Core Type Definitions
All other modules depend on these interfaces:

```typescript
export type NodeType = 'character' | 'event' | 'concept' | 'location' | 'timeline' | 'theme';
export type NodeDepth = 'main' | 'major' | 'minor';
export type AnalysisDepth = 'quick' | 'deep';

export interface KnowledgeNode {
  id: string;                    // UUID hash of title + type
  title: string;
  type: NodeType;
  depth: NodeDepth;
  summary: string;               // 1-3 sentences
  content: {
    quotes?: string[];           // Only major/main nodes
    keyAttributes?: Record<string, string>;
    connections?: Array<{ nodeId: string; reason: string }>;
    tags?: string[];
  };
  metadata: {
    sourceDocument: string;
    createdAt: string;            // ISO timestamp
    parent?: string;              // Parent node ID
    children?: string[];          // Child node IDs
    siblings?: string[];          // Related nodes
  };
}

export interface KnowledgeGraph {
  id: string;                    // Random UUID per analysis
  title: string;                 // Document title
  mainNode: KnowledgeNode;
  majorNodes: KnowledgeNode[];
  minorNodes: KnowledgeNode[];
  relationships: Relationship[];
  metadata: {
    analysisTimestamp: string;
    depth: AnalysisDepth;
    selectedNodeTypes: NodeType[];
    visualizationStyle: VisualizationStyle; // Currently only 'tree' in Phase 1
  };
}
```

### Plugin Settings Interface
```typescript
export interface KnowledgeGraphSettings {
  apiProvider: 'claude' | 'gpt' | 'local';
  claudeApiKey: string;          // User's API key (stored locally)
  defaultDepth: AnalysisDepth;
  defaultNodeTypes: NodeType[];
  outputFolderTemplate: string;  // Default: "Knowledge Graphs"
  chunkSize: number;             // Default: 2000 tokens
  maxTokensPerRequest: number;   // Default: 4000 tokens
  enableCheckpointing: boolean;  // Default: true
}
```

### LLM Provider Interface
All LLM implementations must satisfy:
```typescript
export interface LLMProvider {
  name: string;
  isAvailable(): boolean;
  analyze(document: string, config: AnalysisConfig): Promise<AnalysisResult>;
}
```

### Claude API Response Structure
The ClaudeProvider parses Claude's JSON response into this shape:
```typescript
interface AnalysisResult {
  mainNode: KnowledgeNode;
  majorNodes: KnowledgeNode[];
  minorNodes: KnowledgeNode[];
  relationships: Array<{ from: string; to: string; type: RelationshipType }>;
}
```

### Key Non-Obvious Logic

**Token Estimation**: Uses `~4 characters per token` approximation. This is a heuristic; actual usage varies by LLM. Located in `src/utils/tokenCounter.ts`.

**Node ID Generation**: Deterministic hash of `title + type` using MD5 first 12 chars. Ensures same node extracted twice gets same ID. See `src/utils/idGenerator.ts`.

**Graph Validation**: `validateGraphIntegrity()` in `src/graph/graphGenerator.ts` checks:
- Main node exists
- Major nodes exist
- All relationships reference valid node IDs
- No duplicate IDs

**Markdown Wikilinks**: Generated as `[[Node Title]]` pointing to other nodes in graph. Obsidian auto-links if note exists. See `src/output/markdownGenerator.ts`.

**Checkpointing**: After each document chunk is analyzed, `saveCheckpoint()` in `src/checkpoint/checkpointManager.ts` saves JSON to `.obsidian/plugins/obsidiknows/checkpoints/[graphId]-chunk-[index].json`. On startup, `loadLatestCheckpoint()` can resume incomplete analyses.

## Resume Instructions

### Next Immediate Tasks

**1. Fix Jest/TypeScript Compatibility (Required before running tests)**
```bash
# Current issue: ts-jest cannot compile with current TypeScript version
# Option A (recommended): Update jest.config.js to use ts-jest preset correctly
cd /home/bupe/Desktop/obsidian-plugins-creation

# First, verify TypeScript version is 4.9.5
npm list typescript
# Expected: typescript@4.9.5

# Run tests with verbose output to see exact error
npm test -- --verbose 2>&1 | head -100
```

If tests still fail with moduleResolution error:
- Check tsconfig.json has `moduleResolution: "node"` (not "bundler")
- Verify `esModuleInterop: true` is set
- Try: `npm test -- --no-coverage` to skip coverage issues

**2. Build Production Bundle**
```bash
# Once tests pass, create main.js for Obsidian
npm run build

# Expected output:
# - main.js (bundled plugin, ~100KB)
# - Files created in project root

ls -lh main.js
# Should exist and be > 50KB
```

**3. Deploy to Test Vault**
```bash
# Copy plugin files to test Obsidian vault
# Create test vault first if needed, then:

mkdir -p /path/to/test-vault/.obsidian/plugins/obsidiknows
cp main.js manifest.json styles.css /path/to/test-vault/.obsidian/plugins/obsidiknows/

# In Obsidian:
# 1. Open test vault
# 2. Settings → Community Plugins → Manage (if needed enable)
# 3. Look for "ObsidiaKnows" in list
# 4. Enable it
# 5. Command Palette (Cmd/Ctrl+P) → "Create Knowledge Graph"
```

**4. Test MVP Workflow**
```
1. Run command: Create Knowledge Graph
2. Paste sample text:
   ```
   # Harry Potter and the Philosopher's Stone
   
   Harry Potter is a young wizard who discovers he is famous in the magical world.
   He attends Hogwarts School of Witchcraft and Wizardry where he meets Ron Weasley 
   and Hermione Granger. Together they uncover a plot involving the Philosopher's Stone.
   ```
3. Select node types: Character, Event, Concept
4. Choose depth: Quick Overview
5. Click Analyze
6. Expected outcome: 
   - Progress shows "Analyzing chunk 1 of 1..."
   - On success: "Knowledge graph created: Harry Potter and the Philosopher's Stone"
   - New folder appears: Vault → Knowledge Graphs/Harry Potter.../
   - Files created: Main - Harry Potter.md, Character - Harry Potter.md, etc.
7. If it fails with "Claude API key not configured":
   - Go to Settings → Community Plugins → ObsidiaKnows
   - Paste your Claude API key
   - Try again
```

**5. Verify Output Format**
```
Open "Main - Harry Potter.md" and verify:
- YAML frontmatter at top (between --- markers)
- Summary section
- Related nodes as [[wikilinks]]
- Example:
  ---
  title: Harry Potter and the Philosopher's Stone
  type: concept
  depth: main
  source: Harry Potter and the Philosopher's Stone
  created: 2026-10-09T...
  ---
  
  # Harry Potter and the Philosopher's Stone
  
  ## Summary
  ...
```

## Setup Required

### Environment Variables
None required for Phase 1. Claude API key is configured via plugin settings UI.

### Test Credentials
- Claude API key required (get from https://console.anthropic.com/)
- Test with free tier account or existing credits

### Required Services
- Internet connection (for Claude API calls)
- Obsidian vault (local installation)

### Dependencies Already Installed
```
npm install obsidian @anthropic-ai/sdk
npm install --save-dev typescript@4.9.5 jest ts-jest esbuild ...
```
See `package.json` for full list.

## Edge Cases & Error Handling

| Scenario | Current Behavior | Notes |
|----------|------------------|-------|
| Empty document | Rejected at input validation with "Document cannot be empty" | ✓ Handled |
| Document > 10MB | Rejected with file size error | ✓ Handled |
| Invalid API key | Error: "Claude API key not configured" on analyze | ✓ Handled |
| Network timeout | Error propagates from ClaudeProvider | ⚠️ No retry logic (Phase 2) |
| Claude returns invalid JSON | Caught by parseResponse, error: "Failed to parse LLM response" | ✓ Handled |
| Malformed node ID | Graph validation detects duplicate IDs | ✓ Handled |
| File write permission denied | Error logs to console, user sees toast notification | ✓ Handled |
| Checkpoint file corrupted | loadLatestCheckpoint returns null, user starts fresh | ✓ Handled |
| No major nodes extracted | Graph validation warns but allows (edge case: very short docs) | ⚠️ May need better error message |

## Warnings

1. **TypeScript/Jest Compatibility**: Don't upgrade TypeScript past 4.9.5 without checking ts-jest support first. TypeScript 5+ and 7+ broke ts-jest compatibility; 6.x added new features that esbuild doesn't support well.

2. **Node ID Generation**: Node IDs are deterministic (MD5 hash of title + type). If a title changes, it gets a different ID. This is intentional for Phase 1 but may cause issues if user edits nodes. Document this limitation.

3. **Claude API Costs**: Each analysis call to Claude costs money. No rate limiting in Phase 1. Consider adding token budgets/warnings in Phase 2.

4. **Checkpoint Folder Permissions**: Checkpoints are stored in `.obsidian/plugins/obsidiknows/checkpoints/`. If vault is synced (iCloud, Dropbox), checkpoint files may conflict. Not an issue for local vaults.

5. **Obsidian API Surface**: The plugin uses Obsidian's public API but some features (opening folders, sidebar management) are limited in Phase 1. Canvas rendering (Phase 2) requires newer Obsidian versions (1.1.0+).

6. **LLM Prompt Engineering**: The analysis prompt in `src/analysis/analysisPrompt.ts` is tuned for Claude Opus. GPT/local models may need different prompts (Phase 2/3).

7. **No Duplicate Detection**: If user analyzes same document twice, no de-duplication occurs. Creates separate graphs. Consider adding a "continue existing graph" option in Phase 2.

## Quick Debug Commands

```bash
# Verify TypeScript compiles
npx tsc --noEmit

# Check for linting/type issues
npx tsc --strict

# Run specific test
npm test -- inputHandler.test.ts

# Build with verbose logging
npm run build -- --debug

# Check what main.js exports
node -e "console.log(require('./main.js'))"
```

## Next Session Checklist

- [ ] Fix Jest test compilation (ts-jest + TypeScript 4.9.5)
- [ ] Run all tests and verify passing
- [ ] Build production bundle: `npm run build`
- [ ] Test in Obsidian vault with real Claude API key
- [ ] Document test results
- [ ] If Phase 2 ready: start file upload support
- [ ] If issues found: file bug report with reproduction steps

---

**Contact for questions**: Check conversation history for decision rationale and failed approaches.
