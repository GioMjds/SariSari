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
        className="text-lg text-semantic-danger mb-2"
      >
        {t('collectionErrorTitle')}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-sm text-ink-600 mb-4 text-center"
      >
        {t('collectionErrorDescription')}
      </StyledText>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('collectionErrorRetry')}
        accessibilityHint={t('collectionErrorRetry')}
        hitSlop={8}
        className="bg-persimmon-500 rounded-pill px-7 py-3 min-h-12 flex-row items-center justify-center shadow-persimmon-glow"
      >
        <StyledText variant="extrabold" className="text-paper-50 text-sm">
          {t('collectionErrorRetry')}
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
