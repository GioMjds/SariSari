import { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useTranslation } from 'react-i18next';

export interface DashboardErrorStateProps {
  onRetry: () => void;
}

export const DashboardErrorState = memo(function DashboardErrorState({
  onRetry,
}: DashboardErrorStateProps) {
  const { t } = useTranslation();

  const title = t('common:dashboard.recentActivity.errorTitle', {
    defaultValue: 'Could not load dashboard',
  });
  const description = t('common:dashboard.recentActivity.errorBody', {
    defaultValue: 'Something went wrong loading your counter data.',
  });
  const retryLabel = t('common:dashboard.recentActivity.retry', {
    defaultValue: 'Tap to Retry',
  });

  return (
    <View className="px-4 py-8">
      <View className="bg-paper-50 rounded-2xl p-6 border border-ink-100 items-center text-center shadow-xs">
        <View className="w-12 h-12 rounded-full bg-persimmon-100 items-center justify-center mb-3">
          <FontAwesome name="exclamation-triangle" size={20} color="#E85A1F" />
        </View>

        <StyledText
          variant="extrabold"
          className="text-lg text-ink-900 mb-1 text-center"
        >
          {title}
        </StyledText>

        <StyledText
          variant="regular"
          className="text-sm text-ink-500 mb-5 text-center px-2 leading-5"
        >
          {description}
        </StyledText>

        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          className="bg-persimmon-500 rounded-xl py-3 px-6 flex-row items-center justify-center press-scale"
        >
          <FontAwesome name="refresh" size={14} color="#FBF7EE" />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-sm ml-2"
          >
            {retryLabel}
          </StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
});
