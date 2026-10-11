# ObsidiaKnows

Transform documents into hierarchical knowledge graphs using Claude AI. ObsidiaKnows extracts characters, events, concepts, and relationships from any document and creates an interactive knowledge graph inside your Obsidian vault.

## Status

**Phase 1 MVP**: ✅ Complete  
**Phase 2 Sprint 1 & 2**: ✅ Complete (File Upload Support)  
**Phase 2 Sprint 3**: ⏳ In Progress (Deep Dive Analysis + Additional Node Types)

---

## What's Complete

### Phase 1: Core Knowledge Graph Generation ✅

Transform text into structured knowledge graphs with intelligent relationship mapping.

**Features Implemented:**
- **Text Input**: Paste documents directly into Obsidian modal
- **Multi-Provider LLM Support**: Claude (primary), OpenRouter, OmniRoute, DeepSeek
- **Hierarchical Node Extraction**: Main → Major → Minor node structure
- **4 Core Node Types**: Character, Event, Concept, Relationship
- **Automatic Title Detection**: Smart extraction of document titles from content
- **Document Chunking**: Intelligent token-based splitting with semantic boundary preservation
- **Progress Checkpointing**: Save/load analysis progress per chunk for interruption recovery
- **Markdown Output**: YAML frontmatter + wikilinks for Obsidian integration
- **Vault Integration**: Automatic folder creation and note linking
- **Settings UI**: Configurable depth, node types, output folders, API keys
- **Comprehensive Testing**: 22 tests across 5 suites, all passing

**Tested & Working:**
- ✅ Single-document analysis (tested with books, articles, research papers)
- ✅ Multi-chunk processing (documents >4000 tokens split and reassembled)
- ✅ Checkpoint recovery (resume incomplete analyses)
- ✅ All 4 core node types extracted and validated
- ✅ Relationship mapping between nodes
- ✅ Wikilink generation for Obsidian navigation
- ✅ Settings persistence
- ✅ Error handling with user-friendly messages

**Bundle Size**: 59KB (minified, excludes dependencies)  
**Plugin Installation**: Ready for Obsidian vault (.obsidian/plugins/obsidiknows/)

---

### Phase 2 Sprint 1 & 2: File Upload Support ✅

Upload and analyze professional documents without copy-paste friction.

**Features Implemented:**
- **Multi-Format Support**: .txt, .pdf, .docx file uploads
- **Adapter Pattern Architecture**: Pluggable, independently testable file parsers
  - Text Adapter: Native File API pass-through
  - PDF Adapter: Dynamic pdf.js loading from CDN (no bundling overhead)
  - DOCX Adapter: jszip + XML parsing for Word documents
- **File Validation**: 10MB size limit, MIME type checking, corrupted file detection
- **Modal UI Tabs**: "Paste Text" + "Upload File" tabs in create modal
- **Drag-and-Drop**: Visual feedback for file drag operations
- **Error Handling**: User-friendly messages for corrupted files, unsupported formats, size limits
- **Browser Compatibility**: All adapters work in Obsidian's Electron browser context
- **Backward Compatible**: Text paste workflow unchanged; all Phase 1 tests still pass

**File Format Support:**
| Format | Method | Status |
|--------|--------|--------|
| Plain Text (.txt) | Browser File API | ✅ Working |
| PDF (.pdf) | pdf.js v3.11.174 (CDN) | ✅ Working |
| Word (.docx) | jszip + XML parsing | ✅ Working |

**Testing Results:**
- ✅ All 22 Phase 1 tests passing (no regressions)
- ✅ PDF extraction tested on multi-page documents
- ✅ DOCX extraction tested with formatted text, tables, paragraphs
- ✅ File size validation working (rejects >10MB)
- ✅ Error messages clear and actionable
- ✅ Plugin loads successfully in Obsidian

**Bundle Size**: 223KB (+164KB for jszip; pdf.js lazy-loaded from CDN)

---

## What's In Progress

### Phase 2 Sprint 3: Deep Dive Analysis + Additional Node Types ⏳

Enhance analysis depth and unlock 6 node types for richer knowledge graphs.

