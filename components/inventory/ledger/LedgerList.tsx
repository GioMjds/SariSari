import { useTranslation } from 'react-i18next';
import { useMemo, useCallback, memo } from 'react';
import {
  View,
  TouchableOpacity,
  SectionList,
  RefreshControl,
  Platform,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  SectionListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { InventoryTransaction } from '@/types/inventory.types';
import { LedgerTypeFilter } from './types';
import {
  LedgerRowData,
  LedgerSection,
  buildLedgerRows,
  filterLedgerRows,
  groupLedgerRows,
  readableNote,
} from './ledgerMath';

interface LedgerListProps {
  transactions: InventoryTransaction[];
  currentStock: number;
  searchQuery: string;
  selectedType: LedgerTypeFilter;
  hideBalance?: boolean;
  unitLabel?: string;
  isRefetching?: boolean;
  onRefresh?: () => void;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  ListHeaderComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null | undefined;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onEndReached?: () => void;
  /** Extra bottom room, e.g. to clear a floating button; defaults to 140. */
  bottomPadding?: number;
}

const LIST_CONTAINER_STYLE = { paddingBottom: 140, minHeight: 280 } as const;
const TABULAR = StyleSheet.create({ nums: { fontVariant: ['tabular-nums'] } }).nums;

type EventTone = { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string };

const EVENT_TONE: Record<InventoryTransaction['type'], EventTone> = {
  restock: { icon: 'arrow-down', color: '#3D5E1B', bg: 'bg-sage-50' },
  sale: { icon: 'cart-outline', color: '#2E6FA8', bg: 'bg-semantic-info-50' },
  damaged: { icon: 'warning-outline', color: '#C13030', bg: 'bg-semantic-danger-50' },
  adjustment: { icon: 'swap-vertical', color: '#C77B0E', bg: 'bg-semantic-warning-50' },
};

const keyExtractor = (item: LedgerRowData) => `${item.type}-${item.id}`;

export const LedgerList = memo(function LedgerList({
  transactions,
  currentStock,
  searchQuery,
  selectedType,
  hideBalance = false,
  unitLabel = 'pcs',
  isRefetching,
  onRefresh,
  onScroll,
  ListHeaderComponent,
  ListEmptyComponent,
  isFetchingNextPage,
  hasNextPage,
  onEndReached,
  bottomPadding,
}: LedgerListProps) {
  const { t } = useTranslation('inventory');

  const rows = useMemo(
    () => buildLedgerRows(transactions, currentStock),
    [transactions, currentStock],
  );

  const sections = useMemo(
    () =>
      groupLedgerRows(filterLedgerRows(rows, searchQuery, selectedType), {
        today: t('dayToday'),
        yesterday: t('dayYesterday'),
        earlier: t('dayEarlier'),
      }),
    [rows, searchQuery, selectedType, t],
  );

  const renderItem = useCallback(
    ({ item, index, section }: SectionListRenderItemInfo<LedgerRowData, LedgerSection>) => (
      <LedgerRow
        row={item}
        hideBalance={hideBalance}
        unitLabel={unitLabel}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
      />
    ),
    [hideBalance, unitLabel],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: LedgerSection }) => (
      <DayHeader title={section.title} net={section.net} />
    ),
    [],
  );

  const handleEndReached = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage && onEndReached) onEndReached();
  }, [isFetchingNextPage, hasNextPage, onEndReached]);

  const contentStyle = useMemo(
    () =>
      bottomPadding === undefined
        ? LIST_CONTAINER_STYLE
        : { ...LIST_CONTAINER_STYLE, paddingBottom: bottomPadding },
    [bottomPadding],
  );

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent ?? <LedgerNoMatches />}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      keyExtractor={keyExtractor}
      onScroll={onScroll}
      scrollEventThrottle={onScroll ? 32 : undefined}
      initialNumToRender={12}
      maxToRenderPerBatch={10}
      windowSize={9}
      removeClippedSubviews={Platform.OS === 'android'}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ListFooterNote text={t('movementsLoadingMore')} />
        ) : !hasNextPage && rows.length > 0 ? (
          <ListFooterNote text={t('movementsEnd')} />
        ) : null
      }
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!isRefetching}
            onRefresh={onRefresh}
            tintColor="#E85A1F"
            colors={['#E85A1F']}
          />
        ) : undefined
      }
    />
  );
});

