---
Title: Port md-diff tool to Go (glazed)
Ticket: MO-MDIFF-001-PORT-TO-GO
Status: active
Topics:
    - go
    - porting
    - cli
    - design
    - analysis
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Ticket workspace: analyze md-diff-render (TS/React DHF viewer) and design a Glazed-based Go single-binary port that serves embedded SPA assets and adds CLI inspection commands."
LastUpdated: 2026-01-19T14:58:40.031562215-05:00
WhatFor: "Central hub for analysis, design, and implementation notes for porting md-diff-render to Go using Glazed."
WhenToUse: "Start here to find the current analysis, design plan, and supporting sources for the port."
---

# Port md-diff tool to Go (glazed)

## Overview

This ticket documents two deliverables:

1. A detailed “textbook” analysis of the existing `md-diff-render` codebase (a DHF JSON viewer built with Vite + React).
2. A design for porting that project into a self-contained Go binary using the Glazed framework:
   - serve embedded SPA assets (no Node runtime)
   - add Glazed-powered CLI subcommands (e.g., `inspect`) with structured output

The Go port is intentionally scoped to *shipping and operating* the existing viewer. It does not (yet) include “generate DHF from git history”.

## Key Links

- Analysis textbook: `reference/02-textbook-md-diff-render-codebase.md`
- Port design (Go + Glazed): `design/01-design-port-to-go-single-binary-with-glazed.md`
- Work diary (intermediate steps): `reference/01-diary.md`
- Source: full `glaze help build-first-command` output: `sources/01-glaze-help-build-first-command.txt`

## Status

Current status: **active**

## Topics

- go
- porting
- cli
- design
- analysis

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
