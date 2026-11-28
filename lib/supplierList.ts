import type { Supplier } from '@/types/suppliers.types';
import type { SupplierBalance } from '@/types/supplierPayables.types';

export interface SupplierRow {
  supplier: Supplier;
  owed: number;
  openCount: number;
  nextDueDate: string | null;
  emptiesOwed: number;
}

/** Join suppliers with their balances, filter by name or contact, sort owed first then A to Z. */
export function buildSupplierRows(
  suppliers: Supplier[],
  balances: SupplierBalance[],
  emptiesOwed: ReadonlyMap<string, number>,
  query: string,
): SupplierRow[] {
  const byId = new Map(balances.map((b) => [b.supplierId, b]));
  const q = query.trim().toLowerCase();

  return suppliers
    .filter(
      (s) =>
        q.length === 0 ||
        s.name.toLowerCase().includes(q) ||
        (s.contact?.toLowerCase().includes(q) ?? false),
    )
    .map((supplier) => {
      const b = byId.get(supplier.id);
      return {
        supplier,
        owed: b?.owed ?? 0,
        openCount: b?.openCount ?? 0,
        nextDueDate: b?.nextDueDate ?? null,
        emptiesOwed: emptiesOwed.get(supplier.id) ?? 0,
      };
    })
    .sort((a, b) => b.owed - a.owed || a.supplier.name.localeCompare(b.supplier.name));
}
