import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

interface StocktakeScreenHeaderProps {
  title: string;
  step: string;
  children?: ReactNode;
}

// Back button, title and step label shared by the count and review screens.
export function StocktakeScreenHeader({
  title,
  step,
  children,
}: StocktakeScreenHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation('stocktake');

  return (
    <View className="bg-paper-50 px-4 pt-2 pb-3 border-b border-paper-300 gap-y-3">
      <View className="flex-row items-center gap-x-3">
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.back();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('goBack')}
          className="w-11 h-11 items-center justify-center rounded-full bg-paper-100 border border-paper-300 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>
        <View className="flex-1">
          <StyledText variant="semibold" className="text-ink-600 text-xs">
            {step}
          </StyledText>
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            className="text-ink-900 text-lg"
          >
            {title}
          </StyledText>
        </View>
      </View>
      {children}
    </View>
  );
}
