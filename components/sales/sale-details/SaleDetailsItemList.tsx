import { StyledText } from '@/components/elements';
import { MoneyText, ReceiptHeroTotal } from '@/components/ui';
import { formatPesos } from '@/lib/money';
import { SaleWithItems } from '@/types';
import { soldQty } from '@/utils';
import { View } from 'react-native';

// Itemised lines and grand total, printed inside the resibo ticket.
export function SaleDetailsItemList({ sale }: { sale: SaleWithItems }) {
  const isCancelled = !!sale.cancelled_at;
  const totalLabel = isCancelled
    ? 'Original total'
    : sale.payment_type === 'credit'
      ? 'Amount on utang'
      : 'Total paid';

  return (
    <>
      <View className="mx-5 mt-2 pb-2 flex-row justify-between border-b border-ink-300">
        <StyledText variant="extrabold" className="label-caps text-ink-400">
          Item
        </StyledText>
        <StyledText variant="extrabold" className="label-caps text-ink-400">
          Amount
        </StyledText>
      </View>

      <View className="mx-5 mb-4">
        {sale.items.map((item, index) => {
          const qty = soldQty(item);
          const unit = item.sold_unit_name ?? 'Pc';
          const lineTotal = qty * item.price;
          const isWholesale = !!item.conversion_factor;
          return (
            <View
              key={item.id}
              accessible
              accessibilityLabel={`${item.product_name}, ${qty} ${unit} at ${formatPesos(item.price)}, ${formatPesos(lineTotal)}`}
              className={`py-3 flex-row items-start ${
                index < sale.items.length - 1 ? 'border-b border-dashed border-ink-200' : ''
              }`}
            >
              <View className="flex-1 pr-3">
                <StyledText variant="extrabold" className="text-ink-900 text-base" numberOfLines={2}>
                  {item.product_name}
                </StyledText>
                <View className="flex-row items-center flex-wrap mt-1">
                  <StyledText variant="medium" className="text-mono text-ink-500 text-sm">
                    {qty} {unit} × {formatPesos(item.price)}
                  </StyledText>
                  {isWholesale && (
                    <View className="ml-2 bg-paper-200 rounded-md px-1.5 py-0.5">
                      <StyledText variant="medium" className="text-mono text-ink-700 text-xs">
                        {item.conversion_factor} pcs each
                      </StyledText>
                    </View>
                  )}
                </View>
              </View>
              <MoneyText value={lineTotal} className="text-ink-900 text-base" />
            </View>
          );
        })}
      </View>

      <ReceiptHeroTotal label={totalLabel} amount={sale.total} struck={isCancelled} />
    </>
  );
}
