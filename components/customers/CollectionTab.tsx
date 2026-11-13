import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SearchBar } from '@/components/ui';
import { CollectionRow } from '@/components/customers/CollectionRow';
import { CollectionErrorState } from '@/components/customers/CollectionErrorState';
import { CustomersEmptyState } from '@/components/customers/CustomersEmptyState';
import { CustomersSkeleton } from '@/components/customers/CustomersSkeleton';
import { FollowUpSheet } from '@/components/customers/FollowUpSheet';
import {
  useCollectionQueue,
  useMarkCollectionContacted,
  useSetCollectionFollowUp,
} from '@/hooks/useCredits';
import type {
  CollectionBucket,
  CollectionQueueRow,
} from '@/types/credits.types';

const bucketLabelKey = {
  overdue: 'collectionBucketOverdue',
  near_limit: 'collectionBucketNearLimit',
  oldest_balance: 'collectionBucketOldestBalance',
} as const satisfies Record<CollectionBucket, string>;

const bucketOrder = [
  'overdue',
  'near_limit',
  'oldest_balance',
] satisfies CollectionBucket[];

type RowItem =
  | { type: 'header'; key: string; bucket: CollectionBucket; count: number }
  | { type: 'row'; key: string; row: CollectionQueueRow };

export function CollectionTab() {
  const { t } = useTranslation('utang');
  const [search, setSearch] = useState('');
  const [sheetRow, setSheetRow] = useState<CollectionQueueRow | null>(null);
  const { data, isLoading, error, refetch } = useCollectionQueue();

  // One set of mutations for the whole list instead of two per row.
  const { mutate: setFollowUp } = useSetCollectionFollowUp();
  const {
    mutate: markContacted,
    isPending: isMarking,
    variables: markingId,
  } = useMarkCollectionContacted();

  const handleMarkContacted = useCallback(
    (row: CollectionQueueRow) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      markContacted(row.customerId);
    },
    [markContacted],
  );

  const handleOpenFollowUp = useCallback((row: CollectionQueueRow) => {
    setSheetRow(row);
  }, []);

  const closeSheet = useCallback(() => setSheetRow(null), []);

  const handleSelectFollowUp = useCallback(
    (followUpBy: string | null) => {
      if (sheetRow) {
        setFollowUp({ customerId: sheetRow.customerId, followUpBy });
      }
      setSheetRow(null);
    },
    [sheetRow, setFollowUp],
  );

  const items: RowItem[] = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const filtered = data.filter((r) => {
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.phone != null && r.phone.toLowerCase().includes(q))
      );
    });
    const sections: RowItem[] = [];
    for (const bucket of bucketOrder) {
      const bucketRows = filtered
        .filter((r) => r.bucket === bucket)
        .sort((a, b) => {
          if (bucket === 'overdue') {
            const d = b.overdueDays - a.overdueDays;
            if (d !== 0) return d;
          }
          return b.balance - a.balance;
        });
      if (bucketRows.length === 0) continue;
      sections.push({
        type: 'header',
        key: `h:${bucket}`,
        bucket,
        count: bucketRows.length,
      });
      for (const r of bucketRows) {
        sections.push({ type: 'row', key: `r:${r.customerId}`, row: r });
      }
    }
    return sections;
  }, [data, search]);

  const markingCustomerId = isMarking ? markingId : undefined;

  const renderItem = useCallback(
    ({ item }: { item: RowItem }) =>
      item.type === 'header' ? (
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${t(bucketLabelKey[item.bucket])}, ${item.count}`}
          className="px-4 pt-4 pb-1.5 flex-row items-center"
        >
          <StyledText variant="extrabold" className="text-ink-800 text-base">
            {t(bucketLabelKey[item.bucket])}
          </StyledText>
          <View
            className={`ml-2 min-w-6 px-2 py-0.5 rounded-full items-center ${
              item.bucket === 'overdue'
                ? 'bg-semantic-danger'
                : 'bg-paper-400'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={`text-xs ${
                item.bucket === 'overdue' ? 'text-white' : 'text-ink-700'
              }`}
            >
              {item.count}
            </StyledText>
          </View>
        </View>
      ) : (
        <CollectionRow
          row={item.row}
          isMarking={markingCustomerId === item.row.customerId}
          onOpenFollowUp={handleOpenFollowUp}
          onMarkContacted={handleMarkContacted}
        />
      ),
    [t, markingCustomerId, handleOpenFollowUp, handleMarkContacted],
  );

  if (isLoading) return <CustomersSkeleton />;
  if (error) return <CollectionErrorState onRetry={() => void refetch()} />;
  if (!data || data.length === 0) {
    return (
      <CustomersEmptyState
        title={t('collectionEmptyTitle')}
        description={t('collectionEmptyDescription')}
      />
    );
  }

  // The search bar stays mounted when nothing matches, so the owner can
  // always edit or clear the query.
  const searchEmpty = (
    <View className="items-center px-8 py-10">
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-ink-800 text-base text-center"
      >
        {t('collectionSearchEmptyTitle')}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm text-center mt-1"
      >
        {t('collectionSearchEmptyDescription', { query: search.trim() })}
      </StyledText>
    </View>
  );

  return (
    <View className="flex-1 bg-paper-200">
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListHeaderComponent={
          <View className="px-4 mt-1">
            <SearchBar
              compact
              value={search}
              onChange={setSearch}
              placeholder={t('collectionSearchPlaceholder')}
              accessibilityLabel={t('collectionSearchPlaceholder')}
              clearAccessibilityLabel={t('searchClear')}
              autoCorrect={false}
              autoCapitalize="none"
              maxLength={64}
            />
          </View>
        }
        ListEmptyComponent={searchEmpty}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      <FollowUpSheet
        visible={sheetRow !== null}
        name={sheetRow?.name ?? ''}
        hasFollowUp={sheetRow?.followUp?.followUpBy != null}
        onSelect={handleSelectFollowUp}
        onClose={closeSheet}
      />
    </View>
  );
}
