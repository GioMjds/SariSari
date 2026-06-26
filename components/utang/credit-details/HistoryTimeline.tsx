import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';
import { format, isValid } from 'date-fns';
import { MotiView } from 'moti';
import { CreditHistory } from '@/types/credits.types';
import { formatPesos } from '@/lib/money';
import { describeHistoryEntry } from '@/lib/creditDetails';
import { parseStoredTimestamp } from '@/utils/timezone';
import { StyledText } from '@/components/elements';

interface HistoryTimelineProps {
  history: CreditHistory[];
}

/**
 * HistoryTimeline — chronological ledger combining credits + payments.
 *
 * Each row sits on a dotted vertical trace. Credits land on the left
 * with a red "+" node, payments on the left with a green "check" node.
 * A bold running-balance badge on the right shows where the suki's
 * outstanding balance stood after that entry was logged.
 *
 * Renders an empty-state when there's no history yet — the parent's
 * loader screen handles the "still loading" case so we don't double
 * up a spinner here.
 */
export function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <View className="items-center justify-center py-12 px-6">
        <FontAwesome name="history" size={48} color="#A89F90" />
        <StyledText
          variant="extrabold"
          className="text-ink-700 text-xl mt-4 text-center"
        >
          No transaction history
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-500 text-sm mt-2 text-center"
        >
          Credits and payments will appear here once you start logging them.
        </StyledText>
      </View>
    );
  }

  return (
    <View className="relative">
      {history.map((item, idx) => (
        <MotiView
          key={`${item.type}-${item.id}`}
          from={{ opacity: 0, translateX: -8 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 320, delay: 80 + idx * 30 }}
        >
          <HistoryRow
            item={item}
            isLast={idx === history.length - 1}
          />
        </MotiView>
      ))}
    </View>
  );
}

/* ─── Single row ─────────────────────────────────────────────────────── */

function HistoryRow({
  item,
  isLast,
}: {
  item: CreditHistory;
  isLast: boolean;
}) {
  const isCredit = item.type === 'credit';
  const date = parseStoredTimestamp(item.date);
  const description = describeHistoryEntry(item);

  const nodeBg = isCredit ? 'bg-persimmon-50' : 'bg-sage-50';
  const nodeBorder = isCredit ? 'border-persimmon-500' : 'border-sage-500';
  const nodeColor = isCredit ? '#C8460F' : '#4F7A24';
  const iconName: 'plus' | 'check' = isCredit ? 'plus' : 'check';

  return (
    <View className="flex-row mb-2">
      {/* Timeline gutter — node + dotted trace */}
      <View className="items-center mr-3" style={{ width: 36 }}>
        <View
          className={`w-9 h-9 rounded-full items-center justify-center border-2 ${nodeBg} ${nodeBorder}`}
          style={{
            shadowColor: isCredit ? '#C8460F' : '#4F7A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <FontAwesome name={iconName} size={14} color={nodeColor} />
        </View>
        {!isLast && (
          <View
            className="flex-1 mt-1 mb-[-12px] w-px"
            style={{
              borderLeftWidth: 1,
              borderLeftColor: '#D2CCC1',
              borderStyle: 'dashed',
              minHeight: 24,
            }}
          />
        )}
      </View>

      {/* Content card */}
      <View className="flex-1 bg-paper-50 rounded-2xl border border-ink-100 shadow-paper mb-3 overflow-hidden">
        <View className="flex-row items-start justify-between p-3.5">
          <View className="flex-1 pr-3">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-base"
              numberOfLines={2}
            >
              {description}
            </StyledText>
            <StyledText
              variant="medium"
              className="text-mono text-ink-500 mt-0.5"
            >
              {date && isValid(date)
                ? format(date, 'MMM dd, yyyy · h:mm a')
                : 'Unknown date'}
            </StyledText>
          </View>

          <View className="items-end">
            <StyledText
              variant="black"
              className={`text-base ${
                isCredit ? 'text-semantic-danger' : 'text-semantic-success'
              }`}
            >
              {isCredit ? '+' : '−'}
              {formatPesos(item.amount)}
            </StyledText>
            <View className="mt-1.5 px-2 py-0.5 rounded-pill bg-paper-100 border border-ink-200">
              <StyledText
                variant="medium"
                className="text-mono text-ink-700"
                style={{ fontSize: 10 }}
              >
                Balance {formatPesos(item.running_balance)}
              </StyledText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
