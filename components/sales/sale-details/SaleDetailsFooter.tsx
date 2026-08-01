import { StyledText } from '@/components/elements';
import { ReceiptHeroDivider } from '@/components/ui';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Pressable, StyleSheet, View } from 'react-native';

interface SaleDetailsFooterProps {
  /** Pre-formatted grand-total label (e.g. "Utang total" / "Grand total"). */
  grandTotalLabel: string;
  /** Pre-formatted grand-total amount in display format (e.g. "1,234.50"). */
  grandTotalDisplay: string;
  /** Pre-rendered thank-you message body. */
  thankYouMessage: string;
  /** Optional divider label (defaults to "thank you"). */
  dividerLabel?: string;
  /** Tap handler for the trash CTA on the sticky grand-total plate. */
  onDelete: () => void;
}

/**
 * SaleDetailsFooter — bottom-most stack of the Sale Details screen.
 *
 * Two parts:
 *   1. In-flow "thank you" message + sage divider, wrapped in a fade-in
 *      MotiView so it lands after the items.
 *   2. Sticky grand-total plate anchored to the bottom of the screen —
 *      cinnamon fill, grand-total label + value, and a trash CTA on the
 *      right. Pressable surfaces the destructive delete action without
 *      the screen needing to render any navigation chrome itself.
 *
 * Pure presentational — every label and number is pre-formatted by the
 * screen so this component has zero formatting logic.
 */
export function SaleDetailsFooter({
  grandTotalLabel,
  grandTotalDisplay,
  thankYouMessage,
  dividerLabel,
  onDelete,
}: SaleDetailsFooterProps) {
  return (
    <>
      {/* In-flow thank-you note */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 480, delay: 320 }}
      >
        <View className="mx-4 mt-7">
          <ReceiptHeroDivider label={dividerLabel ?? 'thank you'} tone="sage" />
          <StyledText
            variant="regular"
            className="text-ink-500 text-xs text-center mt-3"
            style={styles.thankYouText}
          >
            {thankYouMessage}
          </StyledText>
        </View>
      </MotiView>

      {/* Sticky grand-total plate */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 520, delay: 220 }}
        className="absolute bottom-0 left-0 right-0"
      >
        <View className="px-4 pb-5 pt-3">
          <View className="bg-cinnamon-500 rounded-3xl shadow-paper-deep px-5 py-4 flex-row items-center justify-between overflow-hidden">
            <View className="flex-1">
              <StyledText
                variant="medium"
                className="label-caps text-paper-200 opacity-90"
              >
                {grandTotalLabel}
              </StyledText>
              <View className="flex-row items-baseline mt-1">
                <StyledText
                  variant="medium"
                  className="text-paper-100 text-base mr-1"
                  style={styles.totalLabel}
                >
                  ₱
                </StyledText>
                <StyledText
                  variant="black"
                  className="text-paper-50 text-3xl"
                  style={styles.totalAmount}
                >
                  {grandTotalDisplay}
                </StyledText>
              </View>
            </View>

            <Pressable
              onPress={onDelete}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Delete sale"
              className="w-12 h-12 rounded-full bg-semantic-danger items-center justify-center shadow-paper active:opacity-80"
              style={styles.deleteButton}
            >
              <FontAwesome name="trash" size={16} color="#FFF1EA" />
            </Pressable>
          </View>
        </View>
      </MotiView>
    </>
  );
}

// ─── Stable style references ──────────────────────────────────────────────────────
// Hoisted to module scope so inline objects are never re-allocated on render.
const styles = StyleSheet.create({
  thankYouText: { lineHeight: 18 },
  totalLabel: { letterSpacing: -0.5 },
  totalAmount: { letterSpacing: -0.5 },
  deleteButton: { marginLeft: 12 },
});
