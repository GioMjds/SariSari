import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesome } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import {
  useSetCollectionFollowUp,
  useMarkCollectionContacted,
} from '@/hooks/useCredits';
import { StyledText } from '@/components/elements';
import { CustomerAvatar } from '@/components/customers/CustomerAvatar';
import { formatPesos } from '@/lib';
import type { CollectionQueueRow } from '@/types/credits.types';
import { Alert } from '@/utils';

interface CollectionRowProps {
  row: CollectionQueueRow;
}

export function CollectionRow({ row }: CollectionRowProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation('utang');

  const setFollowUp = useSetCollectionFollowUp();
  const markContacted = useMarkCollectionContacted();

  const localIsoOf = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const openFollowUpSheet = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const in3 = new Date(today);
    in3.setDate(today.getDate() + 3);
    const inWeek = new Date(today);
    inWeek.setDate(today.getDate() + 7);

    const options = [
      { label: t('collectionFollowUpToday'), value: localIsoOf(today) },
      { label: t('collectionFollowUpTomorrow'), value: localIsoOf(tomorrow) },
      { label: t('collectionFollowUpIn3Days'), value: localIsoOf(in3) },
      { label: t('collectionFollowUpInAWeek'), value: localIsoOf(inWeek) },
    ] as const;
    Alert.alert(t('collectionFollowUpSheetTitle'), undefined, [
      ...options.map((o) => ({
        text: o.label,
        onPress: () =>
          setFollowUp.mutate({
            customerId: row.customerId,
            followUpBy: o.value,
          }),
      })),
      {
        text: t('collectionFollowUpClear'),
        onPress: () =>
          setFollowUp.mutate({
            customerId: row.customerId,
            followUpBy: null,
          }),
      },
      { text: t('collectionFollowUpCancel'), style: 'cancel' as const },
    ]);
  };

  const handleOpenDetails = () => {
    router.push(`/(edit-forms)/credit-details/${row.customerId}` as Href);
  };
  const handleRecordPayment = () => {
    router.push(`/(edit-forms)/add-payment/${row.customerId}` as Href);
  };

  // Parse a stored YYYY-MM-DD string as local midnight to avoid UTC-offset shifts.
  const localMidnight = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
    return new Date(y, m - 1, d);
  };
  const fmtDate = (iso: string | null) =>
    iso ? localMidnight(iso).toLocaleDateString(i18n.language) : '';

  const followUpChipState: 'set' | 'overdue' | 'contacted' | 'none' =
    !row.followUp
      ? 'none'
      : row.followUp.contactsToday > 0 &&
          row.followUp.lastContactAt &&
          new Date(row.followUp.lastContactAt).toDateString() ===
            new Date().toDateString()
        ? 'contacted'
        : row.followUp.followUpBy &&
            localMidnight(row.followUp.followUpBy) <
              localMidnight(localIsoOf(new Date()))
          ? 'overdue'
          : 'set';

  const chipLabel = (() => {
    if (followUpChipState === 'contacted') {
      return t('collectionFollowUpContactedToday', {
        count: row.followUp!.contactsToday,
      });
    }
    if (followUpChipState === 'overdue' && row.followUp?.followUpBy) {
      const days = Math.max(
        1,
        Math.round(
          (Date.now() - localMidnight(row.followUp.followUpBy).getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      );
      return t('collectionFollowUpOverdue', {
        date: fmtDate(row.followUp.followUpBy),
        days,
      });
    }
    if (followUpChipState === 'set' && row.followUp?.followUpBy) {
      return t('collectionFollowUpSet', {
        date: fmtDate(row.followUp.followUpBy),
      });
    }
    return t('collectionFollowUpNone');
  })();

  return (
    <Pressable
      onPress={handleOpenDetails}
      accessibilityRole="button"
      accessibilityLabel={(() => {
        const parts = [row.name, formatPesos(row.balance)];
        if (row.overdueDays > 0)
          parts.push(t('collectionOverdueChip', { days: row.overdueDays }));
        if (row.isNearLimit) parts.push(t('collectionNearLimitChip'));
        if (followUpChipState === 'overdue' && row.followUp?.followUpBy)
          parts.push(
            t('collectionFollowUpOverdue', {
              date: fmtDate(row.followUp.followUpBy),
              days: Math.max(
                1,
                Math.round(
                  (Date.now() - new Date(row.followUp.followUpBy).getTime()) /
                    (24 * 60 * 60 * 1000),
                ),
              ),
            }),
          );
        return parts.join(', ');
      })()}
      accessibilityHint={t('collectionRowOpenDetailsHint')}
      className="mx-4 my-1.5 bg-cream-50 rounded-2xl p-4 flex-row items-center"
    >
      <CustomerAvatar name={row.name} photoUri={row.photoUri ?? null} />
      <View className="flex-1 min-w-0 ml-3">
        <StyledText
          variant="semibold"
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-base text-cinnamon-800"
        >
          {row.name}
        </StyledText>
        {row.phone ? (
          <StyledText
            variant="regular"
            numberOfLines={1}
            className="text-xs text-cinnamon-500"
          >
            {row.phone}
          </StyledText>
        ) : null}
        <View className="flex-row items-center mt-1 flex-wrap">
          <View
            className={`px-2 py-0.5 rounded-full ${
              row.overdueDays > 0 ? 'bg-cinnamon-700' : 'bg-cinnamon-100'
            }`}
          >
            <StyledText
              variant="medium"
              className={`text-xs ${
                row.overdueDays > 0 ? 'text-ink-600' : 'text-cinnamon-700'
              }`}
            >
              {formatPesos(row.balance)}
            </StyledText>
          </View>
          {row.overdueDays > 0 ? (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-semantic-danger-50 border border-semantic-danger-100">
              <StyledText
                variant="medium"
                className="text-xs text-semantic-danger"
              >
                {t('collectionOverdueChip', { days: row.overdueDays })}
              </StyledText>
            </View>
          ) : null}
          {row.isNearLimit ? (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-semantic-warning-100 border border-semantic-warning-100">
              <StyledText
                variant="medium"
                className="text-xs text-semantic-warning"
              >
                {t('collectionNearLimitChip')}
              </StyledText>
            </View>
          ) : null}
        </View>
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              openFollowUpSheet();
            }}
            accessibilityRole="button"
            accessibilityLabel={chipLabel}
            className={`px-2 py-1 rounded-full border ${
              followUpChipState === 'overdue'
                ? 'bg-semantic-danger-50 border-semantic-danger-100'
                : followUpChipState === 'contacted'
                  ? 'bg-sage-50 border-sage-100'
                  : 'bg-paper-200 border-paper-300'
            }`}
          >
            <StyledText
              variant="medium"
              className={`text-xs ${
                followUpChipState === 'overdue'
                  ? 'text-semantic-danger'
                  : followUpChipState === 'contacted'
                    ? 'text-sage-700'
                    : 'text-cinnamon-700'
              }`}
            >
              {chipLabel}
            </StyledText>
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              markContacted.mutate(row.customerId);
            }}
            accessibilityRole="button"
            accessibilityLabel={t('collectionMarkContactedA11y', {
              name: row.name,
            })}
            accessibilityHint={t('collectionRowMarkContactedHint')}
            hitSlop={8}
            className="px-2 py-1 rounded-full border border-paper-300 bg-paper-50 active:bg-paper-200 flex-row items-center"
          >
            <FontAwesome
              name="check-circle"
              size={11}
              color="#623418"
              style={{ marginRight: 4 }}
            />
            <StyledText variant="medium" className="text-xs text-cinnamon-700">
              {t('collectionRowMarkContacted')}
            </StyledText>
          </Pressable>
        </View>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          handleRecordPayment();
        }}
        accessibilityRole="button"
        accessibilityLabel={t('collectionRowRecordPayment', {
          name: row.name,
        })}
        accessibilityHint={t('collectionRowRecordPaymentHint')}
        hitSlop={8}
        className="ml-2 shrink-0 bg-cinnamon-500 px-3 py-2 rounded-xl min-h-12 min-w-[88px] items-center justify-center"
      >
        <FontAwesome name="money" size={14} color="#FFFFFF" />
        <StyledText
          variant="medium"
          numberOfLines={1}
          className="text-xs text-white mt-0.5"
        >
          {t('collectionRowRecordPayment')}
        </StyledText>
      </Pressable>
    </Pressable>
  );
}
