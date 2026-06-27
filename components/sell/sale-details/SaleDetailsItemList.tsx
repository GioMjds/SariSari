import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { SaleItemWithProduct } from '@/types';
import { MotiView } from 'moti';
import { View } from 'react-native';

interface SaleDetailsItemListProps {
  /** Itemised list for the sale. */
  items: SaleItemWithProduct[];
  /** Subtotal — same as sale total; surfaced in the ledger footer. */
  subtotal: number;
  /** Header labels (section eyebrow, line-count caption, subtotal label). */
  sectionLabel: string;
  subtotalLabel: string;
}

/**
 * SaleDetailsItemList — receipt-style itemised list for the sale.
 *
 * Layout (top → bottom):
 *   • Section eyebrow with line count.
 *   • Each item: name + qty × price stamp on the left,
 *     line subtotal on the right. Items separated by dashed rules
 *     like a printed receipt.
 *   • Ledger footer (subtotal) at the bottom.
 *
 * Each row is wrapped in a MotiView with a small stagger so the lines
 * appear one after another on mount. Pure presentational — receives
 * pre-computed `subtotal` so it has no formatting logic.
 */
export function SaleDetailsItemList({
  items,
  subtotal,
  sectionLabel,
  subtotalLabel,
}: SaleDetailsItemListProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 140 }}
    >
      <View className="mx-4 mt-7">
        {/* Section eyebrow */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <StyledText variant="black" className="label-caps text-ink-700">
            {sectionLabel}
          </StyledText>
          <View className="flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-persimmon-500 mr-1.5" />
            <StyledText variant="medium" className="text-mono text-ink-500">
              {items.length} lines
            </StyledText>
          </View>
        </View>

        {/* Item rows — printed-receipt style */}
        <View className="bg-paper-50 rounded-3xl shadow-paper border border-ink-100 overflow-hidden">
          {items.map((item, index) => {
            const lineTotal = item.quantity * item.price;
            const isLast = index === items.length - 1;
            return (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateX: -8 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'timing',
                  duration: 360,
                  delay: 220 + index * 60,
                }}
              >
                <View
                  className={`px-5 py-4 ${
                    isLast ? '' : 'border-b border-dashed border-ink-200'
                  }`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <StyledText
                        variant="extrabold"
                        className="text-ink-900 text-base"
                        numberOfLines={2}
                      >
                        {item.product_name}
                      </StyledText>
                      <View className="flex-row items-center mt-1.5">
                        <View className="bg-paper-200 rounded-md px-2 py-0.5">
                          <StyledText
                            variant="medium"
                            className="text-mono text-ink-700"
                          >
                            {item.quantity}×
                          </StyledText>
                        </View>
                        <MoneyText
                          value={item.price}
                          className="text-mono text-ink-700 text-sm ml-3"
                        />
                      </View>
                    </View>
                    <MoneyText
                      value={lineTotal}
                      className="text-ink-900 text-base"
                    />
                  </View>
                </View>
              </MotiView>
            );
          })}

          {/* Ledger footer — dashes + subtotal line */}
          <View className="bg-paper-100 px-5 py-3 flex-row items-center justify-between border-t border-dashed border-ink-300">
            <StyledText
              variant="medium"
              className="label-caps text-ink-500"
            >
              {subtotalLabel}
            </StyledText>
            <MoneyText
              value={subtotal}
              className="text-base text-ink-900"
            />
          </View>
        </View>
      </View>
    </MotiView>
  );
}