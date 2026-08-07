# Sales Tab Product Cards Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the POS sales tab product cards (`ProductRow.tsx` and `FastLaneCard.tsx`) to an agency-grade double-bezel visual design with explicit bundled/wholesale badges, bulk savings indicators, and tactile dual-unit controls.

**Architecture:** Implement doppelrand (outer shell + inner core) hardware card enclosures. Add helper logic to calculate bulk savings (`retail_price * conversion_factor - wholesale_price`) and render high-contrast wholesale conversion badges (`1 PK = 12 PCs`) and savings pills (`Save ₱24.00`). Maintain React Native performance via static class mappings and memoization.

**Tech Stack:** React Native, Expo, NativeWind v4 (Tailwind), TanStack Query, `@expo/vector-icons`, Jest, `@testing-library/react-native`.

## Global Constraints

- Use `lib/money.ts` (`formatPesos`) for all money display formatting.
- Strict unidirectional architecture: UI components read props and emit events via callbacks.
- Retain memoization and static CSS interop class references for high 60fps scrolling performance.

---

### Task 1: Add Unit Tests & Helper Functions for Wholesale/Bundle Calculations

**Files:**
- Modify: `lib/money.ts`
- Create: `lib/__tests__/moneyBundle.test.ts`

**Interfaces:**
- Produces: `calculateBulkSavings(product: { price: number; wholesale_price?: number | null; conversion_factor?: number | null }): { retailEquivalent: number; wholesalePrice: number; savings: number; hasWholesale: boolean }`

- [ ] **Step 1: Write the failing unit tests for bulk savings calculation**

Create `lib/__tests__/moneyBundle.test.ts`:

```typescript
import { calculateBulkSavings } from '../money';

describe('calculateBulkSavings', () => {
  it('returns hasWholesale: false when product lacks wholesale fields', () => {
    const res = calculateBulkSavings({
      price: 15,
      wholesale_price: null,
      conversion_factor: null,
    });
    expect(res.hasWholesale).toBe(false);
    expect(res.savings).toBe(0);
  });

  it('calculates bulk savings correctly when wholesale price is lower than retail equivalent', () => {
    // Retail = 15 each. Box = 12 pcs. Retail equivalent = 180. Wholesale price = 150. Savings = 30.
    const res = calculateBulkSavings({
      price: 15,
      wholesale_price: 150,
      conversion_factor: 12,
    });
    expect(res.hasWholesale).toBe(true);
    expect(res.retailEquivalent).toBe(180);
    expect(res.wholesalePrice).toBe(150);
    expect(res.savings).toBe(30);
  });

  it('returns savings of 0 if wholesale price is not less than retail equivalent', () => {
    const res = calculateBulkSavings({
      price: 15,
      wholesale_price: 180,
      conversion_factor: 12,
    });
    expect(res.hasWholesale).toBe(true);
    expect(res.savings).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/__tests__/moneyBundle.test.ts`
Expected: FAIL with `calculateBulkSavings` is not a function.

- [ ] **Step 3: Implement `calculateBulkSavings` in `lib/money.ts`**

Add to `lib/money.ts`:

```typescript
export interface BulkSavingsResult {
  retailEquivalent: number;
  wholesalePrice: number;
  savings: number;
  hasWholesale: boolean;
}

export function calculateBulkSavings(product: {
  price: number;
  wholesale_price?: number | null;
  conversion_factor?: number | null;
}): BulkSavingsResult {
  const hasWholesale =
    product.wholesale_price != null &&
    product.wholesale_price > 0 &&
    product.conversion_factor != null &&
    product.conversion_factor >= 2;

  if (!hasWholesale) {
    return {
      retailEquivalent: 0,
      wholesalePrice: 0,
      savings: 0,
      hasWholesale: false,
    };
  }

  const wholesalePrice = product.wholesale_price!;
  const conversionFactor = product.conversion_factor!;
  const retailEquivalent = product.price * conversionFactor;
  const savings = Math.max(0, retailEquivalent - wholesalePrice);

  return {
    retailEquivalent,
    wholesalePrice,
    savings,
    hasWholesale: true,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/__tests__/moneyBundle.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/money.ts lib/__tests__/moneyBundle.test.ts
git commit -m "feat: add calculateBulkSavings helper and unit tests"
```

---

### Task 2: Redesign `ProductRow.tsx` with Doppelrand Architecture & Wholesale Savings Pill

**Files:**
- Modify: `components/sales/pos/ProductRow.tsx`
- Create: `components/sales/pos/__tests__/ProductRow.test.tsx`

**Interfaces:**
- Consumes: `calculateBulkSavings` from `@/lib/money`, `formatPesos` from `@/lib/money`
- Produces: `ProductRow` component rendering double-bezel product card with bundle/wholesale badges and dual-unit toggles.

- [ ] **Step 1: Write component tests for `ProductRow`**

