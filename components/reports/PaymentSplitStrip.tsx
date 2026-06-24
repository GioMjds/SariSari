import { View } from 'react-native';
import { StyledText } from '../elements';
import { MoneyText } from '../ui';

interface Props {
  cash: number;
  credit: number;
  total: number;
  transactions: number;
  avgTicket: number;
}

export function PaymentSplitStrip({
  cash,
  credit,
  total,
  transactions,
  avgTicket,
}: Props) {
  const totalForSplit = cash + credit;
  const cashPct = totalForSplit > 0 ? (cash / totalForSplit) * 100 : 0;
  const creditPct = totalForSplit > 0 ? (credit / totalForSplit) * 100 : 0;

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-2">
        <StyledText
          variant="extrabold"
          className="text-label text-ink-400"
          style={{ letterSpacing: 1.4 }}
        >
          PAYMENT MIX
        </StyledText>
        <StyledText variant="medium" className="text-mono text-ink-500">
          {transactions} txs
        </StyledText>
      </View>

      {/* Segmented bar */}
      <View className="flex-row h-2 rounded-full overflow-hidden border border-ink-200">
        <View
          className="h-full"
          style={{
            width: `${cashPct}%`,
            backgroundColor: '#4F7A24',
          }}
        />
        <View
          className="h-full"
          style={{
            width: `${creditPct}%`,
            backgroundColor: '#E85A1F',
          }}
        />
      </View>

      <View className="flex-row mt-2">
        <View className="flex-1 flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-sage-500 mr-1.5" />
          <StyledText
            variant="extrabold"
            className="text-label text-sage-700"
            style={{ letterSpacing: 1.2 }}
          >
            CASH
          </StyledText>
          <MoneyText
            value={cash}
            fromPesos
            size="sm"
            variant="default"
            className="text-ink-900 ml-2 text-xs"
          />
        </View>
        <View className="flex-1 flex-row items-center justify-end">
          <View className="w-2 h-2 rounded-full bg-persimmon-500 mr-1.5" />
          <StyledText
            variant="extrabold"
            className="text-label text-persimmon-600"
            style={{ letterSpacing: 1.2 }}
          >
            CREDIT
          </StyledText>
          <MoneyText
            value={credit}
            fromPesos
            size="sm"
            variant="default"
            className="text-ink-900 ml-2 text-xs"
          />
        </View>
      </View>

      {/* Footer stat row */}
      <View className="mt-4 flex-row items-stretch border-t border-dashed border-ink-200 pt-3">
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            className="text-label text-ink-400"
            style={{ letterSpacing: 1.2 }}
          >
            AVG TICKET
          </StyledText>
          <MoneyText
            value={avgTicket}
            fromPesos
            size="sm"
            variant="default"
            className="text-ink-900 text-sm"
          />
        </View>
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            className="text-label text-ink-400"
            style={{ letterSpacing: 1.2 }}
          >
            SALES
          </StyledText>
          <MoneyText
            value={total}
            fromPesos
            size="sm"
            variant="default"
            className="text-ink-900 text-sm"
          />
        </View>
      </View>
    </View>
  );
}
