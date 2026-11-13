import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { formatPesos } from '@/lib/money';
import type { PriceChangeSource } from '@/types/pricing.types';

export interface PriceHistoryCardProps {
  productId: number;
}

const SOURCE_KEYS: Record<PriceChangeSource, string> = {
  delivery: 'sourceDelivery',
  restock: 'sourceRestock',
  manual_edit: 'sourceManualEdit',
  reprice: 'sourceReprice',
};

const formatDay = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString();
};

export function PriceHistoryCard({ productId }: PriceHistoryCardProps) {
  const { t } = useTranslation('pricing');
  const history = usePriceHistory(productId).data;

  if (!history || history.length === 0) return null;

  return (
    <View className="mx-4 mt-4 rounded-2xl border border-ink-100 bg-paper-50 p-4">
      <StyledText variant="extrabold" className="label-caps text-ink-400">
        {t('historyTitle')}
      </StyledText>
      {history.map((change) => (
        <View
          key={change.id}
          className="mt-3 flex-row items-start justify-between"
        >
          <View className="mr-3 flex-1">
            <StyledText variant="semibold" className="text-sm text-ink-800">
              {change.field === 'cost' ? t('historyCost') : t('historyPrice')}
            </StyledText>
            <StyledText variant="regular" className="text-sm text-ink-600">
              {change.oldValue === null
                ? t('historyFirst', { to: formatPesos(change.newValue) })
                : t('historyChange', {
                    from: formatPesos(change.oldValue),
                    to: formatPesos(change.newValue),
                  })}
            </StyledText>
          </View>
          <StyledText variant="regular" className="text-xs text-ink-500">
            {`${t(SOURCE_KEYS[change.source])} - ${formatDay(change.createdAt)}`}
          </StyledText>
        </View>
      ))}
    </View>
  );
}
