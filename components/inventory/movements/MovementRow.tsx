import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface Props {
  transaction: any;
}

export function MovementRow({ transaction }: Props) {
  const positive =
    transaction.type === 'restock' ||
    (transaction.type === 'adjustment' &&
      transaction.adjustment_sign === 'positive') ||
    transaction.type === 'receive';
  const sign = positive ? '+' : '-';
  const color = positive ? 'text-sage-700' : 'text-rose-700';
  const icon = positive ? 'arrow-down' : 'arrow-up';
  const time = new Date(transaction.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className="bg-paper-50 mx-4 mb-2 p-3 rounded-2xl border border-ink-100 flex-row items-center gap-3 min-h-[44px]">
      <View
        className={`w-8 h-8 rounded-full items-center justify-center ${
          positive ? 'bg-sage-50' : 'bg-rose-50'
        }`}
      >
        <FontAwesome
          name={icon}
          size={12}
          color={positive ? '#2C4413' : '#9F1239'}
        />
      </View>
      <View className="flex-1">
        <StyledText
          variant="semibold"
          numberOfLines={1}
          className="text-sm text-ink-900"
        >
          {transaction.productName ?? `Product #${transaction.product_id}`}
        </StyledText>
        <StyledText className="text-[11px] text-ink-500">
          {transaction.type} · {time}
          {transaction.note ? ` · ${transaction.note}` : ''}
        </StyledText>
      </View>
      <StyledText variant="extrabold" className={`text-sm ${color}`}>
        {sign}
        {transaction.quantity}
      </StyledText>
    </View>
  );
}
