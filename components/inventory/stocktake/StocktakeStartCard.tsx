import { View, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { MoneyText } from '@/components/ui';
import type { StocktakeSession } from '@/types/stocktake.types';

interface StocktakeStartCardProps {
  lastSession: StocktakeSession | null;
  onStart: () => void;
  isStarting?: boolean;
}

const STEPS = ['stepCount', 'stepCheck', 'stepUpdate'] as const;

export function StocktakeStartCard({
  lastSession,
  onStart,
  isStarting = false,
}: StocktakeStartCardProps) {
  const { t } = useTranslation('stocktake');
  const net = lastSession?.totalVariancePesos ?? 0;

  return (
    <View className="bg-paper-50 rounded-2xl p-4 border border-paper-300 gap-y-4">
      <View className="flex-row items-center gap-x-3">
        <SariMascot state="inventory" size={64} defer animated={false} />
        <View className="flex-1 gap-y-1">
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            className="text-ink-900 text-lg"
          >
            {t('introTitle')}
          </StyledText>
          <StyledText variant="regular" className="text-ink-700 text-sm">
            {t('introBody')}
          </StyledText>
        </View>
      </View>

      <View className="gap-y-3">
        {STEPS.map((key, i) => (
          <View key={key} className="flex-row items-start gap-x-3">
            <View className="w-7 h-7 rounded-full bg-ink-900 items-center justify-center">
              <StyledText variant="extrabold" className="text-paper-50 text-xs">
                {i + 1}
              </StyledText>
            </View>
            <View className="flex-1">
              <StyledText variant="extrabold" className="text-ink-900 text-sm">
                {t(`${key}Title`)}
              </StyledText>
              <StyledText variant="regular" className="text-ink-600 text-sm">
                {t(`${key}Body`)}
              </StyledText>
            </View>
          </View>
        ))}
      </View>

      <View className="bg-paper-100 rounded-xl p-3 border border-paper-300 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <StyledText variant="semibold" className="text-ink-700 text-xs">
            {t('lastCount')}
          </StyledText>
          <StyledText variant="extrabold" className="text-ink-900 text-sm">
            {lastSession
              ? t('lastCountValue', {
                  date: new Date(lastSession.createdAt).toLocaleDateString(),
                  counted: lastSession.totalProductsCounted,
                })
              : t('noRecent')}
          </StyledText>
        </View>
        {lastSession ? (
          <View className="items-end">
            <StyledText variant="semibold" className="text-ink-700 text-xs">
              {net < 0 ? t('shortLabel') : t('netLabel')}
            </StyledText>
            <MoneyText
              value={net}
              size="sm"
              variant={net < 0 ? 'danger' : 'default'}
            />
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={onStart}
        disabled={isStarting}
        accessibilityState={{ busy: isStarting, disabled: isStarting }}
        accessibilityRole="button"
        accessibilityLabel={t('startCta')}
        className={`w-full min-h-[48px] bg-persimmon-500 rounded-xl items-center justify-center flex-row gap-x-2 active:bg-persimmon-600 ${isStarting ? 'opacity-60' : ''}`}
      >
        <FontAwesome name="play" size={14} color="#FAFAF7" />
        <StyledText variant="extrabold" className="text-paper-50 text-base">
          {t('startCta')}
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
