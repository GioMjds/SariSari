import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import {
  useActiveStocktakeSession,
  useRecentStocktakeSessions,
} from '@/hooks/useStocktake';

const STALE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

interface StocktakeNudgeProps {
  onPress: () => void;
}

// Reminds the owner to finish an open count or to count again after 30 days.
export const StocktakeNudge = memo(function StocktakeNudge({
  onPress,
}: StocktakeNudgeProps) {
  const { t } = useTranslation('common');
  const { data: active } = useActiveStocktakeSession();
  const { data: sessions = [], isLoading } = useRecentStocktakeSessions();

  if (isLoading) return null;

  const last = sessions.find((s) => s.status === 'completed');
  const days = last ? Math.floor((Date.now() - last.createdAt) / DAY_MS) : null;

  let message: string;
  if (active) message = t('dashboard.stocktakeNudge.inProgress');
  else if (days === null) message = t('dashboard.stocktakeNudge.never');
  else if (days >= STALE_DAYS)
    message = t('dashboard.stocktakeNudge.stale', { count: days });
  else return null;

  const cta = t(
    active ? 'dashboard.stocktakeNudge.continue' : 'dashboard.stocktakeNudge.cta',
  );

  return (
    <View className="px-4 mb-3">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${message}. ${cta}`}
        className="flex-row items-center justify-between bg-paper-50 rounded-xl px-4 py-3 border border-ink-100 active:opacity-80"
      >
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-9 h-9 rounded-full bg-persimmon-100 items-center justify-center mr-3">
            <FontAwesome name="clipboard" size={16} color="#E85A1F" />
          </View>
          <View className="flex-1">
            <StyledText variant="semibold" className="text-sm text-ink-900">
              {message}
            </StyledText>
            <StyledText variant="regular" className="text-xs text-ink-500 mt-0.5">
              {t('dashboard.stocktakeNudge.sub')}
            </StyledText>
          </View>
        </View>
        <View className="flex-row items-center">
          <StyledText variant="extrabold" className="text-sm text-persimmon-500 mr-1">
            {cta}
          </StyledText>
          <FontAwesome name="arrow-right" size={11} color="#E85A1F" />
        </View>
      </Pressable>
    </View>
  );
});
