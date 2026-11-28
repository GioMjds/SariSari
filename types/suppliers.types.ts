export interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  notes: string | null;
  createdAt: number; // Unix epoch in ms
  paymentTermsDays: number | null; // null = pay on delivery
}

export type NewSupplier = Omit<Supplier, 'id' | 'createdAt' | 'paymentTermsDays'> & {
  paymentTermsDays?: number | null;
};
