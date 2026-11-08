import { Href, Stack, router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  const handleGoHome = () => {
    router.replace('/(tabs)/home' as Href);
  };

  return (
    <>
      <Stack.Screen
        options={{ title: t('common:notFoundTitle'), headerShown: false }}
      />
      <SafeAreaView className="flex-1 bg-paper-200 justify-center">
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          className="items-center px-6"
        >
          <View className="w-24 h-24 rounded-full bg-persimmon-500/10 items-center justify-center mb-6">
            <FontAwesome name="map-signs" size={48} color="#E05B2B" />
          </View>
          <StyledText
            variant="black"
            className="text-3xl text-ink-900 text-center mb-2"
          >
            {t('common:notFoundTitle')}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-sm text-ink-500 text-center mb-8 px-4"
          >
            {t('common:notFoundBody')}
          </StyledText>
          <Pressable
            onPress={handleGoHome}
            accessibilityRole="button"
            accessibilityLabel={t('common:notFoundAction')}
            className="bg-persimmon-600 rounded-pill px-8 py-3.5 shadow-persimmon-glow press-scale active:opacity-80"
          >
            <StyledText variant="extrabold" className="text-paper-50 text-base">
              {t('common:notFoundAction')}
            </StyledText>
          </Pressable>
        </MotiView>
      </SafeAreaView>
    </>
  );
}
