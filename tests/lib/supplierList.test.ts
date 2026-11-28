import { buildSupplierRows } from '@/lib/supplierList';
import type { Supplier } from '@/types/suppliers.types';
import type { SupplierBalance } from '@/types/supplierPayables.types';

const sup = (id: string, name: string, contact: string | null = null): Supplier => ({
  id,
  name,
  contact,
  notes: null,
  createdAt: 0,
  paymentTermsDays: null,
});

const bal = (supplierId: string, owed: number): SupplierBalance => ({
  supplierId,
  supplierName: supplierId,
  paymentTermsDays: null,
  owed,
  openCount: 1,
  nextDueDate: null,
});

const suppliers = [sup('a', 'Zeta Trading'), sup('b', 'Alpha Beverages', '0917'), sup('c', 'Mango Co')];

describe('buildSupplierRows', () => {
  it('keeps suppliers with no balance', () => {
    const rows = buildSupplierRows(suppliers, [bal('a', 500)], new Map(), '');
    expect(rows).toHaveLength(3);
  });

  it('sorts owed first, then name A to Z', () => {
    const rows = buildSupplierRows(suppliers, [bal('a', 500)], new Map(), '');
    expect(rows.map((r) => r.supplier.id)).toEqual(['a', 'b', 'c']);
  });

  it('filters by name or contact, case-insensitive', () => {
    expect(buildSupplierRows(suppliers, [], new Map(), 'MANGO').map((r) => r.supplier.id)).toEqual(['c']);
    expect(buildSupplierRows(suppliers, [], new Map(), '0917').map((r) => r.supplier.id)).toEqual(['b']);
  });

  it('attaches empties owed', () => {
    const rows = buildSupplierRows(suppliers, [], new Map([['c', 12]]), '');
    expect(rows.find((r) => r.supplier.id === 'c')?.emptiesOwed).toBe(12);
  });
});
