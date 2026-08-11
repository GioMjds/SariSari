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
}

export function CollectionRow({ row }: CollectionRowProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation('utang');

  const handleOpenDetails = () => {
    router.push(`/(edit-forms)/credit-details/${row.customerId}` as Href);
  };
  const handleRecordPayment = () => {
    router.push(`/(edit-forms)/add-payment/${row.customerId}` as Href);
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language) : '';

  const followUpChipState: 'set' | 'overdue' | 'contacted' | 'none' =
    !row.followUp
      ? 'none'
      : row.followUp.contactsToday > 0 &&
          row.followUp.lastContactAt &&
          new Date(row.followUp.lastContactAt).toDateString() ===
            new Date().toDateString()
        ? 'contacted'
        : row.followUp.followUpBy &&
            new Date(row.followUp.followUpBy) <
              new Date(new Date().toDateString())
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
          (Date.now() - new Date(row.followUp.followUpBy).getTime()) /
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
      accessibilityLabel={`${row.name}, ${formatPesos(row.balance)}`}
      className="mx-4 my-1.5 bg-cream-50 rounded-2xl p-4 flex-row items-center"
    >
      <CustomerAvatar name={row.name} photoUri={row.photoUri ?? null} />
      <View className="flex-1 ml-3">
        <StyledText variant="semibold" className="text-base text-cinnamon-800">
          {row.name}
        </StyledText>
        {row.phone ? (
          <StyledText variant="regular" className="text-xs text-cinnamon-500">
            {row.phone}
          </StyledText>
        ) : null}
        <View className="flex-row items-center mt-1 flex-wrap">
          <View
            className={`px-2 py-0.5 rounded-full ${
              row.overdueDays > 0 ? 'bg-clay-500' : 'bg-cinnamon-100'
            }`}
          >
            <StyledText
              variant="medium"
              className={`text-xs ${
                row.overdueDays > 0 ? 'text-white' : 'text-cinnamon-700'
              }`}
            >
              {formatPesos(row.balance)}
            </StyledText>
          </View>
          {row.overdueDays > 0 ? (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-clay-100">
              <StyledText variant="medium" className="text-xs text-clay-700">
                {t('collectionOverdueChip', { days: row.overdueDays })}
              </StyledText>
            </View>
          ) : null}
          {row.isNearLimit ? (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-amber-100">
              <StyledText variant="medium" className="text-xs text-amber-700">
                {t('collectionNearLimitChip')}
              </StyledText>
            </View>
          ) : null}
        </View>
        <View className="mt-2">
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              // Action sheet handler stub — implemented in Task 15.
            }}
            accessibilityRole="button"
            accessibilityLabel={chipLabel}
            className={`self-start px-2 py-1 rounded-full ${
              followUpChipState === 'overdue'
                ? 'bg-clay-100'
                : followUpChipState === 'contacted'
                  ? 'bg-sage-100'
                  : 'bg-paper-200'
            }`}
          >
            <StyledText
              variant="medium"
              className={`text-xs ${
                followUpChipState === 'overdue'
                  ? 'text-clay-700'
                  : followUpChipState === 'contacted'
                    ? 'text-sage-700'
                    : 'text-cinnamon-700'
              }`}
            >
              {chipLabel}
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
        className="ml-2 bg-cinnamon-500 px-3 py-2 rounded-xl min-h-11 items-center justify-center"
      >
        <FontAwesome name="money" size={14} color="#FFFFFF" />
        <StyledText variant="regular" className="text-xs text-white mt-0.5">
          {t('collectionRowRecordPayment')}
        </StyledText>
      </Pressable>
    </Pressable>
  );
}
