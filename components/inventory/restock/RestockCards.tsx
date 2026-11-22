import type { ReactNode } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import type { ReorderRecommendation } from '@/types/stock-intelligence.types';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

interface CardShellProps {
  item: ReorderRecommendation;
  badge: { text: string; icon: IconName; color: string; cls: string };
  children: ReactNode;
}

// Shared card frame: product name, meta line, and a status badge with icon.
function CardShell({ item, badge, children }: CardShellProps) {
  const { t } = useTranslation('inventory');
  const meta = [t('restockSku', { sku: item.sku }), item.category]
    .filter(Boolean)
    .join(' · ');

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 200 }}
      className="bg-paper-50 rounded-2xl border border-paper-300 p-4 mb-3 gap-y-3"
    >
      <View className="flex-row justify-between items-start gap-x-2">
        <View className="flex-1">
          <StyledText variant="extrabold" className="text-base text-ink-900" numberOfLines={2}>
            {item.productName}
          </StyledText>
          <StyledText variant="regular" className="text-xs text-ink-600 mt-0.5">
            {meta}
          </StyledText>
        </View>
        <View className={`px-2.5 py-1 rounded-full flex-row items-center gap-x-1 ${badge.cls}`}>
          <FontAwesome name={badge.icon} size={11} color={badge.color} />
          <StyledText variant="extrabold" className="text-xs" style={{ color: badge.color }}>
            {badge.text}
          </StyledText>
        </View>
      </View>
      {children}
    </MotiView>
  );
}

function Stat({ label, children, align = 'start' }: { label: string; children: ReactNode; align?: 'start' | 'end' }) {
  return (
    <View className={`flex-1 ${align === 'end' ? 'items-end' : ''}`}>
      <StyledText variant="regular" className="text-xs text-ink-600">
        {label}
      </StyledText>
      {children}
    </View>
  );
}

function QuietButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-1 min-h-[44px] rounded-xl flex-row items-center justify-center gap-x-1.5 active:bg-paper-200"
    >
      <FontAwesome name={icon} size={12} color="#3D372F" />
      <StyledText variant="semibold" className="text-xs text-ink-700" numberOfLines={1}>
        {label}
      </StyledText>
    </TouchableOpacity>
  );
}

interface ReorderCardProps {
  item: ReorderRecommendation;
  onRestock: () => void;
  onAdjust: () => void;
  onDefer: () => void;
  onDismiss: () => void;
}

