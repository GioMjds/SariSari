import { StyledText } from '@/components/elements';
import { getFeatureByRoute } from '@/configs/features';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sariUnimplementedImage = require('@/assets/images/sari-emotions/sari-unimplemented.png');

type SearchParams = {
  route?: string;
  title?: string;
  description?: string;
};

export default function UnimplementedScreen() {
  const { t } = useTranslation();
  const { route, title, description } = useLocalSearchParams<SearchParams>();

  const targetRoute = route ?? '';
  const featureMeta = getFeatureByRoute(targetRoute);

  const displayTitle =
    title ||
    featureMeta?.title ||
    t('common:featureInDevelopmentTitle', 'Feature Under Construction');

  const displayDescription =
    description ||
    featureMeta?.description ||
    t(
      'common:featureInDevelopmentSub',
      "This screen is currently being built for SariSari. It's not broken, just getting ready for your store.",
    );

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  const statusLabel = featureMeta?.status
    ? `FEATURE ${featureMeta.status.toUpperCase().replace('-', ' ')}`
    : 'IN DEVELOPMENT · GUARD ROUTE';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-paper-200" edges={['top', 'bottom']}>
        <StatusBar style="dark" backgroundColor="#F7F6F2" />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingVertical: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.94, translateY: 16 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            className="bg-paper-50 rounded-3xl p-6 border border-paper-300 items-center w-full"
            style={{
              shadowColor: '#564E45',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            {/* Mascot Container */}
            <View className="items-center justify-center mb-4 relative">
              <View className="w-48 h-48 rounded-full bg-persimmon-500/10 absolute -top-1" />
              <Image
                source={sariUnimplementedImage}
                style={{ width: 190, height: 190 }}
                resizeMode="contain"
                accessible={false}
              />
            </View>

            {/* Status Badge */}
            <View className="flex-row items-center px-3.5 py-1.5 rounded-pill bg-persimmon-50 border border-persimmon-200 mb-4">
              <MotiView
                from={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 800, loop: true }}
                className="w-2.5 h-2.5 rounded-full bg-persimmon-500 mr-2"
              />
              <StyledText
                variant="extrabold"
                className="text-[11px] uppercase text-persimmon-700 tracking-wider"
              >
                {statusLabel}
              </StyledText>
            </View>

            {/* Title & Description */}
            <StyledText
              variant="black"
              className="text-2xl text-ink-900 text-center mb-2 leading-tight"
            >
              {displayTitle}
            </StyledText>

            <StyledText
              variant="regular"
              className="text-sm text-ink-600 text-center leading-6 mb-6 px-2"
            >
              {displayDescription}
            </StyledText>

            {/* Action Buttons */}
            <View className="w-full gap-2.5">
              <Pressable
                onPress={handleGoBack}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'common:goBackToMain',
                  'Bumalik sa Huling Screen',
                )}
                accessibilityHint={t(
                  'common:goBackHint',
                  'Returns to previous screen',
                )}
                className="bg-cinnamon-500 active:bg-cinnamon-600 min-h-[48px] px-6 py-3.5 rounded-2xl flex-row items-center justify-center w-full active:scale-[0.99]"
              >
                <FontAwesome
                  name="arrow-left"
                  size={14}
                  color="#FBF7EE"
                  style={{ marginRight: 8 }}
                />
                <StyledText
                  variant="extrabold"
                  className="text-paper-50 text-sm"
                >
                  {t('common:goBackAction', 'Bumalik')}
                </StyledText>
              </Pressable>

              <Pressable
                onPress={handleGoHome}
                accessibilityRole="button"
                accessibilityLabel="Go to Home Screen"
                accessibilityHint="Returns to main counter dashboard"
                className="bg-paper-100 active:bg-paper-200 border border-ink-200 min-h-[48px] px-6 py-3.5 rounded-2xl flex-row items-center justify-center w-full active:scale-[0.99]"
              >
                <FontAwesome
                  name="home"
                  size={14}
                  color="#623418"
                  style={{ marginRight: 8 }}
                />
                <StyledText
                  variant="extrabold"
                  className="text-cinnamon-700 text-sm"
                >
                  {t('common:goHomeAction', 'Pumunta sa Home')}
                </StyledText>
              </Pressable>
            </View>
          </MotiView>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
