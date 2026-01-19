---
Title: 'Textbook: md-diff-render codebase'
Ticket: MO-MDIFF-001-PORT-TO-GO
Status: active
Topics:
    - go
    - porting
    - cli
    - design
    - analysis
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: md-diff-render/client/public/sample.json
      Note: Canonical sample DHF loaded at startup
    - Path: md-diff-render/client/src/components/DocumentView.tsx
      Note: Segment renderer + tooltip logic for changes
    - Path: md-diff-render/client/src/index.css
      Note: Theme + change highlighting CSS classes
    - Path: md-diff-render/client/src/pages/Home.tsx
      Note: Main UX flow (load sample
    - Path: md-diff-render/client/src/types/dhf.ts
      Note: DHF format contract consumed by the UI
    - Path: md-diff-render/server/index.ts
      Note: Production static server + SPA fallback behavior
    - Path: md-diff-render/vite.config.ts
      Note: Build output location and dev server config
ExternalSources: []
Summary: 'Deep-dive textbook for the md-diff-render TypeScript/React app: data model (DHF), UI rendering pipeline, build/dev lifecycle, and extension points.'
LastUpdated: 2026-01-19T14:58:59.61391834-05:00
WhatFor: 'Onboarding + porting support: understand current behavior/contracts before rewriting or embedding the app elsewhere (e.g., Go single-binary).'
WhenToUse: Use before making behavior changes (DHF schema, rendering, build output) or before implementing the Go/Glazed port.
---


# Textbook: md-diff-render codebase

## Goal

Provide a “from zero to expert” explanation of the `md-diff-render` web viewer: what it does, how the DHF data model works, how the UI renders, how it builds/runs, and where to extend it.

## Context

This repository is a small TypeScript/React single-page app (SPA) called `md-diff-render`. It renders a precomputed “Document History Format” (DHF) JSON file that describes:

- a document (path/repo/branch/current commit)
- a list of commits
- a list of content segments with “added/modified/deleted/unchanged” markers
- summary counts

Important scope note: this codebase is a *viewer*. It does not compute diffs from git history; it renders already-prepared DHF data.

Key directories:

- `md-diff-render/client/` — Vite + React UI
- `md-diff-render/server/` — Express production server (static + SPA fallback)
- `md-diff-render/shared/` — small shared constants
- `md-diff-render/dist/public/` — build output target (generated)

Top-level repo note: the root also contains Go workspaces `glazed/` and `docmgr/` referenced by `go.work`, but those are not part of the md-diff-render runtime.

## Fundamentals

### 1) Core UX: “Load DHF → visualize changes”

The main screen is a 2-pane layout:

- Left pane: the document content, rendered as Markdown, with optional inline highlighting
- Right pane: a vertical timeline of commits

There are two ways to load DHF data:

1. Auto-load sample data on startup (fetches `/sample.json`)
2. Upload a local file (JSON only, today)

**Source:** `md-diff-render/client/src/pages/Home.tsx`

### 2) Mental model: DHF is already “diffed”

The renderer assumes the DHF producer has already:

- chosen how to segment the document into chunk(s)
- labeled each chunk as `unchanged`, `added`, `deleted`, or `modified`
- attached change metadata linking a segment to a commit id

The viewer’s job is then:

- map change commit → author/date/message for tooltips
- render each segment as Markdown
- apply CSS classes based on segment type (added/modified/deleted)

### 3) Rendering strategy: “streamdown for markdown blocks”

Segments are rendered using `Streamdown` (a Markdown renderer component). Each segment’s `.text` is passed to `<Streamdown>{segment.text}</Streamdown>`.

**Implication:** segments must contain valid Markdown; they can contain headings, code fences, lists, etc.

**Source:** `md-diff-render/client/src/components/DocumentView.tsx`

## APIs (Contracts)

This project has essentially one “API”: the DHF file format consumed by the UI.

### DHF schema (TypeScript interfaces)

**Source of truth:** `md-diff-render/client/src/types/dhf.ts`

Key types:

- `DHF` — root object
- `DHFCommit` — a commit entry
- `DHFSegment` — a single content chunk + change metadata

#### DHF: top-level

Minimal shape:

```ts
interface DHF {
  document: DHFDocument;
  view: DHFView;
  commits: DHFCommit[];
  content: DHFSegment[];
  summary: DHFSummary;
}
```

#### DHFDocument: identity + metadata

```ts
interface DHFDocument {
  path: string;          // e.g., "README.md"
  repo: string;          // e.g., "acme/project" (not necessarily a URL)
  branch: string;        // e.g., "main"
  current_commit: string;// commit id string shown as “Current”
  generated_at: string;  // ISO timestamp
}
```

#### DHFCommit: commit metadata used in tooltips and timeline

```ts
interface DHFCommit {
  id: string;      // short-ish id used as join key
  author: string;
  email: string;
  date: string;    // parseable by Date()
  message: string;
}
```

#### DHFSegment: the actual document stream

```ts
interface DHFSegment {
  type: "unchanged" | "added" | "deleted" | "modified";
  text: string;           // markdown chunk (final-text shown in UI)
  change?: DHFChange;     // optional, used for non-unchanged types
}
```

`type` drives:

- the CSS class applied (`change-added`, `change-modified`, `change-deleted`)
- whether tooltips appear (they appear only when `type !== "unchanged"` and “Show Changes” is enabled)

#### DHFChange: link segment → commit, plus optional “diff detail”

```ts
interface DHFChange {
  commit: string;                 // commit id (join key into commits[])
  before?: string;                // prior text (unused by UI today)
  modifications?: DHFModification[]; // optional list (tooltip only today)
}
```

Each `DHFModification` is:

```ts
interface DHFModification {
  offset: number;
  old: string;
  new: string;
}
```

**Important:** `offset` is not used by the UI today; the tooltip just displays `"old" → "new"`.

### Sample DHF file

**Source:** `md-diff-render/client/public/sample.json`

This file is served as a static asset and auto-fetched by the `Home` page on mount. It doubles as:

- a format example
- a smoke test for the UI

## Implementation

### High-level module map

- UI entry: `md-diff-render/client/src/main.tsx`
- Routing: `md-diff-render/client/src/App.tsx` (Wouter)
- Main page UX: `md-diff-render/client/src/pages/Home.tsx`
- Rendering: `md-diff-render/client/src/components/DocumentView.tsx`
- Timeline: `md-diff-render/client/src/components/VersionTimeline.tsx`
- Header + toggles: `md-diff-render/client/src/components/Header.tsx`
- CSS theme + change styles: `md-diff-render/client/src/index.css`
- Prod server: `md-diff-render/server/index.ts`
- Build config: `md-diff-render/vite.config.ts`

### UI boot sequence

**Source:** `md-diff-render/client/src/main.tsx`

Conceptually:

```pseudocode
root = getElementById("root")
render(<App />)
```

`App` wraps:

- an error boundary
- a ThemeProvider (default theme = light)
- shadcn/tooltip provider
- toast “Toaster”
- Wouter router (only `/` and 404)

### Home page: loading DHF

**Source:** `md-diff-render/client/src/pages/Home.tsx`

There are two flows:

#### A) Startup sample load

```pseudocode
onMount:
  fetch("/sample.json")
    .then(parse json)
    .then(setDhfData, setSelectedCommit(lastCommitId))
    .catch(loadFallbackSample)
```

Fallback sample is an *embedded object literal* used only if `/sample.json` fetch fails.

#### B) File upload load

```pseudocode
onFileSelected(file):
  text = FileReader.readAsText(file)
  try:
    data = JSON.parse(text)
  catch:
    toast.error("Please upload a JSON file (YAML support coming soon)")
    return

  setDhfData(data)
  setSelectedCommit(lastCommitId)
  toast.success("Document loaded successfully")
```

The app also tracks:

- `showChanges: boolean` toggled in Header
- `selectedCommit: string | undefined` set when clicking on timeline commits

**Important:** `selectedCommit` does not currently affect rendering; it’s stored and passed to `VersionTimeline` only.

### DocumentView: rendering segments + tooltips

**Source:** `md-diff-render/client/src/components/DocumentView.tsx`

Core algorithm:

```pseudocode
commitMap = map commits by id

for each segment in segments:
  if segment.type == "unchanged" OR showChanges == false:
    render Streamdown(segment.text)
    continue

  commit = commitMap[segment.change.commit] (if present)

  if segment.type == "deleted":
    render div.change-deleted(Streamdown(text))
    tooltip: {Deleted, by author, date, message}

  if segment.type == "added":
    render div.change-added(Streamdown(text))
    tooltip: {Added, by author, date, message}

  if segment.type == "modified":
    modText = modifications.map(old->new).join(", ") OR "Modified"
    render div.change-modified(Streamdown(text))
    tooltip: {Modified, modText, by author, date, message}
```

Hover behavior:

- Component tracks `hoveredSegment: number | null`
- On hover, it adds a colored box-shadow around the segment (per type)

### CSS: change styles

**Source:** `md-diff-render/client/src/index.css`

The “Swiss minimal” theme defines:

- base CSS variables for colors, with OKLCH values
- a `.change-*` set of classes:
  - background tint
  - left border in a stronger color
  - padding-left for visual separation
  - deleted segments have `line-through` + reduced opacity

### Timeline: commit list

**Source:** `md-diff-render/client/src/components/VersionTimeline.tsx`

Behavior:

- Renders commits in order given (the last commit is considered “Current”)
- Clicking a commit calls `onCommitClick(commit.id)`
- Selected commit is highlighted via CSS class toggles

### Production server: Express static + SPA fallback

**Source:** `md-diff-render/server/index.ts`

Behavior:

- Compute `staticPath`:
  - if `NODE_ENV=production`: `dist/public` is treated as “public” relative to bundled server location
  - otherwise: serve from `../dist/public`
- `express.static(staticPath)` for assets
- `GET *` → `index.html` (client-side routing fallback)

Equivalent pseudocode:

```pseudocode
staticPath = resolve(dist/public)
serve static files under "/"
on any GET not matched by a file:
  return index.html
listen on PORT or 3000
```

### Build pipeline

**Source:** `md-diff-render/package.json` and `md-diff-render/vite.config.ts`

Key scripts:

- `pnpm dev` — runs Vite dev server with `--host`
- `pnpm build` — builds SPA + bundles server:
  - `vite build` outputs into `md-diff-render/dist/public`
  - `esbuild server/index.ts ... --outdir=dist` bundles server to `md-diff-render/dist/index.js`
- `pnpm start` — runs production server via `node dist/index.js`

Vite config details:

- `root` is `md-diff-render/client`
- `build.outDir` is `md-diff-render/dist/public`
- Dev-only “manus debug collector” plugin accepts POSTs at `/__manus__/logs` and writes to `.manus-logs/`

## Usage Examples

### Development

From `md-diff-render/`:

```bash
pnpm install
pnpm dev
```

Then open the printed URL. The app should auto-load `/sample.json`.

### Production build + run

From `md-diff-render/`:

```bash
pnpm install
pnpm build
pnpm start
```

### Using your own DHF file

In the UI:

- Click “Upload DHF File” (or “Load File”)
- Select a `.json` file matching the DHF schema

## Extension points (practical)

### YAML support

Current behavior rejects non-JSON uploads (“YAML support coming soon”). Options:

- Client-side: add a YAML parser (parse YAML → DHF object)
- Server-side: accept uploaded YAML, convert to JSON, and serve to UI (better for the Go port)

Starting point: `md-diff-render/client/src/pages/Home.tsx` (file upload handler)

### “Selected commit filters content”

There is already a `selectedCommit` state; implementing filtering could be done by:

- defining how segments map to commits (a segment has exactly one change.commit, or “unchanged”)
- deciding “show document as of commit X” semantics
- rendering only segments with `change.commit <= selectedCommit` etc.

Starting point: `md-diff-render/client/src/pages/Home.tsx` and `md-diff-render/client/src/components/VersionTimeline.tsx`

### Richer “modified” visualization

Right now modified segments are highlighted as a whole; the `offset` in `DHFModification` is unused. Potential upgrade:

- apply inline spans within a segment based on `offset` + old/new
- or render a side-by-side diff viewer for modified segments

Starting point: `md-diff-render/client/src/components/DocumentView.tsx`

## Quick Reference

### “If you only remember one thing”

`md-diff-render` renders a DHF JSON file; it does not compute diffs. DHF segments already encode the change type and commit association.

### Key files (copy/paste lookup)

- DHF schema: `md-diff-render/client/src/types/dhf.ts`
- Main page: `md-diff-render/client/src/pages/Home.tsx`
- Segment renderer: `md-diff-render/client/src/components/DocumentView.tsx`
- Timeline: `md-diff-render/client/src/components/VersionTimeline.tsx`
- CSS change highlighting: `md-diff-render/client/src/index.css`
- Prod server: `md-diff-render/server/index.ts`
- Build output: `md-diff-render/dist/public/`

## Usage Examples

### Minimal DHF example (JSON)

```json
{
  "document": {
    "path": "README.md",
    "repo": "example/repo",
    "branch": "main",
    "current_commit": "abc1234",
    "generated_at": "2026-01-19T00:00:00Z"
  },
  "view": { "since": "xyz", "until": "now" },
  "commits": [
    {
      "id": "abc1234",
      "author": "Alice",
      "email": "alice@example.com",
      "date": "2026-01-18T12:00:00Z",
      "message": "Initial import"
    }
  ],
  "content": [
    { "type": "unchanged", "text": "# Hello\\n" },
    { "type": "added", "text": "New line", "change": { "commit": "abc1234" } }
  ],
  "summary": {
    "total_commits": 1,
    "authors": [{ "name": "Alice", "commits": 1 }],
    "lines_added": 1,
    "lines_deleted": 0,
    "lines_modified": 0
  }
}
```

## Related

- Design doc for Go/Glazed port: `md-diff-render/ttmp/2026/01/19/MO-MDIFF-001-PORT-TO-GO--port-md-diff-tool-to-go-glazed/design/01-design-port-to-go-single-binary-with-glazed.md`
- Diary: `md-diff-render/ttmp/2026/01/19/MO-MDIFF-001-PORT-TO-GO--port-md-diff-tool-to-go-glazed/reference/01-diary.md`
