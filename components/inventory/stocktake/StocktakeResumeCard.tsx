import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

interface StocktakeResumeCardProps {
  counted: number;
  total: number;
  startedAt: string;
  onResume: () => void;
  onDiscard: () => void;
}

// Hub card shown while a count is open; the work itself happens on its own screen.
export function StocktakeResumeCard({
  counted,
  total,
  startedAt,
  onResume,
  onDiscard,
}: StocktakeResumeCardProps) {
  const { t } = useTranslation('stocktake');
  const pct = total > 0 ? Math.round((counted / total) * 100) : 0;

  return (
    <View className="bg-paper-50 rounded-2xl p-4 border border-paper-300 gap-y-3">
      <View className="gap-y-1">
        <StyledText
          variant="extrabold"
          accessibilityRole="header"
          className="text-ink-900 text-lg"
        >
          {t('resumeTitle')}
        </StyledText>
        <StyledText variant="regular" className="text-ink-700 text-sm">
          {t('resumeStarted', { date: new Date(startedAt).toLocaleDateString() })}
        </StyledText>
      </View>

      <View className="gap-y-1.5">
        <View className="flex-row items-center justify-between">
          <StyledText variant="extrabold" className="text-ink-900 text-base">
            {t('progressLabel', { counted, total })}
          </StyledText>
          <StyledText variant="extrabold" className="text-sage-700 text-sm">
            {pct}%
          </StyledText>
        </View>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: total, now: counted }}
          className="h-2 rounded-full bg-paper-300 overflow-hidden"
        >
          <View
            className="h-full bg-sage-500 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </View>
      </View>

      <View className="bg-semantic-warning-50 rounded-xl p-3 flex-row items-start gap-x-2">
        <FontAwesome name="pause-circle" size={14} color="#8A5208" style={{ marginTop: 2 }} />
        <StyledText variant="medium" className="text-ink-800 text-sm flex-1">
          {t('inProgressBanner')}
        </StyledText>
      </View>

      <TouchableOpacity
        onPress={onResume}
        accessibilityRole="button"
        className="min-h-[48px] bg-persimmon-500 rounded-xl flex-row items-center justify-center gap-x-2 active:bg-persimmon-600"
      >
        <FontAwesome name="play" size={14} color="#FAFAF7" />
        <StyledText variant="extrabold" className="text-paper-50 text-base">
          {t('resumeCta')}
        </StyledText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDiscard}
        accessibilityRole="button"
        className="min-h-[44px] rounded-xl items-center justify-center active:bg-semantic-danger-50"
      >
        <StyledText variant="extrabold" className="text-semantic-danger text-sm">
          {t('discardCta')}
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