Create `components/sales/pos/__tests__/ProductRow.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { ProductRow } from '../ProductRow';
import type { Product } from '@/types';

const mockProduct: Product = {
  id: 1,
  name: 'Coke Cans 330ml',
  sku: 'COKE-330',
  price: 25,
  quantity: 50,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  retail_unit_name: 'Pc',
  wholesale_unit_name: 'Pack',
  wholesale_price: 260,
  conversion_factor: 12,
  is_favorite: false,
};

describe('ProductRow Component', () => {
  it('renders product details and wholesale bundle conversion badge', () => {
    const { getByText } = render(
      <ProductRow
        product={mockProduct}
        cartLine={undefined}
        onAdd={jest.fn()}
        onUpdateQuantity={jest.fn()}
      />,
    );

    expect(getByText('Coke Cans 330ml')).toBeTruthy();
    expect(getByText('1 Pack = 12 Pcs')).toBeTruthy();
    expect(getByText('Save ₱40')).toBeTruthy();
  });

  it('renders active unit toggle buttons correctly', () => {
    const { getByText } = render(
      <ProductRow
        product={mockProduct}
        cartLine={undefined}
        onAdd={jest.fn()}
        onUpdateQuantity={jest.fn()}
      />,
    );

    expect(getByText('PC (Pc)')).toBeTruthy();
    expect(getByText('PK (Pack)')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/sales/pos/__tests__/ProductRow.test.tsx`
Expected: FAIL (bundle badge '1 Pack = 12 Pcs' and 'Save ₱40' not present).

- [ ] **Step 3: Update `ProductRow.tsx` with Doppelrand Architecture & Bundle Visuals**

Update `components/sales/pos/ProductRow.tsx`:
- Import `calculateBulkSavings` from `@/lib`.
- Update outer shell to doppelrand styling: `mx-4 mb-3 rounded-2xl bg-paper-100 border border-paper-300/80 p-3.5 shadow-card active:bg-paper-200/50`.
- In thumbnail container: if `hasWholesale`, overlay a subtle stacked layer badge icon (`FontAwesome name="cubes"` or `layers`) indicating bundled items.
- Beside category tag, if `hasWholesale`, add a vibrant wholesale conversion badge (`1 Pack = 12 Pcs`).
- Below unit toggle, if `savings > 0`, display a bulk savings pill: `Save ₱[savings]` with `bg-sage-50 border border-sage-200 text-sage-700`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- components/sales/pos/__tests__/ProductRow.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/sales/pos/ProductRow.tsx components/sales/pos/__tests__/ProductRow.test.tsx
git commit -m "feat: redesign ProductRow with double-bezel layout and bundle savings badges"
```

---

### Task 3: Redesign `FastLaneCard.tsx` with Compact Hardware Enclosure & Bundle Micro Badge

**Files:**
- Modify: `components/sales/pos/FastLaneCard.tsx`
- Create: `components/sales/pos/__tests__/FastLaneCard.test.tsx`

**Interfaces:**
- Consumes: `FastLaneProduct` from `@/database/products`
- Produces: `FastLaneCard` component with double-bezel card enclosure and wholesale bundle indicator tag.

- [ ] **Step 1: Write test for `FastLaneCard`**

Create `components/sales/pos/__tests__/FastLaneCard.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { FastLaneCard } from '../FastLaneCard';
import type { FastLaneProduct } from '@/database/products';

const mockFastLaneItem: FastLaneProduct = {
  id: 1,
  name: 'Instant Noodles',
  price: 15,
  quantity: 20,
  is_favorite: true,
  conversion_factor: 12,
  wholesale_price: 150,
  wholesale_unit_name: 'Box',
};

describe('FastLaneCard Component', () => {
  it('renders item name, price, and Bundle badge for wholesale items', () => {
    const { getByText } = render(
      <FastLaneCard product={mockFastLaneItem} onAddToCart={jest.fn()} />,
    );

    expect(getByText('Instant Noodles')).toBeTruthy();
    expect(getByText('Bundle')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/sales/pos/__tests__/FastLaneCard.test.tsx`
Expected: FAIL (Bundle tag not rendered).

- [ ] **Step 3: Update `FastLaneCard.tsx`**

Modify `components/sales/pos/FastLaneCard.tsx`:
- Update card wrapper to double-bezel styling: `bg-paper-100 border border-paper-300 rounded-2xl p-3 mr-2.5 w-36 shadow-paper active:bg-paper-200/60`.
- If `product.wholesale_price && product.conversion_factor >= 2`, render a micro pill tag: `Bundle` in `bg-sage-50 text-sage-700 border border-sage-200 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold`.
- Polish `+1`, `+2`, `+5` touch buttons with active press states.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- components/sales/pos/__tests__/FastLaneCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/sales/pos/FastLaneCard.tsx components/sales/pos/__tests__/FastLaneCard.test.tsx
git commit -m "feat: upgrade FastLaneCard with double-bezel styling and bundle micro tag"
```

---

### Task 4: Comprehensive Verification & Typecheck

**Files:** None (verification step)

- [ ] **Step 1: Run full verification script**

Run: `npm run verify`
Expected: Zero TypeScript errors, all Jest tests passing cleanly.

- [ ] **Step 2: Final git commit if any remaining changes**

```bash
git status
```
