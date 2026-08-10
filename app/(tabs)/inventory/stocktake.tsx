import { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import {
  useActiveStocktakeSession,
  useStocktakeCounts,
  useRecentStocktakeSessions,
  useStartStocktake,
  useUpsertStocktakeCount,
  useCommitStocktake,
  useAbandonStocktake,
} from '@/hooks/useStocktake';
import { useProducts } from '@/hooks/useProducts';
import {
  StocktakeStartCard,
  StocktakeHistoryList,
  StocktakeCategorySection,
  StocktakeVarianceSummary,
  StocktakeVarianceRow,
  StocktakeSkeleton,
} from '@/components/inventory/stocktake';
import type { StocktakeReason } from '@/configs/stocktakeReasons';
import type { StocktakeCount } from '@/types/stocktake.types';
import { Product } from '@/types';

export default function StocktakeScreen() {
  const { t } = useTranslation('stocktake');
  const [viewState, setViewState] = useState<'counting' | 'variance'>(
    'counting',
  );

  // Queries & Mutations
  const { data: activeSession, isLoading: loadingSession } =
    useActiveStocktakeSession();
  const { data: counts = [] } = useStocktakeCounts(activeSession?.id ?? null);
  const { data: recentSessions = [] } = useRecentStocktakeSessions();
  const { getAllProductsQuery } = useProducts();
  const products = useMemo(() => {
    return getAllProductsQuery?.data;
  }, [getAllProductsQuery?.data]) as Product[];

  const startMut = useStartStocktake();
  const upsertMut = useUpsertStocktakeCount();
  const commitMut = useCommitStocktake();
  const abandonMut = useAbandonStocktake();

  // Local state for variance reason selection
  const [reasonsMap, setReasonsMap] = useState<
    Record<number, { reasonCode: StocktakeReason; note: string }>
  >({});

  // Map counts by product_id
  const countsMap = useMemo(() => {
    const map: Record<number, StocktakeCount> = {};
    for (const c of counts) {
      map[c.productId] = c;
    }
    return map;
  }, [counts]);

  // Group products by category
  const categoriesMap = useMemo(() => {
    const map: Record<string, typeof products> = {};
    for (const p of products) {
      const cat = p.category || 'Uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return map;
  }, [products]);

  // Compute total counted and variances
  const totalProducts = products.length;
  const countedCount = Object.keys(countsMap).length;

  const varianceRows = useMemo(() => {
    return counts.filter((c) => c.countedQty !== c.expectedQty);
  }, [counts]);

  const netVariancePesos = useMemo(() => {
    let sum = 0;
    for (const c of counts) {
      const p = products.find((x) => x.id === c.productId);
      const cost = p?.cost_price ?? 0;
      const delta = c.countedQty - c.expectedQty;
      sum += delta * cost;
    }
    return Math.round(sum * 100) / 100;
  }, [counts, products]);

  const allVariancesHaveReasons = useMemo(() => {
    return varianceRows.every((v) =>
      Boolean(reasonsMap[v.productId]?.reasonCode),
    );
  }, [varianceRows, reasonsMap]);

  // Action handlers
  const handleStart = async () => {
    await startMut.mutateAsync(undefined);
    setViewState('counting');
  };

  const handleCountChange = (
    productId: number,
    expectedQty: number,
    countedQty: number,
  ) => {
    if (!activeSession) return;
    upsertMut.mutate({
      sessionId: activeSession.id,
      productId,
      expectedQty,
      countedQty,
    });
  };

  const handleAbandon = () => {
    if (!activeSession) return;
    Alert.alert(t('abandonTitle'), '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: t('abandonConfirm'),
        style: 'destructive',
        onPress: () => abandonMut.mutate(activeSession.id),
      },
    ]);
  };

  const handleCommit = async () => {
    if (!activeSession || !allVariancesHaveReasons) return;
    await commitMut.mutateAsync({
      sessionId: activeSession.id,
      reasonPerLine: reasonsMap,
    });
  };

  // Loading state — render skeleton while the active session query is in flight.
  if (loadingSession) {
    return <StocktakeSkeleton />;
  }

  // State branch 1: Idle
  if (!activeSession) {
    const lastSession =
      recentSessions.find((s) => s.status === 'completed') ?? null;
    return (
      <ScrollView
        className="flex-1 bg-paper-200 p-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <StocktakeStartCard
          lastSession={lastSession}
          onStart={handleStart}
          isStarting={startMut.isPending}
        />
        <StocktakeHistoryList sessions={recentSessions} />
      </ScrollView>
    );
  }

  // State branch 2: Variance Review
  if (viewState === 'variance') {
    return (
      <ScrollView
        className="flex-1 bg-paper-200 p-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <StocktakeVarianceSummary
          totalProducts={totalProducts}
          varianceCount={varianceRows.length}
          netVariancePesos={netVariancePesos}
        />

        {counts.map((c) => {
          const product = products.find((x) => x.id === c.productId);
          if (!product) return null;

          return (
            <StocktakeVarianceRow
              key={c.id}
              product={product}
              count={c}
              reasonCode={reasonsMap[c.productId]?.reasonCode ?? null}
              note={reasonsMap[c.productId]?.note ?? ''}
              onReasonChange={(reasonCode) => {
                setReasonsMap((prev) => ({
                  ...prev,
                  [c.productId]: {
                    reasonCode,
                    note: prev[c.productId]?.note ?? '',
                  },
                }));
              }}
              onNoteChange={(note) => {
                setReasonsMap((prev) => ({
                  ...prev,
                  [c.productId]: {
                    reasonCode: prev[c.productId]?.reasonCode ?? 'unexplained',
                    note,
                  },
                }));
              }}
            />
          );
        })}

        <View className="flex-row gap-x-3 mt-4">
          <TouchableOpacity
            onPress={() => setViewState('counting')}
            className="flex-1 bg-paper-100 border border-paper-300 py-3.5 rounded-xl items-center"
          >
            <StyledText variant="extrabold" className="text-ink-700">
              Back to Count
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCommit}
            disabled={!allVariancesHaveReasons || commitMut.isPending}
            className={`flex-1 py-3.5 rounded-xl items-center ${
              allVariancesHaveReasons ? 'bg-persimmon-500' : 'bg-paper-300'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={
                allVariancesHaveReasons ? 'text-paper-50' : 'text-ink-400'
              }
            >
              {t('commitCta')}
            </StyledText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-paper-200">
      <View className="bg-paper-50 px-4 py-3 border-b border-paper-300 flex-row items-center justify-between">
        <StyledText variant="semibold" className="text-ink-800 text-xs">
          {t('progressLabel', { counted: countedCount, total: totalProducts })}
        </StyledText>
      </View>

      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {Object.entries(categoriesMap).map(([catName, catProducts]) => (
          <StocktakeCategorySection
            key={catName}
            categoryName={catName}
            products={catProducts}
            countsMap={countsMap}
            onCountChange={handleCountChange}
          />
        ))}
      </ScrollView>

      {/* Footer controls */}
      <View className="bg-paper-50 p-4 border-t border-paper-300 flex-row gap-x-3">
        <TouchableOpacity
          onPress={handleAbandon}
          className="bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl items-center"
        >
          <StyledText variant="extrabold" className="text-rose-700 text-xs">
            {t('saveQuitCta')}
          </StyledText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setViewState('variance')}
          className="flex-1 bg-persimmon-500 py-3 rounded-xl items-center"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-sm">
            {t('finishReviewCta')}
          </StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
