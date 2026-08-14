import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCorrectionsReport } from '@/hooks/useCorrections';
import { formatPesos } from '@/lib';
import type {
  CorrectionKind,
  SaleCorrectionReportRow,
} from '@/types/corrections.types';

type FilterType = 'all' | 'void' | 'refund' | 'price_correction';

const REASON_METADATA = {
  customer_changed_mind: {
    label: 'Customer Changed Mind',
    icon: 'user-times' as const,
  },
  misprinted_price: {
    label: 'Misprinted Price',
    icon: 'tag' as const,
  },
  wrong_item_scanned: {
    label: 'Wrong Item Scanned',
    icon: 'barcode' as const,
  },
  returned_damaged: {
    label: 'Returned — Damaged',
    icon: 'exclamation-circle' as const,
  },
  returned_other: {
    label: 'Returned — Other',
    icon: 'refresh' as const,
  },
  shelf_price_changed: {
    label: 'Shelf Price Changed',
    icon: 'tags' as const,
  },
  other: {
    label: 'Other Reason',
    icon: 'info-circle' as const,
  },
} satisfies Record<
  string,
  { label: string; icon: keyof typeof FontAwesome.glyphMap }
>;

const hasReasonMeta = (
  code: string,
): code is keyof typeof REASON_METADATA =>
  Object.prototype.hasOwnProperty.call(REASON_METADATA, code);

const getReasonDisplay = (
  code: string,
): { label: string; icon: keyof typeof FontAwesome.glyphMap } => {
  if (hasReasonMeta(code)) {
    return REASON_METADATA[code];
  }
  const formatted = code
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return { label: formatted, icon: 'info-circle' };
};

const formatDate = (
  date: Date | string | number | null | undefined,
): { full: string; relative: string } => {
  if (!date) return { full: '—', relative: '' };
  const d =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
  if (!isValid(d)) return { full: '—', relative: '' };

  const full = format(d, 'MMM dd, yyyy · hh:mm a');
  let relative = '';
  try {
    relative = formatDistanceToNow(d, { addSuffix: true });
  } catch {
    relative = '';
  }
  return { full, relative };
};

const getKindBadge = (kind: CorrectionKind) => {
  switch (kind) {
    case 'void':
      return {
        label: 'VOID',
        icon: 'ban' as const,
        containerClass: 'bg-semantic-danger-50 border-semantic-danger/25',
        textClass: 'text-semantic-danger',
        iconColor: '#C13030',
      };
    case 'refund':
      return {
        label: 'REFUND',
        icon: 'undo' as const,
        containerClass: 'bg-semantic-warning-50 border-semantic-warning/25',
        textClass: 'text-semantic-warning',
        iconColor: '#C77B0E',
      };
    case 'price_correction':
      return {
        label: 'PRICE EDIT',
        icon: 'pencil' as const,
        containerClass: 'bg-persimmon-50 border-persimmon-300/60',
        textClass: 'text-persimmon-700',
        iconColor: '#C8460F',
      };
    default:
      return {
        label: String(kind).toUpperCase(),
        icon: 'info-circle' as const,
        containerClass: 'bg-paper-100 border-ink-100',
        textClass: 'text-ink-700',
        iconColor: '#564E45',
      };
  }
};

function CorrectionCardSkeleton() {
  return (
    <View className="bg-paper-50 p-4 rounded-2xl border border-ink-100 shadow-paper mb-3.5">
      <View className="flex-row items-center justify-between mb-3">
        <Skeleton width={90} height={24} borderRadius={999} />
        <Skeleton width={80} height={24} borderRadius={999} />
      </View>
      <Skeleton width={140} height={12} style={{ marginBottom: 12 }} />
      <View className="bg-paper-100/70 p-3 rounded-xl gap-2 mb-3 border border-ink-100/70">
        <Skeleton width="60%" height={14} />
        <Skeleton width="45%" height={14} />
        <Skeleton width="75%" height={14} />
      </View>
      <View className="flex-row justify-between items-center pt-2.5 border-t border-ink-100">
        <Skeleton width={130} height={12} />
        <Skeleton width={70} height={18} />
      </View>
    </View>
  );
}

