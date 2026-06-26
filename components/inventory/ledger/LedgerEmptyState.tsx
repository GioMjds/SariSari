import { View, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

const sariImage = require('@/assets/images/sari-emotions/sari-inventory-state.png');

interface LedgerEmptyStateProps {
  /**
   * The product's current on-hand count. Rendered as a "ghost stat"
   * so the empty screen still communicates useful information
   * instead of a lone mascot + paragraph.
   */
  currentStock: number;
  /**
   * Optional number of categories the cashier is most likely to log.
   * Drives the "Try logging" copy below the illustration.
   */
  currentStockLabel?: string;
}

/**
 * LedgerEmptyState — shown when a product has no transactions in the
 * last 30 days. The Sari mascot illustration explains what'll appear
 * here once the user starts logging restocks, sales, or damage
 * adjustments.
 *
 * The previous version was a single mascot + paragraph that left the
 * bottom half of the screen blank. This iteration adds two "ghost
 * stat" tiles (current stock + 30-day activity) so the screen reads
 * as finished even before data exists. A short action hint at the
 * bottom reminds the cashier to use the floating + button.
 */
export function LedgerEmptyState({
  currentStock,
  currentStockLabel,
}: LedgerEmptyStateProps) {
  return (
    <View className="flex-1 justify-center items-center px-6 py-10 bg-paper-100">
      <Image
        source={sariImage}
        style={{ width: 160, height: 160, marginBottom: 16 }}
        resizeMode="contain"
      />

      <StyledText
        variant="extrabold"
        className="text-ink-900 text-xl text-center mb-1.5"
      >
        No ledger entries yet
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm text-center px-4 leading-5"
      >
        Restocks, sales, damaged goods, and adjustments will appear here once
        you start logging them.
      </StyledText>

      {/* Ghost stat tiles — give the empty screen useful shape */}
      <View className="flex-row gap-3 mt-6 w-full max-w-sm">
        <View className="flex-1 bg-paper-50 border border-ink-100 rounded-xl px-3 py-3 shadow-paper">
          <StyledText
            variant="extrabold"
            className="label-caps text-ink-400 mb-1"
          >
            Current Stock
          </StyledText>
          <StyledText
            variant="black"
            className="text-ink-900 text-xl"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {currentStock}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-mono text-ink-500 mt-0.5"
            style={{ fontSize: 10 }}
          >
            {currentStockLabel ?? 'pcs on hand'}
          </StyledText>
        </View>
        <View className="flex-1 bg-paper-50 border border-dashed border-ink-200 rounded-xl px-3 py-3">
          <StyledText
            variant="extrabold"
            className="label-caps text-ink-400 mb-1"
          >
            30-Day Activity
          </StyledText>
          <StyledText
            variant="black"
            className="text-ink-500 text-xl"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            —
          </StyledText>
          <StyledText
            variant="medium"
            className="text-mono text-ink-500 mt-0.5"
            style={{ fontSize: 10 }}
          >
            no entries yet
          </StyledText>
        </View>
      </View>

      {/* Hint */}
      <View className="flex-row items-center mt-6 bg-paper-50 border border-ink-100 rounded-full px-3.5 py-2 shadow-paper">
        <FontAwesome name="plus-circle" size={12} color="#E85A1F" />
        <StyledText
          variant="semibold"
          className="text-mono text-ink-700 ml-2"
          style={{ fontSize: 11 }}
        >
          Tap the + button to log your first transaction
        </StyledText>
      </View>
    </View>
  );
}
