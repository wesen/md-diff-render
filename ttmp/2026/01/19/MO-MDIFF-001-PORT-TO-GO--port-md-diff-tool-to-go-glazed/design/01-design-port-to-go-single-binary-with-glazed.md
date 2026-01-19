---
Title: 'Design: Port to Go single-binary with glazed'
Ticket: MO-MDIFF-001-PORT-TO-GO
Status: active
Topics:
    - go
    - porting
    - cli
    - design
    - analysis
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: glazed/cmd/examples/new-api-build-first-command/main.go
      Note: Reference Glazed command wiring + wrapper API usage
    - Path: glazed/pkg/cmds/cmds.go
      Note: Glazed command interfaces (BareCommand vs GlazeCommand)
    - Path: md-diff-render/server/index.ts
      Note: Existing server semantics to match in Go (static + SPA fallback)
    - Path: md-diff-render/ttmp/2026/01/19/MO-MDIFF-001-PORT-TO-GO--port-md-diff-tool-to-go-glazed/sources/01-glaze-help-build-first-command.txt
      Note: Full help text used as design input
    - Path: md-diff-render/vite.config.ts
      Note: Defines the SPA build output directory that must be embedded
ExternalSources: []
Summary: 'Design for porting md-diff-render into a self-contained Go binary using the Glazed framework: CLI shape, embedded SPA assets, and optional DHF inspection commands with structured output.'
LastUpdated: 2026-01-19T14:58:59.673992748-05:00
WhatFor: Blueprint for implementing a Go-based single-binary distribution (no Node runtime) that serves the existing UI and adds a Glazed-powered CLI.
WhenToUse: Use when starting the Go port implementation; also useful for review before committing to UI embedding vs rewrite.
---


# Design: Port to Go single-binary with glazed

## 1. Problem statement

`md-diff-render` is currently:

- a Vite + React SPA (`md-diff-render/client/`)
- built into static assets at `md-diff-render/dist/public/`
- served in production by a tiny Express server (`md-diff-render/server/index.ts`)

We want a “nice” Go, self-contained, single-binary distribution that:

- serves the same UI behavior
- does not require Node.js at runtime
- uses the Glazed framework for the CLI ergonomics (flags, output formats, command structure)

## 2. Inputs (current implementation)

### 2.1 Viewer behavior and contracts

The viewer consumes a DHF JSON file (Document History Format) and renders segments with change highlighting. It does **not** compute diffs.

See analysis doc:

- `md-diff-render/ttmp/2026/01/19/MO-MDIFF-001-PORT-TO-GO--port-md-diff-tool-to-go-glazed/reference/02-textbook-md-diff-render-codebase.md`

### 2.2 Current production server behavior (Express)

Source: `md-diff-render/server/index.ts`

- Serve static assets from `dist/public`
- SPA fallback: for all routes (`GET *`) return `index.html`
- Listen on `PORT` env var or `3000`

### 2.3 Glazed tutorial baseline

We read `glaze help build-first-command` in full and saved the output as:

- `md-diff-render/ttmp/2026/01/19/MO-MDIFF-001-PORT-TO-GO--port-md-diff-tool-to-go-glazed/sources/01-glaze-help-build-first-command.txt`

This tutorial demonstrates:

- defining flags via the `fields` wrapper API
- decoding into settings via `values.DecodeSectionInto`
- emitting structured data as `types.Row` for multi-format output (`--output json|yaml|csv|table|...`)
- registering Glazed commands under a Cobra root via `cli.BuildCobraCommand`

Also cross-check example code:

- `glazed/cmd/examples/new-api-build-first-command/main.go`

## 3. Goals / non-goals

### Goals

- **G1: Single binary distribution**: `md-diff` runs as one executable, serving the web UI without external assets at runtime.
- **G2: Keep current UI behavior**: preserve DHF rendering and file-upload flow (at least initially).
- **G3: Glazed-first CLI**: implement the CLI with Glazed command definitions, not ad-hoc flag parsing.
- **G4: Optional structured inspection**: add at least one Glazed command that emits structured output from DHF (`inspect`, `summary`, etc.).

### Non-goals (initially)

- **NG1: Rewriting the React UI** to Go templates/HTMX.
- **NG2: Computing DHF from git history** (unless there is an existing generator outside this repo).
- **NG3: Perfect cross-platform browser auto-open** (we can provide `--open` best-effort, but it’s optional).