**Planned for This Sprint:**
1. **Deep Dive Analysis Depth**
   - Auto-scale token limits: Quick mode 4000 → Deep mode 8000 tokens
   - Enhanced LLM prompt with depth-aware extraction instructions
   - User-configurable token limit (4000-12000 range in settings)
   - Estimated 2x node extraction in deep mode

2. **Additional Node Types** (location, timeline, theme)
   - Location: Cities, countries, buildings, geographic features
   - Timeline: Dates, historical markers, time periods, sequences
   - Theme: Underlying ideas, symbolic meaning, motifs
   - Type-specific validation with permissive warnings
   - Type-specific formatting in markdown output

3. **Implementation Tasks**
   - Enhance `src/analysis/analysisPrompt.ts` with depth-aware instructions
   - Modify `src/analysis/analysisEngine.ts` to scale tokens dynamically
   - Add "Deep Dive Token Limit" slider to `src/settings.ts`
   - Enhance `src/graph/graphGenerator.ts` with type validation
   - Update `src/output/markdownGenerator.ts` for type-specific formatting

**Success Criteria:**
- Deep mode produces 2x more nodes than quick mode
- All 6 node types appear in knowledge graphs
- Settings UI allows token limit customization
- All Phase 1 & 2 tests still passing
- Bundle size remains <600KB

---

## What's Planned (Phase 3+)

### Phase 3: Canvas Visualization & Advanced Features

**Canvas Visualization**
- Interactive node graph layout (spring physics, hierarchical, radial)
- Relationship direction and strength visualization
- Pan, zoom, drag-to-select nodes
- Real-time editing on canvas

**Additional Enhancements**
- Vault note references as input (analyze existing notes)
- Advanced visualization modes (flowchart, timeline, reading order)
- Graph merging and deduplication
- Resumable analysis UI (continue from checkpoint)
- Retry logic for failed API calls
- Rate limiting and token budget warnings

### Phase 4: Extensibility & Local Support

- Local LLM support (Ollama integration)
- Custom node type definitions
- Analysis template system
- Graph templates
- Batch document processing

---

## Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd obsidian-plugins-creation
   npm install
   ```

2. **Build the plugin**
   ```bash
   npm run build
   ```

3. **Install to Obsidian**
   ```bash
   mkdir -p ~/.obsidian/plugins/obsidiknows
   cp main.js manifest.json styles.css ~/.obsidian/plugins/obsidiknows/
   ```

4. **Enable in Obsidian**
   - Open Obsidian Settings
   - Community Plugins → Manage → Find "ObsidiaKnows"
   - Enable the plugin

### Configuration

1. Open Obsidian Settings → ObsidiaKnows
2. Add your API key:
   - **Claude** (primary): Get key from [console.anthropic.com](https://console.anthropic.com)
   - **OpenRouter**: [openrouter.ai](https://openrouter.ai)
   - **OmniRoute**: [omniroute.ai](https://omniroute.ai)
   - **DeepSeek**: [deepseek.com](https://deepseek.com)
3. Configure output folder template
4. Set default analysis depth (Quick or Deep)
5. Select node types to extract

### Usage

1. **Create a Knowledge Graph**
   - Command: "Create Knowledge Graph"
   - Choose: "Paste Text" or "Upload File"
   - Paste document or select .txt, .pdf, or .docx file
   - Select analysis depth (Quick or Deep)
   - Click "Analyze"

2. **Review Results**
   - Knowledge graph creates folder with linked nodes
   - Each node is a .md file with YAML frontmatter
   - Relationships shown as [[wikilinks]]
   - Navigate graph using Obsidian's graph view

3. **Customize**
   - Edit node summaries and relationships
   - Add backlinks to other vault notes
   - Organize in custom folder structure

---

## Architecture

### Core Data Flow

```
User Input (paste or file upload)
    ↓
Input Validation & Chunking
    ↓
File Format Parsing (adapters)
    ↓
LLM Analysis (chunked processing)
    ↓
Graph Generation & Validation
    ↓
Markdown Output (YAML + wikilinks)
    ↓
