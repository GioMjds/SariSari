import { useCallback, useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { CollectionRow } from '@/components/customers/CollectionRow';
import { CollectionErrorState } from '@/components/customers/CollectionErrorState';
import { CustomersEmptyState } from '@/components/customers/CustomersEmptyState';
import { CustomersSkeleton } from '@/components/customers/CustomersSkeleton';
import { useCollectionQueue } from '@/hooks/useCredits';
import type {
  CollectionBucket,
  CollectionQueueRow,
} from '@/types/credits.types';

const bucketLabelKey = {
  overdue: 'collectionBucketOverdue',
  near_limit: 'collectionBucketNearLimit',
  oldest_balance: 'collectionBucketOldestBalance',
} satisfies Record<CollectionBucket, string>;

const bucketOrder = [
  'overdue',
  'near_limit',
  'oldest_balance',
] satisfies CollectionBucket[];

interface RowItem {
  type: 'header' | 'row';
  key: string;
  bucket?: CollectionBucket;
  row?: CollectionQueueRow;
}

export function CollectionTab() {
  const { t } = useTranslation('utang');
  const [search, setSearch] = useState('');
  const { data, isLoading, error, refetch } = useCollectionQueue();

  const items: RowItem[] = useMemo(() => {
    if (!data) return [];
    const filtered = data.filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
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
      sections.push({ type: 'header', key: `h:${bucket}`, bucket });
      for (const r of bucketRows) {
        sections.push({ type: 'row', key: `r:${r.customerId}`, row: r });
      }
    }
    return sections;
  }, [data, search]);

  const renderItem = useCallback(
    ({ item }: { item: RowItem }) =>
      item.type === 'header' ? (
        <StyledText
          variant="medium"
          accessibilityRole="header"
          className="px-4 pt-5 pb-2 text-xs font-sans-bold text-cinnamon-600 uppercase tracking-wider"
        >
          {t(bucketLabelKey[item.bucket!])}
        </StyledText>
      ) : (
        <CollectionRow row={item.row!} />
      ),
    [t],
  );

  if (isLoading) return <CustomersSkeleton />;
  if (error) return <CollectionErrorState onRetry={() => void refetch()} />;
  if (items.length === 0) {
    if (search.trim().length > 0) {
      return (
        <View className="flex-1 items-center justify-center px-8 py-12">
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            className="text-base text-cinnamon-800 mb-1"
          >
            {t('collectionSearchEmptyTitle')}
          </StyledText>
          <StyledText
            variant="regular"
            accessibilityRole="text"
            className="text-sm text-cinnamon-600 text-center"
          >
            {t('collectionSearchEmptyDescription', { query: search.trim() })}
          </StyledText>
        </View>
      );
    }
    return (
      <CustomersEmptyState
        title={t('collectionEmptyTitle')}
        description={t('collectionEmptyDescription')}
      />
    );
  }

  return (
    <View className="flex-1">
      <View className="px-4 py-3 bg-paper-200">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('collectionSearchPlaceholder')}
          placeholderTextColor="#A89F90"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
          maxLength={64}
          className="bg-cream-50 rounded-xl px-4 py-2 text-sm text-cinnamon-800"
          accessibilityLabel={t('collectionSearchPlaceholder')}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ItemSeparatorComponent={({ leadingItem }) =>
          leadingItem?.type === 'header' ? null : <View className="h-1" />
        }
        contentContainerStyle={{ paddingBottom: 96 }}
      />
    </View>
  );
}
