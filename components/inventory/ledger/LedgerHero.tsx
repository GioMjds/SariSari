import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { ReceiptHero, ReceiptHeroDivider } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { InventoryTransaction } from '@/types/inventory.types';
import { Product } from '@/types/products.types';

interface LedgerHeroProps {
  product: Product;
  transactions: InventoryTransaction[];
  onLogTransaction: () => void;
}

/**
 * LedgerHero — the receipt-style hero card that anchors the inventory
 * ledger screen.
 *
 * Composition (top → bottom):
 *   • Cinnamon header band — eyebrow ("Stock Ledger"), product name
 *     (big bold), SKU caption. Sets the screen's identity in one beat.
 *   • Perforated divider into a paper-textured body.
 *   • "Current Stock" featured plate — big tabular integer so the
 *     cashier always sees the on-hand count first.
 *   • Dashed divider into a 3-up movement summary — Restocked / Sold
 *     / Damaged with a "this period" label so each card communicates
 *     context, not just a number.
 *   • Quick-action footer — full-width "Log transaction" pill in
 *     persimmon that opens the bottom-sheet form from anywhere on
 *     the screen (the FAB is still there for redundancy, but this
 *     keeps the hero self-sufficient when scrolled).
 *
 * Pure presentation. Sums are derived in a `useMemo` so a refetch
 * doesn't re-allocate. Mirrors the `CustomerHeroCard` pattern from
 * `components/utang/credit-details/`.
 */
export function LedgerHero({
  product,
  transactions,
  onLogTransaction,
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
        // A positive adjustment operationally equals a restock —
        // on-hand went up without a physical delivery. Roll them
        // into the "stock coming in" bucket so the hero matches the
        // mental model.
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
        {/* Product identity — name + SKU. Rendered on the cream
            paper body so we use high-contrast ink colors (ink-900
            for the name, ink-500 for the caption) — paper-50
            cream text would disappear against the same bg. */}
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

        {/* Quick-action footer */}
        <View className="border-t border-dashed border-ink-200 px-5 py-4">
          <Pressable
            onPress={onLogTransaction}
            accessibilityRole="button"
            accessibilityLabel="Log a new transaction"
            className="press-scale bg-persimmon-500 rounded-xl py-3 flex-row items-center justify-center shadow-persimmon-glow"
          >
            <FontAwesome name="plus" size={14} color="#FBF7EE" />
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-sm ml-2"
            >
              Log Transaction
            </StyledText>
          </Pressable>
        </View>
      </ReceiptHero>
    </MotiView>
  );
}

/* ─── Movement chip ─────────────────────────────────────────────────── */

type MovementTone = 'sage' | 'info' | 'danger';

const TONE_BG: Record<MovementTone, string> = {
  sage: 'bg-sage-50',
  info: 'bg-semantic-info-50',
  danger: 'bg-semantic-danger-50',
};
const TONE_TEXT: Record<MovementTone, string> = {
  sage: 'text-sage-700',
  info: 'text-semantic-info',
  danger: 'text-semantic-danger',
};
const TONE_BORDER: Record<MovementTone, string> = {
  sage: 'border-sage-500',
  info: 'border-semantic-info',
  danger: 'border-semantic-danger',
};
const TONE_ICON_COLOR: Record<MovementTone, string> = {
  sage: '#2F5C3E',
  info: '#2E6FA8',
  danger: '#C22D2D',
};

function MovementChip({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: MovementTone;
  icon: 'arrow-up' | 'shopping-cart' | 'exclamation-triangle';
}) {
  return (
    <View
      className={`flex-1 ${TONE_BG[tone]} border ${TONE_BORDER[tone]} rounded-xl px-3 py-2.5`}
    >
      <View className="flex-row items-center mb-1">
        <FontAwesome name={icon} size={10} color={TONE_ICON_COLOR[tone]} />
        <StyledText
          variant="extrabold"
          className={`label-caps ${TONE_TEXT[tone]} ml-1.5`}
        >
          {label}
        </StyledText>
      </View>
      <StyledText
        variant="black"
        className={`${TONE_TEXT[tone]} text-xl`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </StyledText>
      <StyledText
        variant="medium"
        className="text-mono text-ink-500 mt-0.5"
        style={{ fontSize: 10 }}
      >
        pcs this period
      </StyledText>
    </View>
  );
}