const LedgerRow = memo(function LedgerRow({
  row,
  hideBalance,
  unitLabel,
  isFirst,
  isLast,
}: {
  row: LedgerRowData;
  hideBalance: boolean;
  unitLabel: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { t } = useTranslation('inventory');
  const tone = EVENT_TONE[row.type] ?? EVENT_TONE.adjustment;
  const note = readableNote(row.note, t);
  const positive = row.signed > 0;
  const typeLabel = t(`movementType_${row.type}`, {
    defaultValue: t('movementType_other'),
  });
  const qtyText = `${positive ? '+' : ''}${row.signed}`;
  const balanceText = t('ledgerBalanceAfter', { count: row.balance });
  // Movements lists several products, so their names lead the row there.
  const title = hideBalance && row.product_name ? row.product_name : typeLabel;
  const a11y = [
    title,
    hideBalance && row.product_name ? typeLabel : null,
    `${qtyText} ${unitLabel}`,
    row.timeLabel,
    hideBalance ? null : balanceText,
    note,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      accessible
      accessibilityLabel={a11y}
      className={`mx-4 px-4 py-3 bg-paper-50 border-x border-ink-100 flex-row items-center ${
        isFirst ? 'rounded-t-2xl border-t' : ''
      } ${isLast ? 'rounded-b-2xl border-b' : 'border-b border-b-paper-300'}`}
    >
      <View className={`w-9 h-9 rounded-full items-center justify-center ${tone.bg}`}>
        <Ionicons name={tone.icon} size={18} color={tone.color} />
      </View>

      <View className="flex-1 mx-3">
        <StyledText variant="semibold" className="text-ink-900 text-sm" numberOfLines={1}>
          {title}
        </StyledText>
        {note ? (
          <StyledText variant="regular" className="text-ink-600 text-sm mt-0.5" numberOfLines={2}>
            {note}
          </StyledText>
        ) : null}
        <StyledText variant="medium" className="text-ink-400 text-xs mt-0.5" style={TABULAR}>
          {row.timeLabel}
          {hideBalance && row.product_name ? ` · ${typeLabel}` : ''}
        </StyledText>
      </View>

      <View className="items-end">
        <StyledText
          variant="black"
          className={`text-base ${positive ? 'text-sage-600' : 'text-semantic-danger'}`}
          style={TABULAR}
        >
          {qtyText}
          <StyledText variant="medium" className="text-ink-400 text-xs">
            {` ${unitLabel}`}
          </StyledText>
        </StyledText>
        {!hideBalance && (
          <StyledText variant="medium" className="text-ink-500 text-xs mt-0.5" style={TABULAR}>
            {balanceText}
          </StyledText>
        )}
      </View>
    </View>
  );
});

const DayHeader = memo(function DayHeader({ title, net }: { title: string; net: number }) {
  const { t } = useTranslation('inventory');
  const netText = `${net > 0 ? '+' : ''}${net}`;
  return (
    <View
      accessibilityRole="header"
      className="bg-paper-200 px-6 pt-4 pb-2 flex-row items-center justify-between"
    >
      <StyledText variant="extrabold" className="text-ink-700 text-sm">
        {title}
      </StyledText>
      <StyledText
        variant="semibold"
        className={`text-xs ${net > 0 ? 'text-sage-600' : net < 0 ? 'text-semantic-danger' : 'text-ink-500'}`}
        style={TABULAR}
      >
        {t('ledgerDayNet', { value: netText })}
      </StyledText>
    </View>
  );
});

function ListFooterNote({ text }: { text: string }) {
  return (
    <View className="py-5 items-center">
      <StyledText variant="medium" className="text-ink-400 text-xs">
        {text}
      </StyledText>
    </View>
  );
}

export const LedgerNoMatches = memo(function LedgerNoMatches({
  onClear,
}: {
  onClear?: (() => void) | undefined;
}) {
  const { t } = useTranslation('inventory');
  return (
    <View className="mx-4 mt-2 items-center py-10 px-6 bg-paper-50 rounded-2xl border border-dashed border-ink-200">
      <View className="w-12 h-12 rounded-full bg-paper-100 items-center justify-center mb-3">
        <Ionicons name="search" size={20} color="#564E45" />
      </View>
      <StyledText variant="extrabold" className="text-ink-700 text-base text-center">
        {t('movementsNoMatchTitle')}
      </StyledText>
      <StyledText variant="regular" className="text-ink-500 text-sm mt-1 text-center">
        {t('movementsNoMatch')}
      </StyledText>
      {onClear ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onClear}
          accessibilityRole="button"
          className="mt-4 px-5 min-h-[44px] justify-center rounded-pill bg-paper-100 border border-ink-200"
        >
          <StyledText variant="extrabold" className="text-ink-800 text-sm">
            {t('movementsClearFilters')}
          </StyledText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});
