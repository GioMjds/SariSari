# POS Fast Lane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the POS Fast Lane feature to allow cashiers to perform one-tap checkouts of daily top-selling and favorited products with preset quantity chips (`+1`, `+2`, `+5`, `+12`) and direct barcode scan additions.

**Architecture:** Extend SQLite database with migration version 14 (`is_favorite`, `last_sold_at`), add database query helper `getFastLaneProducts()`, wrap with TanStack Query hooks (`useFastLaneProducts`, `useToggleFavorite`), and render a pinned horizontal `FastLaneBar` component in `pos.tsx`.

**Tech Stack:** React Native (Expo), TypeScript, SQLite (expo-sqlite), TanStack Query, React Native Paper / custom components.

## Global Constraints

- Migration Version: `PRAGMA user_version = 14;`
- Database Tables: `products`, `sale_items`, `sales`
- Caching: TanStack Query keys `['fastLaneProducts']` and `['products']`
- Formatting: Currency displayed in integer pesos (`₱X`)
- Code Style: Strict TypeScript contracts, zero placeholders

---

### Task 1: Database Migration v14 (POS Fast Lane Schema)

**Files:**

- Modify: `database/migrations.ts:380-402`
- Test: `database/migrations.ts`

**Interfaces:**

- Consumes: Existing SQLite database connection (`db`)
- Produces: Updated `products` table schema with `is_favorite INTEGER DEFAULT 0` and `last_sold_at TEXT` columns, plus indexes `idx_products_favorite` and `idx_products_last_sold`.

- [ ] **Step 1: Write migration logic for version 14 in `database/migrations.ts`**

```typescript
if (currentVersion < 14) {
  console.log('Running migration to version 14 (POS Fast Lane)...');
  await db.withTransactionAsync(async () => {
    const productCols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(products)',
    );
    const hasFavorite = productCols.some((c) => c.name === 'is_favorite');
    const hasLastSold = productCols.some((c) => c.name === 'last_sold_at');

    if (!hasFavorite) {
      await db.execAsync(
        'ALTER TABLE products ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;',
      );
    }
    if (!hasLastSold) {
      await db.execAsync('ALTER TABLE products ADD COLUMN last_sold_at TEXT;');
    }

    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_products_favorite ON products(is_favorite);',
    );
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_products_last_sold ON products(last_sold_at);',
    );

    await db.execAsync('PRAGMA user_version = 14;');
  });
  console.log('Database migrated to version 14.');
}
```

- [ ] **Step 2: Run TypeScript check to verify syntax**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add database/migrations.ts
git commit -m "feat(database): add migration v14 for POS fast lane columns and indexes"
```

---

### Task 2: Database Query Helper & Favorite Mutation (`database/products.ts`)

**Files:**

- Modify: `database/products.ts`

**Interfaces:**

- Consumes: `products`, `sale_items`, `sales` tables
- Produces: `getFastLaneProducts({ limit })`, `toggleProductFavorite(productId, isFavorite)`, `FastLaneProduct` interface.

- [ ] **Step 1: Add `FastLaneProduct` interface and database functions to `database/products.ts`**

```typescript
export interface FastLaneProduct extends Product {
  is_favorite: number;
  last_sold_at?: string | null;
  units_sold_14d?: number;
}

export async function getFastLaneProducts({
  limit = 15,
}: { limit?: number } = {}): Promise<FastLaneProduct[]> {
  const sql = `
    WITH favorite_items AS (
      SELECT p.*, 1 AS is_fav_priority, 0 AS units_sold_14d
      FROM products p
      WHERE p.is_favorite = 1
    ),
    top_sold_items AS (
      SELECT p.*, 0 AS is_fav_priority, SUM(si.quantity) AS units_sold_14d
      FROM products p
      JOIN sale_items si ON si.product_id = p.id
      JOIN sales s ON s.id = si.sale_id
      WHERE s.timestamp >= datetime('now', '-14 days')
        AND p.is_favorite = 0
      GROUP BY p.id
      ORDER BY units_sold_14d DESC
    )
    SELECT * FROM (
      SELECT * FROM favorite_items
      UNION ALL
      SELECT * FROM top_sold_items
    )
    LIMIT ?;
  `;
  return await db.getAllAsync<FastLaneProduct>(sql, [limit]);
}

export async function toggleProductFavorite(
  productId: number,
  isFavorite: boolean,
): Promise<void> {
  await db.runAsync('UPDATE products SET is_favorite = ? WHERE id = ?;', [
    isFavorite ? 1 : 0,
    productId,
  ]);
}
```

- [ ] **Step 2: Run TypeScript check to verify signatures**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add database/products.ts
git commit -m "feat(database): add getFastLaneProducts and toggleProductFavorite helper functions"
```

---

### Task 3: Fast Lane Hooks (`hooks/useProducts.tsx`)

**Files:**

- Modify: `hooks/useProducts.tsx`

**Interfaces:**

- Consumes: `getFastLaneProducts`, `toggleProductFavorite` from `database/products.ts`
- Produces: `useFastLaneProducts()`, `useToggleFavorite()` hooks.

- [ ] **Step 1: Add hooks in `hooks/useProducts.tsx`**

