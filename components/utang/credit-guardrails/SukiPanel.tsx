import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import type { CustomerCreditSummary } from '@/types/credits.types';

export interface SukiPanelProps {
  summary: CustomerCreditSummary;
  pendingTotal?: number;
  mode: 'compact' | 'detailed';
  onRequestOverride?: () => void;
}

export function SukiPanel({
  summary,
  pendingTotal,
  mode,
  onRequestOverride,
}: SukiPanelProps) {
  const pending = pendingTotal ?? 0;

  // Projected available: creditLimit - balance - pending
  const projectedAvailable =
    summary.creditLimit !== null
      ? summary.creditLimit - summary.balance - pending
      : null;

  const projectedWouldExceed =
    summary.creditLimit !== null &&
    projectedAvailable !== null &&
    projectedAvailable < 0;

  const projectedNearLimit =
    summary.creditLimit !== null &&
    projectedAvailable !== null &&
    !projectedWouldExceed &&
    projectedAvailable / summary.creditLimit <= 0.2;

  // In compact mode, hide entirely when there is nothing to show
  if (
    mode === 'compact' &&
    summary.creditLimit === null &&
    !summary.isOverdue &&
    pending === 0
  ) {
    return null;
  }

  const overAmount =
    projectedAvailable !== null && projectedAvailable < 0
      ? Math.abs(projectedAvailable)
      : 0;

  return (
    <View className="bg-paper-50 border border-ink-150 rounded-xl p-3 gap-2">
      {/* Outstanding row — always shown */}
      <View className="flex-row items-center justify-between">
        <StyledText variant="medium" className="text-ink-500 text-xs">
          Outstanding
        </StyledText>
        <StyledText variant="extrabold" className="text-ink-900 text-sm">
          {formatPesos(summary.balance)}
        </StyledText>
      </View>

      {/* Limit + available rows */}
      {summary.creditLimit !== null && (
        <>
          <View className="flex-row items-center justify-between">
            <StyledText variant="medium" className="text-ink-500 text-xs">
              Limit
            </StyledText>
            <StyledText variant="medium" className="text-ink-700 text-sm">
              {formatPesos(summary.creditLimit)}
            </StyledText>
          </View>
          {projectedAvailable !== null && (
            <View className="flex-row items-center justify-between">
              <StyledText variant="medium" className="text-ink-500 text-xs">
                Available
              </StyledText>
              <StyledText
                variant="extrabold"
                className={
                  projectedAvailable < 0
                    ? 'text-red-600 text-sm'
                    : 'text-ink-900 text-sm'
                }
              >
                {formatPesos(projectedAvailable)}
              </StyledText>
            </View>
          )}
        </>
      )}

      {/* Overdue badge */}
      {summary.isOverdue && summary.overdueDays !== null && (
        <View className="bg-red-100 px-2 py-1 rounded-full self-start">
          <StyledText variant="semibold" className="text-red-700 text-xs">
            {`Overdue \u00b7 ${summary.overdueDays} days`}
          </StyledText>
        </View>
      )}

      {/* Near-limit chip */}
      {projectedNearLimit && summary.creditLimit !== null && (
        <View className="bg-amber-100 px-2 py-1 rounded-full self-start">
          <StyledText variant="semibold" className="text-amber-700 text-xs">
            Almost at limit
          </StyledText>
        </View>
      )}

      {/* Exceeded — soft warning (non-blocking) */}
      {projectedWouldExceed && !summary.blockOnExceed && (
        <View className="bg-red-100 px-2 py-1 rounded-full self-start">
          <StyledText variant="semibold" className="text-red-700 text-xs">
            {`Over limit by ${formatPesos(overAmount)}`}
          </StyledText>
        </View>
      )}

      {/* Exceeded — hard block banner with CTA */}
      {projectedWouldExceed && summary.blockOnExceed && (
        <View className="bg-red-50 border border-red-200 rounded-lg p-3 gap-2">
          <StyledText variant="semibold" className="text-red-800 text-sm">
            Over limit \u00b7 requires owner override
          </StyledText>
          {onRequestOverride && (
            <Pressable
              onPress={onRequestOverride}
              className="bg-red-600 rounded-lg px-3 py-2 items-center"
            >
              <StyledText variant="semibold" className="text-white text-sm">
                Record override
              </StyledText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
