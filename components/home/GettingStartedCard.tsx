import { Image, Pressable, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { FIRST_STEPS } from '@/constants/gettingStarted';
import { SARI_POINTING_ASSET } from '@/constants/onboardingTour.assets';
import { useGettingStarted } from '@/hooks/useGettingStarted';

/**
 * GettingStartedCard - Home checklist for new stores. Hides itself when
 * all three tasks are done or the owner dismisses it.
 */
export function GettingStartedCard() {
  const { t } = useTranslation('onboarding');
  const router = useRouter();
  const { visible, progress, dismiss } = useGettingStarted();

  if (!visible) return null;

  return (
    <View className="mx-4 mb-5 rounded-3xl border border-paper-300 bg-paper-50 p-4">
      <View className="flex-row items-center gap-3">
        <Image
          source={SARI_POINTING_ASSET}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{ width: 64, height: 64 }}
        />
        <View className="flex-1">
          <StyledText variant="extrabold" className="text-ink-900 text-base">
            {t('gettingStartedTitle')}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-caption">
            {t('gettingStartedProgress', {
              done: progress.doneCount,
              total: progress.total,
            })}
          </StyledText>
          <View className="mt-2 flex-row gap-1">
            {progress.tasks.map((task) => (
              <View
                key={task.id}
                className={`h-1.5 flex-1 rounded-full ${
                  task.done ? 'bg-sage-500' : 'bg-ink-200'
                }`}
              />
            ))}
          </View>
        </View>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('gettingStartedDismissA11y')}
          className="h-8 w-8 items-center justify-center"
        >
          <Ionicons name="close" size={20} color="#A89F90" />
        </TouchableOpacity>
      </View>

      <View className="mt-3 gap-2">
        {FIRST_STEPS.map((first) => {
          const done =
            progress.tasks.find((task) => task.id === first.id)?.done ?? false;
          const title = t(first.titleKey);
          return (
            <Pressable
              key={first.id}
              disabled={done}
              onPress={() => router.push(first.href as Href)}
              accessibilityRole="button"
              accessibilityLabel={title}
              accessibilityState={{ disabled: done, checked: done }}
              className={`min-h-[48px] flex-row items-center gap-3 rounded-2xl border border-paper-300 bg-paper-100 px-3 py-2 ${
                done ? 'opacity-60' : ''
              }`}
            >
              <Ionicons
                name={done ? 'checkmark-circle' : first.icon}
                size={20}
                color={done ? '#4F7A4B' : '#E85A1F'}
              />
              <StyledText
                variant="medium"
                className={`flex-1 text-sm ${
                  done ? 'text-ink-500 line-through' : 'text-ink-800'
                }`}
              >
                {title}
              </StyledText>
              {done ? null : (
                <Ionicons name="chevron-forward" size={16} color="#A89F90" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
