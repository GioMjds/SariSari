import { useCallback, useState } from 'react';
import {  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { format, isValid } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { useDeliveryReceipts } from '@/hooks/useDeliveryReceipts';
import { formatPesos } from '@/lib/money';
import type {
  DeliveryReceiptStatus,
  DeliveryReceiptSummary,
} from '@/types/deliveries.types';

const TABS: {
  status: DeliveryReceiptStatus;
  labelKey: string;
  emptyKey: string;
}[] = [
  { status: 'draft', labelKey: 'tabDrafts', emptyKey: 'emptyDrafts' },
  { status: 'committed', labelKey: 'tabCommitted', emptyKey: 'emptyCommitted' },
  { status: 'voided', labelKey: 'tabVoided', emptyKey: 'emptyVoided' },
];

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isValid(d) ? format(d, 'MMM dd, yyyy · hh:mm a') : '—';
};

// The date that matters for each tab: received, voided, or started.
const rowDate = (r: DeliveryReceiptSummary): string | null =>
  r.status === 'committed'
    ? r.committedAt
    : r.status === 'voided'
      ? r.voidedAt
      : r.createdAt;

export default function DeliveryReceiptsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('receiving');
  const [activeStatus, setActiveStatus] =
    useState<DeliveryReceiptStatus>('draft');

  const { data, isLoading, isFetching, refetch } = useDeliveryReceipts({
    status: activeStatus,
  });
  const receipts = data ?? [];
  const activeTab = TABS.find((tab) => tab.status === activeStatus);

  const openReceipt = useCallback(
    (id: number | 'new') => {
      Haptics.selectionAsync().catch(() => {});
      router.push(`/(edit-forms)/delivery-receipt/${id}` as Href);
    },
    [router],
  );

  const renderReceipt = useCallback(
    ({ item }: { item: DeliveryReceiptSummary }) => (
      <Pressable
        onPress={() => openReceipt(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.supplierName}, ${item.invoiceNo ?? t('noInvoice')}`}
        className="bg-paper-50 p-4 rounded-2xl border border-ink-100 shadow-paper mb-3 active:opacity-90"
      >
        <View className="flex-row items-start justify-between mb-1">
          <View className="flex-1 mr-2">
            <StyledText
              variant="semibold"
              className="text-base text-ink-900"
              numberOfLines={1}
            >
              {item.supplierName}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-xs text-ink-500 mt-0.5"
            >
              {item.invoiceNo ?? t('noInvoice')}
            </StyledText>
          </View>
          <StyledText
            variant="extrabold"
            className="text-cinnamon-600 text-base"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatPesos(item.totalCost)}
          </StyledText>
        </View>

        <View className="flex-row items-center gap-1.5 mt-1">
          <FontAwesome name="clock-o" size={11} color="#A89F90" />
          <StyledText
            variant="medium"
            className="text-ink-400 text-xs"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatDate(rowDate(item))}
          </StyledText>
        </View>

        <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-ink-100">
          <StyledText variant="regular" className="text-xs text-ink-600">
            {t('lineCount', { count: item.lineCount })}
          </StyledText>
          {item.shortageQty > 0 ? (
            <View className="px-2 py-0.5 rounded-full bg-semantic-danger-50">
              <StyledText
                variant="semibold"
                className="text-xs text-semantic-danger"
              >
                {t('shortageChip', { count: item.shortageQty })}
              </StyledText>
            </View>
          ) : null}
        </View>
      </Pressable>
    ),
    [openReceipt, t],
  );

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
            >
              {t('listTitle')}
            </StyledText>
          </View>

          <View className="w-10 h-10" />
        </View>
      </View>

      {/* Shortage report link */}
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          router.push('/reports/supplier-shortages' as Href);
        }}
        accessibilityRole="link"
        accessibilityLabel={t('shortagesLink')}
        className="mx-4 mb-3 flex-row items-center justify-between rounded-xl bg-cinnamon-50 border border-cinnamon-100 px-4 py-2.5 active:opacity-80"
      >
        <View className="flex-row items-center gap-2">
          <FontAwesome name="truck" size={13} color="#623418" />
          <StyledText variant="semibold" className="text-cinnamon-700 text-xs">
            {t('shortagesLink')}
          </StyledText>
        </View>
        <FontAwesome name="angle-right" size={14} color="#623418" />
      </Pressable>

      {/* Status tabs */}
      <View className="flex-row px-4 gap-2 mb-3">
        {TABS.map((tab) => {
          const isActive = tab.status === activeStatus;
          return (
            <Pressable
              key={tab.status}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveStatus(tab.status);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t(tab.labelKey)}
              style={{ minHeight: 40 }}
              className={`px-4 rounded-full border flex-row items-center ${
                isActive
                  ? 'bg-ink-900 border-ink-900'
                  : 'bg-paper-50 border-ink-200'
              }`}
            >
              <StyledText
                variant={isActive ? 'extrabold' : 'semibold'}
                className={`text-sm ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {t(tab.labelKey)}
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
        <FlatList<DeliveryReceiptSummary>
          data={receipts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReceipt}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 24,
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
                {activeTab ? t(activeTab.emptyKey) : ''}
              </StyledText>
            </View>
          }
        />
      )}

      {/* Bottom action bar */}
      <View
        className="px-4 pt-4 bg-paper-50 border-t border-ink-100 shadow-paper"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Pressable
          onPress={() => openReceipt('new')}
          accessibilityRole="button"
          accessibilityLabel={t('newDelivery')}
          className="w-full py-4 rounded-xl flex-row items-center justify-center gap-2 bg-persimmon-500 shadow-paper active:opacity-90"
        >
          <FontAwesome name="plus" size={14} color="#FBF7EE" />
          <StyledText
            variant="extrabold"
            className="text-base font-stack-sans-bold text-paper-50"
          >
            {t('newDelivery')}
          </StyledText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