Vault Integration (folder + files)
```

### Key Components

| Component | Purpose | Status |
|-----------|---------|--------|
| **Input Layer** | Text paste, file upload with adapter pattern | ✅ Complete |
| **LLM Providers** | Multi-provider support (Claude, OpenRouter, OmniRoute, DeepSeek) | ✅ Complete |
| **Analysis Engine** | Chunking, checkpointing, progress tracking | ✅ Complete |
| **Graph Generator** | Node hierarchy validation, relationship building | ✅ Complete |
| **Output Formatter** | Markdown generation with YAML frontmatter | ✅ Complete |
| **Vault Integration** | Folder creation, file management, wikilinks | ✅ Complete |
| **Settings UI** | User configuration, API keys, output templates | ✅ Complete |

### Multi-Provider LLM Architecture

Pluggable provider system supports:
- **Claude** (Anthropic): claude-3-5-sonnet-20241022
- **OpenRouter**: anthropic/claude-3-5-sonnet
- **OmniRoute**: Multiple models (Claude, DeepSeek, GPT-4, Mistral, Llama, Gemini, GLM-5)
- **DeepSeek**: deepseek-flash

Add new providers by extending `LLMProvider` interface and implementing `analyze()` method.

---

## Development

### Commands

```bash
# Development
npm run dev          # Watch mode with inline sourcemaps
npm run build        # Production bundle
npm test             # Run all tests (Jest, 22 tests)
npx tsc --noEmit     # Type check without emitting

# Verification
npm test -- --verbose    # Detailed test output
npm test -- [test-file]  # Run specific test
```

### Tech Stack

- **Language**: TypeScript 4.9.5 (pinned for ts-jest compatibility)
- **Build**: esbuild (bundles to CommonJS for Obsidian)
- **Testing**: Jest with ts-jest
- **Runtime**: Obsidian Plugin API, Browser APIs
- **LLM Integration**: Anthropic SDK + provider abstractions

### File Structure

```
src/
├── main.ts                    # Plugin entry point
├── types.ts                   # Central type definitions
├── settings.ts                # Settings UI
├── analysis/                  # LLM analysis & providers
│   ├── analysisEngine.ts
│   ├── analysisPrompt.ts
│   ├── claudeProvider.ts
│   ├── openrouterProvider.ts
│   ├── omnirouteProvider.ts
│   └── deepseekProvider.ts
├── input/                     # Input processing
│   ├── inputHandler.ts
│   ├── fileValidator.ts
│   └── adapters/              # File format adapters
│       ├── fileAdapter.ts
│       ├── textAdapter.ts
│       ├── pdfAdapter.ts
│       ├── docxAdapter.ts
│       └── adapterFactory.ts
├── graph/                     # Graph validation & generation
│   └── graphGenerator.ts
├── output/                    # Output formatting
│   ├── outputFormatter.ts
│   └── markdownGenerator.ts
├── vault/                     # Obsidian vault integration
│   └── vaultIntegration.ts
├── checkpoint/                # Analysis checkpointing
│   └── checkpointManager.ts
└── utils/                     # Utilities
    ├── tokenCounter.ts
    ├── idGenerator.ts
    └── logger.ts
```

### Important Constraints

- **TypeScript 4.9.5 PINNED**: Do not upgrade (ts-jest breaks on TS 5+)
- **Browser Context**: Obsidian runs in Electron; no Node.js APIs
- **Bundle Size**: Keep <600KB (currently 223KB)
- **Adaptive Dependencies**: pdf-parse external (CDN), jszip bundled (~150KB)

---

## Testing

### Test Coverage

- **Input Validation**: Text/file validation, tokenization, title extraction
- **Graph Generation**: Node hierarchy, relationship validation
- **Output Formatting**: Markdown generation, wikilinks
- **Token Counting**: Chunking logic, edge cases
- **End-to-End**: Full pipeline with mock LLM

### Running Tests

```bash
# All tests
npm test

# Specific test suite
npm test -- inputHandler.test.ts

# Verbose output
npm test -- --verbose

