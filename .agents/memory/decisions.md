# Memory: Architecture Decision Records (ADRs)

## ADR-001: Vite + React 19 + Tailwind v4 Stack

- **Context**: The site is a fast, high-performance marketing and support application for Filipino store owners on mobile hardware.
- **Decision**: Use Vite for lightning-fast bundling, React 19 for modern component rendering, and Tailwind CSS v4 for utility styling.
- **Consequences**: Fast page loads, zero unnecessary framework overhead, and clear token integration via `@theme` in `src/index.css`.

## ADR-002: Serverless Nodemailer Email Handling

- **Context**: The contact support form requires sending email notifications to `support@sarisariapp.ph` without exposing SMTP credentials in client JS.
- **Decision**: Keep email processing in Vercel Serverless Functions under `api/contact.ts`. The client submits JSON payloads to `/api/contact`.
- **Consequences**: Secure SMTP credentials, decoupled backend API logic, and seamless Vercel deployment compatibility.

## ADR-003: Strict Separation of Concerns (Hooks, Sections, Pages)

- **Context**: Prevent large monolithic page components and bloated state management.
- **Decision**:
  - Pages (`src/pages/*`) handle route containers.
  - Sections (`src/components/sections/*` or `src/components/<page>/*`) contain visual UI layout.
  - Custom Hooks (`src/hooks/*`) contain all form state, fetch calls, and validation logic.
  - Zustand (`src/stores/*`) is restricted strictly to global client UI state.
- **Consequences**: High maintainability, clear module boundaries, and reusability.

## ADR-004: "Receipt Ledger" Design System

- **Context**: The brand must appeal directly to local Sari-Sari store owners while guaranteeing mobile screen legibility in bright sunlight.
- **Decision**: Use warm cream paper (`#FBF7EE`), dark ink text (`#0E0C0A`), 1px borders over heavy drop shadows, and Active Persimmon (`#E85A1F`) accents limited to <=10% of any view.
- **Consequences**: Unique local merchant brand identity, high WCAG AA contrast, and anti-cliché modern aesthetic.
