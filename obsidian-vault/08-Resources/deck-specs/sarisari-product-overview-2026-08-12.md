---
title: SariSari Product Overview Deck Spec
description: Slide-by-slide build spec for the 16:9 product-overview pitch deck — copy, layout, colors, image placeholders. Source for Canva build.
type: resource
status: draft
created: 2026-08-12
---

# SariSari — Product Overview Deck

**Audience:** Mang Bert / Aling Nene — neighborhood tindero/tindera. Everyday, non-technical.
**Format:** 16:9 presentation (1920×1080).
**Voice:** Mainit. Tapat. Magaan. (Per `09-Marketing/strategy/brand-voice.md`)
**Source notes:** `obsidian-vault/00-Vision/project-vision.md`, `obsidian-vault/09-Marketing/strategy/audience-persona.md`, `obsidian-vault/09-Marketing/strategy/brand-voice.md`, `obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md`, `tailwind.config.js`.

---

## Color tokens (from `tailwind.config.js`)

| Token | Hex | Use |
|---|---|---|
| Persimmon-500 | `#E85A1F` | ★ Brand — primary surfaces, CTAs, big titles on light |
| Persimmon-600 | `#C8460F` | Hover / pressed |
| Persimmon-100 | `#FFE0D1` | Soft brand surface |
| Cinnamon-500 | `#623418` | Deep brand — dark backgrounds, ink-strong |
| Cinnamon-700 | `#391C0A` | Darkest surfaces |
| Sage-500 | `#4F7A24` | Accent — "cash" / success highlights only |
| Sage-50 | `#EEF4E5` | Soft success surface |
| Paper-50 | `#FAFAF7` | Brightest card / page surface |
| Paper-200 | `#F7F6F2` | Page background |
| Paper-300 | `#E6E3D8` | Border / divider |
| Ink-900 | `#0E0C0A` | Body text |
| Ink-600 | `#3D372F` | Secondary text |
| Semantic-warning | `#C77B0E` | Alerts |
| Semantic-danger | `#C13030` | Errors / overdue |

**Rule:** Persimmon = action, Cinnamon = depth, Sage = money/cash only, Paper = neutral surface, Ink = type.

---

## Typography

Use Canva's **Plus Jakarta Sans** (closest match to the app's `StackSansText` family). Weights:
- **Bold (700-800)** — slide titles, hero stats
- **Medium (500)** — sub-headings
- **Regular (400)** — body copy
- Avoid italics; we don't use them in-app either.

Sizes (in Canva px on 1920×1080 canvas):
- Hero / display: **120-160 px**, line-height 1.0
- Slide title: **72-88 px**
- Section eyebrow: **20-24 px**, all-caps, letter-spaced 0.14em
- Body: **28-32 px**, line-height 1.4
- Caption / footnote: **18-20 px**

---

## Slide-by-slide

### Slide 1 — Cover

- **Background:** Persimmon-500 `#E85A1F` full bleed
- **Top-left corner:** Logo `assets/images/logo-transparent.png` (cream/white version preferred; if not available, use the transparent one and let it sit on persimmon). Size: ~280×280 px, padding 80 px.
- **Center title:** `SariSari` — Plus Jakarta Sans Bold, 200 px, color `#FAFAF7`.
- **Sub-tagline (under title):** `Para sa mga tindahang tunay na nagsusikap.` — Regular, 36 px, color `#FFE0D1`.
- **Bottom-right corner:** small "v0.1 · August 2026" caption in persimmon-100.
- **Image frame:** none.
- **Margins:** 80 px all sides.

---

### Slide 2 — Para sa mga tindahang tunay na nagsusikap (audience)

- **Background:** Paper-200 `#F7F6F2`.
- **Left column (60% width):**
  - **Eyebrow:** `PARA KANINO` — Persimmon-700, 20 px, all-caps, letter-spaced.
  - **Title:** `Yung tipong tindahan na bukas ng 5:30, sarado ng 10. Yung may suki na hindi na tinatanong kung pwede mag-utang — alam nilang pwede.` — Ink-900, 56 px.
  - **Body:** `Si Mang Bert. Si Aling Nene. Yung mga kapitbahay mo na bumibili ng piso-piso at nagbabayad ng isang linggo mamaya. Ito ang app para sa kanila.` — Ink-600, 32 px.
- **Right column (40% width):**
  - **Image frame:** rounded rectangle (16 px radius), placeholder for a candid photo of a sari-sari store counter. Caption below: `[ photo placeholder ]`.
- **Bottom:** tiny "SariSari · Product overview" footer, ink-400.

---

### Slide 3 — Ang problema (the problem)

