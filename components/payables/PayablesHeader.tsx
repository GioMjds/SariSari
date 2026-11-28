import type { TFunction } from 'i18next';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';

interface Props {
  title: string;
  subtitle?: string | null;
  fallback: Href;
}

/** Back button and title card shared by the supplier payables screens. */
export function PayablesHeader({ title, subtitle, fallback }: Props) {
  const router = useRouter();
  const goBack = () => {
    Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  };

  return (
    <View className="px-4 pt-3 pb-2 bg-background z-10">
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center">
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 16, bottom: 16, left: 20, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>
        <View className="flex-1 px-3">
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            className="text-ink-900 text-h2 font-stack-sans-bold"
          >
            {title}
          </StyledText>
          {subtitle ? (
            <StyledText variant="medium" className="label-caps text-ink-400 mt-0.5" numberOfLines={1}>
              {subtitle}
            </StyledText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** Due-date label and tone for a payable or supplier row. */
export function dueMeta(
  dueDate: string | null,
  today: string,
  t: TFunction,
  formatDate: (d: string) => string,
): { label: string; overdue: boolean } {
  if (!dueDate) return { label: t('payablesNoDue'), overdue: false };
  const overdue = dueDate < today;
  return {
    label: overdue
      ? t('payablesOverdue', { date: formatDate(dueDate) })
      : t('payablesNextDue', { date: formatDate(dueDate) }),
    overdue,
  };
}
