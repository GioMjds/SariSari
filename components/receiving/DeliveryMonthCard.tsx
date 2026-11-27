import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { MoneyText } from '@/components/ui';
import type { MonthSummary } from './receiptList';

interface DeliveryMonthCardProps {
  summary: MonthSummary;
  onOpenShortages: () => void;
}

/** This month's receiving at a glance, with Sari's read and the door to the shortage report. */
export function DeliveryMonthCard({
  summary,
  onOpenShortages,
}: DeliveryMonthCardProps) {
  const { t } = useTranslation('receiving');
  const hasShort = summary.shortCount > 0;
  const verdict =
    summary.count === 0
      ? t('monthNone')
      : hasShort
        ? t('monthShort', { count: summary.shortCount })
        : t('monthAllFull');

  return (
    <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper mb-4 overflow-hidden">
      <View
        className="flex-row items-center px-4 pt-4 pb-3"
        accessible
        accessibilityLabel={`${t('monthLabel')}, ${t('deliveryCount', {
          count: summary.count,
        })}. ${verdict}`}
      >
        <View className="flex-1">
          <StyledText variant="semibold" className="text-xs text-ink-500">
            {t('monthLabel')}
          </StyledText>
          <MoneyText
            value={summary.totalCost}
            size="xl"
            className="text-ink-900 mt-0.5"
            numberOfLines={1}
          />
          <StyledText
            variant="medium"
            className="text-xs text-ink-600 mt-0.5"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {t('deliveryCount', { count: summary.count })}
          </StyledText>
        </View>
        <SariMascot
          state={
            hasShort ? 'low-stock' : summary.count > 0 ? 'inventory' : 'empty'
          }
          size={72}
        />
      </View>

      <Pressable
        onPress={onOpenShortages}
        accessibilityRole="link"
        accessibilityLabel={`${verdict} ${t('shortagesLink')}`}
        style={{ minHeight: 48 }}
        className={`flex-row items-center justify-between px-4 py-3 border-t active:opacity-80 ${
          hasShort
            ? 'bg-semantic-danger-50 border-semantic-danger-100'
            : 'bg-cinnamon-50 border-cinnamon-100'
        }`}
      >
        <View className="flex-row items-center gap-2 flex-1 mr-2">
          <FontAwesome
            name={hasShort ? 'exclamation-triangle' : 'truck'}
            size={13}
            color={hasShort ? '#C13030' : '#623418'}
          />
          <StyledText
            variant="semibold"
            className={`text-xs flex-shrink ${
              hasShort ? 'text-semantic-danger' : 'text-cinnamon-700'
            }`}
            numberOfLines={2}
          >
            {verdict}
          </StyledText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <StyledText variant="semibold" className="text-xs text-cinnamon-700">
            {t('shortagesShort')}
          </StyledText>
          <FontAwesome name="angle-right" size={14} color="#623418" />
        </View>
      </Pressable>
    </View>
  );
}
