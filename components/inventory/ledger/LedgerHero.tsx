import { useMemo, memo } from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { ReceiptHero, ReceiptHeroDivider } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { InventoryTransaction } from '@/types/inventory.types';
import { Product } from '@/types/products.types';
import { MovementChip } from './MovementChip';

interface LedgerHeroProps {
  product: Product;
  transactions: InventoryTransaction[];
}

export const LedgerHero = memo(function LedgerHero({
  product,
  transactions,
}: LedgerHeroProps) {
  const { restocked, sold, damaged } = useMemo(() => {
    let restocked = 0;
    let sold = 0;
    let damaged = 0;
    for (const tx of transactions) {
      if (tx.type === 'restock') {
        restocked += tx.quantity;
      } else if (tx.type === 'sale') {
        sold += tx.quantity;
      } else if (tx.type === 'damaged') {
        damaged += tx.quantity;
      } else if (
        tx.type === 'adjustment' &&
        tx.adjustment_sign === 'positive'
      ) {
        restocked += tx.quantity;
      }
    }
    return { restocked, sold, damaged };
  }, [transactions]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 60 }}
    >
      <ReceiptHero tone="cinnamon" headerLabel="Stock Ledger">
        <View className="px-5 pt-4 pb-3">
          <StyledText
            variant="black"
            className="text-ink-900 text-2xl"
            style={{ letterSpacing: -0.4 }}
            numberOfLines={1}
          >
            {product.name}
          </StyledText>
          <View className="flex-row items-center mt-1">
            <FontAwesome name="tag" size={10} color="#564E45" />
            <StyledText
              variant="medium"
              className="text-mono text-ink-500 ml-1.5"
            >
              {product.sku}
              {product.category ? ` · ${product.category}` : ''}
            </StyledText>
          </View>
        </View>

        <ReceiptHeroDivider label="On Hand" tone="cinnamon" />

        {/* Current stock — the featured plate */}
        <View className="px-5 py-5 bg-paper-100 border-y border-dashed border-ink-200">
          <StyledText variant="extrabold" className="label-caps text-ink-400">
            Current Stock
          </StyledText>
          <View className="flex-row items-baseline mt-1">
            <StyledText
              variant="black"
              className="text-ink-900"
              style={{
                fontSize: 44,
                letterSpacing: -1.2,
                fontVariant: ['tabular-nums'],
              }}
            >
              {product.quantity}
            </StyledText>
            <StyledText
              variant="extrabold"
              className="label-caps text-ink-500 ml-2"
            >
              pcs
            </StyledText>
          </View>
        </View>

        {/* 30-day movement summary */}
        <View className="px-5 py-4">
          <StyledText
            variant="extrabold"
            className="label-caps text-ink-400 mb-3"
          >
            30-Day Activity
          </StyledText>
          <View className="flex-row gap-2.5">
            <MovementChip
              label="Restocked"
              value={restocked}
              tone="sage"
              icon="arrow-up"
            />
            <MovementChip
              label="Sold"
              value={sold}
              tone="info"
              icon="shopping-cart"
            />
            <MovementChip
              label="Damaged"
              value={damaged}
              tone="danger"
              icon="exclamation-triangle"
            />
          </View>
        </View>
      </ReceiptHero>
    </MotiView>
  );
});
