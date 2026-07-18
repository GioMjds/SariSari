export interface CatalogProduct {
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  unit: string;
  imageUrl: string | null;
  createdAt: number;
}

export type NewCatalogProduct = Omit<CatalogProduct, 'createdAt'>;

export interface CatalogRow {
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  unit: string;
  image_url: string | null;
  created_at: number;
}