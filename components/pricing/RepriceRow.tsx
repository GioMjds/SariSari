import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos, parsePesosInput } from '@/lib/money';
import { markupPercent, suggestPrice } from '@/lib/repricing';
import type { RepriceFlag } from '@/types/pricing.types';

export interface RepriceRowProps {
  flag: RepriceFlag;
  busy?: boolean;
  onApply: (productId: number, newPrice: number) => void;
  onKeep: (productId: number) => void;
}

/** Returns the typed price, or null when it is empty, invalid, or not above zero. */
const readPrice = (text: string): number | null => {
  try {
    const value = parsePesosInput(text);
    return value > 0 ? value : null;
  } catch {
    return null;
  }
};

export function RepriceRow({
  flag,
  busy = false,
  onApply,
  onKeep,
}: RepriceRowProps) {
  const { t } = useTranslation('pricing');
  const suggestion = suggestPrice(
    flag.baselineCost,
    flag.newCost,
    flag.priceAtFlag,
  );
  const [text, setText] = useState(
    suggestion !== null ? String(suggestion) : '',
  );

  const typed = readPrice(text);
  const oldMarkup = markupPercent(flag.baselineCost, flag.priceAtFlag);
  const newMarkup = markupPercent(flag.newCost, flag.currentPrice);
  const sellsAtLoss = typed !== null && typed < flag.newCost;

  const handleApply = () => {
    if (busy || typed === null) return;
    onApply(flag.productId, typed);
  };

  const handleKeep = () => {
    if (busy) return;
    onKeep(flag.productId);
  };

  return (
    <View className="rounded-2xl border border-paper-300 bg-paper-50 p-4 gap-y-2">
      <StyledText variant="semibold" className="text-base text-ink-900">
        {flag.productName}
      </StyledText>

      <StyledText variant="regular" className="text-sm text-ink-600">
        {t('costLine', {
          from: formatPesos(flag.baselineCost),
          to: formatPesos(flag.newCost),
        })}
      </StyledText>

      <StyledText variant="regular" className="text-sm text-ink-600">
        {oldMarkup !== null && newMarkup !== null
          ? t('markupLine', { from: oldMarkup, to: newMarkup })
          : t('markupUnknown')}
      </StyledText>

      <StyledText variant="regular" className="text-sm text-ink-500">
        {t('currentPrice', { price: formatPesos(flag.currentPrice) })}
      </StyledText>

      <View className="mt-1">
        <StyledText variant="medium" className="text-sm text-ink-700 mb-1">
          {t('newPriceLabel')}
        </StyledText>
        <TextInput
          value={text}
          onChangeText={setText}
          editable={!busy}
          keyboardType="decimal-pad"
          accessibilityLabel={t('newPriceLabel')}
          className="min-h-[48px] rounded-xl border border-ink-200 bg-paper-100 px-3 text-base text-ink-900"
        />
        <StyledText variant="regular" className="text-xs text-ink-500 mt-1">
          {suggestion !== null
            ? t('suggestedHint', { price: formatPesos(suggestion) })
            : t('noSuggestion')}
        </StyledText>
        {typed === null ? (
          <StyledText
            variant="medium"
            className="text-xs text-persimmon-600 mt-1"
          >
            {t('invalidPrice')}
          </StyledText>
        ) : null}
        {sellsAtLoss ? (
          <StyledText
            variant="medium"
            className="text-xs text-persimmon-600 mt-1"
          >
            {t('lossWarning')}
          </StyledText>
        ) : null}
      </View>

      <View className="flex-row gap-x-3 mt-2">
        <Pressable
          onPress={handleKeep}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          className="flex-1 min-h-[48px] items-center justify-center rounded-xl border border-ink-200 bg-paper-100 active:opacity-80"
        >
          <StyledText variant="semibold" className="text-sm text-ink-800">
            {t('keepPrice')}
          </StyledText>
        </Pressable>
        <Pressable
          onPress={handleApply}
          disabled={busy || typed === null}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy || typed === null }}
          className={`flex-1 min-h-[48px] items-center justify-center rounded-xl bg-persimmon-500 active:opacity-80 ${
            busy || typed === null ? 'opacity-50' : ''
          }`}
        >
          <StyledText variant="extrabold" className="text-sm text-paper-50">
            {t('updatePrice')}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
