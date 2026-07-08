import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { memo } from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { LOW_STOCK_THRESHOLD } from '@/constants';
import { getProductImageUri } from '@/lib';
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
  /** Optional override for the stamp label. Defaults to stock state. */
  stockLabel?: string;
}

/**
 * ProductDetailsHero — the receipt-style hero that anchors the top
 * of the Product Details screen.
 *
 * Composition (top → bottom):
 *   • Cinnamon header strip ("PRODUCT PROFILE") + image monogram.
 *   • Eyebrow + product name + SKU/barcode line.
 *   • Status stamp (stock state) on the right.
 *   • Meta block (SKU / barcode / category) via ReceiptHeroMeta.
 *   • Printed-plate selling price via ReceiptHeroTotal.
 *
 * Pure presentational. The screen passes the product; the hero
 * derives the stamp tone/label from `product.quantity` itself.
 */
export const ProductDetailsHero = memo(function ProductDetailsHero({
  product,
  stockLabel,
}: ProductDetailsHeroProps) {
  const isOutOfStock = product.quantity === 0;
  const isLowStock =
    product.quantity > 0 && product.quantity < LOW_STOCK_THRESHOLD;

  // Stamp tone + label — derived from stock state. These are the
  // three states the inventory grid also surfaces, so the hero
  // matches the rest of the product language exactly.
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

  const placeholderText = product.name
    ? product.name.trim().charAt(0).toUpperCase()
    : '?';
  const displayImageUri = getProductImageUri(product.image_uri);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 60 }}
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
              <Ionicons
                name="barcode-outline"
                size={12}
                color="#7A7165"
              />
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
          <View className="w-16 h-16 rounded-xl bg-persimmon-50 border border-persimmon-100 overflow-hidden items-center justify-center">
            {displayImageUri ? (
              <Image
                source={{ uri: displayImageUri }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <StyledText
                variant="black"
                className="text-persimmon-500 text-3xl"
                style={{ letterSpacing: -0.5 }}
              >
                {placeholderText}
              </StyledText>
            )}
            <View
              className="absolute inset-0 border border-black/10 rounded-xl"
              pointerEvents="none"
            />
          </View>

          <View className="flex-1 ml-4">
            <View className="flex-row items-center gap-2">
              <StatusPill
                variant={
                  isOutOfStock
                    ? 'danger'
                    : isLowStock
                      ? 'warning'
                      : 'success'
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

        {/* Printed-plate selling price — the dominant number on the
            receipt. Lives at the bottom of the hero so the eye lands
            on the price after scanning identity, stock, and meta. */}
        <ReceiptHeroTotal label="SELLING PRICE" amount={product.price} />
      </ReceiptHero>
    </MotiView>
  );
});
