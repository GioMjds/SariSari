export interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  notes: string | null;
  createdAt: number; // Unix epoch in ms
}

export type NewSupplier = Omit<Supplier, 'id' | 'createdAt'>;
