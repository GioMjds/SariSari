import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { useDeleteReorderPlan, useSaveReorderPlan, useStockRecommendations } from '@/hooks';
import { formatPesos } from '@/lib/money';
import { ReorderRecommendation } from '@/types/stock-intelligence.types';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { MotiView } from 'moti';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'reorder' | 'slow_movers' | 'watch_list' | 'saved_plans';

export default function RecommendationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('reorder');

  // Queries & Mutations
  const { data: recommendations, isLoading, refetch } = useStockRecommendations();
  const savePlanMutation = useSaveReorderPlan();
  const deletePlanMutation = useDeleteReorderPlan();

  // Adjust Modal state
  const [adjustingProduct, setAdjustingProduct] = useState<ReorderRecommendation | null>(null);
  const [adjustedQtyText, setAdjustedQtyText] = useState('');
  const [adjustError, setAdjustError] = useState('');

  // Tab calculations
  const reorderList = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.filter((rec) => {
      const isDeferred =
        rec.savedPlan?.status === 'deferred' &&
        rec.savedPlan.deferredUntil &&
        new Date(rec.savedPlan.deferredUntil).getTime() > Date.now();
      const isDismissed = rec.savedPlan?.status === 'dismissed';
      return (rec.isOutOfStock || rec.isLowStock) && !isDeferred && !isDismissed;
    });
  }, [recommendations]);

  const slowMoversList = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.filter((rec) => rec.isSlowMover);
  }, [recommendations]);

  const watchList = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.filter((rec) => rec.isWatchItem);
  }, [recommendations]);

  const savedPlansList = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.filter((rec) => rec.savedPlan !== null);
  }, [recommendations]);

  // Actions
  const handleOpenAdjust = (product: ReorderRecommendation) => {
    setAdjustingProduct(product);
    const initialQty =
      product.savedPlan?.status === 'adjusted' && product.savedPlan.adjustedQuantity !== null
        ? product.savedPlan.adjustedQuantity.toString()
        : product.suggestedQuantity.toString();
    setAdjustedQtyText(initialQty);
    setAdjustError('');
  };

  const handleSaveAdjustment = () => {
    if (!adjustingProduct) return;
    const qty = parseInt(adjustedQtyText, 10);
    if (isNaN(qty) || qty < 0) {
      setAdjustError('Please enter a valid positive number');
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
      }
    );
  };

  const handleDefer = (product: ReorderRecommendation) => {
    const deferredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
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
        onSuccess: () => refetch(),
      }
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
        onSuccess: () => refetch(),
      }
    );
  };

  const handleRestore = (product: ReorderRecommendation) => {
    deletePlanMutation.mutate(product.productId, {
      onSuccess: () => refetch(),
    });
  };

  const handleRestock = (product: ReorderRecommendation) => {
    // Navigates back to the main inventory screen and triggers the restock flow
    router.replace({
      pathname: '/inventory',
      params: { restock: product.productId.toString() },
    } as any);
  };

  // Render Item for Reorder Tab
  const renderReorderItem = ({ item }: { item: ReorderRecommendation }) => {
    const showEstimatedSpend = item.costPrice !== null && item.suggestedQuantity > 0;
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250 }}
        className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 shadow-paper"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <StyledText variant="semibold" className="text-base text-ink-900">
              {item.productName}
            </StyledText>
            <View className="flex-row flex-wrap items-center mt-1 gap-x-2">
              <StyledText variant="regular" className="text-xs text-ink-500">
                SKU: {item.sku}
              </StyledText>
              {item.category && (
                <>
                  <StyledText variant="regular" className="text-xs text-ink-300">•</StyledText>
                  <StyledText variant="regular" className="text-xs text-ink-500">
                    {item.category}
                  </StyledText>
                </>
              )}
            </View>
          </View>
          <View className="items-end">
            <View className={`px-2 py-0.5 rounded-full ${item.isOutOfStock ? 'bg-semantic-danger-50' : 'bg-semantic-warning-50'}`}>
              <StyledText variant="semibold" className={`text-xs ${item.isOutOfStock ? 'text-semantic-danger' : 'text-semantic-warning'}`}>
                {item.isOutOfStock ? 'Out of Stock' : `${item.currentStock} ${item.retailUnitName} left`}
              </StyledText>
            </View>
          </View>
        </View>

        {/* Demand & Recommendation Metrics */}
        <View className="bg-paper-100 rounded-xl p-3 flex-row justify-between items-center mb-3">
          <View>
            <StyledText variant="regular" className="text-xs text-ink-400">28d Sales</StyledText>
            <StyledText variant="semibold" className="text-sm text-ink-700 mt-0.5">
              {item.sales28Days} {item.retailUnitName}
            </StyledText>
          </View>
          <View className="items-center">
            <StyledText variant="regular" className="text-xs text-ink-400">Suggested</StyledText>
            <StyledText variant="extrabold" className="text-sm text-persimmon-600 mt-0.5">
              +{item.suggestedQuantity} {item.retailUnitName}
            </StyledText>
          </View>
          <View className="items-end">
            <StyledText variant="regular" className="text-xs text-ink-400">Est. Spend</StyledText>
            {showEstimatedSpend ? (
              <MoneyText value={item.estimatedSpend ?? 0} size="sm" className="mt-0.5" />
            ) : (
              <StyledText variant="semibold" className="text-sm text-ink-400 mt-0.5">—</StyledText>
            )}
          </View>
        </View>

        {item.preferredSupplierName && (
          <View className="flex-row items-center mb-3 gap-1">
            <FontAwesome name="truck" size={12} color="#7A7165" />
            <StyledText variant="medium" className="text-xs text-ink-500">
              Supplier: {item.preferredSupplierName}
            </StyledText>
          </View>
        )}

        {/* Actions Row */}
        <View className="flex-row justify-between gap-2 mt-1">
          <View className="flex-row gap-2">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleOpenAdjust(item)}
              className="px-3 py-2 bg-paper-200 border border-ink-200 rounded-xl active:bg-paper-300"
            >
              <StyledText variant="semibold" className="text-xs text-ink-700">Adjust</StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleDefer(item)}
              className="px-3 py-2 bg-paper-200 border border-ink-200 rounded-xl active:bg-paper-300"
            >
              <StyledText variant="semibold" className="text-xs text-ink-700">Defer 7d</StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleDismiss(item)}
              className="px-3 py-2 bg-paper-200 border border-ink-200 rounded-xl active:bg-paper-300"
            >
              <StyledText variant="semibold" className="text-xs text-ink-700">Dismiss</StyledText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRestock(item)}
            className="px-3 py-2 bg-persimmon-500 rounded-xl flex-row items-center gap-1.5 active:bg-persimmon-600 shadow-persimmon-glow"
          >
            <FontAwesome name="plus" size={10} color="#FBF7EE" />
            <StyledText variant="semibold" className="text-xs text-paper-50">Record Restock</StyledText>
          </TouchableOpacity>
        </View>
      </MotiView>
    );
  };

  // Render Item for Slow Movers Tab
  const renderSlowMoverItem = ({ item }: { item: ReorderRecommendation }) => {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250 }}
        className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 shadow-paper"
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-2">
            <StyledText variant="semibold" className="text-base text-ink-900">
              {item.productName}
            </StyledText>
            <View className="flex-row flex-wrap items-center mt-1 gap-x-2">
              <StyledText variant="regular" className="text-xs text-ink-500">
                SKU: {item.sku}
              </StyledText>
              {item.category && (
                <>
                  <StyledText variant="regular" className="text-xs text-ink-300">•</StyledText>
                  <StyledText variant="regular" className="text-xs text-ink-500">
                    {item.category}
                  </StyledText>
                </>
              )}
            </View>
          </View>
          <View className="items-end">
            <View className="px-2 py-0.5 rounded-full bg-paper-200 border border-ink-150">
              <StyledText variant="semibold" className="text-xs text-ink-700">
                Stock: {item.currentStock} {item.retailUnitName}
              </StyledText>
            </View>
          </View>
        </View>

        <View className="mt-3 pt-3 border-t border-ink-100 flex-row justify-between items-center">
          <StyledText variant="regular" className="text-xs text-ink-500">
            No sales recorded in the last 28 days
          </StyledText>
          {item.costPrice !== null && (
            <View className="flex-row items-center gap-1.5">
              <StyledText variant="regular" className="text-xs text-ink-400">Stock Value:</StyledText>
              <MoneyText value={item.currentStock * item.costPrice} size="sm" />
            </View>
          )}
        </View>
      </MotiView>
    );
  };

  // Render Item for Watch List Tab
  const renderWatchItem = ({ item }: { item: ReorderRecommendation }) => {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250 }}
        className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 shadow-paper"
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-2">
            <StyledText variant="semibold" className="text-base text-ink-900">
              {item.productName}
            </StyledText>
            <View className="flex-row flex-wrap items-center mt-1 gap-x-2">
              <StyledText variant="regular" className="text-xs text-ink-500">
                SKU: {item.sku}
              </StyledText>
              {item.category && (
                <>
                  <StyledText variant="regular" className="text-xs text-ink-300">•</StyledText>
                  <StyledText variant="regular" className="text-xs text-ink-500">
                    {item.category}
                  </StyledText>
                </>
              )}
            </View>
          </View>
          <View className="items-end">
            <View className="px-2 py-0.5 rounded-full bg-semantic-info-50">
              <StyledText variant="semibold" className="text-xs text-semantic-info">
                New Product
              </StyledText>
            </View>
          </View>
        </View>

        <View className="mt-3 pt-3 border-t border-ink-100 flex-row justify-between items-center">
          <StyledText variant="regular" className="text-xs text-ink-500">
            Fewer than 7 days of sales history
          </StyledText>
          <StyledText variant="semibold" className="text-xs text-ink-700">
            Current Stock: {item.currentStock} {item.retailUnitName}
          </StyledText>
        </View>
      </MotiView>
    );
  };

  // Render Item for Saved Plans Tab
  const renderSavedPlanItem = ({ item }: { item: ReorderRecommendation }) => {
    if (!item.savedPlan) return null;
    const { status, adjustedQuantity, deferredUntil } = item.savedPlan;

    let statusText = '';
    let statusColorClass = 'text-ink-600 bg-paper-200';
    if (status === 'adjusted') {
      statusText = `Adjusted: +${adjustedQuantity} ${item.retailUnitName}`;
      statusColorClass = 'text-persimmon-700 bg-persimmon-50';
    } else if (status === 'deferred') {
      const dateStr = deferredUntil ? new Date(deferredUntil).toLocaleDateString() : '';
      statusText = `Deferred until ${dateStr}`;
      statusColorClass = 'text-semantic-warning bg-semantic-warning-50';
    } else if (status === 'dismissed') {
      statusText = 'Dismissed';
      statusColorClass = 'text-semantic-danger bg-semantic-danger-50';
    }

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250 }}
        className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 shadow-paper"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-2">
            <StyledText variant="semibold" className="text-base text-ink-900">
              {item.productName}
            </StyledText>
            <StyledText variant="regular" className="text-xs text-ink-500 mt-0.5">
              SKU: {item.sku}
            </StyledText>
          </View>
          <View className={`px-2.5 py-1 rounded-full ${statusColorClass}`}>
            <StyledText variant="semibold" className="text-xs">
              {statusText}
            </StyledText>
          </View>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-ink-100">
          <StyledText variant="regular" className="text-xs text-ink-400">
            Original suggested: +{Math.max(0, Math.ceil((7 * item.sales28Days) / 28) - item.currentStock)} {item.retailUnitName}
          </StyledText>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRestore(item)}
            className="px-3.5 py-1.5 bg-paper-100 border border-ink-200 rounded-xl flex-row items-center gap-1 active:bg-paper-200"
          >
            <FontAwesome name="undo" size={10} color="#564E45" />
            <StyledText variant="semibold" className="text-xs text-ink-700">Restore</StyledText>
          </TouchableOpacity>
        </View>
      </MotiView>
    );
  };

  const getActiveList = () => {
    switch (activeTab) {
      case 'reorder':
        return reorderList;
      case 'slow_movers':
        return slowMoversList;
      case 'watch_list':
        return watchList;
      case 'saved_plans':
        return savedPlansList;
      default:
        return [];
    }
  };

  const activeList = getActiveList();

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-background">
        {/* Header Bar */}
        <View className="bg-cinnamon-500 pt-3 pb-4 px-5 flex-row items-center border-b border-cinnamon-600">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            className="mr-3 p-2 rounded-full bg-cinnamon-700/50"
            accessibilityLabel="Go back to inventory screen"
          >
            <Ionicons name="arrow-back" size={20} color="#FBF7EE" />
          </TouchableOpacity>
          <StyledText variant="extrabold" className="text-xl text-paper-50 flex-1">
            Stock Advice
          </StyledText>
        </View>

        {/* Tabs Row */}
        <View className="bg-cinnamon-500 px-5 pb-3 pt-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {[
              { id: 'reorder', label: 'Reorder', count: reorderList.length },
              { id: 'slow_movers', label: 'Slow Movers', count: slowMoversList.length },
              { id: 'watch_list', label: 'Watch List', count: watchList.length },
              { id: 'saved_plans', label: 'Saved Plans', count: savedPlansList.length },
            ].map((t) => {
              const isActive = activeTab === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setActiveTab(t.id as TabType)}
                  className="px-4 py-2 rounded-xl flex-row items-center gap-1.5 active:scale-[0.96] transition-transform"
                  style={{
                    backgroundColor: isActive ? '#E85A1F' : 'rgba(77, 40, 16, 0.5)',
                  }}
                >
                  <StyledText
                    variant="semibold"
                    className="text-xs"
                    style={{ color: isActive ? '#FFFFFF' : '#E5D8BC' }}
                  >
                    {t.label}
                  </StyledText>
                  {t.count > 0 && (
                    <View
                      className="px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(229,216,188,0.2)',
                      }}
                    >
                      <StyledText
                        variant="extrabold"
                        className="text-[10px]"
                        style={{ color: isActive ? '#FFFFFF' : '#E5D8BC' }}
                      >
                        {t.count}
                      </StyledText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Content Container */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#E85A1F" />
          </View>
        ) : activeList.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <View className="w-16 h-16 rounded-full bg-paper-100 border border-ink-150 items-center justify-center mb-4">
              <FontAwesome name="check-circle" size={32} color="#4F7A24" />
            </View>
            <StyledText variant="extrabold" className="text-lg text-ink-900 text-center mb-1">
              All Good!
            </StyledText>
            <StyledText variant="regular" className="text-sm text-ink-500 text-center">
              No items in this category need attention right now.
            </StyledText>
          </View>
        ) : (
          <FlatList
            data={activeList}
            renderItem={
              activeTab === 'reorder'
                ? renderReorderItem
                : activeTab === 'slow_movers'
                  ? renderSlowMoverItem
                  : activeTab === 'watch_list'
                    ? renderWatchItem
                    : renderSavedPlanItem
            }
            keyExtractor={(item) => item.productId.toString()}
            contentContainerClassName="p-4 pb-20"
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Adjust Quantity Modal */}
        <Modal
          visible={adjustingProduct !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setAdjustingProduct(null)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-center items-center px-6"
            onPress={() => setAdjustingProduct(null)}
          >
            <Pressable
              className="bg-paper-50 rounded-2xl p-5 w-full max-w-sm border border-ink-150 shadow-modal"
              onPress={(e) => e.stopPropagation()}
            >
              <StyledText variant="extrabold" className="text-lg text-ink-900 mb-2">
                Adjust Quantity
              </StyledText>
              <StyledText variant="regular" className="text-sm text-ink-500 mb-4">
                Enter the adjusted restock quantity for {adjustingProduct?.productName}:
              </StyledText>

              <TextInput
                value={adjustedQtyText}
                onChangeText={(text) => {
                  setAdjustedQtyText(text);
                  setAdjustError('');
                }}
                keyboardType="number-pad"
                className="bg-paper-100 border border-ink-200 rounded-xl p-3 font-stack-sans text-ink-900 text-base mb-2"
                placeholder="Quantity"
                autoFocus
              />

              {adjustError ? (
                <StyledText variant="semibold" className="text-xs text-semantic-danger mb-3">
                  {adjustError}
                </StyledText>
              ) : null}

              <View className="flex-row justify-end gap-3 mt-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setAdjustingProduct(null)}
                  className="px-4 py-2 bg-paper-200 rounded-xl"
                >
                  <StyledText variant="semibold" className="text-sm text-ink-700">
                    Cancel
                  </StyledText>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSaveAdjustment}
                  className="px-4 py-2 bg-persimmon-500 rounded-xl shadow-persimmon-glow"
                >
                  <StyledText variant="semibold" className="text-sm text-paper-50">
                    Save
                  </StyledText>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
