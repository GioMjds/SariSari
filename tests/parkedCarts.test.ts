import { db } from '@/configs/sqlite';
import {
  parkCart,
  getParkedCarts,
  discardParkedCart,
  swapParkedCart,
} from '@/database/parkedCarts';
import { validateParkedCartItems } from '@/hooks/useParkedCarts';
import { initSalesTables } from '@/database/sales';
import { initProductsTable } from '@/database/products';
import { initCreditsTable } from '@/database/credits';
import { initInventoryTable } from '@/database/inventory';
import { runMigrations } from '@/database/migrations';
import type { Product, NewSaleItem } from '@/types';

describe('Parked Carts Database & Hook Logic', () => {
  beforeEach(async () => {
    await initCreditsTable();
    await initSalesTables();
    await initProductsTable();
    await initInventoryTable();
    await runMigrations();
    await db.execAsync('DELETE FROM parked_carts;');
  });

  const mockItem: NewSaleItem = {
    product_id: 1,
    product_name: 'Coke 1.5L',
    price: 65,
    quantity: 2,
    stock: 10,
    selected_unit: 'retail',
    retail_unit_name: 'Pc',
    retail_price: 65,
  };

  const mockProduct: Product = {
    id: 1,
    name: 'Coke 1.5L',
    sku: 'COKE1',
    barcode: '4800010000017',
    price: 65,
    quantity: 10,
    retail_unit_name: 'Pc',
    is_favorite: false,
    created_at: '1000',
    updated_at: '1000',
  };

  it('parks and retrieves a cart correctly', async () => {
    await db.runAsync(
      "INSERT INTO customers (id, name) VALUES (5, 'Aling Nena');",
    );

    const id = await parkCart(db, {
      label: 'Suki Aling Nena',
      customer_id: 5,
      customer_name: 'Aling Nena',
      payment_type: 'credit',
      cartItems: [mockItem],
    });

    expect(id).toBeGreaterThan(0);

    const carts = await getParkedCarts(db);
    expect(carts).toHaveLength(1);
    const target = carts[0];
    expect(target).toBeDefined();
    if (target) {
      expect(target.label).toBe('Suki Aling Nena');
      expect(target.customerId).toBe(5);
      expect(target.customerName).toBe('Aling Nena');
      expect(target.paymentType).toBe('credit');
      expect(target.cartItems).toHaveLength(1);
      expect(target.cartItems[0]?.product_name).toBe('Coke 1.5L');
    }
  });

  it('prevents parking an empty cart', async () => {
    await expect(
      parkCart(db, {
        label: 'Empty Cart',
        payment_type: 'cash',
        cartItems: [],
      }),
    ).rejects.toThrow('Cannot park an empty cart.');
  });

  it('enforces maximum limit of 3 parked carts', async () => {
    await parkCart(db, { label: 'Cart 1', payment_type: 'cash', cartItems: [mockItem] });
    await parkCart(db, { label: 'Cart 2', payment_type: 'cash', cartItems: [mockItem] });
    await parkCart(db, { label: 'Cart 3', payment_type: 'cash', cartItems: [mockItem] });

    await expect(
      parkCart(db, { label: 'Cart 4', payment_type: 'cash', cartItems: [mockItem] }),
    ).rejects.toThrow('Maximum limit of 3 parked carts reached.');
  });

  it('allows swapping active cart when 3 carts are already parked', async () => {
    const id1 = await parkCart(db, { label: 'Cart 1', payment_type: 'cash', cartItems: [mockItem] });
    await parkCart(db, { label: 'Cart 2', payment_type: 'cash', cartItems: [mockItem] });
    await parkCart(db, { label: 'Cart 3', payment_type: 'cash', cartItems: [mockItem] });

    // Swap Cart 4 into the parked slots by replacing/resuming Cart 1
    const { newParkedId } = await swapParkedCart(
      db,
      { label: 'Cart 4', payment_type: 'credit', cartItems: [mockItem] },
      id1,
    );

    expect(newParkedId).toBeGreaterThan(0);

    const carts = await getParkedCarts(db);
    expect(carts).toHaveLength(3);
    const labels = carts.map((c) => c.label);
    expect(labels).toContain('Cart 4');
    expect(labels).not.toContain('Cart 1');
  });

  it('validates parked cart items against current product inventory', () => {
    const parkedItem: NewSaleItem = {
      ...mockItem,
      price: 50, // Old price
      quantity: 15, // Higher than current stock (10)
    };

    const result = validateParkedCartItems([parkedItem], [mockProduct]);

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item).toBeDefined();
    if (item) {
      expect(item.price).toBe(65); // Price updated to current product price
      expect(item.quantity).toBe(10); // Quantity reduced to available stock
    }
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('discards a parked cart correctly', async () => {
    const id = await parkCart(db, {
      label: 'To Discard',
      payment_type: 'cash',
      cartItems: [mockItem],
    });

    await discardParkedCart(db, id);

    const carts = await getParkedCarts(db);
    expect(carts).toHaveLength(0);
  });
});
