# Task 03-02: Drop alerts from TopTabs.Screen list

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Remove the `<TopTabs.Screen name="alerts" />` line from the layout file.

## Dependencies

- [03-01](./task-03-01-simplify-router-logic.md)

## Files

- Modify: `app/(tabs)/home/_layout.tsx:60-62`

## Steps

- [ ] **Step 1: Drop `alerts` from `TopTabs.Screen` list**

Replace:

```tsx
<TopTabs.Screen name="index" />
<TopTabs.Screen name="today" />
<TopTabs.Screen name="alerts" />
```

with:

```tsx
<TopTabs.Screen name="index" />
<TopTabs.Screen name="today" />
```

## Commit

None yet — verification + commit happen in `task-03-04`.