- **Background:** Paper-50 `#FAFAF7`.
- **Title (top-left):** `Tatlong bagay na hindi mo na kailangang tiisin.` — Ink-900, 72 px.
- **Three stacked cards (one per row, full width, 200 px tall, 32 px gap):**
  - **Card 1 — Stockout (Persimmon-100 surface, Persimmon-700 number "01"):**
    - `Nawawalan ng stock sa gitna ng benta.`
    - Sub: `At hindi mo alam kung ano pa pwede pang mawala.`
  - **Card 2 — Utang (Sage-50 surface, Sage-700 number "02"):**
    - `Suking nakakalimot, utang na hindi nababayaran.`
    - Sub: `Yung listahan sa notebook, hindi na sapat.`
  - **Card 3 — Kaha (Cinnamon-50 surface, Cinnamon-700 number "03"):**
    - `Hindi mo alam kung magkano talaga ang kinita kagabi.`
    - Sub: `Kahit na bilang mo lahat ng benta, may kulang pa rin.`
- Each card: 40 px padding, 12 px radius. Number = 80 px Bold. Title = 36 px Bold ink-900. Sub = 22 px Regular ink-600.

---

### Slide 4 — Ano ang SariSari (one-line)

- **Background:** Cinnamon-700 `#391C0A` full bleed.
- **Center hero:**
  - **Eyebrow:** `ONE-LINER` — Persimmon-300, 22 px, letter-spaced.
  - **Title (3 lines, centered):**
    `Isang assistant para sa sari-sari store.`
    `Nasa phone mo lang.`
    `Walang internet, walang subscription, walang login.`
    — Plus Jakarta Sans Bold 80 px, color `#FAFAF7`. Line-height 1.15.
  - **Sub (below title, centered):** `Stock. POS. Utang. Backup. Lahat on-device.` — Sage-200, 32 px.

---

### Slide 5 — Gumagana sa phone nila (works on their phone)

- **Background:** Paper-200.
- **Title:** `Built for the phone they already have.` — Ink-900, 72 px.
- **Subtitle:** `Mid-range Android, 2-4 years na. Kahit walang signal, gumagana.` — Ink-600, 32 px.
- **Four icon-style tiles in a row (260×260 px each, 40 px gap):**
  1. **Offline badge** — Persimmon-500 background, white icon (wifi-off style). Caption: `Offline-first`.
  2. **No login badge** — Cinnamon-500 background, cream icon. Caption: `Walang sign-up`.
  3. **No subscription badge** — Sage-500 background, cream icon. Caption: `Single purchase`.
  4. **Mid-range badge** — Ink-700 background, paper icon. Caption: `Luma o bago, OK`.
- Each tile: centered icon (80 px), caption below in Paper-200, 22 px.

---

### Slide 6 — Stock na hindi nawawalan

- **Background:** Paper-50.
- **Eyebrow (top-left):** `INVENTORY` — Persimmon-700.
- **Title:** `Stock na hindi nawawalan.` — Ink-900, 80 px.
- **Body:** `Live inventory. Fast-lane POS na naka-save sa mga paborito. Low-stock alerts sa umaga. Restock suggestions by supplier.` — Ink-600, 32 px.
- **Right side:** Image frame (480×640 px rounded rect) — placeholder for "POS / Inventory screen" screenshot. Caption: `[ screenshot placeholder ]`.
- **Bottom strip — three stats (Persimmon-100 surface):**
  - `+1 / +2 / +5` — Mabilis na buttons
  - `28-day sales history` — Restock logic
  - `Barcode scan` — Optional, hindi required

---

### Slide 7 — Utang na hindi nakakalimot

- **Background:** Sage-50 `#EEF4E5` (subtle, signal: this is the credit side).
- **Eyebrow:** `UTANG` — Sage-700.
- **Title:** `Utang na hindi nakakalimot.` — Ink-900, 80 px.
- **Body:** `Live suki balance sa bawat checkout. Collection queue para sa mga overdue at near-limit. Printable statement via PDF — share mo lang sa Messenger.` — Ink-600, 32 px.
- **Right:** Image frame (480×640) — placeholder for "Suki ledger / collection queue" screenshot. Caption: `[ screenshot placeholder ]`.
- **Bottom strip — three stats on Sage-500 background, paper text:**
  - `FIFO payment allocation` — Reversible when payment is deleted
  - `Override reason codes` — Auditable
  - `PDF statement share` — Offline, no email needed

---

### Slide 8 — Kaha na malinaw araw-araw

- **Background:** Paper-50.
- **Eyebrow:** `CASH CLOSE-OUT` — Cinnamon-700.
- **Title:** `Kaha na malinaw araw-araw.` — Ink-900, 80 px.
- **Body:** `Opening float, cash in/out, sales, expected vs actual, variance — lahat naka-log. May reason code para sa bawat kakaiba.` — Ink-600, 32 px.
- **Right:** Image frame (480×640) — placeholder for "Cash session summary" screenshot. Caption: `[ screenshot placeholder ]`.
- **Bottom — single stat tile (Cinnamon-50, 24 px radius):**
  - `expectedCash = openingFloat + cashSales + cashPayments + ownerAdditions − expenses − ownerDrawings` — mono-style font, 28 px, ink-700. Tag: "Computed inside one transaction".

---

### Slide 9 — Privacy by default

- **Background:** Cinnamon-700.
- **Title (centered):** `Lahat ng data, nasa phone mo lang.` — Paper-50, 80 px.
- **Sub:** `Walang cloud account. Walang auto-sync. Manual encrypted backup lang kung gusto mo.` — Paper-100, 32 px.
- **Three icon-row items (white icons, paper text):**
  1. `SQLite on-device` — Local-first source of truth.
  2. `Manual backup` — Encrypted snapshots, ikaw ang nag-trigger.
  3. `No login required` — Hindi nagtatanong ng email.

