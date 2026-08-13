import { StyledText } from '@/components/elements';
import { ReceiptHeroDivider } from '@/components/ui';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Pressable, StyleSheet, View } from 'react-native';

interface SaleDetailsFooterProps {
  grandTotalLabel: string;
  grandTotalDisplay: string;
  thankYouMessage: string;
  dividerLabel?: string;
  onDelete: () => void;
  onVoid?: () => void;
  onRefund?: () => void;
  onPriceCorrection?: () => void;
}

export function SaleDetailsFooter({
  grandTotalLabel,
  grandTotalDisplay,
  thankYouMessage,
  dividerLabel,
  onDelete,
  onVoid,
  onRefund,
  onPriceCorrection,
}: SaleDetailsFooterProps) {
  return (
    <>
      {/* In-flow thank-you note and correction action buttons */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 480, delay: 320 }}
      >
        {(onVoid || onRefund || onPriceCorrection) && (
          <View className="flex-row gap-2 mx-4 mt-6">
            {onVoid && (
              <Pressable
                onPress={onVoid}
                accessibilityRole="button"
                accessibilityLabel="Void sale"
                className="flex-1 bg-paper-50 border border-cinnamon-500 py-3 px-2 rounded-2xl items-center justify-center flex-row gap-1.5 active:opacity-80 shadow-paper"
              >
                <FontAwesome name="ban" size={13} color="#E85A1F" />
                <StyledText variant="semibold" className="text-cinnamon-600 text-xs" numberOfLines={1}>
                  Void Sale
                </StyledText>
              </Pressable>
            )}
            {onRefund && (
              <Pressable
                onPress={onRefund}
                accessibilityRole="button"
                accessibilityLabel="Refund sale"
                className="flex-1 bg-paper-50 border border-warm-300 py-3 px-2 rounded-2xl items-center justify-center flex-row gap-1.5 active:opacity-80 shadow-paper"
              >
                <FontAwesome name="undo" size={13} color="#4A453E" />
                <StyledText variant="semibold" className="text-ink-700 text-xs" numberOfLines={1}>
                  Refund Sale
                </StyledText>
              </Pressable>
            )}
            {onPriceCorrection && (
              <Pressable
                onPress={onPriceCorrection}
                accessibilityRole="button"
                accessibilityLabel="Correct price"
                className="flex-1 bg-paper-50 border border-warm-300 py-3 px-2 rounded-2xl items-center justify-center flex-row gap-1.5 active:opacity-80 shadow-paper"
              >
                <FontAwesome name="pencil" size={13} color="#4A453E" />
                <StyledText variant="semibold" className="text-ink-700 text-xs" numberOfLines={1}>
                  Edit Price
                </StyledText>
              </Pressable>
            )}
          </View>
        )}

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
