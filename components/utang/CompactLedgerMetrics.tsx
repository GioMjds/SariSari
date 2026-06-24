import { memo } from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';

interface CompactLedgerMetricsProps {
  totalOutstandingCentavos: number;
  collectedTodayCentavos: number;
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
  totalOutstandingCentavos,
  collectedTodayCentavos,
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
                value={totalOutstandingCentavos}
                size="md"
                variant="danger"
                className="text-base"
              />
            </Tile>

            <Divider />

            <Tile label="Collected" tone="success" icon="money">
              <MoneyText
                value={collectedTodayCentavos}
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

type Tone = 'danger' | 'success' | 'warning' | 'ink';

const TONE_TEXT: Record<Tone, string> = {
  danger: '#C13030',
  success: '#4F7A24',
  warning: '#C77B0E',
  ink: '#564E45',
};

function Tile({
  label,
  tone,
  icon,
  children,
}: {
  label: string;
  tone: Tone;
  icon: keyof typeof FontAwesome.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-1 px-2 py-2 items-center">
      <View className="flex-row items-center mb-1">
        <FontAwesome name={icon} size={9} color={TONE_TEXT[tone]} />
        <StyledText
          variant="extrabold"
          className="label-caps ml-1 text-ink-400"
          style={{ fontSize: 9 }}
        >
          {label}
        </StyledText>
      </View>
      {children}
    </View>
  );
}

function Divider() {
  return (
    <View
      className="w-px self-stretch"
      style={{
        backgroundColor: '#D2CCC1',
        opacity: 0.55,
        // Dashed vertical line approximated via dots
        borderLeftWidth: 1,
        borderLeftColor: '#D2CCC1',
        borderStyle: 'dashed',
      }}
    />
  );
}