export function ReorderCard({ item, onRestock, onAdjust, onDefer, onDismiss }: ReorderCardProps) {
  const { t } = useTranslation('inventory');
  const unit = item.retailUnitName;
  const badge = item.isOutOfStock
    ? { text: t('restockOutOfStock'), icon: 'exclamation-circle' as const, color: '#C13030', cls: 'bg-semantic-danger-50' }
    : { text: t('restockLeft', { qty: item.currentStock, unit }), icon: 'arrow-down' as const, color: '#C77B0E', cls: 'bg-semantic-warning-50' };

  return (
    <CardShell item={item} badge={badge}>
      <View className="bg-paper-100 rounded-xl p-3 flex-row gap-x-2">
        <Stat label={t('restockSales28')}>
          <StyledText variant="semibold" className="text-sm text-ink-900">
            {item.sales28Days} {unit}
          </StyledText>
        </Stat>
        <Stat label={t('restockSuggested')}>
          <StyledText variant="extrabold" className="text-base text-persimmon-700">
            +{item.suggestedQuantity} {unit}
          </StyledText>
        </Stat>
        <Stat label={t('restockEstCost')} align="end">
          {item.costPrice !== null && item.suggestedQuantity > 0 ? (
            <MoneyText value={item.estimatedSpend ?? 0} size="sm" />
          ) : (
            <StyledText variant="semibold" className="text-sm text-ink-600">
              —
            </StyledText>
          )}
        </Stat>
      </View>

      {item.preferredSupplierName ? (
        <View className="flex-row items-center gap-x-1.5">
          <FontAwesome name="truck" size={12} color="#564E45" />
          <StyledText variant="medium" className="text-xs text-ink-700">
            {t('restockSupplier', { name: item.preferredSupplierName })}
          </StyledText>
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onRestock}
        accessibilityRole="button"
        accessibilityLabel={`${t('restockRecord')}, ${item.productName}`}
        className="min-h-[48px] bg-persimmon-500 rounded-xl flex-row items-center justify-center gap-x-2 active:bg-persimmon-600"
      >
        <FontAwesome name="plus" size={12} color="#FAFAF7" />
        <StyledText variant="extrabold" className="text-sm text-paper-50">
          {t('restockRecord')}
        </StyledText>
      </TouchableOpacity>

      <View className="flex-row border-t border-paper-300 pt-1 -mb-1">
        <QuietButton icon="pencil" label={t('restockAdjust')} onPress={onAdjust} />
        <QuietButton icon="clock-o" label={t('restockDefer')} onPress={onDefer} />
        <QuietButton icon="times" label={t('restockDismiss')} onPress={onDismiss} />
      </View>
    </CardShell>
  );
}

export function SlowMoverCard({ item }: { item: ReorderRecommendation }) {
  const { t } = useTranslation('inventory');
  const badge = {
    text: t('restockStock', { qty: item.currentStock, unit: item.retailUnitName }),
    icon: 'archive' as const,
    color: '#3D372F',
    cls: 'bg-paper-200',
  };
  return (
    <CardShell item={item} badge={badge}>
      <View className="flex-row justify-between items-center pt-3 border-t border-paper-300">
        <StyledText variant="regular" className="text-sm text-ink-700 flex-1">
          {t('restockNoSales28')}
        </StyledText>
        {item.costPrice !== null ? (
          <View className="items-end">
            <StyledText variant="regular" className="text-xs text-ink-600">
              {t('restockStockValue')}
            </StyledText>
            <MoneyText value={item.currentStock * item.costPrice} size="sm" />
          </View>
        ) : null}
      </View>
    </CardShell>
  );
}

export function WatchCard({ item }: { item: ReorderRecommendation }) {
  const { t } = useTranslation('inventory');
  const badge = { text: t('restockNewProduct'), icon: 'star' as const, color: '#2E6FA8', cls: 'bg-semantic-info-50' };
  return (
    <CardShell item={item} badge={badge}>
      <View className="flex-row justify-between items-center pt-3 border-t border-paper-300 gap-x-2">
        <StyledText variant="regular" className="text-sm text-ink-700 flex-1">
          {t('restockFewDays')}
        </StyledText>
        <StyledText variant="semibold" className="text-sm text-ink-900">
          {t('restockStock', { qty: item.currentStock, unit: item.retailUnitName })}
        </StyledText>
      </View>
    </CardShell>
  );
}

export function SavedPlanCard({ item, onRestore }: { item: ReorderRecommendation; onRestore: () => void }) {
  const { t } = useTranslation('inventory');
  if (!item.savedPlan) return null;
  const { status, adjustedQuantity, deferredUntil } = item.savedPlan;
  const unit = item.retailUnitName;

  const badge =
    status === 'adjusted'
      ? { text: t('restockStatusAdjusted', { qty: adjustedQuantity, unit }), icon: 'pencil' as const, color: '#A1370C', cls: 'bg-persimmon-50' }
      : status === 'deferred'
        ? {
            text: t('restockStatusDeferred', { date: deferredUntil ? new Date(deferredUntil).toLocaleDateString() : '' }),
            icon: 'clock-o' as const,
            color: '#8A5208',
            cls: 'bg-semantic-warning-50',
          }
        : { text: t('restockStatusDismissed'), icon: 'times' as const, color: '#C13030', cls: 'bg-semantic-danger-50' };

  return (
    <CardShell item={item} badge={badge}>
      <View className="flex-row justify-between items-center pt-3 border-t border-paper-300 gap-x-2">
        <StyledText variant="regular" className="text-sm text-ink-700 flex-1">
          {t('restockOriginalSuggested')} +{item.defaultSuggestedQuantity} {unit}
        </StyledText>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onRestore}
          accessibilityRole="button"
          accessibilityLabel={`${t('restockRestore')}, ${item.productName}`}
          className="min-h-[44px] px-4 bg-paper-100 border border-ink-200 rounded-xl flex-row items-center gap-x-1.5 active:bg-paper-200"
        >
          <FontAwesome name="undo" size={12} color="#28231D" />
          <StyledText variant="extrabold" className="text-sm text-ink-900">
            {t('restockRestore')}
          </StyledText>
        </TouchableOpacity>
      </View>
    </CardShell>
  );
}
