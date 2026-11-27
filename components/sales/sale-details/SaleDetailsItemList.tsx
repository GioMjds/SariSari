import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { formatPesos } from '@/lib/money';
import { SaleWithItems } from '@/types';
import { saleProfit, soldQty } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const TABULAR = StyleSheet.create({ nums: { fontVariant: ['tabular-nums'] } }).nums;

interface SaleDetailsItemListProps {
  sale: SaleWithItems;
  /** Original unit price per sale item id, for lines changed by a price correction. */
  oldPrices?: Map<number, number>;
}

// Owner-only profit line, collapsed by default so the screen is safe to show a customer.
function ProfitRow({ sale }: { sale: SaleWithItems }) {
  const [shown, setShown] = useState(false);
  const { profit, margin, missingCost } = saleProfit(sale.items);
  const allMissing = missingCost === sale.items.length;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        setShown((v) => !v);
      }}
      accessibilityRole="button"
      accessibilityState={{ expanded: shown }}
      accessibilityLabel={
        shown && !allMissing
          ? `Profit ${formatPesos(profit)}, ${Math.round(margin * 100)} percent margin. Tap to hide.`
          : 'Show profit for this sale'
      }
      className="mx-5 mt-3 min-h-12 px-4 py-3 rounded-xl border border-paper-300 bg-paper-50 active:bg-paper-100"
    >
      <View className="flex-row items-center">
        <FontAwesome name={shown ? 'eye-slash' : 'eye'} size={14} color="#564E45" />
        <StyledText variant="extrabold" className="text-ink-700 text-sm ml-2 flex-1">
          {shown ? 'Profit on this sale' : 'Show profit'}
        </StyledText>
        {shown && !allMissing && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 200 }}>
            <StyledText variant="extrabold" className="text-sage-700 text-base" style={TABULAR}>
              {formatPesos(profit)}
              <StyledText variant="medium" className="text-ink-500 text-sm">
                {`  ${Math.round(margin * 100)}%`}
              </StyledText>
            </StyledText>
          </MotiView>
        )}
      </View>
      {shown && missingCost > 0 && (
        <StyledText variant="regular" className="text-ink-500 text-xs mt-1.5">
          {allMissing
            ? 'No cost price saved for these items, so profit is unknown.'
            : `${missingCost} ${missingCost === 1 ? 'item has' : 'items have'} no cost price, so profit is partial.`}
        </StyledText>
      )}
    </Pressable>
  );
}

// Itemised lines, receipt-style total, and the hidden profit row.
export function SaleDetailsItemList({ sale, oldPrices }: SaleDetailsItemListProps) {
  const isCancelled = !!sale.cancelled_at;
  const isCredit = sale.payment_type === 'credit';
  const struck = isCancelled ? 'text-ink-400 line-through' : 'text-ink-900';

  return (
    <>
      <View className="mx-5 mt-2 pb-2 flex-row border-b border-ink-300">
        <StyledText variant="extrabold" className="label-caps text-ink-400 w-10">
          Qty
        </StyledText>
        <StyledText variant="extrabold" className="label-caps text-ink-400 flex-1">
          Item
        </StyledText>
        <StyledText variant="extrabold" className="label-caps text-ink-400">
          Amount
        </StyledText>
      </View>

      <View className="mx-5">
        {sale.items.map((item, index) => {
          const qty = soldQty(item);
          const unit = item.sold_unit_name ?? 'pc';
          const lineTotal = qty * item.price;
          const original = oldPrices?.get(item.id);
          const oldPrice = original !== item.price ? original : undefined;
          return (
            <View
              key={item.id}
              accessible
              accessibilityLabel={`${qty} ${unit} ${item.product_name} at ${formatPesos(item.price)}${
                oldPrice != null ? `, corrected from ${formatPesos(oldPrice)}` : ''
              }, ${formatPesos(lineTotal)}`}
              className={`py-3 flex-row items-start ${
                index < sale.items.length - 1 ? 'border-b border-dashed border-ink-200' : ''
              }`}
            >
              <StyledText variant="extrabold" className="text-ink-700 text-base w-10" style={TABULAR}>
                {qty}×
              </StyledText>
              <View className="flex-1 pr-3">
                <StyledText variant="extrabold" className="text-ink-900 text-base" numberOfLines={2}>
                  {item.product_name}
                </StyledText>
                <View className="flex-row items-center flex-wrap mt-1 gap-x-2 gap-y-1">
                  <StyledText variant="medium" className="text-mono text-ink-500 text-sm">
                    {unit} ×{' '}
                    {oldPrice != null && (
                      <StyledText variant="medium" className="text-ink-400 line-through">
                        {formatPesos(oldPrice)}{' '}
                      </StyledText>
                    )}
                    {formatPesos(item.price)}
                  </StyledText>
                  {!!item.conversion_factor && (
                    <View className="bg-paper-200 rounded-md px-1.5 py-0.5">
                      <StyledText variant="medium" className="text-mono text-ink-700 text-xs">
                        {item.conversion_factor} pcs each
                      </StyledText>
                    </View>
                  )}
                  {oldPrice != null && (
                    <View className="bg-paper-200 rounded-md px-1.5 py-0.5">
                      <StyledText variant="medium" className="text-ink-700 text-xs">
                        Price fixed
                      </StyledText>
                    </View>
                  )}
                </View>
              </View>
              <MoneyText value={lineTotal} className={`text-base ${struck}`} />
            </View>
          );
        })}
      </View>

      <View
        accessible
        accessibilityLabel={`${isCancelled ? 'Original total' : 'Total'} ${formatPesos(sale.total)}${
          isCancelled ? ', cancelled' : isCredit ? ', charged to utang' : ''
        }`}
        className="mx-5 mt-2"
      >
        <View className="h-px bg-ink-300" />
        <View className="h-px bg-ink-300 mt-0.5 mb-3" />
        <View className="flex-row items-baseline justify-between">
          <StyledText variant="extrabold" className="label-caps text-ink-500">
            {isCancelled ? 'Original total' : 'Total'}
          </StyledText>
          <MoneyText value={sale.total} size="xl" className={struck} />
        </View>
        {isCredit && !isCancelled && (
          <View className="flex-row items-center mt-1.5">
            <FontAwesome name="book" size={12} color="#A1370C" />
            <StyledText variant="medium" className="text-persimmon-700 text-sm ml-1.5">
              Charged to utang. Payments show in the customer ledger.
            </StyledText>
          </View>
        )}
      </View>

      {!isCancelled && <ProfitRow sale={sale} />}
    </>
  );
}
