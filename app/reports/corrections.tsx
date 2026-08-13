import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { format, isValid } from 'date-fns';
import { useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';
import { useCorrectionsReport } from '@/hooks/useCorrections';
import { formatPesos } from '@/lib';
import type {
  CorrectionKind,
  SaleCorrectionReportRow,
} from '@/types/corrections.types';

const REASON_LABELS = {
  customer_changed_mind: 'Customer Changed Mind',
  misprinted_price: 'Misprinted Price',
  wrong_item_scanned: 'Wrong Item Scanned',
  returned_damaged: 'Returned Damaged',
  returned_other: 'Returned Other',
  shelf_price_changed: 'Shelf Price Changed',
  other: 'Other Reason',
} satisfies Record<string, string>;

const hasReasonLabel = (code: string): code is keyof typeof REASON_LABELS =>
  Object.prototype.hasOwnProperty.call(REASON_LABELS, code);

const formatReasonCode = (code: string): string => {
  if (hasReasonLabel(code)) return REASON_LABELS[code];
  return code
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (
  date: Date | string | number | null | undefined,
): string => {
  if (!date) return '—';
  const d =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
  if (!isValid(d)) return '—';
  return format(d, 'MMM dd, yyyy · hh:mm a');
};

const getKindBadge = (kind: CorrectionKind) => {
  switch (kind) {
    case 'void':
      return {
        label: 'VOID',
        containerClass: 'bg-cinnamon-100 border-cinnamon-200',
        textClass: 'text-cinnamon-800',
      };
    case 'refund':
      return {
        label: 'REFUND',
        containerClass: 'bg-blue-100 border-blue-200',
        textClass: 'text-blue-800',
      };
    case 'price_correction':
      return {
        label: 'PRICE CORRECTION',
        containerClass: 'bg-amber-100 border-amber-200',
        textClass: 'text-amber-800',
      };
    default:
      return {
        label: String(kind).toUpperCase(),
        containerClass: 'bg-warm-100 border-warm-200',
        textClass: 'text-ink-700',
      };
  }
};

export default function CorrectionsReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useCorrectionsReport({ limit: 50 });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const renderCorrectionCard = useCallback(
    ({ item }: { item: SaleCorrectionReportRow }) => {
      const badge = getKindBadge(item.kind);
      const formattedDate = formatDate(item.createdAt);
      const reasonText = formatReasonCode(item.actorReasonCode);

      return (
        <View className="bg-paper-50 p-4 rounded-2xl border border-warm-100 mb-3 shadow-sm">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2">
            <View
              className={`px-2.5 py-1 rounded-full border ${badge.containerClass}`}
            >
              <StyledText
                variant="extrabold"
                className={`text-xs tracking-wide ${badge.textClass}`}
              >
                {badge.label}
              </StyledText>
            </View>
            <StyledText variant="semibold" className="text-ink-800 text-sm">
              Sale #{item.saleId}
            </StyledText>
          </View>

          <StyledText variant="regular" className="text-ink-400 text-xs mb-3">
            {formattedDate}
          </StyledText>

          {/* Body */}
          <View className="bg-paper-100/60 p-3 rounded-xl gap-1.5 mb-3 border border-warm-100">
            <View className="flex-row justify-between items-center">
              <StyledText variant="regular" className="text-ink-500 text-xs">
                Actor:
              </StyledText>
              <StyledText variant="semibold" className="text-ink-800 text-xs">
                {item.actorUser}
              </StyledText>
            </View>

            <View className="flex-row justify-between items-center">
              <StyledText variant="regular" className="text-ink-500 text-xs">
                Witness:
              </StyledText>
              <StyledText variant="semibold" className="text-ink-800 text-xs">
                {item.witnessUser || '—'}
              </StyledText>
            </View>

            <View className="flex-row justify-between items-center">
              <StyledText variant="regular" className="text-ink-500 text-xs">
                Reason:
              </StyledText>
              <StyledText variant="medium" className="text-ink-700 text-xs">
                {reasonText}
              </StyledText>
            </View>

            {item.actorNote ? (
              <View className="mt-1 pt-1.5 border-t border-warm-100/80">
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-xs italic"
                >
                  &quot;{item.actorNote}&quot;
                </StyledText>
              </View>
            ) : null}
          </View>

          {/* Amount */}
          <View className="flex-row justify-between items-center pt-1">
            <StyledText
              variant="extrabold"
              className="text-ink-600 text-xs uppercase tracking-wider"
            >
              Sale Total
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-cinnamon-600 text-base"
            >
              {formatPesos(item.saleTotalAtCorrection)}
            </StyledText>
          </View>
        </View>
      );
    },
    [],
  );

  const renderEmptyState = useCallback(
    () => (
      <View className="bg-paper-50 p-8 rounded-2xl border border-warm-100 items-center justify-center my-6">
        <FontAwesome
          name="clipboard"
          size={32}
          color="#A39E93"
          style={{ marginBottom: 12 }}
        />
        <StyledText
          variant="semibold"
          className="text-ink-500 text-base text-center"
        >
          No corrections recorded
        </StyledText>
      </View>
    ),
    [],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback(
    (item: SaleCorrectionReportRow) => item.id.toString(),
    [],
  );

  return (
    <View className="flex-1 bg-paper-200">
      {/* Cinnamon Header */}
      <View
        className="bg-cinnamon-500 px-5 pb-6 flex-row items-center gap-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={20}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 rounded-full bg-cinnamon-600 items-center justify-center border border-paper-50/20 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#FBF7EE" />
        </Pressable>

        <StyledText
          variant="extrabold"
          className="text-paper-50 text-xl font-extrabold flex-1"
        >
          Corrections Audit Log
        </StyledText>
      </View>

      {/* Content / List */}
      {isLoading ? (
        // Must replace with a proper loading skeleton later
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#C85A32" />
        </View>
      ) : (
        <FlatList<SaleCorrectionReportRow>
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderCorrectionCard}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
          }}
          ListEmptyComponent={renderEmptyState}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#C85A32" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
