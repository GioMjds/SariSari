---
name: '⚡ Refactoring & Code Enhancement'
about: Propose a performance, structure, UX detail, or code quality improvement.
title: '[ENHANCEMENT] '
labels: refactor, performance
assignees: ''
---

## Proposed Enhancement

<!-- What part of the codebase/UI do you want to refactor or enhance? -->

## Rationale

<!-- Why should we implement this? (e.g., bundle size reduction, UI responsiveness, code readability, performance boost, etc.) -->

## Core Invariants Verification

<!-- Any enhancement must preserve our core invariants. Please confirm the following: -->

- [ ] **Hard Offline-First**: Does not introduce any external server dependencies in core flows.
- [ ] **Money is Integer Pesos**: Uses integer pesos for money storage and operations (represented in centavo-equivalent, e.g. `₱12.50` -> `1250`).
- [ ] **Utang Invariant**: Customer balance is strictly computed as `SUM(amount) - SUM(amount_paid)`.
- [ ] **Single SQLite Connection**: Leverages the shared expo-sqlite database handle.
- [ ] **Layering Rule**: Does not bypass the hook layer (Screen -> Hook -> DB -> SQLite).

## Implementation Details

<!-- If you have an idea of how to implement this, please describe it here (e.g., changes to db/, hooks/, components/). -->
