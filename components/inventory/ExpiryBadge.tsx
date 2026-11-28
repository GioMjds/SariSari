import { ProductStatusChip } from '@/components/inventory/ProductStatusChip';
import { useNearExpiryDays } from '@/hooks/useAppSetting';
import { daysUntilProductExpiry } from '@/types/inventory.types';
import type { Product } from '@/types/products.types';

/** Shows days left on a product row once it is inside its warning window; nothing otherwise. */
export function ExpiryBadge({
  product,
}: {
  product: Pick<Product, 'expiry_date' | 'expiry_warn_days' | 'quantity'>;
}) {
  const windowDays = useNearExpiryDays();
  const days = daysUntilProductExpiry(product);
  if (days === null || product.quantity <= 0) return null;
  if (days > (product.expiry_warn_days ?? windowDays)) return null;
  return <ProductStatusChip status="near_expiry" expiryDays={days} />;
}
