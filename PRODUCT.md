# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Filipino sari-sari store owners who run their retail business offline at the store counter. They need to quickly register sales, update inventory stock, and track suki loan ledgers.

Helpers (family members or a bantay) also operate the app day to day, mainly to ring up sales. The owner PIN locks owner-only actions so helpers can sell without touching sensitive settings or records.

## Product Purpose

SariSari is an offline-first mobile app that acts as a business assistant and POS. It enables store owners to manage inventory, run quick counter checkouts, and maintain a 100% accurate customer credit (utang) ledger with zero network dependencies.

## Positioning

SariSari replaces the paper notebook and calculator rather than imitating a generic POS:

- **Fully offline.** Sales, inventory, utang, and reports work end to end in airplane mode; no signal or data plan is needed.
- **Exact utang ledger.** Payments are allocated FIFO against the oldest unpaid credit, and balances are integer-accurate, so the owner can trust them and show them to the suki.
- **Built for sari-sari.** Tingi and pakyaw pricing, owner-entered barcodes, Tagalog and English, and the Sari mascot.
- **Free and local.** No account, subscription, or cloud lock-in; the store's data stays on the phone.

## Operating Context

- Used at a physical store counter, often under bright daylight, with customers waiting.
- Several people may share one phone: the owner plus helpers ringing up sales.
- Sales are cash or credit (utang); credit checkouts are not counted as sales.
- Barcode scanning looks up products offline; owners set each product's barcode, and the app learns it on save.
- Suki statements and the palengke sheet are shared as PDFs from the device.
- The UI ships in English and Tagalog (`locales/en`, `locales/tl`).

## Capabilities and Constraints

- Core jobs: inventory and categories, POS checkout, and the suki utang ledger.
- Also built: supplier directory, receiving and delivery receipts, stocktake, repricing, cash entries, e-services ledger, reports, and local backup.
- Owner PIN with recovery code gates owner-only actions; biometrics are optional.
- Money is stored as integer centavos; all currency must stay integer-accurate.
- No automatic cloud backup; there is no network dependency for core features.
- Planned, not built: automated payer risk profiles and credit-limit enforcement at sale time.

## Brand Commitments

Tactile & Cozy. Warm, receipt-paper aesthetic utilizing the mascot Sari (an interactive garapon jar representing store readiness, alerts, sales, and success) to make business tasks feel human, accessible, and friendly.

## Anti-references

- Generic SaaS UI clichés (e.g. ghost-cards with thin borders and huge soft shadows, tiny tracked uppercase eyebrows on every section).
- Overly complex navigation layouts (nested settings, multi-step checkout wizards, heavy nested modals).
- High-latency UI elements (spinners inside lists, slow animations, blocking transition sequences).
- Overly saturated accents on non-interactive states.

## Evidence on Hand

- Pilot stores use the app. This is internal only: never cite pilots, their counts, or their feedback in app copy or marketing.
- A feedback survey exists (`SURVEY.md`); no results are recorded, so none may be quoted.
- Real product assets: the Sari mascot (`components/mascot/`).
- No testimonials, ratings, install counts, or press exist. Do not fabricate them.

## Product Principles

- **Sari (Garapon) Integration**: Keep the mascot present in empty states, error states, and dashboards to visually guide the store owner through the store's current health.
- **Rapid POS Checkout**: Focus on micro-efficiency. Minimize taps and steps at the counter.
- **Auditability & Ledger Clarity**: Provide clear, easy-to-read, integer-accurate lists of transactions and live suki balance histories to build trust.
- **Offline Is the Default**: Every core flow must work without a network; never gate a counter task on connectivity.
- **Owner Stays in Control**: Helpers can sell freely, but anything that changes money records or settings stays behind the owner PIN.

## Accessibility & Inclusion

- Large, reliable tap targets for fast POS entry.
- High-contrast typography (body text ink-900 against light-toned paper/parchment surfaces).
- Instant or near-instant UI transitions (<150-250ms) with proper support for reduced motion preferences.
