import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { endOfDay, format, isValid, startOfDay, subDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import {
  useDeliveryShortageReport,
  useSupplierShortageLines,
} from '@/hooks/useDeliveryReceipts';
import { formatPesos } from '@/lib/money';
import type { SupplierShortageRow } from '@/types/deliveries.types';

type RangeKey = '30' | '90' | 'all';

const RANGES: { key: RangeKey; labelKey: string; days: number | null }[] = [
  { key: '30', labelKey: 'range30', days: 30 },
  { key: '90', labelKey: 'range90', days: 90 },
  { key: 'all', labelKey: 'rangeAll', days: null },
];

/**
 * committed_at is a full ISO timestamp, so both bounds are full ISO
 * timestamps: since is the start of the first day, until the end of today.
 * A date-only until would sort before same-day timestamps and drop today.
 */
const rangeBounds = (
  days: number | null,
): { since?: string; until?: string } => {
  if (days === null) return {};
  const now = new Date();
  return {
    since: startOfDay(subDays(now, days - 1)).toISOString(),
    until: endOfDay(now).toISOString(),
  };
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return isValid(d) ? format(d, 'MMM dd, yyyy') : '—';
};

export default function SupplierShortagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('receiving');
  const [rangeKey, setRangeKey] = useState<RangeKey>('30');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Computed once per selection so the query key stays stable.
  const range = useMemo(
    () => rangeBounds(RANGES.find((r) => r.key === rangeKey)?.days ?? null),
    [rangeKey],
  );

  const { data, isLoading, isFetching, refetch } =
    useDeliveryShortageReport(range);
  const rows = data ?? [];
  const evidence = useSupplierShortageLines(expandedId, range);

  const toggleExpanded = useCallback((supplierId: string) => {
    Haptics.selectionAsync().catch(() => {});
    setExpandedId((prev) => (prev === supplierId ? null : supplierId));
  }, []);

  const renderRow = ({ item }: { item: SupplierShortageRow }) => {
    const isExpanded = expandedId === item.supplierId;
    return (
      <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper mb-3 overflow-hidden">
        <Pressable
          onPress={() => toggleExpanded(item.supplierId)}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          accessibilityLabel={item.supplierName}
          className="p-4 active:opacity-90"
        >
          <View className="flex-row items-start justify-between mb-3">
            <StyledText
              variant="semibold"
              className="text-base text-ink-900 flex-1 mr-2"
              numberOfLines={1}
            >
              {item.supplierName}
            </StyledText>
            <View className="items-end">
              <StyledText
                variant="extrabold"
                className={`text-base ${
                  item.shortageValue > 0
                    ? 'text-semantic-danger'
                    : 'text-ink-700'
                }`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatPesos(item.shortageValue)}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-[10px] text-ink-400"
              >
                {t('reportShortageValue')}
              </StyledText>
            </View>
          </View>

          <View className="bg-paper-100 rounded-xl p-3 flex-row justify-between items-center">
            <Stat label={t('reportReceipts')} value={String(item.receipts)} />
            <Stat
              label={t('reportShortLines')}
              value={`${item.shortLines} / ${item.lines}`}
            />
            <Stat
              label={t('reportRate')}
              value={`${Math.round(item.shortageRate * 100)}%`}
              alignEnd
            />
          </View>

          <View className="flex-row justify-center mt-2">
            <FontAwesome
              name={isExpanded ? 'angle-up' : 'angle-down'}
              size={16}
              color="#A89F90"
            />
          </View>
        </Pressable>

        {isExpanded ? (
          <View className="px-4 pb-4 gap-2">
            {evidence.isLoading ? (
              <ActivityIndicator size="small" color="#623418" />
            ) : (evidence.data ?? []).length === 0 ? (
              <StyledText variant="regular" className="text-ink-500 text-xs">
                {t('reportEmpty')}
              </StyledText>
            ) : (
              (evidence.data ?? []).map((line, index) => (
                <View
                  key={`${line.receiptId}-${index}`}
                  className="bg-paper-100/70 p-2.5 rounded-xl border border-ink-100"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <StyledText
                      variant="extrabold"
                      className="text-ink-900 text-xs flex-1 mr-2"
                      numberOfLines={1}
                    >
                      {line.productName}
                    </StyledText>
                    <StyledText
                      variant="medium"
                      className="text-ink-400 text-[11px]"
                    >
                      {line.invoiceNo ?? t('noInvoice')} ·{' '}
                      {formatDate(line.committedAt)}
                    </StyledText>
                  </View>
                  <StyledText
                    variant="regular"
                    className="text-ink-600 text-xs"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {t('expected')} {line.expectedQty} · {t('received')}{' '}
                    {line.receivedQty} ·{' '}
                    <StyledText
                      variant="semibold"
                      className="text-semantic-danger text-xs"
                    >
                      {t('reportShort')} {line.shortageQty}
                    </StyledText>
                  </StyledText>
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-3 pb-2 bg-background z-10">
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.back();
            }}
            hitSlop={{ top: 16, bottom: 16, left: 20, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>

          <View className="flex-1 px-3 items-center">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-h2 font-stack-sans-bold"
              numberOfLines={1}
            >
              {t('reportTitle')}
            </StyledText>
          </View>

          <View className="w-10 h-10" />
        </View>
      </View>

      {/* Range selector */}
      <View className="flex-row px-4 gap-2 mb-3">
        {RANGES.map((r) => {
          const isActive = r.key === rangeKey;
          return (
            <Pressable
              key={r.key}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setRangeKey(r.key);
                setExpandedId(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t(r.labelKey)}
              className={`px-3 py-1.5 rounded-full border ${
                isActive
                  ? 'bg-persimmon-500 border-persimmon-600 shadow-sm'
                  : 'bg-paper-50 border-ink-100 active:bg-paper-100'
              }`}
            >
              <StyledText
                variant="semibold"
                className={`text-xs ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {t(r.labelKey)}
              </StyledText>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <SariMascot state="loading" size={96} accessibilityLabel="Loading" />
        </View>
      ) : (
        <FlatList<SupplierShortageRow>
          data={rows}
          keyExtractor={(item) => item.supplierId}
          renderItem={renderRow}
          extraData={{ expandedId, evidence: evidence.data }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: insets.bottom + 32,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => {
                void refetch();
              }}
              tintColor="#623418"
              colors={['#E85A1F', '#623418']}
            />
          }
          ListEmptyComponent={
            <View className="bg-paper-50 p-8 rounded-2xl border border-ink-100 items-center justify-center my-6 shadow-paper">
              <View className="w-14 h-14 rounded-full bg-paper-100 items-center justify-center mb-3 border border-ink-100">
                <FontAwesome name="truck" size={20} color="#7A7165" />
              </View>
              <StyledText
                variant="regular"
                className="text-ink-500 text-sm text-center px-4 leading-relaxed"
              >
                {t('reportEmpty')}
              </StyledText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  alignEnd = false,
}: {
  label: string;
  value: string;
  alignEnd?: boolean;
}) {
  return (
    <View className={alignEnd ? 'items-end' : ''}>
      <StyledText variant="regular" className="text-xs text-ink-600">
        {label}
      </StyledText>
      <StyledText
        variant="semibold"
        className="text-sm text-ink-700 mt-0.5"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </StyledText>
    </View>
  );
}