```typescript
export function useFastLaneProducts() {
  return useQuery({
    queryKey: ['fastLaneProducts'],
    queryFn: () => getFastLaneProducts({ limit: 15 }),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      isFavorite,
    }: {
      productId: number;
      isFavorite: boolean;
    }) => toggleProductFavorite(productId, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fastLaneProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useProducts.tsx
git commit -m "feat(hooks): add useFastLaneProducts and useToggleFavorite TanStack hooks"
```

---

### Task 4: Fast Lane UI Components (`FastLaneCard` & `FastLaneBar`)

**Files:**

- Create: `components/pos/FastLaneCard.tsx`
- Create: `components/pos/FastLaneBar.tsx`

**Interfaces:**

- Consumes: `FastLaneProduct`, `useToggleFavorite`
- Produces: `<FastLaneBar onAddToCart={(product, qty) => void} />` component.

- [ ] **Step 1: Create `components/pos/FastLaneCard.tsx`**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FastLaneProduct } from '@/database/products';
import { useToggleFavorite } from '@/hooks/useProducts';

interface FastLaneCardProps {
  product: FastLaneProduct;
  onAddToCart: (product: FastLaneProduct, quantity: number) => void;
}

export const FastLaneCard: React.FC<FastLaneCardProps> = ({
  product,
  onAddToCart,
}) => {
  const toggleFavorite = useToggleFavorite();

  const handleToggleFav = () => {
    toggleFavorite.mutate({
      productId: product.id,
      isFavorite: !product.is_favorite,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <TouchableOpacity
          onPress={handleToggleFav}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name={product.is_favorite ? 'star' : 'star-outline'}
            size={18}
            color={product.is_favorite ? '#fbc02d' : '#9e9e9e'}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.price}>₱{Math.round(product.price)}</Text>

      <View style={styles.chipsRow}>
        {[1, 2, 5, 12].map((qty) => (
          <TouchableOpacity
            key={qty}
            style={styles.chip}
            onPress={() => onAddToCart(product, qty)}
          >
            <Text style={styles.chipText}>+{qty}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
    marginRight: 4,
  },
  price: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  chipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
});
```

- [ ] **Step 2: Create `components/pos/FastLaneBar.tsx`**

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { FastLaneProduct } from '@/database/products';
import { useFastLaneProducts } from '@/hooks/useProducts';
import { FastLaneCard } from './FastLaneCard';

interface FastLaneBarProps {
  onAddToCart: (product: FastLaneProduct, quantity: number) => void;
}

export const FastLaneBar: React.FC<FastLaneBarProps> = ({ onAddToCart }) => {
  const { data: fastLaneProducts = [], isLoading } = useFastLaneProducts();

  if (isLoading || fastLaneProducts.length === 0) {
    return (
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          ⚡ ⭐ Star products in catalog to populate Fast Lane for 1-tap
          checkout.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>⚡ FAST LANE</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {fastLaneProducts.map((product) => (
          <FastLaneCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingRight: 10,
  },
  hintContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  hintText: {
    fontSize: 12,
    color: '#1565c0',
    textAlign: 'center',
  },
});
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/pos/FastLaneCard.tsx components/pos/FastLaneBar.tsx
git commit -m "feat(ui): add FastLaneCard and FastLaneBar components"
```

---

### Task 5: POS Catalog Star Button & Barcode Scan Toast Integration

**Files:**

- Create: `components/pos/ScanToastBanner.tsx`
- Modify: `components/pos/ProductSearchCatalog.tsx`
- Modify: `app/(tabs)/sales/pos.tsx`

**Interfaces:**

- Consumes: `<FastLaneBar>`, `<ScanToastBanner>`, `useBarcodeResolver`
- Produces: Integrated POS Fast Lane workflow with star button toggles and scan toasts.

- [ ] **Step 1: Create `components/pos/ScanToastBanner.tsx`**

```tsx
import React, { useEffect } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface ScanToastBannerProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error';
  onHide: () => void;
}

export const ScanToastBanner: React.FC<ScanToastBannerProps> = ({
  visible,
  message,
  type = 'success',
  onHide,
}) => {
  const translateY = React.useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1300),
        Animated.timing(translateY, {
          toValue: -60,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        type === 'error' ? styles.toastError : styles.toastSuccess,
        { transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  toastSuccess: {
    backgroundColor: '#2e7d32',
  },
  toastError: {
    backgroundColor: '#c62828',
  },
  toastText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
```

- [ ] **Step 2: Add star button toggle to product rows in `components/pos/ProductSearchCatalog.tsx`**
      Add star toggle button next to each product item row using `useToggleFavorite()`.

- [ ] **Step 3: Embed `<FastLaneBar>` and `<ScanToastBanner>` in `app/(tabs)/sales/pos.tsx`**
      Connect `FastLaneBar` at the top of POS search, and trigger `ScanToastBanner` when `useBarcodeResolver` resolves scanned products.

- [ ] **Step 4: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add components/pos/ScanToastBanner.tsx components/pos/ProductSearchCatalog.tsx app/\(tabs\)/sales/pos.tsx
git commit -m "feat(pos): integrate FastLaneBar, star toggles, and barcode scan toast"
```