export default function CorrectionsReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('corrections');

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch,
    isFetching,
  } = useCorrectionsReport({ limit: 50 });

  const rawItems = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  // Counts for top metric filter chips
  const counts = useMemo(() => {
    let voidCount = 0;
    let refundCount = 0;
    let priceCount = 0;

    for (const item of rawItems) {
      if (item.kind === 'void') voidCount++;
      else if (item.kind === 'refund') refundCount++;
      else if (item.kind === 'price_correction') priceCount++;
    }

    return {
      all: rawItems.length,
      void: voidCount,
      refund: refundCount,
      price_correction: priceCount,
    };
  }, [rawItems]);

  // Filtered items based on active kind tab & search input
  const filteredItems = useMemo(() => {
    let result = rawItems;

    if (activeFilter !== 'all') {
      result = result.filter((item) => item.kind === activeFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      result = result.filter((item) => {
        const saleIdStr = String(item.saleId);
        const refStr = `#sr-${saleIdStr.padStart(4, '0')}`;
        if (saleIdStr.includes(q) || refStr.toLowerCase().includes(q)) {
          return true;
        }
        if (item.actorUser.toLowerCase().includes(q)) return true;
        if (item.witnessUser?.toLowerCase().includes(q)) return true;
        if (item.actorReasonCode.toLowerCase().includes(q)) return true;
        if (item.actorNote?.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    return result;
  }, [rawItems, activeFilter, searchQuery]);

  const totalFilteredVolume = useMemo(() => {
    return filteredItems.reduce(
      (sum, item) => sum + (item.saleTotalAtCorrection || 0),
      0,
    );
  }, [filteredItems]);

  const handleCardPress = useCallback(
    (saleId: number) => {
      Haptics.selectionAsync().catch(() => {});
      router.push(`/(edit-forms)/sale-details/${saleId}` as Href);
    },
    [router],
  );

  const handleFilterChange = useCallback((filter: FilterType) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveFilter(filter);
  }, []);

  const handleResetFilters = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setSearchQuery('');
    setActiveFilter('all');
  }, []);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await refetch();
  }, [refetch]);

  const renderCorrectionCard = useCallback(
    ({ item }: { item: SaleCorrectionReportRow }) => {
      const badge = getKindBadge(item.kind);
      const { full: formattedDate, relative: relativeDate } = formatDate(
        item.createdAt,
      );
      const reasonMeta = getReasonDisplay(item.actorReasonCode);

      return (
        <Pressable
          onPress={() => handleCardPress(item.saleId)}
          accessibilityRole="button"
          accessibilityLabel={`View sale details for sale number ${item.saleId}, ${badge.label}`}
          accessibilityHint="Navigates to the detailed sale receipt"
          className="bg-paper-50 p-4 rounded-2xl border border-ink-100 shadow-paper mb-3.5 active:scale-[0.99] active:opacity-90 transition-all"
        >
          {/* Card Header: Kind Badge & Sale Reference Pill */}
          <View className="flex-row items-center justify-between mb-2">
            <View
              className={`px-2.5 py-1 rounded-full border flex-row items-center gap-1.5 ${badge.containerClass}`}
            >
              <FontAwesome
                name={badge.icon}
                size={11}
                color={badge.iconColor}
              />
              <StyledText
                variant="extrabold"
                className={`text-[11px] tracking-wider ${badge.textClass}`}
              >
                {badge.label}
              </StyledText>
            </View>

            <View className="flex-row items-center bg-paper-100 px-2.5 py-1 rounded-full border border-ink-100 gap-1.5">
              <FontAwesome name="file-text-o" size={10} color="#623418" />
              <StyledText
                variant="extrabold"
                className="text-cinnamon-600 text-xs"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                Sale #{item.saleId}
              </StyledText>
              <FontAwesome name="angle-right" size={12} color="#A89F90" />
            </View>
          </View>

          {/* Timestamp Subtitle */}
          <View className="flex-row items-center gap-1.5 mb-3">
            <FontAwesome name="clock-o" size={11} color="#A89F90" />
            <StyledText
              variant="medium"
              className="text-ink-400 text-xs"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formattedDate}
            </StyledText>
            {relativeDate ? (
              <StyledText variant="regular" className="text-ink-300 text-xs">
                · {relativeDate}
              </StyledText>
            ) : null}
          </View>

          {/* Audit Metadata Capsule */}
          <View className="bg-paper-100/70 p-3 rounded-xl gap-2 mb-3 border border-ink-100/70">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-1.5">
                <FontAwesome name="user" size={11} color="#7A7165" />
                <StyledText variant="regular" className="text-ink-500 text-xs">
                  {t('actor_label', 'Authorized by')}:
                </StyledText>
              </View>
              <StyledText
                variant="semibold"
                className="text-ink-800 text-xs capitalize"
              >
                {item.actorUser}
              </StyledText>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-1.5">
                <FontAwesome name="user-o" size={11} color="#7A7165" />
                <StyledText variant="regular" className="text-ink-500 text-xs">
                  {t('witness_label_short', 'Witness / Cashier')}:
                </StyledText>
              </View>
              <StyledText
                variant="semibold"
                className="text-ink-800 text-xs capitalize"
              >
                {item.witnessUser || '—'}
              </StyledText>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-1.5">
                <FontAwesome name={reasonMeta.icon} size={11} color="#7A7165" />
                <StyledText variant="regular" className="text-ink-500 text-xs">
                  {t('reason_label', 'Reason')}:
                </StyledText>
              </View>
              <StyledText
                variant="semibold"
                className="text-ink-900 text-xs text-right flex-1 ml-2"
                numberOfLines={1}
              >
                {reasonMeta.label}
              </StyledText>
            </View>

            {item.actorNote ? (
              <View className="mt-1 pt-2 border-t flex-row gap-2 items-start bg-paper-50/80 p-2.5 rounded-lg border-l-2 border-persimmon-400">
                <FontAwesome
                  name="quote-left"
                  size={10}
                  color="#FA7A4B"
                  style={{ marginTop: 2 }}
                />
                <StyledText
                  variant="regular"
                  className="text-ink-700 text-xs italic flex-1"
                >
                  {item.actorNote}
                </StyledText>
              </View>
            ) : null}
          </View>

          {/* Financial Value Footer */}
          <View className="flex-row justify-between items-center pt-2.5 border-t border-ink-100">
            <StyledText
              variant="extrabold"
              className="text-ink-500 text-[10px] uppercase tracking-wider"
            >
              {t('sale_total_at_event', 'Sale Total At Event')}
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-cinnamon-600 text-base"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatPesos(item.saleTotalAtCorrection)}
            </StyledText>
          </View>
        </Pressable>
      );
    },
    [handleCardPress, t],
  );

  const renderEmptyState = useCallback(() => {
    if (rawItems.length === 0) {
      return (
        <View className="bg-paper-50 p-8 rounded-2xl border border-ink-100 items-center justify-center my-6 shadow-paper">
          <View className="w-16 h-16 rounded-full bg-persimmon-50 items-center justify-center mb-4 border border-persimmon-200 shadow-sm">
            <FontAwesome name="check-circle-o" size={30} color="#C8460F" />
          </View>
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-lg text-center mb-1.5"
          >
            {t('empty_report', 'No Corrections Recorded Yet')}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-ink-500 text-xs text-center px-4 leading-relaxed"
          >
            {t(
              'empty_report_desc',
              'Voided sales, customer refunds, and price adjustments will be logged here in this immutable audit trail.',
            )}
          </StyledText>
        </View>
      );
    }

    return (
      <View className="bg-paper-50 p-8 rounded-2xl border border-ink-100 items-center justify-center my-6 shadow-paper">
        <View className="w-14 h-14 rounded-full bg-paper-100 items-center justify-center mb-3 border border-ink-100">
          <FontAwesome name="search" size={20} color="#7A7165" />
        </View>
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-base text-center mb-1"
        >
          {t('no_matching_title', 'No Matching Corrections')}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-500 text-xs text-center px-4 mb-4"
        >
          {t(
            'no_matching_desc',
            'No records matched your search query or filter selection.',
          )}
        </StyledText>
        <Pressable
          onPress={handleResetFilters}
          accessibilityRole="button"
          accessibilityLabel="Reset search and filters"
          className="bg-cinnamon-600 px-4 py-2 rounded-full active:opacity-80 flex-row items-center gap-2"
        >
          <FontAwesome name="undo" size={11} color="#FBF7EE" />
          <StyledText variant="semibold" className="text-paper-50 text-xs">
            {t('clear_filters', 'Clear Filters')}
          </StyledText>
        </Pressable>
      </View>
    );
  }, [rawItems.length, t, handleResetFilters]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback(
    (item: SaleCorrectionReportRow) => item.id.toString(),
    [],
  );

  const listHeader = useMemo(() => {
    return (
      <View className="mb-3">
        {/* Context Banner */}
        <View className="rounded-2xl overflow-hidden shadow-paper bg-cinnamon-50 p-4 mb-3 border border-cinnamon-100">
          <View className="flex-row items-center gap-3">
            <View className="bg-cinnamon-100 w-10 h-10 rounded-full items-center justify-center">
              <FontAwesome name="shield" size={16} color="#623418" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 mb-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                <StyledText
                  variant="extrabold"
                  className="text-[10px] text-cinnamon-600 uppercase tracking-wider"
                >
                  {t('immutable_badge', 'IMMUTABLE AUDIT LOG')}
                </StyledText>
              </View>
              <StyledText
                variant="regular"
                className="text-xs text-ink-600 leading-snug"
              >
                Tamper-evident record of all voided sales, customer refunds, and price corrections.
              </StyledText>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-paper-50 rounded-xl px-3.5 py-2.5 flex-row items-center border border-ink-100 shadow-sm mb-3">
          <FontAwesome
            name="search"
            size={13}
            color="#A89F90"
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t(
              'search_placeholder',
              'Search sale #, actor, cashier, reason...',
            )}
            placeholderTextColor="#A89F90"
            className="flex-1 text-ink-900 text-xs p-0 font-medium"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
              className="p-1"
            >
              <FontAwesome name="times-circle" size={14} color="#7A7165" />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Segment Chips */}
        <View className="flex-row items-center gap-2 mb-3">
          <Pressable
            onPress={() => handleFilterChange('all')}
            accessibilityRole="button"
            accessibilityLabel={`Filter by all corrections (${counts.all})`}
            className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-persimmon-500 border-persimmon-600 shadow-sm'
                : 'bg-paper-50 border-ink-100 active:bg-paper-100'
            }`}
          >
            <StyledText
              variant="semibold"
              className={`text-xs ${
                activeFilter === 'all' ? 'text-paper-50' : 'text-ink-700'
              }`}
            >
              {t('filter_all', 'All')}
            </StyledText>
            <View
              className={`px-1.5 py-0.2 rounded-full ${
                activeFilter === 'all'
                  ? 'bg-persimmon-700/60'
                  : 'bg-paper-200'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-[10px] ${
                  activeFilter === 'all' ? 'text-paper-50' : 'text-ink-600'
                }`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {counts.all}
              </StyledText>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleFilterChange('void')}
            accessibilityRole="button"
            accessibilityLabel={`Filter by voids (${counts.void})`}
            className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1.5 ${
              activeFilter === 'void'
                ? 'bg-semantic-danger border-semantic-danger shadow-sm'
                : 'bg-paper-50 border-ink-100 active:bg-paper-100'
            }`}
          >
            <StyledText
              variant="semibold"
              className={`text-xs ${
                activeFilter === 'void' ? 'text-paper-50' : 'text-ink-700'
              }`}
            >
              {t('filter_voids', 'Voids')}
            </StyledText>
            <View
              className={`px-1.5 py-0.2 rounded-full ${
                activeFilter === 'void'
                  ? 'bg-semantic-danger-100/30'
                  : 'bg-paper-200'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-[10px] ${
                  activeFilter === 'void' ? 'text-paper-50' : 'text-ink-600'
                }`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {counts.void}
              </StyledText>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleFilterChange('refund')}
            accessibilityRole="button"
            accessibilityLabel={`Filter by refunds (${counts.refund})`}
            className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1.5 ${
              activeFilter === 'refund'
                ? 'bg-semantic-warning border-semantic-warning shadow-sm'
                : 'bg-paper-50 border-ink-100 active:bg-paper-100'
            }`}
          >
            <StyledText
              variant="semibold"
              className={`text-xs ${
                activeFilter === 'refund' ? 'text-paper-50' : 'text-ink-700'
              }`}
            >
              {t('filter_refunds', 'Refunds')}
            </StyledText>
            <View
              className={`px-1.5 py-0.2 rounded-full ${
                activeFilter === 'refund'
                  ? 'bg-semantic-warning-100/30'
                  : 'bg-paper-200'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-[10px] ${
                  activeFilter === 'refund' ? 'text-paper-50' : 'text-ink-600'
                }`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {counts.refund}
              </StyledText>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleFilterChange('price_correction')}
            accessibilityRole="button"
            accessibilityLabel={`Filter by price edits (${counts.price_correction})`}
            className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1.5 ${
              activeFilter === 'price_correction'
                ? 'bg-cinnamon-600 border-cinnamon-700 shadow-sm'
                : 'bg-paper-50 border-ink-100 active:bg-paper-100'
            }`}
          >
            <StyledText
              variant="semibold"
              className={`text-xs ${
                activeFilter === 'price_correction'
                  ? 'text-paper-50'
                  : 'text-ink-700'
              }`}
            >
              {t('filter_price_corrections', 'Price Edits')}
            </StyledText>
            <View
              className={`px-1.5 py-0.2 rounded-full ${
                activeFilter === 'price_correction'
                  ? 'bg-cinnamon-800/40'
                  : 'bg-paper-200'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-[10px] ${
                  activeFilter === 'price_correction'
                    ? 'text-paper-50'
                    : 'text-ink-600'
                }`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {counts.price_correction}
              </StyledText>
            </View>
          </Pressable>
        </View>

        {/* Dynamic Summary Count / Total Bar */}
        {filteredItems.length > 0 ? (
          <View className="px-1 py-1 flex-row items-center justify-between">
            <StyledText
              variant="semibold"
              className="text-ink-500 text-[11px] tracking-wide"
            >
              {t('showing_count', {
                count: filteredItems.length,
                total: rawItems.length,
                defaultValue: `Showing ${filteredItems.length} of ${rawItems.length} records`,
              })}
            </StyledText>
            <View className="flex-row items-baseline gap-1">
              <StyledText variant="regular" className="text-ink-400 text-xs">
                Volume:
              </StyledText>
              <StyledText
                variant="extrabold"
                className="text-cinnamon-600 text-xs"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatPesos(totalFilteredVolume)}
              </StyledText>
            </View>
          </View>
        ) : null}
      </View>
    );
  }, [
    t,
    searchQuery,
    activeFilter,
    counts,
    filteredItems.length,
    rawItems.length,
    totalFilteredVolume,
    handleFilterChange,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top Header Card (Consistent with Edit Forms like Add Category) */}
      <View className="px-4 pt-3 pb-2 bg-background z-10">
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.back();
            }}
            hitSlop={{ top: 16, bottom: 16, left: 20, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('goBack', 'Go back')}
            className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>

          <View className="flex-1 px-3 items-center">
            <StyledText
              variant="extrabold"
              className="label-caps text-ink-400"
              style={{ fontSize: 10 }}
            >
              STORE AUDIT TRAIL
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-h2 font-stack-sans-bold mt-0.5"
            >
              {t('report_title', 'Corrections Report')}
            </StyledText>
          </View>

          <Pressable
            onPress={handleRefresh}
            hitSlop={{ top: 16, bottom: 16, left: 8, right: 20 }}
            accessibilityRole="button"
            accessibilityLabel="Refresh audit log"
            className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
          >
            <MotiView
              animate={{ rotate: isFetching ? '360deg' : '0deg' }}
              transition={{
                type: 'timing',
                duration: 700,
                loop: isFetching,
              }}
            >
              <FontAwesome name="refresh" size={14} color="#0E0C0A" />
            </MotiView>
          </Pressable>
        </View>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View className="flex-1 p-4">
          <CorrectionCardSkeleton />
          <CorrectionCardSkeleton />
          <CorrectionCardSkeleton />
        </View>
      ) : (
        <FlatList<SaleCorrectionReportRow>
          data={filteredItems}
          keyExtractor={keyExtractor}
          renderItem={renderCorrectionCard}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 32,
          }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={renderEmptyState}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              tintColor="#623418"
              colors={['#E85A1F', '#623418']}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#623418" />
              </View>
            ) : !hasNextPage && filteredItems.length > 0 ? (
              <View className="py-6 items-center flex-row justify-center gap-2 opacity-60">
                <View className="h-px bg-ink-100 w-12" />
                <StyledText
                  variant="medium"
                  className="text-ink-400 text-[11px] uppercase tracking-wider"
                >
                  {t('end_of_log', 'End of audit trail')}
                </StyledText>
                <View className="h-px bg-ink-100 w-12" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
