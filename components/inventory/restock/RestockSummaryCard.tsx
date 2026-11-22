import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { MoneyText } from '@/components/ui';

interface RestockSummaryCardProps {
  buyCount: number;
  estimatedTotal: number;
  onReceiveDelivery: () => void;
}

// Explains the Restock tab and totals the current buy list.
export function RestockSummaryCard({
  buyCount,
  estimatedTotal,
  onReceiveDelivery,
}: RestockSummaryCardProps) {
  const { t } = useTranslation('inventory');
  const { t: tReceiving } = useTranslation('receiving');

  return (
    <View className="bg-paper-50 rounded-2xl p-4 border border-paper-300 gap-y-3">
      <View className="flex-row items-center gap-x-3">
        <SariMascot state="low-stock" size={56} animated={false} defer />
        <View className="flex-1 gap-y-1">
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            className="text-ink-900 text-lg"
          >
            {t('restockIntroTitle')}
          </StyledText>
          <StyledText variant="regular" className="text-ink-700 text-sm">
            {t('restockSubtitle')}
          </StyledText>
        </View>
      </View>

      <View className="flex-row gap-x-2">
        <View className="flex-1 bg-paper-100 rounded-xl p-3">
          <StyledText variant="semibold" className="text-ink-700 text-xs">
            {t('restockToBuyLabel')}
          </StyledText>
          <StyledText variant="extrabold" className="text-ink-900 text-lg">
            {t('restockItemsCount', { count: buyCount })}
          </StyledText>
        </View>
        <View className="flex-1 bg-paper-100 rounded-xl p-3">
          <StyledText variant="semibold" className="text-ink-700 text-xs">
            {t('restockEstTotal')}
          </StyledText>
          <MoneyText value={estimatedTotal} size="lg" />
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onReceiveDelivery}
        accessibilityRole="button"
        accessibilityLabel={tReceiving('newDelivery')}
        accessibilityHint={t('restockDeliveryHint')}
        className="min-h-[48px] px-4 bg-paper-100 border border-ink-200 rounded-xl flex-row items-center gap-x-3 active:bg-paper-200"
      >
        <FontAwesome name="truck" size={16} color="#28231D" />
        <View className="flex-1 py-2">
          <StyledText variant="extrabold" className="text-sm text-ink-900">
            {tReceiving('newDelivery')}
          </StyledText>
          <StyledText variant="regular" className="text-xs text-ink-600">
            {t('restockDeliveryHint')}
          </StyledText>
        </View>
        <FontAwesome name="chevron-right" size={12} color="#564E45" />
      </TouchableOpacity>
    </View>
  );
}
