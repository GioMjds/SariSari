# Design Spec: Add Product Screen UI/UX Redesign

**Date**: 2026-06-26  
**Status**: Approved (Brainstormed with User)  
**Target Path**: `app/(edit-forms)/add-product/index.tsx`  

---

## 1. Overview & Objectives
The goal of this redesign is to replace the generic and plain UI of the **Add Product** form screen with a professional, elegant, and editorial design that aligns with SariSari's physical retail theme. 

The core user experience is structured around the **Tactile Receipt Cards** concept:
- Grouping related inputs into stacked "paper card" surfaces.
- Providing smart presets and helpers to enhance quality-of-life (QoL) for SariSari store owners who need to register products quickly at the counter.
- Strict adherence to the brand's offline-first requirement and integer pesos currency database logic.

---

## 2. Design System Alignment

We map the redesigned UI components to the established design system tokens in `tailwind.config.js` and `global.css`:

| UI Layer / Element | Tailwind / Custom CSS Class | Brand Color / Property |
| :--- | :--- | :--- |
| **Page Background** | `bg-background` (`paper-200`) | Cream background (`#EFE6D2`) |
| **Header Wrapper** | `bg-paper-50` | Off-white paper background (`#FBF7EE`) |
| **Header Border** | `border-b border-ink-100` | Soft gray divider separating header |
| **Header Text** | `text-ink-900 font-stack-sans-bold` | Crisp near-black text |
| **Form Cards** | `bg-paper-50 shadow-paper rounded-xl` | Card surfaces simulating invoice paper sheets |
| **Input Fields** | `bg-paper-100 text-ink-900 border-ink-200` | Parchment colored input fields |
| **Active Categories** | `bg-persimmon-500 text-white` | Brand Persimmon primary accent (`#E85A1F`) |
| **Inactive Categories**| `bg-paper-100 text-ink-700` | Dark parchment background with neutral text |
| **Profit Box** | `bg-sage-50 border-l-4 border-sage-500` | Soft green success banner (`#EEF4E5` / `#4F7A24`) |
| **Add Product Button** | `bg-persimmon-500 text-white shadow-persimmon-glow` | High-impact call-to-action |
| **Secondary Buttons** | `bg-paper-100 border border-ink-200 text-ink-700` | Tactile off-white button surface |

---

## 3. UI Layout & Component Specifications

The form is split into three stacked cards with smooth entrance transitions:

### Header Bar
- Minimalist back button and Title (`Add Product`).
- A subtle dotted or thin line border separating it from the main content.

### Card 1: Basic Information
- **Product Name**:
  - Focus state adds a subtle ring around the field.
  - Generates the SKU dynamically in real-time when the Auto-generate setting is active.
- **SKU (Stock Keeping Unit)**:
  - Toggled by an "Auto-generate" checkbox on the top right.
  - When checked, the text input is styled with `opacity-60` and `editable={false}` to show it is managed automatically.
  - When unchecked, the field is fully editable for custom/manual barcode input.
- **Category Selector**:
  - Renders a horizontal scrollable view of categories.
  - Selected category highlighted in Persimmon orange.
  - If no categories exist, a warning box with an info icon is displayed instead.

### Card 2: Pricing & Profit Tracker (Core QoL)
- **Cost Configuration**:
  - Custom toggle allows switching between **Single Piece** cost and **Bundle Cost**.
  - Single mode: Enter direct cost per piece.
  - Bundle mode: Enter Total Bundle Cost (₱) and Pieces per Bundle; cost per piece is calculated automatically.
- **Markup Presets Row**:
  - Quick-action buttons: `+10%`, `+20%`, `+30%`, `+50%`.
  - When tapped, the system calculates the markup price and populates the **Selling Price** input.
- **Selling Price Input**:
  - Main input field for final customer price.
  - If Selling Price is less than or equal to Cost Price, a warning message appears: *"Selling price is below or equal to cost price."*
- **Dynamic Profit Receipt Card**:
  - Rendered inside a Sage-green box simulating a receipt summary.
  - Displays computed **Profit per piece** (`Selling Price - Cost per Piece`) and **Markup %** dynamically as the user types.

### Card 3: Inventory Stock
- **Initial Stock**:
  - Input field to record initial quantities.
  - Standard helper buttons: `+5`, `+10`, `+20`.
  - Pressing a helper parses the current input, adds the amount, and writes it back (e.g. `10 -> +5 -> 15`).

---

## 4. Logical Behaviors & Calculations

### SKU Auto-Generation
```ts
const generateSku = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  const prefix = parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${timestamp}`;
};
```

### Markup Presets Calculation
When a markup preset $M$ (e.g., $0.20$ for $+20\%$) is clicked:
$$\text{Calculated Price} = \text{Cost Price} \times (1 + M)$$
This value is written to the Form State via `setValue('price', calculatedPrice.toFixed(2))`.

### Money Safety Rules
- Inputs represent float strings in the UI (e.g., `"10.00"`).
- On submission, we convert prices to integer pesos using `parsePesosInput` (e.g., `10.00` becomes `1000`).
- No float division or rounding is committed to the database.

---

## 5. Safety & Navigation Rules
- **Hardware/Software Back Buttons**:
  - Intercepted by `BackHandler` and custom header actions.
  - If changes were made to the form (`hasActualChanges` is true), displays an Alert confirming if the user wants to discard changes.
- **Required Fields**:
  - Product Name (non-empty)
  - SKU (non-empty)
  - Selling Price (> 0)
- **Submit Guard**: The submit action is disabled while the mutation is pending.

---

## 6. Testing Plan
- **Offline Integrity**: Test in Simulator with Airplane Mode enabled to verify immediate SQLite inserts.
- **Monetary Presets & Calculations**:
  - Verify that a cost price of `₱10.00` with a `+30%` preset sets the selling price to `₱13.00`.
  - Verify that a custom selling price of `₱15.00` with cost `₱10.00` calculates profit as `₱5.00` (50% markup).
- **Stock Helpers**:
  - Input `5`, tap `+10` helper, verify field updates to `15`.
- **Validation Constraints**:
  - Attempt to insert with a Selling Price less than Cost Price, verify validation error blocks the transaction.