# With coverage
npm test -- --coverage
```

**Current Status**: 22/22 tests passing ✅

---

## Known Limitations

### Phase 1
- Text paste only (resolved in Phase 2)
- Quick overview depth only (resolving in Phase 2 Sprint 3)
- 4 core node types (location, timeline, theme coming in Phase 2 Sprint 3)

### Phase 2
- No canvas visualization (Phase 3)
- No graph merging (Phase 3)
- No local LLM support (Phase 4)

### Current
- PDF text extraction only (no OCR for scanned images)
- Large PDFs (100+ pages) may take 5-10 seconds
- Node extraction quality depends on LLM model capability

---

## API Keys & Configuration

### Get Your API Keys

**Claude (Recommended)**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account and get API key
3. Add to ObsidiaKnows settings

**OpenRouter (Alternative)**
1. Go to [openrouter.ai](https://openrouter.ai)
2. Generate API key
3. Select preferred model (supports 100+ models)

**OmniRoute (Multi-Provider)**
1. Go to [omniroute.ai](https://omniroute.ai)
2. Create account and get API key
3. Choose from 14+ models (Claude, DeepSeek, GPT-4, etc.)

**DeepSeek (Budget Option)**
1. Go to [deepseek.com](https://deepseek.com)
2. Create account and get API key
3. Use deepseek-flash model

---

## Troubleshooting

### Plugin Won't Load in Obsidian
1. Check manifest.json has `id: "obsidiaknows"`
2. Verify main.js exists and is >50KB
3. Restart Obsidian (clears plugin cache)
4. Check browser console (F12) for errors

### API Calls Failing
1. Verify API key is valid and has active credits
2. Check rate limits on provider dashboard
3. Try different LLM provider
4. Ensure no firewall blocking HTTPS requests

### File Upload Not Working
- .pdf: Verify not encrypted/password-protected
- .docx: Ensure valid Word 2007+ format
- .txt: Any encoding supported by browser

### Analysis Incomplete or Slow
- Check document size (>50MB may timeout)
- Verify internet connection
- Check LLM provider status
- Try enabling checkpointing to resume

---

## Contributing

### Development Setup

1. Install dependencies: `npm install`
2. Run in watch mode: `npm run dev`
3. Run tests: `npm test`
4. Build for production: `npm run build`

### Adding a New LLM Provider

1. Create `src/analysis/[provider]Provider.ts` extending `LLMProvider`
2. Implement `analyze()` method
3. Add to provider dropdown in `src/settings.ts`
4. Add case to provider selection in `src/main.ts`
5. Test with sample document
6. Add tests in `tests/unit/`

### Adding a New File Format

1. Create `src/input/adapters/[format]Adapter.ts` implementing `FileAdapter`
2. Implement `canHandle()`, `parse()`, `getMimeTypes()`, `getName()`
3. Register in `AdapterFactory`
4. Update modal UI to accept new format
5. Test with sample file

---

## Resources

- **Obsidian Plugin Documentation**: https://docs.obsidian.md/Plugins/Getting+started/Build+a+sample+plugin
- **Claude API Documentation**: https://docs.anthropic.com/en/api/getting-started
- **OpenRouter**: https://openrouter.ai/docs
- **OmniRoute**: https://omniroute.ai
- **TypeScript Documentation**: https://www.typescriptlang.org/docs/
- **Jest Testing**: https://jestjs.io/docs/getting-started

## Roadmap

### Phase 2 Sprint 3 (Current)
- [ ] Deep dive analysis depth with token scaling
- [ ] Additional node types (location, timeline, theme)
- [ ] Type-specific validation and formatting
- [ ] Settings UI for token limits
- **Target**: Late October 2026

### Phase 3 (Next)
- [ ] Canvas visualization with interactive graph
- [ ] Advanced visualization modes
- [ ] Graph merging and deduplication
- [ ] Resume UI for checkpoints
- **Target**: November 2026

### Phase 4 (Future)
- [ ] Local LLM support (Ollama)
- [ ] Custom node types
- [ ] Batch processing
- [ ] Analysis templates

---

## Project Stats

- **Lines of Code**: ~4,000 (including tests)
- **Test Coverage**: 22 tests across 5 suites
- **Bundle Size**: 223KB (Phase 2 with file upload)
- **Supported Formats**: 3 (text, PDF, DOCX)
- **LLM Providers**: 4 (Claude, OpenRouter, OmniRoute, DeepSeek)
- **Node Types**: 4 core (6 with Phase 2 Sprint 3)

---

## License

This project is provided as-is for personal and educational use.

---
