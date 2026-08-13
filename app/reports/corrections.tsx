import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { format, isValid } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
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
        icon: 'ban' as const,
        containerClass: 'bg-rose-100 border-rose-300',
        textClass: 'text-rose-900',
      };
    case 'refund':
      return {
        label: 'REFUND',
        icon: 'undo' as const,
        containerClass: 'bg-amber-100 border-amber-300',
        textClass: 'text-amber-900',
      };
    case 'price_correction':
      return {
        label: 'PRICE CORRECTION',
        icon: 'pencil' as const,
        containerClass: 'bg-paper-200 border-warm-300',
        textClass: 'text-ink-900',
      };
    default:
      return {
        label: String(kind).toUpperCase(),
        icon: 'info-circle' as const,
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

  const handleCardPress = useCallback(
    (saleId: number) => {
      Haptics.selectionAsync().catch(() => {});
      router.push(`/sale-details/${saleId}` as Href);
    },
    [router],
  );

  const renderCorrectionCard = useCallback(
    ({ item }: { item: SaleCorrectionReportRow }) => {
      const badge = getKindBadge(item.kind);
      const formattedDate = formatDate(item.createdAt);
      const reasonText = formatReasonCode(item.actorReasonCode);

      return (
        <Pressable
          onPress={() => handleCardPress(item.saleId)}
          accessibilityRole="button"
          accessibilityLabel={`View sale details for sale number ${item.saleId}`}
          className="bg-paper-50 p-4 rounded-2xl border border-warm-200 mb-3 shadow-sm active:opacity-90"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2">
            <View
              className={`px-2.5 py-1 rounded-full border flex-row items-center gap-1.5 ${badge.containerClass}`}
            >
              <FontAwesome name={badge.icon} size={11} color="#623418" />
              <StyledText
                variant="extrabold"
                className={`text-[11px] tracking-wide ${badge.textClass}`}
              >
                {badge.label}
              </StyledText>
            </View>
            <View className="flex-row items-center gap-1">
              <StyledText variant="extrabold" className="text-cinnamon-600 text-sm">
                Sale #{item.saleId}
              </StyledText>
              <FontAwesome name="angle-right" size={14} color="#A39E93" />
            </View>
          </View>

          <StyledText variant="regular" className="text-ink-400 text-xs mb-3">
            {formattedDate}
          </StyledText>

          {/* Details metadata block */}
          <View className="bg-paper-100/70 p-3 rounded-xl gap-2 mb-3 border border-warm-200/80">
            <View className="flex-row justify-between items-center">
              <StyledText variant="regular" className="text-ink-500 text-xs">
                Authorized By (Actor):
              </StyledText>
              <StyledText variant="semibold" className="text-ink-800 text-xs">
                {item.actorUser}
              </StyledText>
            </View>

            <View className="flex-row justify-between items-center">
              <StyledText variant="regular" className="text-ink-500 text-xs">
                Witness / Cashier:
              </StyledText>
              <StyledText variant="semibold" className="text-ink-800 text-xs">
                {item.witnessUser || '—'}
              </StyledText>
            </View>

            <View className="flex-row justify-between items-center">
              <StyledText variant="regular" className="text-ink-500 text-xs">
                Reason:
              </StyledText>
              <StyledText variant="semibold" className="text-ink-900 text-xs">
                {reasonText}
              </StyledText>
            </View>

            {item.actorNote ? (
              <View className="mt-1 pt-1.5 border-t border-warm-200/60">
                <StyledText
                  variant="regular"
                  className="text-ink-600 text-xs italic"
                >
                  &quot;{item.actorNote}&quot;
                </StyledText>
              </View>
            ) : null}
          </View>

          {/* Amount footer */}
          <View className="flex-row justify-between items-center pt-2 border-t border-warm-200 divider-dotted">
            <StyledText
              variant="extrabold"
              className="text-ink-600 text-[11px] uppercase tracking-wider"
            >
              Sale Total At Correction
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-cinnamon-600 text-base"
            >
              {formatPesos(item.saleTotalAtCorrection)}
            </StyledText>
          </View>
        </Pressable>
      );
    },
    [handleCardPress],
  );

  const renderEmptyState = useCallback(
    () => (
      <View className="bg-paper-50 p-8 rounded-2xl border border-warm-200 items-center justify-center my-6 shadow-sm">
        <View className="w-14 h-14 rounded-full bg-paper-200 items-center justify-center mb-3">
          <FontAwesome name="clipboard" size={24} color="#623418" />
        </View>
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-base text-center mb-1"
        >
          No Corrections Recorded
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-500 text-xs text-center px-4"
        >
          Voided sales, refunds, and price adjustments will appear here in the audit log.
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
      {/* Header Bar */}
      <View
        className="bg-cinnamon-600 px-5 pb-5 flex-row items-center gap-3 border-b border-warm-900/20"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.back();
          }}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 rounded-full bg-paper-50/15 items-center justify-center border border-paper-50/20 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={15} color="#FBF7EE" />
        </Pressable>

        <View className="flex-1">
          <StyledText
            variant="medium"
            className="text-paper-100/70 label-caps"
          >
            STORE AUDIT TRAIL
          </StyledText>
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-xl"
          >
            Corrections Report
          </StyledText>
        </View>
      </View>

      {/* Content / List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#623418" />
          <StyledText variant="medium" className="text-ink-500 mt-3 text-sm">
            Loading audit report...
          </StyledText>
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
                <ActivityIndicator size="small" color="#623418" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

