import { Image, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { ONBOARDING_COLORS } from '@/components/onboarding/palette';
import { StatusStamp } from '@/components/ui/StatusStamp';
import { FIRST_STEPS } from '@/constants/gettingStarted';
import { SARI_CELEBRATE_ASSET } from '@/constants/onboardingTour.assets';
import { OnboardingProfile } from '@/types/onboarding.types';
import { useTranslation } from 'react-i18next';

/**
 * ReadyStep - final onboarding screen. A persimmon "READY" stamp sits
 * on the celebrating Sari, the headline uses the owner's name, and a
 * "First steps" list offers three shortcuts. Each card persists the
 * profile, routes to the tab group, then opens its screen. The plain
 * "open my store" action lives in the screen's sticky footer. Cards
 * share its guard: no taps while saving or while a name is blank.
 * A text link under the greeting sends the owner back to fix a name.
 */

type Props = {
  profile: OnboardingProfile;
  saving: boolean;
  /** Open the store, then the given screen. */
  onOpenStore: (href?: string) => void;
  /** Return to the profile step to correct the names. */
  onEditProfile: () => void;
};

export function ReadyStep({
  profile,
  saving,
  onOpenStore,
  onEditProfile,
}: Props) {
  const { t } = useTranslation('onboarding');
  const trimmedName = profile.ownerName.trim();
  const trimmedStore = profile.storeName.trim();
  const canOpen = !saving && trimmedName.length > 0 && trimmedStore.length > 0;

  return (
    <View>
      <View className="items-center relative" style={{ height: 160 }}>
        <Image
          source={SARI_CELEBRATE_ASSET}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          className="w-full h-full"
        />
        <View className="absolute top-2 right-2">
          <StatusStamp label={t('readyStamp')} tone="persimmon" rotate={-8} />
        </View>
      </View>

      <View className="items-center mt-4 px-2">
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-h1 text-center"
        >
          {trimmedName
            ? t('readyGreetingNamed', { name: trimmedName })
            : t('readyGreetingDefault')}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-900 text-body text-center mt-2"
        >
          {trimmedStore
            ? t('readySublineNamed', { storeName: trimmedStore })
            : t('readySublineDefault')}
        </StyledText>
        <TouchableOpacity
          onPress={onEditProfile}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          className="min-h-[44px] justify-center px-3 active:opacity-70"
        >
          <StyledText
            variant="semibold"
            className="text-persimmon-700 text-sm underline"
          >
            {t('readyEditProfile')}
          </StyledText>
        </TouchableOpacity>
      </View>

      <View className="mt-4">
        <StyledText variant="semibold" className="text-ink-700 text-sm mb-2">
          {t('readyFirstStepsTitle')}
        </StyledText>
        <View className="gap-2">
          {FIRST_STEPS.map((first) => {
            const title = t(first.titleKey);
            const reason = t(first.reasonKey);
            return (
              <TouchableOpacity
                key={first.id}
                disabled={!canOpen}
                onPress={() => {
                  if (canOpen) onOpenStore(first.href);
                }}
                accessibilityRole="button"
                accessibilityLabel={t('readyStepA11y', { title, reason })}
                accessibilityState={{ disabled: !canOpen }}
                className={`min-h-[56px] flex-row items-center gap-3 rounded-lg border border-paper-400 bg-paper-50 px-3 py-2 press-scale active:bg-paper-100 ${
                  canOpen ? '' : 'opacity-50'
                }`}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-persimmon-50">
                  <Ionicons
                    name={first.icon}
                    size={20}
                    color={ONBOARDING_COLORS.action}
                  />
                </View>
                <View className="flex-1">
                  <StyledText variant="semibold" className="text-ink-900 text-sm">
                    {title}
                  </StyledText>
                  <StyledText variant="regular" className="text-ink-600 text-caption">
                    {reason}
                  </StyledText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={ONBOARDING_COLORS.muted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
