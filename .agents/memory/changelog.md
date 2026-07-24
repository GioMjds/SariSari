# Memory: Project Changelog

## Current Baseline

### Version 0.1.0 - Initial Web Foundation & Design System Alignment

- Architecture Setup:
  - Configured Vite + React 19 + TypeScript build pipeline with `@tailwindcss/vite` and Tailwind CSS v4.
  - Implemented client-side routing via React Router DOM v7 across core views (`Home`, `Features`, `About`, `FAQ`, `Contact`, `FeatureRequests`, `NotFound`).
  - Integrated shadcn/ui components (`button`, `card`, `dialog`, `accordion`, `sonner`, `combobox`, `navigation-menu`).
- Design Token Implementation:
  - Established "The Sari-Sari Receipt Ledger" design system in `src/index.css`.
  - Configured typography scale (`Outfit` for display headings, `Plus Jakarta Sans` for body copy).
  - Defined brand palette including Active Persimmon (`#E85A1F`), Refreshing Sage (`#4F7A24`), Cream Paper (`#FBF7EE`), and Dark Ink (`#0E0C0A`).
- Layout & Component Structure:
  - Created `MainLayout.tsx` with responsive `Header` and `Footer` navigation.
  - Built interactive screenshot gallery `AppScreenshotGallery.tsx`.
- Support Form UI:
  - Implemented Taglish contact form view in `src/pages/Contact.tsx`.
