import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';

interface DashboardAlertCardsProps {
  lowStockCount: number;
  outOfStockCount: number;
  outstandingCentavos: number;
  customersWithBalance: number;
  onTapStock: () => void;
  onTapUtang: () => void;
}

/**
 * DashboardAlertCards — compact two-up alert row.
 *
 * The left card summarises stock urgency (low + out counts) and the
 * right card summarises the outstanding utang book. Both tap through
 * to their owning tab; if a count is zero the card quietly fades so
 * it doesn't pull attention from the busy card.
 */
export const DashboardAlertCards = memo(function DashboardAlertCards({
  lowStockCount,
  outOfStockCount,
  outstandingCentavos,
  customersWithBalance,
  onTapStock,
  onTapUtang,
}: DashboardAlertCardsProps) {
  const stockTotal = lowStockCount + outOfStockCount;
  const showStock = stockTotal > 0;
  const showUtang = outstandingCentavos > 0;

  if (!showStock && !showUtang) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: 220 }}
    >
      <View className="px-4 mb-4">
        <View className="flex-row gap-2.5">
          {showStock && (
            <AlertCard
              tone="warning"
              icon="exclamation-triangle"
              eyebrow="Stock"
              valueText={`${stockTotal}`}
              valueKind="count"
              subtitle={
                outOfStockCount > 0
                  ? `${outOfStockCount} out · ${lowStockCount} low`
                  : `${lowStockCount} low stock`
              }
              onPress={onTapStock}
              accessibilityLabel={`${stockTotal} items need stock attention`}
            />
          )}
          {showUtang && (
            <AlertCard
              tone="danger"
              icon="credit-card"
              eyebrow="Utang"
              valueText={`${outstandingCentavos}`}
              valueKind="money"
              subtitle={
                customersWithBalance === 1
                  ? '1 suki owes'
                  : `${customersWithBalance} suki owe`
              }
              onPress={onTapUtang}
              accessibilityLabel={`Outstanding utang ${outstandingCentavos} centavos across ${customersWithBalance} customers`}
            />
          )}
        </View>
      </View>
    </MotiView>
  );
});

type AlertTone = 'warning' | 'danger';

const TONE_BG: Record<AlertTone, string> = {
  warning: 'bg-semantic-warning-50',
  danger: 'bg-semantic-danger-50',
};

const TONE_ACCENT: Record<AlertTone, string> = {
  warning: '#C77B0E',
  danger: '#C13030',
};

const TONE_LABEL: Record<AlertTone, string> = {
  warning: 'text-semantic-warning',
  danger: 'text-semantic-danger',
};

function AlertCard({
  tone,
  icon,
  eyebrow,
  valueText,
  valueKind,
  subtitle,
  onPress,
  accessibilityLabel,
}: {
  tone: AlertTone;
  icon: keyof typeof FontAwesome.glyphMap;
  eyebrow: string;
  valueText: string;
  valueKind: 'count' | 'money';
  subtitle: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="flex-1 active:opacity-80"
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        className={`rounded-2xl p-3 border ${
          tone === 'warning'
            ? 'bg-semantic-warning-50 border-semantic-warning-100'
            : 'bg-semantic-danger-50 border-semantic-danger-100'
        }`}
        style={{
          shadowColor: '#564E45',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between mb-1.5">
          <View className="flex-row items-center">
            <FontAwesome name={icon} size={11} color={TONE_ACCENT[tone]} />
            <StyledText
              variant="extrabold"
              className={`label-caps ml-1.5 ${TONE_LABEL[tone]}`}
              style={{ fontSize: 10 }}
            >
              {eyebrow}
            </StyledText>
          </View>
          <FontAwesome
            name="chevron-right"
            size={11}
            color={TONE_ACCENT[tone]}
            style={{ opacity: 0.6 }}
          />
        </View>

        {valueKind === 'money' ? (
          <MoneyText
            value={Number(valueText)}
            size="lg"
            variant="danger"
            className="text-lg"
          />
        ) : (
          <StyledText
            variant="black"
            className={`text-xl ${TONE_LABEL[tone]}`}
          >
            {valueText}
          </StyledText>
        )}

        <StyledText
          variant="medium"
          className="text-caption text-ink-600 mt-0.5"
          numberOfLines={1}
        >
          {subtitle}
        </StyledText>
      </View>
    </Pressable>
  );
}
