import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

interface FollowUpSheetProps {
  visible: boolean;
  /** Suki the reminder is for. Shown under the title. */
  name: string;
  /** Show the "clear" row only when a follow-up date exists. */
  hasFollowUp: boolean;
  /** `YYYY-MM-DD` local date, or null to clear. */
  onSelect: (followUpBy: string | null) => void;
  onClose: () => void;
}

const ROW =
  'min-h-14 px-4 rounded-xl flex-row items-center justify-between active:bg-paper-100';

function localIsoOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(base.getDate() + days);
  return d;
}

export function FollowUpSheet({
  visible,
  name,
  hasFollowUp,
  onSelect,
  onClose,
}: FollowUpSheetProps) {
  const { t, i18n } = useTranslation('utang');
  const insets = useSafeAreaInsets();

  const options = useMemo(() => {
    if (!visible) return [];
    const today = new Date();
    const fmt = (d: Date) =>
      d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
    return [
      { key: 'today', label: t('collectionFollowUpToday'), offset: 0 },
      { key: 'tomorrow', label: t('collectionFollowUpTomorrow'), offset: 1 },
      { key: 'in3', label: t('collectionFollowUpIn3Days'), offset: 3 },
      { key: 'week', label: t('collectionFollowUpInAWeek'), offset: 7 },
    ].map((o) => {
      const date = addDays(today, o.offset);
      return { ...o, value: localIsoOf(date), dateLabel: fmt(date) };
    });
  }, [visible, t, i18n.language]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          style={StyleSheet.absoluteFillObject}
          className="bg-black/50"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('collectionFollowUpCancel')}
        />
        <View
          className="bg-paper-50 rounded-t-3xl px-3 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}
        >
          <View className="px-1 pb-2">
            <StyledText
              variant="extrabold"
              accessibilityRole="header"
              className="text-ink-900 text-lg"
            >
              {t('collectionFollowUpSheetTitle')}
            </StyledText>
            <StyledText
              variant="medium"
              numberOfLines={1}
              className="text-ink-500 text-sm mt-0.5"
            >
              {name}
            </StyledText>
          </View>

          {options.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => onSelect(o.value)}
              accessibilityRole="button"
              accessibilityLabel={`${o.label}, ${o.dateLabel}`}
              className={ROW}
            >
              <StyledText variant="extrabold" className="text-ink-900 text-base">
                {o.label}
              </StyledText>
              <StyledText variant="medium" className="text-ink-500 text-sm">
                {o.dateLabel}
              </StyledText>
            </Pressable>
          ))}

          <View className="h-px bg-paper-300 my-2" />

          {hasFollowUp ? (
            <Pressable
              onPress={() => onSelect(null)}
              accessibilityRole="button"
              className={ROW}
            >
              <StyledText
                variant="semibold"
                className="text-semantic-danger text-base"
              >
                {t('followUpSheetClear')}
              </StyledText>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            className={ROW}
          >
            <StyledText variant="semibold" className="text-ink-600 text-base">
              {t('collectionFollowUpCancel')}
            </StyledText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
