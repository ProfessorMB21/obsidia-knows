# SourceWeaver (working title) — Obsidian Plugin Design Spec

> **One-line pitch:** An Obsidian plugin that ingests any document (novel, textbook, paper, notes) and generates an interactive, layered knowledge graph — on an Obsidian Canvas — with a user-controlled depth/breadth dial and a dedicated "Start Here" timeline/overview node.

---

## 1. Core Concept

The user selects a source document. The plugin analyzes it (via an LLM) and produces a **hierarchical knowledge graph** rendered as a `.canvas` file (and/or linked markdown notes). Every node covers one specific, atomic area of the source material, and every node traces back to a single root node.

### Node hierarchy

| Level | Name | Description |
|-------|------|-------------|
| 0 | **Root node** ("Source Overview") | The document itself: title, author, type, one-paragraph summary. Every other node connects to it. |
| 1 | **Major nodes** | Key characters, core concepts, major events, themes, arcs, parts/chapters — chosen by the LLM as structurally important. |
| 2 | **Minor nodes** | Atomic, specific information belonging to exactly one major node (e.g., "Frodo inherits the Ring," "Definition of entropy," "Causes of Event X"). |
| 3+ (optional) | **Leaf nodes** | Only generated when the user sets depth ≥ 3. Finer-grained detail under minor nodes. |
| — | **Cross-links** | Edges between a minor node and a *different* major node's subtree, wherever the LLM finds real relationships (a character appears in another character's arc; an event references a concept). |

### The "Start Here" node (Timeline / Prerequisite Graph)

A **separately generated, dedicated node** (actually a small sub-graph or a large structured node) that answers the question:

> *"In what order should I consume this knowledge graph?"*

It is a **prerequisite/dependency illustration** — a tree or DAG showing what to learn first before advancing. For a novel this could be chronological timeline + reading-order; for a textbook it's the concept dependency chain. This is the flagship output and should be visually distinct (own color group, placed at top-left, edge labeled "start here").

---

## 2. User-Facing Flow

1. User runs command: **"Weave knowledge graph from current note"** (or picks a file).
2. A modal asks for:
   - **Depth** (1–3): how many levels below major nodes to generate.
   - **Breadth**: target number of major nodes (e.g., 5 / 10 / auto).
   - **Focus** (optional): "characters only", "concepts only", "everything", or a custom hint.
3. Plugin shows a progress notice (LLM calls are slow; stream or show step indicator).
4. Output: a `<DocumentName>.canvas` file opened automatically, root node centered, "Start Here" group highlighted.

---

## 3. Technical Architecture

### 3.1 Plugin skeleton
- TypeScript + esbuild, forked from `obsidianmd/obsidian-sample-plugin`.
- Entry: `main.ts` (`Plugin` subclass), settings tab, command registration.
- Manifest: `manifest.json` (id, name, minAppVersion).

### 3.2 The pipeline (the actual heart of the plugin)

```
Document (.md file in vault)
   │
   ▼
[Stage 0: Ingest & Chunk]
   • Read via app.vault.read()
   • Split by headings → semantic chunks (fallback: fixed-size with overlap)
   • Estimate tokens; if doc > context window → map-reduce
   │
   ▼
[Stage 1: Overview]  ── LLM call ──▶  Root node summary + document type
   │
   ▼
[Stage 2: Major nodes]  ── LLM call ──▶  JSON list of major entities
   │                                 (id, title, type: character|event|concept|theme|timeline,
   │                                  summary, importance score)
   ▼
[Stage 3: Minor nodes, per major node]  ── N parallel LLM calls ──▶  JSON list of atomic facts
   │                                 (id, parentId, title, body, relatedIds[])
   │                                 Depth parameter controls whether Stage 3 recurses.
   ▼
[Stage 4: Cross-link resolution]  ── LLM call (or embedding similarity) ──▶  edges between subtrees
   │
   ▼
[Stage 5: Start-Here graph]  ── LLM call with condensed graph as input ──▶  ordered prerequisite tree
   │
   ▼
[Stage 6: Layout & Emit]
   • Layout: simple layered layout (root left-center, majors in a column, minors
     in columns per major, cross-links as labeled edges). No force-directed
     physics needed for v1 — deterministic grid layout is predictable and testable.
   • Emit JSON Canvas format {nodes, edges} → write `<name>.canvas` → open leaf.
```

### 3.3 LLM provider abstraction

