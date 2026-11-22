import { TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';

const HUB = '/(tabs)/inventory/stocktake' as Href;

// Shown when a count screen is opened for a session that is no longer in progress.
export function StocktakeClosedState() {
  const router = useRouter();
  const { t } = useTranslation('stocktake');

  return (
    <View className="flex-1 items-center justify-center px-8 gap-y-2 bg-paper-200">
      <SariMascot state="inventory" size={96} defer />
      <StyledText variant="extrabold" className="text-ink-900 text-lg text-center">
        {t('sessionClosedTitle')}
      </StyledText>
      <StyledText variant="regular" className="text-ink-700 text-sm text-center">
        {t('sessionClosedBody')}
      </StyledText>
      <TouchableOpacity
        onPress={() => router.dismissTo(HUB)}
        accessibilityRole="button"
        className="mt-2 min-h-[48px] px-6 bg-ink-900 rounded-xl items-center justify-center"
      >
        <StyledText variant="extrabold" className="text-paper-50 text-sm">
          {t('backToHub')}
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
