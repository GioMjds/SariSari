import { withProf } from '@/utils/perf';
import { useState, useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/utils';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
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

function StocktakeScreen() {
  const { t } = useTranslation('stocktake');
  const [viewState, setViewState] = useState<'counting' | 'variance'>(
    'counting',
  );
  const tabBarBottomOffset = useTabBarBottomOffset();

  // Queries & Mutations
  const { data: activeSession, isLoading: loadingSession } =
    useActiveStocktakeSession();
  const { data: counts = [] } = useStocktakeCounts(activeSession?.id ?? null);
  const { data: recentSessions = [] } = useRecentStocktakeSessions();
  const { getAllProductsQuery } = useProducts();
  const products = useMemo(() => {
    return getAllProductsQuery?.data ?? [];
  }, [getAllProductsQuery?.data]);

  const startMut = useStartStocktake();
  const upsertMut = useUpsertStocktakeCount();
  const commitMut = useCommitStocktake();
  const abandonMut = useAbandonStocktake();

  // Local state for variance reason selection
  const [reasonsMap, setReasonsMap] = useState<
    Record<number, { reasonCode: StocktakeReason; note: string }>
  >({});

  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

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
      const p = productsById.get(c.productId);
      const cost = p?.cost_price ?? 0;
      const delta = c.countedQty - c.expectedQty;
      sum += delta * cost;
    }
    return Math.round(sum * 100) / 100;
  }, [counts, productsById]);

  const allVariancesHaveReasons = useMemo(() => {
    return varianceRows.every((v) =>
      Boolean(reasonsMap[v.productId]?.reasonCode),
    );
  }, [varianceRows, reasonsMap]);

  // Action handlers
  const handleStart = async () => {
    try {
      await startMut.mutateAsync(undefined);
      setViewState('counting');
    } catch {
      Alert.alert(t('commitError'));
    }
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
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('abandonConfirm'),
        style: 'destructive',
        onPress: () => abandonMut.mutate(activeSession.id),
      },
    ]);
  };

  // Warn when items were skipped; they keep their current stock on commit.
  const handleFinish = () => {
    const uncounted = totalProducts - countedCount;
    if (uncounted <= 0) {
      setViewState('variance');
      return;
    }
    Alert.alert(t('uncountedTitle'), t('uncountedBody', { count: uncounted }), [
      { text: t('keepCounting'), style: 'cancel' },
      { text: t('finishReviewCta'), onPress: () => setViewState('variance') },
    ]);
  };

  const handleCommit = () => {
    if (!activeSession || !allVariancesHaveReasons) return;
    Alert.alert(
      t('commitConfirmTitle'),
      t('commitConfirmBody', { count: varianceRows.length }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('commitCta'),
          onPress: async () => {
            try {
              await commitMut.mutateAsync({
                sessionId: activeSession.id,
                reasonPerLine: reasonsMap,
              });
            } catch {
              Alert.alert(t('commitError'));
            }
          },
        },
      ],
    );
  };

  if (loadingSession) return <StocktakeSkeleton />;

  // State branch 1: Idle
  if (!activeSession) {
    const lastSession =
      recentSessions.find((s) => s.status === 'completed') ?? null;
    return (
      <KeyboardAwareScrollView
        bottomOffset={64}
        keyboardShouldPersistTaps="handled"
        className="flex-1 bg-paper-200 p-4"
        contentContainerStyle={{ paddingBottom: 40 + tabBarBottomOffset }}
      >
        <StocktakeStartCard
          lastSession={lastSession}
          onStart={handleStart}
          isStarting={startMut.isPending}
        />
        <StocktakeHistoryList sessions={recentSessions} />
      </KeyboardAwareScrollView>
    );
  }

  // State branch 2: Variance Review
  if (viewState === 'variance') {
    return (
      <KeyboardAwareScrollView
        bottomOffset={64}
        keyboardShouldPersistTaps="handled"
        className="flex-1 bg-paper-200 p-4"
        contentContainerStyle={{ paddingBottom: 40 + tabBarBottomOffset }}
      >
        <StocktakeVarianceSummary
          totalProducts={totalProducts}
          varianceCount={varianceRows.length}
          netVariancePesos={netVariancePesos}
        />

        {varianceRows.map((c) => {
          const product = productsById.get(c.productId);
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
              {t('backToCount')}
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
      </KeyboardAwareScrollView>
    );
  }

  return (
    <View
      className="flex-1 bg-paper-200"
      style={{ paddingBottom: tabBarBottomOffset }}
    >
      <View className="bg-paper-50 px-4 py-3 border-b border-paper-300 flex-row items-center justify-between">
        <StyledText variant="semibold" className="text-ink-800 text-xs">
          {t('progressLabel', { counted: countedCount, total: totalProducts })}
        </StyledText>
        <StyledText variant="regular" className="text-ink-500 text-xs flex-1 text-right ml-3">
          {t('countHint')}
        </StyledText>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={64}
        keyboardShouldPersistTaps="handled"
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
      </KeyboardAwareScrollView>

      {/* Footer controls */}
      <View className="bg-paper-50 p-4 border-t border-paper-300 flex-row gap-x-3">
        <TouchableOpacity
          onPress={handleAbandon}
          className="bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl items-center"
        >
          <StyledText variant="extrabold" className="text-rose-700 text-xs">
            {t('discardCta')}
          </StyledText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleFinish}
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

export default withProf(StocktakeScreen, 'inventory/stocktake');