---

### Slide 10 — 5 tabs, walang kalat

- **Background:** Paper-200.
- **Title:** `Limang tabs. Itrabaho lang ang kailangan.` — Ink-900, 72 px.
- **Five tab mockups in a row (300×420 px each, 24 px gap), each with rounded-top + brand color stripe at top:**
  - **Home (Today)** — Persimmon-500 stripe. Caption: `Alerts, quick jumps.`
  - **Sales (POS)** — Cinnamon-500 stripe. Caption: `Cart, suki balance, park cart.`
  - **Inventory** — Sage-500 stripe. Caption: `Stock, movements, restock.`
  - **Customers (Utang)** — Persimmon-600 stripe. Caption: `People, collection queue.`
  - **More** — Ink-700 stripe. Caption: `Reports, cash, backup, settings.`
- Each tile: small "iPhone frame" inner area, paper-50 fill, tab name at top, caption below.

---

### Slide 11 — Built by an indie dev, in public

- **Background:** Paper-50.
- **Title:** `Built by one dev. In public. Tapat.` — Ink-900, 80 px.
- **Body:** `Walang board meeting. Walang "synergy." Isang tao, isang phone, isang SQLite file. Kapag may gumagana, naka-ship. Kapag hindi, narito rin naman.` — Ink-600, 32 px.
- **Pull-quote (right side, large):** `"Walang bayad na subscription, walang 'cloud sync' na wala naman silang internet."` — Cinnamon-500, 36 px italic-allowed. Attribution: `— Mang Bert, probinsya` (representative).
- **Footer:** `Source code available · Built with Expo, React Native, SQLite` — Ink-400, 18 px.

---

### Slide 12 — Saan na ngayon (status)

- **Background:** Paper-200.
- **Title:** `Saan na ngayon.` — Ink-900, 80 px.
- **Three-column layout (one per phase), each column 540 px wide:**

  | Now (Persimmon-100 surface) | Next (Paper-50 surface) | Later (Paper-100 surface) |
  |---|---|---|
  | ✓ POS Fast Lane | Voids / Refunds / Corrections | Expiry & Damaged |
  | ✓ Parked Sales | Supplier Delivery Receiving | Transparent Insights |
  | ✓ Daily Cash Close-Out | Offline Reorder Suggestions | Smarter Credit Profiles |
  | ✓ Physical Stocktake | Stock Movement Timeline | Shift Tracking |
  | ✓ Utang Guardrails | Owner PIN | Backup & Restore |
  | ✓ Collection Queue | Credit Statement PDF | Price Labels |

- **Footer:** `10 Done · 4 Partial · 4 Next · Plus 4 later-phase` — Ink-600, 24 px.

---

### Slide 13 — Closing CTA

- **Background:** Persimmon-500 full bleed.
- **Center hero:**
  - **Logo** at top center (cream version, 200×200 px).
  - **Title:** `Salamat.` — Paper-50, 160 px.
  - **Sub:** `Try it. Sundan ang build. Mag-suggest ng suki na hindi mo pa nafi-feature.` — Paper-100, 32 px.
  - **Bottom three lines (centered, small):**
    - `github.com/[your-handle]/sarisari`
    - `@sarisariapp` (or your handle)
    - `[your-email]`
    — Persimmon-100, 24 px.
- **Tiny corner mark:** `v0.1 · August 2026` — Persimmon-200, bottom-right.

---

## Build order in Canva

1. Create a **Brand Kit** in Canva (Settings → Brand Kit) with the colors above.
2. Create a **new 16:9 Presentation** (blank, not a template — we want full layout control).
3. Build slides in order: 1, 13, 4, 9 (the high-impact Persimmon/Cinnamon hero slides), then 2, 3, 5, 6, 7, 8, 10, 11, 12 (the content-heavy ones).
4. Use the **same** grid: 80 px outer margin, 60 px inner gutter, columns at 1920×1080.
5. Drop in `assets/images/logo-transparent.png` wherever the logo appears.
6. Leave the image-frame placeholders empty — user will fill with screenshots later.

## Image placeholder spec (for later fill)

| Slide | Position | Aspect | Suggest |
|---|---|---|---|
| 2 | Right 40% | 3:4 portrait | Candid sari-sari counter |
| 6 | Right column | 3:4 portrait | POS or inventory screen |
| 7 | Right column | 3:4 portrait | Suki ledger or collection queue |
| 8 | Right column | 3:4 portrait | Cash session summary |

When user takes app screenshots, save them to `assets/images/screenshots/` and drop them in.

---

## Related

- [[brand-voice]] — Voice rules this deck follows.
- [[audience-persona]] — Mang Bert / Aling Nene framing.
- [[../../01-Roadmap/feature-implementation-status-and-ia|Feature Status & IA]] — Status numbers used on slide 12.
- [[../../02-Features/features|Feature catalog]] — Full feature list with status.