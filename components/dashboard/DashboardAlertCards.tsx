import { memo } from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { AlertCard } from './AlertCard';

interface DashboardAlertCardsProps {
  lowStockCount: number;
  outOfStockCount: number;
  outstandingPesos: number;
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
  outstandingPesos,
  customersWithBalance,
  onTapStock,
  onTapUtang,
}: DashboardAlertCardsProps) {
  const stockTotal = lowStockCount + outOfStockCount;
  const showStock = stockTotal > 0;
  const showUtang = outstandingPesos > 0;

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
              valueText={`${outstandingPesos}`}
              valueKind="money"
              subtitle={
                customersWithBalance === 1
                  ? '1 suki owes'
                  : `${customersWithBalance} suki owe`
              }
              onPress={onTapUtang}
              accessibilityLabel={`Outstanding utang ${outstandingPesos} pesos across ${customersWithBalance} customers`}
            />
          )}
        </View>
      </View>
    </MotiView>
  );
});
