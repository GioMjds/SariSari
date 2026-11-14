import { Image, TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { StatusStamp } from '@/components/ui/StatusStamp';
import { SARI_CELEBRATE_ASSET } from '@/constants/onboardingTour.assets';
import { OnboardingProfile } from '@/types/onboarding.types';
import { useTranslation } from 'react-i18next';

/**
 * ReadyStep - final onboarding screen. A persimmon "READY" stamp sits
 * on the celebrating Sari and the headline uses the owner's name. The
 * "open my store" action lives in the screen's sticky footer. A text
 * link under the greeting sends the owner back to fix a name. Setup
 * shortcuts live on the Home Getting Started card, not here.
 */

type Props = {
  profile: OnboardingProfile;
  saving: boolean;
  /** Return to the profile step to correct the names. */
  onEditProfile: () => void;
};

export function ReadyStep({ profile, saving, onEditProfile }: Props) {
  const { t } = useTranslation('onboarding');
  const trimmedName = profile.ownerName.trim();
  const trimmedStore = profile.storeName.trim();

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
    </View>
  );
}
