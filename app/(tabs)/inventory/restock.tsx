import { withProf } from '@/utils/perf';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { TabGuide } from '@/components/inventory';
import {
  ReorderCard,
  RestockAdjustModal,
  RestockSummaryCard,
  SavedPlanCard,
  SlowMoverCard,
  WatchCard,
} from '@/components/inventory/restock';
import { useStockSheetSignal, useToastStore } from '@/stores';
import {
  useDeleteReorderPlan,
  useSaveReorderPlan,
  useStockRecommendations,
} from '@/hooks';
import { ReorderRecommendation } from '@/types/stock-intelligence.types';
import { useRouter, Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { Alert } from '@/utils';
import { useFabClearance } from '@/components/inventory/InventorySpeedDialFab';
import { useTranslation } from 'react-i18next';

type TabType = 'reorder' | 'slow_movers' | 'watch_list' | 'saved_plans';

const FILTER_IDS: TabType[] = [
  'reorder',
  'slow_movers',
  'watch_list',
  'saved_plans',
];

function RestockScreen() {
  const router = useRouter();
  const { t } = useTranslation('inventory');
  const addToast = useToastStore((s) => s.addToast);
  const signal = useStockSheetSignal();
  const fabClearance = useFabClearance();
  const [activeTab, setActiveTab] = useState<TabType>('reorder');

  const {
    data: recommendations,
    isLoading,
    refetch,
  } = useStockRecommendations();
  const savePlanMutation = useSaveReorderPlan();
  const deletePlanMutation = useDeleteReorderPlan();

  const [adjustingProduct, setAdjustingProduct] =
    useState<ReorderRecommendation | null>(null);
  const [adjustedQtyText, setAdjustedQtyText] = useState('');
  const [adjustError, setAdjustError] = useState('');

  const lists = useMemo(() => {
    const recs = recommendations ?? [];
    const now = Date.now();
    return {
      reorder: recs.filter((rec) => {
        const isDeferred =
          rec.savedPlan?.status === 'deferred' &&
          rec.savedPlan.deferredUntil &&
          new Date(rec.savedPlan.deferredUntil).getTime() > now;
        const isDismissed = rec.savedPlan?.status === 'dismissed';
        return (
          (rec.isOutOfStock || rec.isLowStock) && !isDeferred && !isDismissed
        );
      }),
      slow_movers: recs.filter((rec) => rec.isSlowMover),
      watch_list: recs.filter((rec) => rec.isWatchItem),
      saved_plans: recs.filter((rec) => rec.savedPlan !== null),
    } satisfies Record<TabType, ReorderRecommendation[]>;
  }, [recommendations]);

  // Items without a cost price are left out of the estimate.
  const estimatedTotal = useMemo(
    () =>
      lists.reorder.reduce(
        (sum, rec) =>
          rec.costPrice !== null && rec.suggestedQuantity > 0
            ? sum + (rec.estimatedSpend ?? 0)
            : sum,
        0,
      ),
    [lists.reorder],
  );

  // Actions
  const handleOpenAdjust = (product: ReorderRecommendation) => {
    setAdjustingProduct(product);
    const initialQty =
      product.savedPlan?.status === 'adjusted' &&
      product.savedPlan.adjustedQuantity !== null
        ? product.savedPlan.adjustedQuantity.toString()
        : product.suggestedQuantity.toString();
    setAdjustedQtyText(initialQty);
    setAdjustError('');
  };

  const handleSaveAdjustment = () => {
    if (!adjustingProduct) return;
    const qty = parseInt(adjustedQtyText, 10);
    if (isNaN(qty) || qty < 0) {
      setAdjustError(t('restockQtyInvalid'));
      return;
    }

    savePlanMutation.mutate(
      {
        productId: adjustingProduct.productId,
        status: 'adjusted',
        adjustedQuantity: qty,
        lastStock: adjustingProduct.currentStock,
        lastDemand: adjustingProduct.sales28Days,
        lastCost: adjustingProduct.costPrice,
        lastSupplierId: adjustingProduct.preferredSupplierId,
      },
      {
        onSuccess: () => {
          setAdjustingProduct(null);
          refetch();
        },
        onError: () => {
          setAdjustError(t('restockSaveFailed'));
        },
      },
    );
  };

  const handleDefer = (product: ReorderRecommendation) => {
    const deferredUntil = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    savePlanMutation.mutate(
      {
        productId: product.productId,
        status: 'deferred',
        deferredUntil,
        lastStock: product.currentStock,
        lastDemand: product.sales28Days,
        lastCost: product.costPrice,
        lastSupplierId: product.preferredSupplierId,
      },
      {
        onSuccess: () => {
          refetch();
          showUndo(product, t('restockDeferredToast'));
        },
        onError: () => {
          Alert.alert(t('errorTitle'), t('restockSaveFailed'));
        },
      },
    );
  };

  const handleDismiss = (product: ReorderRecommendation) => {
    savePlanMutation.mutate(
      {
        productId: product.productId,
        status: 'dismissed',
        lastStock: product.currentStock,
        lastDemand: product.sales28Days,
        lastCost: product.costPrice,
        lastSupplierId: product.preferredSupplierId,
      },
      {
        onSuccess: () => {
          refetch();
          showUndo(product, t('restockDismissedToast'));
        },
        onError: () => {
          Alert.alert(t('errorTitle'), t('restockSaveFailed'));
        },
      },
    );
  };

  const handleRestore = (product: ReorderRecommendation) => {
    deletePlanMutation.mutate(product.productId, {
      onSuccess: () => refetch(),
    });
  };

  const showUndo = (product: ReorderRecommendation, message: string) => {
    addToast({
      message,
      variant: 'info',
      duration: 6000,
      action: { label: t('undo'), onPress: () => handleRestore(product) },
    });
  };

  const renderItem = ({ item }: { item: ReorderRecommendation }) => {
    switch (activeTab) {
      case 'reorder':
        return (
          <ReorderCard
            item={item}
            // The sheet host lives in the inventory layout, so the owner stays on Restock.
            onRestock={() => signal.requestRestock(item.productId)}
            onAdjust={() => handleOpenAdjust(item)}
            onDefer={() => handleDefer(item)}
            onDismiss={() => handleDismiss(item)}
          />
        );
      case 'slow_movers':
        return <SlowMoverCard item={item} />;
      case 'watch_list':
        return <WatchCard item={item} />;
      default:
        return <SavedPlanCard item={item} onRestore={() => handleRestore(item)} />;
    }
  };

  const header = (
    <View className="gap-y-3 pb-3">
      <RestockSummaryCard
        buyCount={lists.reorder.length}
        estimatedTotal={estimatedTotal}
        onReceiveDelivery={() =>
          router.push('/(edit-forms)/delivery-receipts' as Href)
        }
      />
      <TabGuide
        guideId="restock"
        steps={[t('restockGuide1'), t('restockGuide2'), t('restockGuide3')]}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-4"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {FILTER_IDS.map((id) => {
          const isActive = activeTab === id;
          const count = lists[id].length;
          return (
            <Pressable
              key={id}
              onPress={() => setActiveTab(id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${t(`restockFilter_${id}`)}, ${count}`}
              className={`min-h-[44px] px-4 rounded-full border flex-row items-center gap-2 ${
                isActive
                  ? 'bg-ink-900 border-ink-900'
                  : 'bg-paper-50 border-ink-200'
              }`}
            >
              <StyledText
                variant={isActive ? 'extrabold' : 'semibold'}
                className={`text-sm ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {t(`restockFilter_${id}`)}
              </StyledText>
              {count > 0 && (
                <StyledText
                  variant="extrabold"
                  className={`text-sm ${
                    isActive ? 'text-persimmon-300' : 'text-persimmon-700'
                  }`}
                >
                  {count}
                </StyledText>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      <StyledText variant="regular" className="text-sm text-ink-700">
        {t(`restockFilterHint_${activeTab}`)}
      </StyledText>
    </View>
  );

  const empty = isLoading ? (
    <View className="items-center py-10">
      <SariMascot state="loading" size={96} accessibilityLabel="Loading" defer />
    </View>
  ) : (
    <View className="items-center py-8 px-4">
      <SariMascot state="inventory" size={120} defer />
      <StyledText variant="extrabold" className="text-lg text-ink-900 text-center mb-1">
        {t(`restockEmpty_${activeTab}_title`)}
      </StyledText>
      <StyledText variant="regular" className="text-sm text-ink-700 text-center">
        {t(`restockEmpty_${activeTab}_body`)}
      </StyledText>
    </View>
  );

  return (
    <View className="flex-1 bg-paper-200">
      <FlatList
        data={isLoading ? [] : lists[activeTab]}
        renderItem={renderItem}
        keyExtractor={(item) => item.productId.toString()}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: fabClearance,
        }}
        showsVerticalScrollIndicator={false}
      />

      <RestockAdjustModal
        productName={adjustingProduct?.productName ?? null}
        value={adjustedQtyText}
        error={adjustError}
        onChange={(text) => {
          setAdjustedQtyText(text);
          setAdjustError('');
        }}
        onSave={handleSaveAdjustment}
        onClose={() => setAdjustingProduct(null)}
      />
    </View>
  );
}

export default withProf(RestockScreen, 'inventory/recommendations');
