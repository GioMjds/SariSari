import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesome } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';
import { CustomerAvatar } from '@/components/customers/CustomerAvatar';
import { formatPesos } from '@/lib';
import type { CollectionQueueRow } from '@/types/credits.types';

interface CollectionRowProps {
  row: CollectionQueueRow;
  /** True while a "mark contacted" write for this row is in flight. */
  isMarking: boolean;
  onOpenFollowUp: (row: CollectionQueueRow) => void;
  onMarkContacted: (row: CollectionQueueRow) => void;
}

type FollowUpState = 'set' | 'overdue' | 'contacted' | 'none';

const CARD_BASE = 'mx-4 my-1.5 rounded-2xl border bg-paper-50';
const CARD_NORMAL = `${CARD_BASE} border-paper-300`;
const CARD_OVERDUE = `${CARD_BASE} border-semantic-danger-100`;

// Follow-up line: each state owns a distinct hue, icon, and label.
const FOLLOW_UP_STYLE = {
  overdue: {
    container: 'bg-semantic-danger-50 border-semantic-danger-100',
    text: 'text-semantic-danger',
    icon: 'calendar-times-o',
    color: '#C13030',
  },
  contacted: {
    container: 'bg-sage-50 border-sage-200',
    text: 'text-sage-700',
    icon: 'check',
    color: '#2C4413',
  },
  set: {
    container: 'bg-paper-100 border-paper-300',
    text: 'text-ink-700',
    icon: 'calendar-check-o',
    color: '#28231D',
  },
  none: {
    container: 'bg-paper-100 border-paper-300',
    text: 'text-ink-700',
    icon: 'calendar-plus-o',
    color: '#28231D',
  },
} as const satisfies Record<
  FollowUpState,
  { container: string; text: string; icon: string; color: string }
>;

const DAY_MS = 24 * 60 * 60 * 1000;

function localIsoOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parse a stored YYYY-MM-DD string as local midnight to avoid UTC-offset shifts.
function localMidnight(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

function CollectionRowComponent({
  row,
  isMarking,
  onOpenFollowUp,
  onMarkContacted,
}: CollectionRowProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation('utang');

  const handleOpenDetails = () => {
    router.push(`/(edit-forms)/credit-details/${row.customerId}` as Href);
  };
  const handleRecordPayment = () => {
    router.push(`/(edit-forms)/add-payment/${row.customerId}` as Href);
  };

  const fmtDate = (iso: string | null) =>
    iso ? localMidnight(iso).toLocaleDateString(i18n.language) : '';

  const followUpState: FollowUpState = !row.followUp
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
        : row.followUp.followUpBy
          ? 'set'
          : 'none';

  const followUpLabel = (() => {
    if (followUpState === 'contacted') {
      return t('collectionFollowUpContactedToday', {
        count: row.followUp!.contactsToday,
      });
    }
    if (followUpState === 'overdue' && row.followUp?.followUpBy) {
      const days = Math.max(
        1,
        Math.round(
          (Date.now() - localMidnight(row.followUp.followUpBy).getTime()) /
            DAY_MS,
        ),
      );
      return t('collectionFollowUpOverdue', {
        date: fmtDate(row.followUp.followUpBy),
        days,
      });
    }
    if (followUpState === 'set' && row.followUp?.followUpBy) {
      return t('collectionFollowUpSet', {
        date: fmtDate(row.followUp.followUpBy),
      });
    }
    return t('collectionFollowUpNone');
  })();

  const isOverdue = row.overdueDays > 0;
  const balance = formatPesos(row.balance);
  const followUpStyle = FOLLOW_UP_STYLE[followUpState];

  const summaryA11yLabel = (() => {
    const parts = [row.name, balance];
    if (isOverdue)
      parts.push(t('collectionOverdueChip', { days: row.overdueDays }));
    if (row.isNearLimit) parts.push(t('collectionNearLimitChip'));
    if (followUpState === 'overdue') parts.push(followUpLabel);
    return parts.join(', ');
  })();

  return (
    <View className={isOverdue ? CARD_OVERDUE : CARD_NORMAL}>
      {/* Who owes and how much. Tap opens the suki's ledger. */}
      <Pressable
        onPress={handleOpenDetails}
        accessibilityRole="button"
        accessibilityLabel={summaryA11yLabel}
        accessibilityHint={t('collectionRowOpenDetailsHint')}
        className="flex-row items-center px-4 pt-4 pb-3 rounded-t-2xl active:bg-paper-100"
      >
        <CustomerAvatar
          name={row.name}
          photoUri={row.photoUri ?? null}
          size={48}
        />
        <View className="flex-1 min-w-0 ml-3">
          <StyledText
            variant="extrabold"
            numberOfLines={2}
            className="text-base text-ink-900"
          >
            {row.name}
          </StyledText>
          {isOverdue || row.isNearLimit ? (
            <View className="flex-row flex-wrap gap-1.5 mt-1.5">
              {isOverdue ? (
                <View className="flex-row items-center px-2 py-1 rounded-full bg-semantic-danger-50">
                  <FontAwesome
                    name="exclamation-circle"
                    size={12}
                    color="#C13030"
                    style={{ marginRight: 4 }}
                  />
                  <StyledText
                    variant="semibold"
                    className="text-xs text-semantic-danger"
                  >
                    {t('collectionOverdueChip', { days: row.overdueDays })}
                  </StyledText>
                </View>
              ) : null}
              {row.isNearLimit ? (
                <View className="flex-row items-center px-2 py-1 rounded-full bg-semantic-warning-50">
                  <FontAwesome
                    name="warning"
                    size={11}
                    color="#C77B0E"
                    style={{ marginRight: 4 }}
                  />
                  <StyledText variant="semibold" className="text-xs text-ink-700">
                    {t('collectionNearLimitChip')}
                  </StyledText>
                </View>
              ) : null}
            </View>
          ) : row.phone ? (
            <StyledText
              variant="regular"
              numberOfLines={1}
              className="text-sm text-ink-500 mt-0.5"
            >
              {row.phone}
            </StyledText>
          ) : null}
        </View>
        <View className="items-end ml-3">
          <StyledText
            variant="extrabold"
            className={`text-lg ${
              isOverdue ? 'text-semantic-danger' : 'text-ink-900'
            }`}
          >
            {balance}
          </StyledText>
          <StyledText variant="medium" className="text-xs text-ink-500">
            {t('cardUtangLabel')}
          </StyledText>
        </View>
      </Pressable>

      <View className="px-4 pb-4">
        {/* Follow-up reminder */}
        <Pressable
          onPress={() => onOpenFollowUp(row)}
          accessibilityRole="button"
          accessibilityLabel={followUpLabel}
          className={`min-h-11 px-3 py-2 rounded-xl border flex-row items-center active:opacity-70 ${followUpStyle.container}`}
        >
          <FontAwesome
            name={followUpStyle.icon}
            size={14}
            color={followUpStyle.color}
            style={{ marginRight: 8 }}
          />
          <StyledText
            variant="semibold"
            maxFontSizeMultiplier={1.4}
            className={`flex-1 text-sm ${followUpStyle.text}`}
          >
            {followUpLabel}
          </StyledText>
          <FontAwesome
            name="chevron-right"
            size={11}
            color={followUpStyle.color}
            style={{ marginLeft: 8, opacity: 0.6 }}
          />
        </Pressable>

        {/* Actions: secondary left, primary right. Labels wrap, never clip. */}
        <View className="flex-row gap-2 mt-2">
          <Pressable
            onPress={() => onMarkContacted(row)}
            disabled={isMarking}
            accessibilityRole="button"
            accessibilityLabel={t('collectionMarkContactedA11y', {
              name: row.name,
            })}
            accessibilityHint={t('collectionRowMarkContactedHint')}
            accessibilityState={{ disabled: isMarking }}
            className={`flex-1 min-h-12 px-2 py-2 rounded-xl border border-sage-300 bg-sage-50 active:bg-sage-100 flex-row items-center justify-center ${
              isMarking ? 'opacity-50' : ''
            }`}
          >
            <FontAwesome
              name="check-circle"
              size={14}
              color="#2C4413"
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant="extrabold"
              maxFontSizeMultiplier={1.4}
              className="shrink text-center text-sm text-sage-700"
            >
              {t('collectionRowMarkContacted')}
            </StyledText>
          </Pressable>
          <Pressable
            onPress={handleRecordPayment}
            accessibilityRole="button"
            accessibilityLabel={`${t('collectionRowRecordPayment')}, ${row.name}`}
            accessibilityHint={t('collectionRowRecordPaymentHint')}
            className="flex-1 min-h-12 px-2 py-2 rounded-xl bg-persimmon-600 active:bg-persimmon-700 flex-row items-center justify-center"
          >
            <FontAwesome
              name="money"
              size={14}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant="extrabold"
              maxFontSizeMultiplier={1.4}
              className="shrink text-center text-sm text-white"
            >
              {t('collectionRowRecordPayment')}
            </StyledText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export const CollectionRow = memo(CollectionRowComponent);
export default CollectionRow;
