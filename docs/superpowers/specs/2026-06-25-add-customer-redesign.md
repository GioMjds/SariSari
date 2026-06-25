# Design Spec: Add Customer Redesign

- **Date:** 2026-06-25
- **Author:** Antigravity AI
- **Status:** Approved by User
- **Target File:** [app/(edit-forms)/add-customer/index.tsx](file:///C:/Users/giomj/OneDrive/Desktop/SariSari/app/%28edit-forms%29/add-customer/index.tsx)

---

## 1. Objective & Context

The current **Add Customer** screen (`app/(edit-forms)/add-customer/index.tsx`) presents a standard form that, while functional, lacks premium styling, visual feedback, and does not align with the custom warm-themed paper/cinnamon design system used across SariSari. 

This redesign improves the Quality of Life (QoL) when registering customer accounts by introducing:
1. **Interactive Suki Passbook Preview Card:** A beautiful, dark-cinnamon colored passbook-like card (`#623418`) at the top of the form. It updates dynamically in real-time as the owner fills out the Suki's Name, Phone, and Credit Limit, providing satisfying visual feedback.
2. **Cozy Analog Paper Design:** Transitioning standard flat fields into card groups with warm, parchment-colored containers, refined typography, and dotted dividers.
3. **Ergonomic Native Touch Controls:** Soft micro-animations, clear validation highlights with Persimmon focus borders, and clean, legible help tooltips to support one-handed entries.
4. **Preservation of Core Rules:** Adhering strictly to integer-based peso parsing for credit limits and transaction integrity outlined in `AGENTS.md`.

---

## 2. Requirements & User Experience

### A. Layout Structure (Parchment & Cinnamon Card Theme)
- **Background:** The screen outer container uses `bg-background` (`paper-200`, `#EFE6D2`).
- **Passbook Card Hero:** Positioned at the top of the form, simulating a physical cardboard account passbook or member card:
  - Background: `bg-cinnamon-500` (`#623418`) with a subtle `border-cinnamon-400` border.
  - Accent details: A large semi-transparent `₱` or `S` character overlaying the background, and a custom tag showing `New Suki` (utilizing a clear Persimmon badge: `bg-persimmon-500/20 border border-persimmon-500 text-persimmon-300`).
- **Grouped Field Cards:** Fields are grouped into three physical white card blocks:
  - **Group 1: Suki Information:** Customer Name (Required, with orange star symbol and highlight active border) and Phone Number (with icon).
  - **Group 2: Account Settings:** Credit Limit (with peso symbol) and Address (with map-marker icon).
  - **Group 3: Internal Notes:** A spacious multiline field for private comments.
- **Section Dividers:** Dotted border lines to section contents nicely: `border-t border-dashed border-ink-200`.

### B. Interactive Controls & Live Preview Logic
1. **Live Preview Data Binding:**
   - **Name:** Watch the `name` field using react-hook-form's `watch()`. Defaults to `Suki Name` or `Juan dela Cruz` as a light gray placeholder on the card.
   - **Phone:** Watch the `phone` field. Formats dynamically to standard format. Displays a placeholder if empty.
   - **Credit Limit:** Watch the `credit_limit` field. If blank or invalid, display **"No Limit"** in gold (`#FF9E76`) to denote open-ended borrowing. If a valid peso input is entered, format it as a currency value (e.g. `₱ 2,000.00`).
2. **Tactile Inputs:**
   - Text inputs use `bg-white` and when active transition to `border-persimmon-500` with a subtle highlight.
   - Large, clear touch targets for fields.
3. **Animations:**
   - Tapping input fields or the submit button triggers soft scaling animations using `Moti` (e.g., `animate={{ scale: isPressed ? 0.98 : 1 }}`).

---

## 3. Data Flow & Security Guards

### A. SQLite Integrity & Math
- **No Floats:** Credit limits are parsed using `tryParsePesosInput` and `parsePesosInput` from `@/lib/money` to convert the user's decimal inputs into integer centavos/pesos. Empty fields are saved as `undefined` (which maps to NULL in SQLite).
- **Mutations:** Submitting the form calls `useInsertCustomer` hook, which triggers the transaction-wrapped database insert function in `database/credits.ts` and invalidates query caches `['customers']` and `['credit-kpis']`.

### B. State Management Diagram

```mermaid
graph TD
  User((User)) -->|Types Name, Phone, Limit| Form[React Hook Form Context]
  Form -->|watch| LiveCard[Passbook Preview Card updates live]
  LiveCard -->|Empty Limit| ShowNoLimit[Display 'No Limit']
  LiveCard -->|Limit filled| FormatLimit[Parse & format display currency]
  Form -->|Submit Form| ParseDecimal[parsePesosInput: decimal input -> integer centavos]
  ParseDecimal -->|Mutation payload| useInsertCustomer[hooks/useCredits: useInsertCustomer]
  useInsertCustomer -->|SQLite transaction| db_credits[database/credits.ts: insertCustomer]
  db_credits -->|Success| Invalidate[QueryClient: Invalidate customers + KPIs]
  Invalidate -->|Router Go Back| Back[router.back()]
```

---

## 4. Design Tokens & Styling Cheat Sheet

We will use the following custom Tailwind values defined in the SariSari design system:

- **Layout Background:** `bg-background` (`#EFE6D2`)
- **Passbook Card Background:** `bg-cinnamon-500` (`#623418`)
- **Passbook Text Highlight:** `text-persimmon-300` (`#FF9E76`)
- **Card Fields Background:** `bg-paper-50` (`#FBF7EE`) / `bg-white`
- **Active Focused Border:** `border-persimmon-500` (`#E85A1F`)
- **Borders & Dividers:** `border-paper-300` (`#E5D8BC`)
- **Standard Text Ink:** `text-ink-900` (`#0E0C0A`) / `text-ink-600` (`#3D372F`)
- **Helper Subtitles:** `text-ink-400` (`#7A7165`)
- **Notice Alert Banner:** `bg-sage-50 border border-sage-200`
- **Submit Button:** `bg-secondary-500` (`#4F7A24`)

---

## 5. Verification & Quality Gates

- **Visual Quality Gate:** Open the screen to verify that the Live Passbook Card renders at the top and updates on every keystroke.
- **Offline-First Gate:** Confirm the form works, validates required fields, and submits successfully in Airplane Mode (zero network dependency).
- **Format Integrity Gate:** Verify that empty credit limits are parsed as `undefined` and valid ones are saved as integers, never decimals.
