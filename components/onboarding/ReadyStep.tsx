import { ActivityIndicator, Image, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { StatusStamp } from '@/components/ui/StatusStamp';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FIRST_STEPS } from '@/constants/gettingStarted';
import { SARI_CELEBRATE_ASSET } from '@/constants/onboardingTour.assets';
import { OnboardingProfile } from '@/types/onboarding.types';
import { useTranslation } from 'react-i18next';

/**
 * ReadyStep - final onboarding screen. A persimmon "READY" stamp sits
 * on the celebrating Sari, the headline uses the owner's name, a
 * "First steps" list offers three shortcuts, and the CTA persists the
 * profile and routes to the tab group. A first-step card does the same
 * save, then also opens its screen. Cards and CTA share one guard:
 * no taps while saving or while a name is blank.
 */

type Props = {
  profile: OnboardingProfile;
  saving: boolean;
  /** No argument: open the store. With href: open the store, then that screen. */
  onOpenStore: (href?: string) => void;
};

export function ReadyStep({ profile, saving, onOpenStore }: Props) {
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation('onboarding');
  const trimmedName = profile.ownerName.trim();
  const trimmedStore = profile.storeName.trim();
  const canOpen = !saving && trimmedName.length > 0 && trimmedStore.length > 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: reducedMotion ? 0 : 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 80 }}
    >
      <View className="items-center relative" style={{ height: 180 }}>
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

      <View className="items-center mt-4 px-4">
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
          className="text-ink-600 text-body text-center mt-2"
        >
          {trimmedStore
            ? t('readySublineNamed', { storeName: trimmedStore })
            : t('readySublineDefault')}
        </StyledText>
      </View>

      <View className="mt-6">
        <StyledText variant="extrabold" className="label-caps text-ink-400 mb-2">
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
                className={`min-h-[56px] flex-row items-center gap-3 rounded-2xl border border-paper-300 bg-paper-50 px-3 py-2 press-scale active:opacity-80 ${
                  canOpen ? '' : 'opacity-50'
                }`}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-persimmon-50">
                  <Ionicons name={first.icon} size={20} color="#E85A1F" />
                </View>
                <View className="flex-1">
                  <StyledText variant="semibold" className="text-ink-900 text-sm">
                    {title}
                  </StyledText>
                  <StyledText variant="regular" className="text-ink-500 text-caption">
                    {reason}
                  </StyledText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#A89F90" />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="mt-6">
        <TouchableOpacity
          onPress={() => {
            if (canOpen) onOpenStore();
          }}
          disabled={!canOpen}
          accessibilityRole="button"
          accessibilityLabel={t('readyCtaA11y')}
          accessibilityState={{ disabled: !canOpen }}
          className={`bg-persimmon-500 rounded-2xl py-4 items-center shadow-persimmon-glow press-scale active:opacity-80 ${
            !canOpen ? 'opacity-50' : ''
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <StyledText variant="semibold" className="text-white text-base">
              {t('readyCta')}
            </StyledText>
          )}
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}