## 4. Proposed solution (overview)

Build a Go CLI application `md-diff` that contains:

1. A `serve` subcommand implemented as a Glazed `cmds.BareCommand` that:
   - serves embedded static assets (the built React SPA)
   - handles SPA fallback routing (`index.html`)
   - optionally prints the URL and/or opens a browser
2. One or more “data” subcommands implemented as Glazed `cmds.GlazeCommand` that:
   - read a DHF file
   - emit commits/summary/segments as structured rows
   - automatically support `--output json|yaml|csv|table|...`

The React UI remains the same (built with `pnpm build`), but its output is embedded into the Go binary via `go:embed`.

## 5. CLI design (Glazed)

### 5.1 Command tree

Binary: `md-diff`

- `md-diff serve`
  - starts HTTP server serving embedded SPA
  - flags: `--port`, `--host`, `--open`, `--path-prefix`
- `md-diff inspect` (GlazeCommand)
  - emits commit list + summary rows from a DHF file
  - args: `--file <path>`
  - supports `--output json|yaml|csv|table|...` (standard Glazed)
- `md-diff schema` (WriterCommand or GlazeCommand)
  - prints a JSON Schema for DHF (optional but recommended)
- `md-diff sample` (WriterCommand)
  - prints built-in sample DHF JSON (useful for smoke tests)

### 5.2 Serve command shape (BareCommand)

Why `BareCommand`:

- `serve` is a side-effect command (long-running process) and doesn’t naturally emit rows.
- Glazed explicitly supports this via `cmds.BareCommand`.

Glazed interfaces reference:

- `glazed/pkg/cmds/cmds.go` defines `BareCommand`, `WriterCommand`, `GlazeCommand`.

Settings struct (example):

```go
type ServeSettings struct {
  Host       string `glazed.parameter:"host"`
  Port       int    `glazed.parameter:"port"`
  Open       bool   `glazed.parameter:"open"`
  PathPrefix string `glazed.parameter:"path-prefix"`
}
```

Pseudocode:

```pseudocode
Run(ctx, parsedLayers):
  settings = decode settings from parsedLayers (schema.DefaultSlug)
  addr = settings.Host:settings.Port
  handler = newSPAHandler(embeddedFS, settings.PathPrefix)
  start http server with handler
  if settings.Open: bestEffortOpenBrowser(url)
  block until ctx cancelled or server error
```

### 5.3 Inspect command shape (GlazeCommand)

Why `GlazeCommand`:

- It produces structured information that is useful in table/JSON/YAML form.

Outputs to consider:

- One “summary” row:
  - `path`, `repo`, `branch`, `current_commit`, `generated_at`
  - `total_commits`, `lines_added`, `lines_deleted`, `lines_modified`
- N “commit” rows:
  - `id`, `author`, `email`, `date`, `message`
- Optional N “segment” rows (can be large):
  - `type`, `commit`, `text_len`, `has_modifications`

Pseudocode:

```pseudocode
RunIntoGlazeProcessor(ctx, parsedLayers, gp):
  settings = decode --file + flags
  dhf = read JSON file into struct
  gp.AddRow(summaryRow(dhf))
  for commit in dhf.commits:
    gp.AddRow(commitRow(commit))
  return nil
```

This directly follows the “build-first-command” tutorial pattern: define flags with `fields.New`, decode with `values.DecodeSectionInto`, emit `types.Row`.

## 6. Embedded UI server design

### 6.1 Assets layout and embedding

We need a stable directory in Go code to embed:

- `index.html`
- JS/CSS bundles emitted by Vite
- `sample.json` and any other public assets

Proposed generated directory:

- `cmd/md-diff/assets/public/` (generated, embedded)

Embedding:

```go
import _ "embed"

//go:embed assets/public/*
var embeddedPublicFS embed.FS
```

### 6.2 HTTP handler: static + SPA fallback

Goal: match the Express behavior in `md-diff-render/server/index.ts`.

Handler algorithm:

```pseudocode
on request (path):
  clean path
  if pathPrefix configured:
    strip prefix
  if path == "/" or empty:
    serve "index.html"
  else if file exists in embeddedFS:
    serve file with proper content-type
  else:
    // SPA client-side routing fallback
    serve "index.html"
```

Notes:

