# Feature Workflow

Workflow for planning, implementing, and integrating new application features.

## Steps

1. **Requirements & Architecture Plan**
   - Review `PRODUCT.md`, `DESIGN.md`, and `.agents/contexts/project-overview.md`.
   - Define component boundaries, state hooks, and API endpoints.

2. **Component & Logic Construction**
   - Create reusable section components under `src/components/sections/`.
   - Create custom React hooks for form or state logic under `src/hooks/`.
   - Maintain UI primitives under `src/components/ui/`.

3. **Page & Route Integration**
   - Update high-level container views under `src/pages/`.
   - Update router configurations in `src/App.tsx` if adding new routes.

4. **Build & Lint Verification**
   - Execute `npm run build` to verify TypeScript compilation.
   - Execute `npm run lint` to enforce formatting and lint rules.

5. **Activity Log Update**
   - Log completed feature work in `docs/activity-log.md`.
