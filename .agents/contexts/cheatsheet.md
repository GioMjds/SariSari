# Cheatsheet — file naming & "when you're stuck"

## File-naming conventions

- React components: `PascalCase.tsx`
- Hooks: `useCamelCase.tsx` (`.tsx` because they often return JSX or use context)
- Domain files in `db/`, `hooks/`, `types/`: `camelCase.ts` matching the domain name
- Routes: `kebab-case.tsx` (expo-router maps URL segments to file names)
- Constants: `SCREAMING_SNAKE_CASE` inside `constants/`

## When you're stuck

- "Where does this code go?" → see the **layering rule** in `stack-and-architecture.md`.
- "Should this be a store or a query?" → UI state → `stores/`. Business data → `hooks/`.
- "Is this safe to call offline?" → if it's not in `onlineOnly/`, yes — and it must be.
- "How do I add a new screen?" → see the **playbook** in `playbook.md`.