- Use `http.FileServer(http.FS(subFS))` where `subFS` is an `fs.Sub` of the embedded FS.
- For the SPA fallback, implement a wrapper that tries `Open(path)` first and falls back to `index.html`.

### 6.3 “No Node runtime” constraint

At runtime, there is no Node. Therefore:

- The Go binary must contain all assets.
- Any “build” work happens ahead of time (developer builds or CI builds).

## 7. Build and dev workflow

### 7.1 Local dev (recommended)

Two-loop workflow:

1) UI dev: `pnpm -C md-diff-render dev` (fast hot reload)
2) Go dev: implement/iterate `md-diff` CLI commands and server handler

During early development, it’s fine if the Go `serve` command serves from disk (non-embedded) behind a `--dev-assets` flag; but for the “single-binary” deliverable, embedding is required.

### 7.2 Production build (single binary)

Recommended approach: `go generate` builds assets and copies them into the Go embed directory.

Example:

- `cmd/md-diff/generate.go`:
  - `//go:generate pnpm -C ../../../md-diff-render install`
  - `//go:generate pnpm -C ../../../md-diff-render build`
  - `//go:generate go run ./internal/cmd/copy-assets --from ../../../md-diff-render/dist/public --to ./assets/public`

Then:

```bash
go generate ./...
go build ./...
```

This yields a single `md-diff` binary with embedded assets.

### 7.3 CI/release consideration

If CI must build without network, either:

- vendor `node_modules` (usually undesirable), or
- check in the built `assets/public/` directory (generated) and treat it as a source artifact for Go builds, or
- ensure CI has Node and can run `pnpm install` with cached deps

This choice is policy-dependent; the design supports any of the three.

## 8. File and package layout (proposed)

Add a new Go entrypoint (in the main repo, not inside `glazed/`):

- `cmd/md-diff/main.go`
  - create Cobra root
  - add Glazed-built subcommands

Command implementations:

- `pkg/commands/serve.go` — `ServeCommand` (`cmds.BareCommand`)
- `pkg/commands/inspect.go` — `InspectCommand` (`cmds.GlazeCommand`)
- `pkg/commands/sample.go` — `SampleCommand` (`cmds.WriterCommand`)
- `pkg/commands/schema.go` — `SchemaCommand` (optional)

Web server helper:

- `pkg/web/spa.go` — `NewSPAHandler(embedFS, prefix) http.Handler`

Generated assets:

- `cmd/md-diff/assets/public/` — generated build artifacts from Vite, embedded in the binary

## 9. Testing and validation plan

### 9.1 Asset server tests

Unit tests for `pkg/web/spa.go`:

- requests to `/` return `index.html`
- requests to `/assets/<hash>.js` return the correct file (when present)
- requests to unknown route (`/foo/bar`) return `index.html` (SPA fallback)

### 9.2 CLI tests (lightweight)

For `inspect`:

- feed a small DHF fixture JSON
- assert rows/fields are emitted (using Glazed testing utilities if present, or by running the cobra command in tests)

## 10. Risks and mitigations

- **R1: Vite output path changes** (hash naming, directory layout)
  - Mitigation: embed the entire output folder and always serve by file lookup; avoid hardcoding asset names.
- **R2: Base path / path prefix issues** (serving under `/` vs `/ui/`)
  - Mitigation: support `--path-prefix`, and ensure `index.html` references are correct (might require `base` in Vite config).
- **R3: Node build step complicates Go builds**
  - Mitigation: allow “checked-in generated assets” as an alternative path for Go-only builds.

## 11. Alternatives considered

### A) Rewrite UI in Go templates/HTMX

Pros:

- no Node build ever
- potentially simpler distribution

Cons:

- larger rewrite
- harder to preserve current UX quickly

### B) Ship assets alongside binary (not embedded)

Pros:

- simpler build pipeline

Cons:

- not a true “single binary”
- harder distribution (files must stay together)

## 12. Next steps (implementation order)

1. Implement `md-diff inspect` (GlazeCommand) to prove “structured output with Glazed” quickly.
2. Implement `pkg/web/spa.go` handler with embedded FS + SPA fallback.
3. Implement `md-diff serve` (BareCommand) with `--port/--host/--open`.
4. Add `go:generate` pipeline for copying built SPA assets into embed dir.
5. Add minimal tests for handler routing + CLI parsing.
