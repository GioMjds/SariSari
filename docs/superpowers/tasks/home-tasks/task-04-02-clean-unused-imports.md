# Task 04-02: Remove unused imports from DashboardHeader

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Remove the `Pressable`, `FontAwesome5`, and `Haptics` imports that were only used by the deleted bell block. Keep `StyledText` and `SubTabControl`.

## Dependencies

- [04-01](./task-04-01-strip-bell-and-props.md)

## Files

- Modify: `components/home/DashboardHeader.tsx` (imports at top of file)

## Steps

- [ ] **Step 1: Delete the unused imports**

- Delete the `Pressable` import from `react-native`.
- Delete the `FontAwesome5` import from `@expo/vector-icons` (if no other usage).
- Delete the `Haptics` import (only used inside the deleted handler).
- Keep `StyledText` and `SubTabControl`.

## Commit

None yet — verification + commit happen in `task-04-03`.