```
interface LLMProvider {
  analyze(prompt: string, schema: ZodSchema<T>): Promise<T>;
}
```
Implementations: OpenAI, Anthropic, OpenRouter, and local (Ollama/LM Studio via OpenAI-compatible endpoint). API key lives in plugin settings. **Structured output / JSON mode with Zod validation + retry is mandatory** — never parse free-form prose.

### 3.4 Output format: JSON Canvas (v1 decision)

Generate a `.canvas` file (JSON Canvas spec: top-level `nodes` + `edges` arrays; node types `text`/`file`/`link`/`group`; edges have `fromNode`, `toNode`, `fromSide`, `toSide`, `label`, `color`).

- Root node: big, distinct color, group labeled with the document title.
- Each major node + its minors inside a labeled **group** per subtree.
- Cross-links: edges with `label` explaining the relation.
- Start-Here graph: its own group, distinct color, positioned top-left.
- Optionally, each minor node can also be a *file node* pointing to a generated `.md` note (full detail) — deferred to v2.

**Why Canvas over alternatives:**
- Obsidian's built-in Graph View only shows note-level links — too coarse for intra-document nodes.
- A custom `ItemView` with d3/cytoscape gives full control but is a huge surface area (pan/zoom/interaction). Canvas is free UI, native, and exportable. Revisit in v3 if needed.

### 3.5 Key data structures

```ts
interface KGNode {
  id: string;                    // "n:char:frodo"
  level: 0 | 1 | 2 | 3;
  parentId: string | null;
  title: string;
  type: 'root' | 'character' | 'event' | 'concept' | 'theme' | 'timeline';
  summary: string;               // ≤ 2 sentences
  detail: string;                // longer body for canvas text node
  relatedIds: string[];          // cross-link candidates
}

interface CanvasNode {
  id: string; type: 'text' | 'group';
  x: number; y: number; width: number; height: number;
  text?: string; label?: string; color?: string;
}

interface CanvasEdge {
  id: string; fromNode: string; toNode: string;
  fromSide: 'top'|'right'|'bottom'|'left';
  toSide: 'top'|'right'|'bottom'|'left';
  label?: string; color?: string;
}
```

---

## 4. Settings

- LLM provider + model + API key (+ base URL for local)
- Default depth (1–3) and default breadth
- Output folder for canvases/notes
- Cost guard: max LLM calls per run / max tokens
- Optional: generate companion markdown notes for each minor node (v2)

---

## 5. Error Handling & Edge Cases

- Document too long → chunking + map-reduce; warn user of estimated cost.
- LLM returns invalid JSON → schema validation, bounded retry with repair prompt.
- Rate limits → exponential backoff, queue LLM calls instead of firing all in parallel.
- Partial failure → emit what succeeded, mark failed branches as placeholder nodes.
- Re-run on same document → offer overwrite vs. new file.

---

## 6. Build Order (MVP-first)

1. **Weekend 1 — Skeleton:** fork sample plugin, rename, settings tab with API key, one command that reads the active file and shows a Notice with its word count. *Done = you can build/load/reload.*
2. **Step 2 — One LLM call:** settings for provider, call LLM with hardcoded prompt on active file, dump response into a new note. *Done = end-to-end LLM path.*
3. **Step 3 — Structured extraction:** define Zod schemas, prompt → validated `KGNode[]` for major+minor nodes (depth fixed at 2). *Done = reliable JSON out.*
4. **Step 4 — Canvas emitter:** pure function `KGNode[] → {nodes, edges}` JSON Canvas, write file, open it. Deterministic grid layout. *Done = you see your first real graph.*
5. **Step 5 — Depth & breadth controls:** modal, chunking for long docs, parallel Stage-3 calls with backoff. *Done = the "user determines depth" requirement.*
6. **Step 6 — Cross-links + Start-Here node.** *Done = the flagship feature.*
7. **Step 7+ — Polish:** progress UI, cost estimator, file-node mode, embeddings-based cross-links, custom graph view.

**Definition of done for MVP:** run command on a novel chapter → get a canvas with root node, ≥5 major nodes, minors, one Start-Here group, all laid out legibly.

---

## 7. Open Questions (decide later)

- Embeddings (local vs API) for cross-link similarity vs. pure LLM judgment?
- Should the Start-Here node be a group of small nodes, or one big structured text node? (Start with one big text node + edges — easiest.)
- Multi-document graphs (weave *several* sources into one graph)?
- PDF/DOCX ingestion (Obsidian reads PDFs natively; extraction needs a lib or user pastes text in v1).

---

## 8. Name Ideas
ObsidiaKnows
