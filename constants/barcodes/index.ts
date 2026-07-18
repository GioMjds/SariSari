import beverages from './beverages.json';
import cannedGoods from './canned-goods.json';
import noodles from './noodles.json';
import snacks from './snacks.json';

export interface BundledCatalogRecord {
  barcode: string;
  name: string;
  category: string;
}

export const BUNDLED_CATALOG_RECORDS: readonly BundledCatalogRecord[] = [
  ...beverages,
  ...snacks,
  ...noodles,
  ...cannedGoods,
];

export const BUNDLED_CATALOG_COUNT = BUNDLED_CATALOG_RECORDS.length;
