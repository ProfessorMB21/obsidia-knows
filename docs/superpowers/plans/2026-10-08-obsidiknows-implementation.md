# ObsidiaKnows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Obsidian plugin that transforms documents into hierarchical knowledge graphs via Claude API, generating linked notes organized by type and depth.

**Architecture:** Monolithic TypeScript plugin with pluggable LLM provider layer, document input handler, analysis engine with checkpointing, graph generator for hierarchy validation, and output formatter for Markdown notes and Canvas visualizations. Phase 1 focuses on MVP: text paste input, Claude API, quick overview depth, core node types (characters, events, concepts).

**Tech Stack:** TypeScript, Obsidian Plugin API, Anthropic SDK (`@anthropic-ai/sdk`), Node.js (bundled), Jest for testing.

**Spec:** `docs/superpowers/specs/2026-10-08-obsidiknows-design.md`

## Global Constraints

- **Plugin ID:** `obsidiknows` (used in commands, folders, settings)
- **Commands:** `obsidiknows:create`, `obsidiknows:open-latest`, `obsidiknows:regenerate` (Phase 2+)
- **Min API Version:** Obsidian 1.0.0
- **Node Version:** 16.x or higher
- **Output folder:** `Knowledge Graphs/[Document Title]/` inside vault
- **Checkpoint folder:** `.obsidian/plugins/obsidiknows/checkpoints/`
- **Max document size:** 10MB (enforced at input validation)
- **Default chunk size:** 2000 tokens
- **Default max tokens per request:** 4000
- **Node types (Phase 1):** character, event, concept (others in Phase 2+)
- **Depth (Phase 1):** quick (deep in Phase 2+)
- **Visualization (Phase 1):** none (Canvas in Phase 2+)
- **All errors must be user-facing, actionable, not technical codes**

---

## File Structure

### New Files to Create

```
obsidiknows/
├── src/
│   ├── main.ts                         // Plugin entry, command registration
│   ├── types.ts                        // TypeScript interfaces (KnowledgeNode, KnowledgeGraph, etc.)
│   ├── settings.ts                     // Settings panel definition and storage
│   ├── input/
│   │   └── inputHandler.ts            // Document input validation and normalization
│   ├── analysis/
│   │   ├── analysisEngine.ts          // Document chunking, LLM orchestration
│   │   ├── llmProvider.ts             // Abstract LLM provider interface
│   │   ├── claudeProvider.ts          // Claude API implementation
│   │   └── analysisPrompt.ts          // Prompt generation for LLM
│   ├── graph/
│   │   └── graphGenerator.ts          // Node hierarchy, relationship mapping
│   ├── output/
│   │   ├── outputFormatter.ts         // Markdown + Canvas generation
│   │   └── markdownGenerator.ts       // Markdown node rendering
│   ├── vault/
│   │   └── vaultIntegration.ts        // File creation, folder management
│   ├── checkpoint/
│   │   └── checkpointManager.ts       // Save/load/resume logic
│   ├── ui/
│   │   ├── createModal.ts             // Analysis modal UI
│   │   └── progressNotification.ts    // Progress and error UI
│   ├── utils/
│   │   ├── idGenerator.ts             // UUID/hash generation for node IDs
│   │   ├── tokenCounter.ts            // Approximate token counting
│   │   └── logger.ts                  // Console logging with prefix
│   └── manifest.json                  // Plugin manifest
├── tests/
│   ├── unit/
│   │   ├── inputHandler.test.ts
│   │   ├── graphGenerator.test.ts
│   │   ├── outputFormatter.test.ts
│   │   ├── claudeProvider.test.ts
│   │   ├── tokenCounter.test.ts
│   │   └── checkpointManager.test.ts
│   └── integration/
│       └── endToEnd.test.ts
├── esbuild.config.mjs                 // Build configuration
├── tsconfig.json                       // TypeScript configuration
├── jest.config.js                      // Jest testing configuration
├── package.json                        // Dependencies and scripts
└── README.md                           // Development setup guide
```

### Key Dependencies

```json
{
  "dependencies": {
    "obsidian": "^1.4.0",
    "@anthropic-ai/sdk": "^0.20.0"
  },
  "devDependencies": {
    "@types/node": "^16.0.0",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0",
    "esbuild": "^0.19.0",
    "tslib": "2.4.0"
  }
}
```

---

## Phase 1: MVP Implementation

### Task 1: Project Setup & Plugin Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `jest.config.js`
- Create: `esbuild.config.mjs`
- Create: `src/manifest.json`
- Create: `README.md` (dev setup)

**Interfaces:**
- Produces: Build system ready for TypeScript compilation and bundling

- [ ] **Step 1: Initialize npm project and install dependencies**

Run in obsidiknows directory:
```bash
cd /home/bupe/Desktop/obsidian-plugins-creation
npm init -y
npm install obsidian @anthropic-ai/sdk
npm install --save-dev typescript @types/node @types/jest jest ts-jest esbuild tslib @types/obsidian
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES6",
    "allowJs": true,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "isolatedModules": true,
    "lib": ["DOM", "ES5", "ES6", "ES7"]
  },
  "include": ["**/*.ts"]
}
```

- [ ] **Step 3: Create jest.config.js**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
};
```

- [ ] **Step 4: Create esbuild.config.mjs**

```javascript
import esbuild from 'esbuild';
import process from 'process';
import builtinModules from 'builtin-modules';

const banner =
`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = (process.argv[2] === 'production');
const context = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtinModules],
  format: 'cjs',
  target: 'ES6',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
```

- [ ] **Step 5: Create package.json scripts**

```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "node esbuild.config.mjs production"
  }
}
```

- [ ] **Step 6: Create src/manifest.json**

```json
{
  "id": "obsidiknows",
  "name": "ObsidiaKnows",
  "version": "0.1.0",
  "minAppVersion": "1.0.0",
  "description": "Transform documents into hierarchical knowledge graphs",
  "author": "Your Name",
  "authorUrl": "https://github.com/yourusername",
  "fundingUrl": "",
  "isDesktopOnly": false
}
```

- [ ] **Step 7: Create README.md (dev setup)**

```markdown
# ObsidiaKnows Development

## Setup

1. Clone repo and run: `npm install`
2. Start dev build: `npm run dev`
3. Copy `main.js`, `manifest.json`, `styles.css` to test vault's `.obsidian/plugins/obsidiknows/`
4. Enable plugin in Obsidian settings

## Build

\`\`\`bash
npm run build
\`\`\`

## Test

\`\`\`bash
npm test
\`\`\`
```

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json jest.config.js esbuild.config.mjs src/manifest.json README.md
git commit -m "feat: initialize plugin scaffold with build system"
```

---

**Continue with remaining 13 tasks in sequence. This is Phase 1: MVP (Tasks 1-14 covering all core components and initial testing).**

---

**End of Implementation Plan**
