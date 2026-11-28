import type { TFunction } from 'i18next';
import { Pressable, View, type ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Skeleton } from '@/components/ui';
import { ICON_COLOR } from '@/lib/theme';

// Keeps rows readable on tablets instead of stretching edge to edge, matching the delivery list.
export const PAYABLES_COLUMN: ViewStyle = { width: '100%', maxWidth: 640, alignSelf: 'center' };

interface Props {
  title: string;
  subtitle?: string | null;
  fallback: Href;
}

/** Back button and title card shared by the supplier payables screens. */
export function PayablesHeader({ title, subtitle, fallback }: Props) {
  const router = useRouter();
  const { t } = useTranslation('receiving');
  const goBack = () => {
    Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  };

  return (
    <View className="px-4 pt-3 pb-2 bg-background z-10" style={PAYABLES_COLUMN}>
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center">
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 16, bottom: 16, left: 20, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('goBack')}
          className="press-scale w-11 h-11 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color={ICON_COLOR.ink} />
        </Pressable>
        <View className="flex-1 px-3">
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            className="text-ink-900 text-h2 font-stack-sans-bold"
            numberOfLines={2}
          >
            {title}
          </StyledText>
          {subtitle ? (
            <StyledText variant="regular" className="text-ink-600 text-xs mt-0.5" numberOfLines={1}>
              {subtitle}
            </StyledText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** Placeholder rows shown while payables load, in place of a spinner. */
export function PayablesSkeleton({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation('receiving');
  return (
    <View
      className="px-4 pt-2 gap-y-3"
      style={PAYABLES_COLUMN}
      accessible
      accessibilityLabel={t('loadingPayables')}
    >
      <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4 gap-y-2">
        <Skeleton width="30%" height={12} />
        <Skeleton width="50%" height={28} />
      </View>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} className="bg-paper-50 rounded-2xl border border-ink-100 p-4 flex-row items-center gap-x-3">
          <View className="flex-1 gap-y-2">
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={10} />
          </View>
          <Skeleton width={72} height={18} />
        </View>
      ))}
    </View>
  );
}

/** Error block with a retry, so a failed read never reads as "nothing owed". */
export function PayablesError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('receiving');
  return (
    <View className="flex-1 items-center justify-center px-6 gap-3" style={PAYABLES_COLUMN}>
      <FontAwesome name="exclamation-circle" size={28} color={ICON_COLOR.danger} />
      <StyledText variant="semibold" className="text-ink-800 text-sm text-center">
        {t('errorLoadPayables')}
      </StyledText>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('retry')}
        className="min-h-[44px] px-5 rounded-xl items-center justify-center bg-paper-100 border border-ink-200 active:bg-paper-200"
      >
        <StyledText variant="extrabold" className="text-ink-800 text-sm">
          {t('retry')}
        </StyledText>
      </Pressable>
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
