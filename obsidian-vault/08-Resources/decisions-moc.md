---
title: Decisions MOC (Map of Content)
description: Index of all Architectural Decision Records (ADRs) mirrored into the vault. Each ADR also exists in docs/decisions/ in the codebase.
type: moc
status: active
tags: [moc, adr, architecture]
last_updated: 2026-08-12
---

# Architectural Decision Records

This MOC indexes every Architectural Decision Record that has been mirrored into the Obsidian vault. The canonical source-of-truth copies live in `docs/decisions/ADR-NNN-*.md` in the codebase; the vault copies exist so that decisions cannot be lost when the codebase reorganizes `docs/`.

## Index

| ADR | Title | Status | Date | Codebase Path |
| --- | --- | --- | --- | --- |
| [ADR-001](03-Technical/ADR-001-inventory-tab-architecture.md) | Offline-First Inventory Tab Architecture & Transaction Integrity | Accepted | 2026-08-12 | `docs/decisions/ADR-001-inventory-tab-architecture.md` |

## Conventions

- **Naming:** `ADR-NNN-kebab-case-title.md`, zero-padded 3-digit serial.
- **Location (codebase):** `docs/decisions/ADR-NNN-*.md`.
- **Location (vault):** `obsidian-vault/03-Technical/ADR-NNN-*.md` (mirror).
- **Template:** Use `[[adr-template]]` from `08-Resources/`.
- **Status values:** `Proposed`, `Accepted`, `Superseded`, `Deprecated`.
- **Mirroring rule:** Whenever an ADR is created or modified in `docs/decisions/`, the vault copy in `03-Technical/` must be updated in the same commit so the two stay in sync.

## Workflow

1. Copy `[[adr-template]]` to `docs/decisions/ADR-NNN-short-title.md` in the codebase.
2. Fill in Status, Context, Decision, Alternatives, Consequences.
3. Mirror the same content to `obsidian-vault/03-Technical/ADR-NNN-short-title.md`.
4. Add a row to the index table above.
5. Update `last_updated` in this MOC's frontmatter.
6. Commit both files together. Do not auto-push.

## Related

- Vault etiquette: [[AGENTS]]
- AI context entry point: [[CONTEXT]]
- Technical notes index: [[tech-note-template]]
