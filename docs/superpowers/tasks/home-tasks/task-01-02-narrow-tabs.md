# Task 01-02: Narrow HOME_SUB_TABS const and HomeSubTab type

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Replace the three-entry `HOME_SUB_TABS` const with a two-entry one. `HomeSubTab` automatically narrows since it is derived via `(typeof HOME_SUB_TABS)[number]`.

## Dependencies

- [01-01](./task-01-01-locate-tabs.md)

## Files

- Modify: `constants/tabs.ts:66`

## Steps

- [ ] **Step 1: Replace the const definition**

In `constants/tabs.ts`, replace:

```ts
export const HOME_SUB_TABS = ['overview', 'today', 'alerts'] as const;
```

with:

```ts
export const HOME_SUB_TABS = ['overview', 'today'] as const;
```

`HomeSubTab` follows automatically. Do not edit the type definition.

## Commit

None yet — verification + commit happens in `task-01-03`.
