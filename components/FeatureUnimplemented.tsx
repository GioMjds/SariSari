import { StyledText } from '@/components/elements';
import { getAllInWorkFeatures, getFeatureByRoute } from '@/configs/features';
import { FontAwesome } from '@expo/vector-icons';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

interface FeatureUnimplementedProps {
  route?: string;
  title?: string;
  description?: string;
}

export function FeatureUnimplemented({
  route: routeProp,
  title: titleProp,
  description: descriptionProp,
}: FeatureUnimplementedProps) {
  const { t } = useTranslation();
  const currentPath = usePathname();
  const params = useLocalSearchParams<{ route?: string }>();

  const activeRoute = routeProp || params.route || currentPath;
  const featureInfo = getFeatureByRoute(activeRoute);

  const displayTitle =
    titleProp ||
    featureInfo?.title ||
    t('common:featureInDevelopmentTitle', 'Feature Under Construction');

  const displayDescription =
    descriptionProp ||
    featureInfo?.description ||
    t(
      'common:featureInDevelopmentSub',
      'This screen or feature is currently being developed and will be available in an upcoming update.',
    );

  const allFeatures = getAllInWorkFeatures();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View className="flex-1 bg-paper-200">
      {/* Header */}
      <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Pressable
              onPress={handleGoBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('common:settingsGoBackA11y', 'Go back')}
              className="w-8 h-8 items-center justify-center rounded-full bg-paper-50/15 active:opacity-70"
            >
              <FontAwesome name="arrow-left" size={14} color="#FBF7EE" />
            </Pressable>
          </View>
        </View>
        <StyledText
          variant="extrabold"
          className="text-h1 text-paper-50 text-3xl"
          style={{ letterSpacing: -0.28 }}
        >
          {displayTitle}
        </StyledText>
      </View>

      <ScrollView className="flex-1 px-5 pt-5 pb-8">
        {/* Hero Card */}
        <View className="bg-paper-50 rounded-2xl p-6 mb-6 shadow-sm border border-wood-100 items-center text-center">
          <View className="w-16 h-16 rounded-full bg-amber-100 items-center justify-center mb-4">
            <FontAwesome
              name={(featureInfo?.iconName as any) || 'wrench'}
              size={28}
              color="#D97706"
            />
          </View>

          <View className="px-3 py-1 bg-amber-100 rounded-full mb-3">
            <StyledText
              variant="extrabold"
              className="text-xs text-amber-800 uppercase tracking-wider"
            >
              {featureInfo?.status
                ? `Status: ${featureInfo.status}`
                : 'Work In Progress'}
            </StyledText>
          </View>

          <StyledText
            variant="extrabold"
            className="text-xl text-wood-900 text-center mb-2"
          >
            {displayTitle}
          </StyledText>

          <StyledText
            variant="regular"
            className="text-sm text-wood-700 text-center leading-6 mb-4"
          >
            {displayDescription}
          </StyledText>

          {featureInfo?.targetRelease && (
            <View className="bg-wood-100 px-3 py-1 rounded-md">
              <StyledText variant="medium" className="text-xs text-wood-800">
                Target Release: {featureInfo.targetRelease}
              </StyledText>
            </View>
          )}

          <View className="w-full mt-6 flex-row justify-center space-x-3">
            <Pressable
              onPress={handleGoBack}
              className="bg-cinnamon-500 px-6 py-3 rounded-xl active:opacity-80 flex-row items-center"
            >
              <FontAwesome
                name="arrow-left"
                size={14}
                color="#FBF7EE"
                style={{ marginRight: 8 }}
              />
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                Bumalik
              </StyledText>
            </Pressable>
          </View>
        </View>

        {/* Developer In-Work Features Registry */}
        <View className="bg-paper-50 rounded-2xl p-5 mb-8 border border-wood-100">
          <View className="flex-row items-center mb-4">
            <FontAwesome
              name="code-fork"
              size={16}
              color="#623418"
              style={{ marginRight: 8 }}
            />
            <StyledText variant="extrabold" className="text-base text-wood-900">
              Features In The Works (Developer Settings)
            </StyledText>
          </View>

          <StyledText variant="regular" className="text-xs text-wood-600 mb-4">
            Below are the feature routes currently marked as in development in
            the codebase config:
          </StyledText>

          {allFeatures.map((feat) => (
            <View
              key={feat.id}
              className="py-3 border-b border-wood-100 flex-row items-center justify-between"
            >
              <View className="flex-1 mr-2">
                <StyledText variant="extrabold" className="text-sm text-wood-800">
                  {feat.title}
                </StyledText>
                <StyledText variant="regular" className="text-xs text-wood-500">
                  Route: {feat.route}
                </StyledText>
              </View>
              <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                <StyledText variant="medium" className="text-xs text-amber-700">
                  {feat.status}
                </StyledText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
