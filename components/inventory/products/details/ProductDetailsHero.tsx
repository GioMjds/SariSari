import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { memo } from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { LOW_STOCK_THRESHOLD } from '@/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ProductThumb } from '@/components/ui/ProductThumb';
import {
  ReceiptHero,
  ReceiptHeroMeta,
  ReceiptHeroTotal,
  StatusPill,
  StatusStamp,
} from '@/components/ui';
import type { Product } from '@/types';

interface ProductDetailsHeroProps {
  product: Product;
  stockLabel?: string;
}

export const ProductDetailsHero = memo(function ProductDetailsHero({
  product,
  stockLabel,
}: ProductDetailsHeroProps) {
  const reducedMotion = useReducedMotion();
  const isOutOfStock = product.quantity === 0;
  const isLowStock =
    product.quantity > 0 && product.quantity < LOW_STOCK_THRESHOLD;

  let stampTone: 'sage' | 'cinnamon' | 'persimmon';
  let stampLabel: string;
  if (isOutOfStock) {
    stampTone = 'persimmon';
    stampLabel = stockLabel ?? 'OUT';
  } else if (isLowStock) {
    stampTone = 'cinnamon';
    stampLabel = stockLabel ?? `LOW · ${product.quantity}`;
  } else {
    stampTone = 'sage';
    stampLabel = stockLabel ?? 'IN STOCK';
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: reducedMotion ? 0 : 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: reducedMotion ? 160 : 480, delay: 60 }}
    >
      <ReceiptHero tone="cinnamon" headerLabel="PRODUCT PROFILE">
        {/* Eyebrow + product name + stock stamp */}
        <View className="px-5 pt-6 pb-3 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <StyledText
              variant="black"
              className="text-ink-900 text-3xl"
              style={{ letterSpacing: -0.5 }}
              numberOfLines={2}
            >
              {product.name}
            </StyledText>
            <View className="flex-row items-center mt-1.5">
              <Ionicons name="barcode-outline" size={12} color="#7A7165" />
              <StyledText
                variant="regular"
                className="text-ink-500 text-xs ml-1.5"
                numberOfLines={1}
              >
                SKU {product.sku || '—'}
                {product.barcode ? `  ·  ${product.barcode}` : ''}
              </StyledText>
            </View>
          </View>
          <StatusStamp
            label={stampLabel}
            tone={stampTone}
            size="md"
            rotate={isOutOfStock ? -8 : isLowStock ? 6 : 6}
          />
        </View>

        {/* Product image / monogram block — sits above the meta block.
            A monogram keeps the receipt feeling personal even when no
            photo has been captured. */}
        <View className="mx-5 mb-2 flex-row items-center">
          <ProductThumb
            name={product.name}
            imageUri={product.image_uri}
            className="w-16 h-16 rounded-xl border border-paper-300"
            initialsClassName="text-2xl"
          />

          <View className="flex-1 ml-4">
            <View className="flex-row items-center gap-2">
              <StatusPill
                variant={
                  isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'
                }
                size="sm"
                dot
              >
                {isOutOfStock
                  ? 'Out of stock'
                  : isLowStock
                    ? 'Low stock'
                    : 'In stock'}
              </StatusPill>
            </View>
            <View className="flex-row items-center mt-1.5">
              <FontAwesome name="cube" size={11} color="#7A7165" />
              <StyledText
                variant="medium"
                className="text-ink-500 text-xs ml-1.5"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {product.quantity} {product.quantity === 1 ? 'pc' : 'pcs'} on
                hand
              </StyledText>
            </View>
          </View>
        </View>

        {/* Meta block — SKU / category / cost */}
        <ReceiptHeroMeta
          rows={[
            { label: 'SKU', value: product.sku || '—' },
            {
              label: 'Category',
              value: product.category?.trim() || 'Uncategorized',
            },
            {
              label: 'Cost',
              value:
                product.cost_price != null
                  ? `₱${(product.cost_price / 100).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : '—',
            },
          ]}
        />

        <ReceiptHeroTotal label="SELLING PRICE" amount={product.price} />
      </ReceiptHero>
    </MotiView>
  );
});
