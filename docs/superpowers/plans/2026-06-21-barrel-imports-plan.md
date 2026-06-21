# Implementation Plan: Folder-Level Barrel Imports

## Overview
Implement folder-level barrel imports across all core directories and refactor the entire codebase to import from these barrels.

## Architecture Decisions
- **Approach 1 (Folder-Level Barrels)**: Barrels will be created at the sub-folder level for components (e.g. `components/ui`, `components/inventory`) to avoid namespace conflicts, and at the root level for single-depth folders (`db/`, `hooks/`, `stores/`, `types/`, `constants/`, `lib/`, `utils/`).
- **Strict Typing & Resolution**: Use TypeScript's default resolving behavior for path aliases (`@/*` mapping to `./*`). No changes to `tsconfig.json` are necessary.

---

## Task List

### Phase 1: Foundation (Creating Barrels)

#### Task 1: Create Component Barrel Files
Create barrel files (`index.ts` / `index.tsx`) in all sub-folders of `components/` to export all their constituent components.
*   **Acceptance criteria:**
    *   `components/ui/index.ts` exports all UI components as named exports.
    *   `components/elements/index.ts` exports all element components.
    *   `components/layout/index.ts` exports layout components.
    *   `components/inventory/index.ts` exports inventory components.
    *   `components/products/index.ts` exports products components.
    *   `components/credits/index.ts` (rewrite existing) exports credit components.
    *   `components/reports/index.ts` exports report components.
    *   `components/sales/index.ts` exports sales components.
*   **Verification:**
    *   Files exist and export correctly.
*   **Dependencies:** None
*   **Files likely touched:**
    *   `components/ui/index.ts` (new)
    *   `components/elements/index.ts` (new)
    *   `components/layout/index.ts` (new)
    *   `components/inventory/index.ts` (new)
    *   `components/products/index.ts` (new)
    *   `components/credits/index.ts` (modified)
    *   `components/reports/index.ts` (new)
    *   `components/sales/index.ts` (new)
*   **Estimated scope:** Small

#### Task 2: Create Core Directory Barrel Files
Create barrel files in single-depth root directories (`db/`, `hooks/`, `stores/`, `types/`, `constants/`, `lib/`, `utils/`).
*   **Acceptance criteria:**
    *   `db/index.ts` exports all database domain functions (excluding `seed.ts`).
    *   `hooks/index.ts` exports all query/mutation hooks.
    *   `stores/index.ts` exports all Zustand UI stores.
    *   `types/index.ts` exports all TypeScript types, including sub-folder `types/ui/*.ts`.
    *   `constants/index.ts` exports all constants.
    *   `lib/index.ts` exports onboarding storage and core libraries.
    *   `utils/index.ts` (or `@/utils` mapped from `utils/index.ts`) exports all formatter, alert, and timezone utilities.
*   **Verification:**
    *   Files exist and compile correctly.
*   **Dependencies:** None
*   **Files likely touched:**
    *   `db/index.ts` (new)
    *   `hooks/index.ts` (new)
    *   `stores/index.ts` (new)
    *   `types/index.ts` (new)
    *   `constants/index.ts` (new)
    *   `lib/index.ts` (new)
    *   `utils/index.ts` (new)
*   **Estimated scope:** Small

### Checkpoint: Foundation
*   [ ] All new index files are verified with no TypeScript compiler errors.

---

### Phase 2: Refactoring Codebase Imports

#### Task 3: Refactor Imports in `components/` Directory
Search and update all imports inside the `components/` subdirectories to use the new barrel entry points.
*   **Acceptance criteria:**
    *   Any component-to-component or component-to-hook/db/store import uses the barrel pattern (e.g. `import { MoneyText } from '@/components/ui';` instead of `@/components/ui/MoneyText`).
*   **Verification:**
    *   Run type checker: `npx tsc --noEmit`
*   **Dependencies:** Task 1, Task 2
*   **Files likely touched:**
    *   Various files under `components/**/*.tsx`
*   **Estimated scope:** Medium

#### Task 4: Refactor Imports in `app/` (Screens/Routes)
Search and update all imports inside the `app/` directory (screens, layouts, onboarding, sub-forms) to use the new barrel entry points.
*   **Acceptance criteria:**
    *   All screen files under `app/` import components, hooks, db methods, stores, etc., using the clean barrel paths.
*   **Verification:**
    *   Run type checker: `npx tsc --noEmit`
*   **Dependencies:** Task 1, Task 2
*   **Files likely touched:**
    *   Various files under `app/**/*.tsx` and `app/**/*.ts`
*   **Estimated scope:** Large

---

### Checkpoint: Complete Refactoring Verification
*   [ ] `npx tsc --noEmit` passes without errors.
*   [ ] `npm run lint` or `npx expo lint` passes without errors.
*   [ ] All Jest tests pass: `npm test`

---

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Namespace naming conflicts in future | Low | Folder-level isolation prevents component naming conflicts. For global imports, distinct naming will be enforced. |
| Circular dependencies created by barrels | Medium | Be careful not to import from a barrel within the files that define the barrel's exports. Keep internal/co-located imports relative (e.g. `import X from './X'`) to avoid cycle loops. |
