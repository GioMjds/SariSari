import { validateParkedCartItems } from '../hooks/useParkedCarts';
import type { NewSaleItem, Product } from '../types';

describe('validateParkedCartItems', () => {
  const mockProduct: Product = {
    id: 1,
    name: 'Coke 1.5L',
    price: 65,
    quantity: 15,
    category: 'Beverages',
    retail_unit_name: 'Pc',
    wholesale_price: 600,
    wholesale_unit_name: 'Case',
    conversion_factor: 10,
    sku: 'COKE-1.5L',
    barcode: '1234567890',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    is_favorite: false,
  };

  it('keeps valid retail items unchanged', () => {
    const parkedItem: NewSaleItem = {
      product_id: 1,
      product_name: 'Coke 1.5L',
      price: 65,
      quantity: 5,
      stock: 15,
      selected_unit: 'retail',
    };

    const result = validateParkedCartItems([parkedItem], [mockProduct]);

    expect(result.warnings).toHaveLength(0);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.quantity).toBe(5);
    expect(result.items[0]!.price).toBe(65);
  });

  it('adjusts retail quantity when exceeding stock', () => {
    const parkedItem: NewSaleItem = {
      product_id: 1,
      product_name: 'Coke 1.5L',
      price: 65,
      quantity: 20,
      stock: 20,
      selected_unit: 'retail',
    };

    const result = validateParkedCartItems([parkedItem], [mockProduct]);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('stock reduced to 15 Pc');
    expect(result.items[0]!.quantity).toBe(15);
  });

  it('removes item if stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, quantity: 0 };
    const parkedItem: NewSaleItem = {
      product_id: 1,
      product_name: 'Coke 1.5L',
      price: 65,
      quantity: 2,
      stock: 10,
      selected_unit: 'retail',
    };

    const result = validateParkedCartItems([parkedItem], [outOfStockProduct]);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('out of stock and was removed');
    expect(result.items).toHaveLength(0);
  });

  it('correctly validates wholesale units based on conversion factor', () => {
    // Product has stock = 15 pcs, conversion_factor = 10 pcs/case.
    // Max wholesale cases available = Math.floor(15 / 10) = 1 case.
    const parkedItem: NewSaleItem = {
      product_id: 1,
      product_name: 'Coke 1.5L',
      price: 600,
      quantity: 3, // 3 cases requested (30 pcs) > 15 pcs available
      stock: 30,
      selected_unit: 'wholesale',
    };

    const result = validateParkedCartItems([parkedItem], [mockProduct]);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('stock reduced to 1 Case');
    expect(result.items[0]!.quantity).toBe(1);
    expect(result.items[0]!.price).toBe(600);
  });

  it('resets wholesale to retail if wholesale configuration is removed', () => {
    const productWithoutWholesale: Product = {
      ...mockProduct,
      wholesale_price: null,
      wholesale_unit_name: null,
      conversion_factor: null,
    };

    const parkedItem: NewSaleItem = {
      product_id: 1,
      product_name: 'Coke 1.5L',
      price: 600,
      quantity: 2,
      stock: 15,
      selected_unit: 'wholesale',
    };

    const result = validateParkedCartItems(
      [parkedItem],
      [productWithoutWholesale],
    );

    expect(result.warnings.some((w) => w.includes('reset to retail'))).toBe(
      true,
    );
    expect(result.items[0]!.selected_unit).toBe('retail');
    expect(result.items[0]!.price).toBe(65);
  });

  it('removes item if product is no longer available in catalog', () => {
    const parkedItem: NewSaleItem = {
      product_id: 999,
      product_name: 'Discontinued Item',
      price: 100,
      quantity: 1,
      stock: 10,
      selected_unit: 'retail',
    };

    const result = validateParkedCartItems([parkedItem], [mockProduct]);

    expect(result.warnings[0]).toContain(
      'Discontinued Item is no longer available',
    );
    expect(result.items).toHaveLength(0);
  });

  it('flags price changes when product price has updated', () => {
    const updatedProduct = { ...mockProduct, price: 70 };
    const parkedItem: NewSaleItem = {
      product_id: 1,
      product_name: 'Coke 1.5L',
      price: 65,
      quantity: 2,
      stock: 15,
      selected_unit: 'retail',
    };

    const result = validateParkedCartItems([parkedItem], [updatedProduct]);

    expect(result.warnings.some((w) => w.includes('price updated'))).toBe(true);
    expect(result.items[0]!.price).toBe(70);
  });
});
