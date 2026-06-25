import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { MotiView } from 'moti';
import { memo } from 'react';
import { View } from 'react-native';
import { Tile } from './Tile';
import { Divider } from './Divider';

interface CompactLedgerMetricsProps {
  totalOutstandingPesos: number;
  collectedTodayPesos: number;
  customersWithBalance: number;
  overdueCount: number;
}

/**
 * CompactLedgerMetrics — 4-cell metrics strip, ledger style.
 * Lives between the priority hero and the customer list. Reads
 * like the totals row of a paper receipt — small, dense, scannable.
 *
 * Each tile carries its own tone (danger for what you owe out,
 * success for what came in, warning for overdue count) so the eye
 * can latch onto urgency without parsing text.
 */
export const CompactLedgerMetrics = memo(function CompactLedgerMetrics({
  totalOutstandingPesos,
  collectedTodayPesos,
  customersWithBalance,
  overdueCount,
}: CompactLedgerMetricsProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: 160 }}
    >
      <View className="px-4 mb-4">
        <View
          className="bg-paper-50 rounded-2xl border border-ink-100 p-3"
          style={{
            shadowColor: '#564E45',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Row of 4 tiles, divided by dotted rules */}
          <View className="flex-row items-stretch">
            <Tile label="Outstanding" tone="danger" icon="credit-card">
              <MoneyText
                value={totalOutstandingPesos}
                size="md"
                variant="danger"
                className="text-base"
              />
            </Tile>

            <Divider />

            <Tile label="Collected" tone="success" icon="money">
              <MoneyText
                value={collectedTodayPesos}
                size="md"
                variant="success"
                className="text-base"
              />
            </Tile>

            <Divider />

            <Tile label="With Balance" tone="ink" icon="users">
              <StyledText variant="black" className="text-ink-900 text-base">
                {customersWithBalance}
              </StyledText>
            </Tile>

            <Divider />

            <Tile
              label="Overdue"
              tone={overdueCount > 0 ? 'warning' : 'ink'}
              icon="exclamation-triangle"
            >
              <StyledText
                variant="black"
                className={`text-base ${
                  overdueCount > 0 ? 'text-semantic-warning' : 'text-ink-900'
                }`}
              >
                {overdueCount}
              </StyledText>
            </Tile>
          </View>
        </View>
      </View>
    </MotiView>
  );
});
