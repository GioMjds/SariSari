---
title: ADR-001 Inventory Tab Architecture
description: Offline-first inventory tab with atomic transaction integrity. Mirrors docs/decisions/ADR-001-inventory-tab-architecture.md in the codebase.
type: adr
status: accepted
tags: [adr, architecture, inventory, sqlite, offline-first]
created: 2026-08-12
---

> **Vault mirror.** The canonical copy of this ADR lives in `docs/decisions/ADR-001-inventory-tab-architecture.md` in the codebase. This vault copy is kept in sync so the decision is preserved if `docs/decisions/` is reorganized. See [[decisions-moc]] for the full index.

# ADR-001: Offline-First Inventory Tab Architecture & Transaction Integrity

## Status

Accepted

## Date

2026-08-12

## Context

SariSari is an offline-first mobile store assistant for sari-sari store owners in the Philippines. The inventory management subsystem (`app/(tabs)/inventory`) handles product cataloging, physical stocktakes, global stock movement timelines, stock intelligence advice, and damaged goods logging on-device without a backend server.

Key requirements:

1. **Offline-First SQLite Source of Truth:** Local SQLite is the sole source of truth. Transient UI state lives in Zustand; business data access is strictly governed via TanStack Query hooks.
2. **Atomic Inventory Audit Trail:** All stock changes (restocks, sales, damaged goods, physical adjustments) must write immutable audit rows to `inventory_transactions`.
3. **Transaction Safety:** Multi-table writes (stocktake session commits, restocks) must execute atomically inside `db.withTransactionAsync` blocks.
4. **Physical Stocktake Isolation:** Manual stock changes during an active stocktake session must be gated via `useStocktakeGuard` to prevent race conditions in variance calculation.

## Decision

1. **Unidirectional Architecture:**
   `app/(tabs)/inventory` (UI Layer) -> `hooks/` (Data Access Layer) -> `database/` (SQLite Query Layer) -> SQLite (`configs/sqlite.ts`).
2. **Atomic Multi-Table Commit:**
   Physical stocktake commits write `inventory_transactions` adjustment rows, update `products.quantity`, and finalize `stocktake_sessions` inside a single `db.withTransactionAsync` block.
3. **Stocktake Count Baseline Safety:**
   `startSession()` pre-populates `stocktake_counts` with initial `counted_qty = p.quantity` so uncounted items evaluate to `0` variance instead of wiping inventory stock to zero.
4. **Performance Indexing:**
   Composite covering index `idx_inventory_tx_timestamp` (`timestamp DESC, id DESC`) and `idx_inventory_tx_product_id` guarantee $O(\log N)$ cursor pagination for movement timeline feeds.

## Alternatives Considered

### In-Memory State Caching in Zustand

- _Pros:_ Instant synchronous state updates without database queries.
- _Cons:_ Violates offline-first single source of truth; risks state drift and uncommitted data loss on app crash.
- _Decision:_ Rejected per `obsidian-vault/CONTEXT.md`. SQLite is the sole source of truth.

### Non-Transactional Independent SQL Writes

- _Pros:_ Simpler asynchronous query strings without `withTransactionAsync`.
- _Cons:_ Partial mutation failure during multi-table writes leaves database in an inconsistent state (e.g. `inventory_transactions` row inserted without `products.quantity` update).
- _Decision:_ Rejected. All ledger mutations must use `db.withTransactionAsync`.

## Consequences

- Every stock adjustment creates a traceable audit row in `inventory_transactions`.
- Sub-tab screens remain fast, responsive, and crash-resilient under heavy transaction volume.
- Offline backup and restore preserve complete historical stock timelines.

## References

- Code: `app/(tabs)/inventory/`, `database/inventory.ts`, `database/products.ts`, `database/stocktake.ts`, `hooks/useProducts.ts`
- Related notes: [[tech-note-template]], [[CONTEXT]]
- MOC: [[decisions-moc]]
