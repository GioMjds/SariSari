import { memo } from 'react';
import { MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { MotiView } from 'moti';
import { View } from 'react-native';

interface ProductsHeroProps {
  total: number;
  lowStock: number;
  totalValuePesos: number;
}

/**
 * ProductsHero — slim receipt-style summary bar that lives at the top
 * of the products list. Replaces the previous heavyweight `ReceiptHero`
 * card (which ate ~200px of vertical space above the list) with a
 * single-line strip so the products — the actual reason the user opened
 * the tab — get the screen back.
 *
 * Layout (left → right, single row):
 *   - "OFFICIAL LEDGER" eyebrow + dashed hairline divider
 *   - Big tabular total value (the only large number, kept left as the
 *     primary affordance — answering "how much is my inventory worth?")
 *   - Right cluster: TOTAL PRODUCTS / LOW+OUT stacked stats
 *
 * The receipt feel is preserved via:
 *   - paper-50 surface on the cream page
 *   - dashed ink-200 hairlines between sections
 *   - monospaced tabular numerals on the money value
 *   - one 10px eyebrow label in persimmon, never repeated elsewhere
 */
export const ProductsHero = memo(function ProductsHero({
  total,
  lowStock,
  totalValuePesos,
}: ProductsHeroProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 360, delay: 60 }}
    >
      <View className="px-4 mb-3">
        <View
          className="bg-paper-50 rounded-2xl border mt-2 border-dashed border-ink-200 shadow-paper"
          style={{ paddingVertical: 10, paddingHorizontal: 14 }}
        >
          <View className="flex-row items-center">
            <View className="flex-row items-center flex-1 min-w-0">
              <View
                className="w-1.5 h-1.5 rounded-full bg-persimmon-500 mr-2"
              />
              <StyledText
                variant="extrabold"
                className="label-caps text-persimmon-600"
              >
                Ledger · at cost
              </StyledText>
              <View className="flex-1 h-px bg-ink-200 mx-3 opacity-70" />
              <View className="flex-row items-baseline">
                <MoneyText
                  value={totalValuePesos}
                  size="xl"
                  className="text-ink-900"
                  numberOfLines={1}
                />
              </View>
            </View>

            {/* Right: stacked stats, kept compact */}
            <View className="flex-row items-center ml-3 pl-3 border-l border-dashed border-ink-200">
              <View className="items-end mr-3">
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-400"
                >
                  Items
                </StyledText>
                <StyledText
                  variant="black"
                  className="text-ink-900 text-sm"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {total}
                </StyledText>
              </View>
              <View className="items-end">
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-400"
                >
                  Low
                </StyledText>
                <StyledText
                  variant="black"
                  className="text-sm"
                  style={{
                    fontVariant: ['tabular-nums'],
                    // Persimmon only when there is something to act on;
                    // muted ink when stock is healthy — semantic, not
                    // decorative.
                    color: lowStock > 0 ? '#E85A1F' : '#564E45',
                  }}
                >
                  {lowStock}
                </StyledText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </MotiView>
  );
});
