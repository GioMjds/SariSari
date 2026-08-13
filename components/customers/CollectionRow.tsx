import { memo } from 'react';
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

const COLLECTION_ROW_BASE =
  'mx-4 my-1.5 bg-paper-50 rounded-2xl p-4 flex-row items-center';
const COLLECTION_ROW_BASE_OVERDUE =
  'mx-4 my-1.5 rounded-2xl p-4 flex-row items-center bg-persimmon-50 border border-persimmon-100';

// Balance badge: normal = neutral money chip, overdue = ink-strong with brand tint
const BADGE_CONTAINER_OVERDUE = 'px-2 py-0.5 rounded-full bg-persimmon-700';
const BADGE_CONTAINER_NORMAL = 'px-2 py-0.5 rounded-full bg-paper-100';
const BADGE_TEXT_OVERDUE = 'text-xs text-paper-50';
const BADGE_TEXT_NORMAL = 'text-xs text-cinnamon-700';

// Follow-up chip — three states, each owns a distinct hue
const CHIP_CONTAINER_OVERDUE =
  'px-2 py-1 rounded-full border bg-semantic-danger border-semantic-danger';
const CHIP_CONTAINER_CONTACTED =
  'px-2 py-1 rounded-full border bg-sage-500 border-sage-500';
const CHIP_CONTAINER_DEFAULT =
  'px-2 py-1 rounded-full border bg-paper-100 border-paper-300';

const CHIP_TEXT_OVERDUE = 'text-xs text-paper-50';
const CHIP_TEXT_CONTACTED = 'text-xs text-paper-50';
const CHIP_TEXT_DEFAULT = 'text-xs text-cinnamon-700';

const MARK_CONTACTED_BTN =
  'px-2 py-1 rounded-full border border-sage-200 bg-sage-50 active:bg-sage-100 flex-row items-center';
// Saturated brand persimmon — the only place on this row that earns it.
const RECORD_PAYMENT_BTN =
  'ml-2 shrink-0 bg-persimmon-500 active:bg-persimmon-600 px-3 py-2 rounded-xl min-h-12 min-w-[88px] items-center justify-center shadow-paper';

function CollectionRowComponent({ row }: CollectionRowProps) {
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
          new Date(
            row.followUp.lastContactAt.replace(' ', 'T') + 'Z',
          ).toDateString() === new Date().toDateString()
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
                  (Date.now() -
                    localMidnight(row.followUp.followUpBy).getTime()) /
                    (24 * 60 * 60 * 1000),
                ),
              ),
            }),
          );
        return parts.join(', ');
      })()}
      accessibilityHint={t('collectionRowOpenDetailsHint')}
      className={row.overdueDays > 0 ? COLLECTION_ROW_BASE_OVERDUE : COLLECTION_ROW_BASE}
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
            className={
              row.overdueDays > 0
                ? BADGE_CONTAINER_OVERDUE
                : BADGE_CONTAINER_NORMAL
            }
          >
            <StyledText
              variant="medium"
              className={
                row.overdueDays > 0 ? BADGE_TEXT_OVERDUE : BADGE_TEXT_NORMAL
              }
            >
              {formatPesos(row.balance)}
            </StyledText>
          </View>
          {row.overdueDays > 0 ? (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-paper-50 border border-semantic-danger">
              <StyledText
                variant="medium"
                className="text-xs text-semantic-danger"
              >
                {t('collectionOverdueChip', { days: row.overdueDays })}
              </StyledText>
            </View>
          ) : null}
          {row.isNearLimit ? (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-paper-50 border border-semantic-warning">
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
            className={
              followUpChipState === 'overdue'
                ? CHIP_CONTAINER_OVERDUE
                : followUpChipState === 'contacted'
                  ? CHIP_CONTAINER_CONTACTED
                  : CHIP_CONTAINER_DEFAULT
            }
          >
            <StyledText
              variant="medium"
              className={
                followUpChipState === 'overdue'
                  ? CHIP_TEXT_OVERDUE
                  : followUpChipState === 'contacted'
                    ? CHIP_TEXT_CONTACTED
                    : CHIP_TEXT_DEFAULT
              }
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
            className={MARK_CONTACTED_BTN}
          >
            <FontAwesome
              name="check-circle"
              size={11}
              color="#3D5E1B"
              style={{ marginRight: 4 }}
            />
            <StyledText variant="medium" className="text-xs text-sage-700">
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
        className={RECORD_PAYMENT_BTN}
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

export const CollectionRow = memo(CollectionRowComponent);
export default CollectionRow;
