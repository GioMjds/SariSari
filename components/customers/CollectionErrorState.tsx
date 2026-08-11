import { TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

interface CollectionErrorStateProps {
  onRetry: () => void;
}

export function CollectionErrorState({ onRetry }: CollectionErrorStateProps) {
  const { t } = useTranslation('utang');
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-lg text-cinnamon-700 mb-2"
      >
        {t('collectionEmptyTitle')}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-sm text-cinnamon-600 mb-4 text-center"
      >
        {t('collectionEmptyDescription')}
      </StyledText>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry"
        className="bg-persimmon-500 rounded-pill px-7 py-3 flex-row items-center shadow-persimmon-glow"
      >
        <StyledText variant="extrabold" className="text-paper-50 text-sm">
          Retry
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
