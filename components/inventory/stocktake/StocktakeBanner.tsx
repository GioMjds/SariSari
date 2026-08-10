import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Href, useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';
import { useActiveStocktakeSession } from '@/hooks/useStocktake';

export function StocktakeBanner() {
  const { t } = useTranslation('stocktake');
  const router = useRouter();
  const { data: activeSession } = useActiveStocktakeSession();

  if (!activeSession) return null;

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/inventory/stocktake' as Href)}
      accessibilityRole="button"
      accessibilityLabel={t('inProgressBanner')}
      className="bg-amber-500 px-4 py-2.5 flex-row items-center justify-between border-b border-amber-600 active:bg-amber-600"
    >
      <View className="flex-row items-center gap-x-2.5 flex-1 pr-2">
        <FontAwesome name="clipboard" size={16} color="#FFFFFF" />
        <StyledText
          variant="semibold"
          className="text-white text-xs flex-1"
          numberOfLines={1}
        >
          {t('inProgressBanner')}
        </StyledText>
      </View>
      <FontAwesome name="chevron-right" size={12} color="#FFFFFF" />
    </Pressable>
  );
}
