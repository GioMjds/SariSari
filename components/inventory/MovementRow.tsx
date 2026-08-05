import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { InventoryTransaction } from '@/types/inventory.types';

export interface MovementRowProps {
  transaction: InventoryTransaction & { productName?: string };
}

export function MovementRow({ transaction }: MovementRowProps) {
  const isPositive =
    transaction.type === 'restock' ||
    (transaction.type === 'adjustment' &&
      transaction.adjustment_sign === 'positive');

  const qtyPrefix = isPositive ? '+' : '-';
  const qtyColor = isPositive ? 'text-semantic-success' : 'text-semantic-danger';

  return (
    <View className="bg-paper-50 mx-4 mb-2 p-3 rounded-2xl border border-ink-100 flex-row items-center justify-between">
      <View className="flex-1 mr-2">
        <StyledText variant="extrabold" className="text-sm text-ink-900">
          {transaction.productName || `Product #${transaction.product_id}`}
        </StyledText>
        <StyledText variant="medium" className="text-xs text-ink-600 mt-0.5">
          {transaction.type} •{' '}
          {new Date(transaction.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </StyledText>
        {transaction.note ? (
          <StyledText variant="regular" className="text-xs text-ink-600 italic mt-1">
            {transaction.note}
          </StyledText>
        ) : null}
      </View>

      <StyledText
        variant="extrabold"
        className={`text-base ${qtyColor}`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {qtyPrefix}
        {transaction.quantity}
      </StyledText>
    </View>
  );
}
