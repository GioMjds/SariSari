import { withProf } from '@/utils/perf';
import { useEffect, useState, useMemo } from 'react';
import { SectionList, View, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { useFabClearance } from '@/components/inventory/InventorySpeedDialFab';
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
  StocktakeCategoryHeader,
  StocktakeCountRow,
  StocktakeVarianceSummary,
  StocktakeVarianceRow,
  StocktakeSkeleton,
} from '@/components/inventory/stocktake';
import type { StocktakeReason } from '@/configs/stocktakeReasons';
import type { StocktakeCount } from '@/types/stocktake.types';

function StocktakeScreen() {
  const { t } = useTranslation('stocktake');
  const [viewState, setViewState] = useState<'counting' | 'variance'>(
    'counting',
  );
  const tabBarBottomOffset = useTabBarBottomOffset();
  const fabClearance = useFabClearance();

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
      const cat = p.category || t('uncategorized');
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return map;
  }, [products, t]);

  // Only open categories feed rows into the virtualized list; null means not yet initialized.
  const [openCategories, setOpenCategories] = useState<Set<string> | null>(
    null,
  );
  useEffect(() => {
    if (openCategories || products.length === 0) return;
    const first = Object.entries(categoriesMap).find(([, items]) =>
      items.some((p) => !countsMap[p.id]),
    )?.[0];
    setOpenCategories(new Set(first ? [first] : []));
  }, [openCategories, products.length, categoriesMap, countsMap]);
  const toggleCategory = (name: string) =>
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  const sections = useMemo(
    () =>
      Object.entries(categoriesMap).map(([title, items]) => ({
        title,
        total: items.length,
        counted: items.filter((p) => countsMap[p.id]).length,
        data: openCategories?.has(title) ? items : [],
      })),
    [categoriesMap, openCategories, countsMap],
  );

  // Compute total counted and variances
  const totalProducts = products.length;
  const countedCount = Object.keys(countsMap).length;
  const progressPct =
    totalProducts > 0 ? Math.round((countedCount / totalProducts) * 100) : 0;

  const varianceRows = useMemo(() => {
    return counts.filter((c) => c.countedQty !== c.expectedQty);
  }, [counts]);

  // Short and extra are kept apart so a big loss is not hidden by a small gain.
  const { shortPesos, extraPesos, netVariancePesos } = useMemo(() => {
    let short = 0;
    let extra = 0;
    for (const c of counts) {
      const cost = productsById.get(c.productId)?.cost_price ?? 0;
      const value = (c.countedQty - c.expectedQty) * cost;
      if (value < 0) short += value;
      else extra += value;
    }
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      shortPesos: round(short),
      extraPesos: round(extra),
      netVariancePesos: round(short + extra),
    };
  }, [counts, productsById]);

  const reasonsPicked = varianceRows.filter((v) =>
    Boolean(reasonsMap[v.productId]?.reasonCode),
  ).length;

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
        contentContainerStyle={{ paddingBottom: fabClearance }}
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
        contentContainerStyle={{ paddingBottom: fabClearance }}
      >
        <StocktakeVarianceSummary
          totalProducts={totalProducts}
          varianceCount={varianceRows.length}
          reasonsPicked={reasonsPicked}
          shortPesos={shortPesos}
          extraPesos={extraPesos}
          netVariancePesos={netVariancePesos}
        />

        {varianceRows.length === 0 ? (
          <View className="items-center py-6 gap-y-1">
            <StyledText variant="extrabold" className="text-ink-900 text-lg text-center">
              {t('allMatchTitle')}
            </StyledText>
            <StyledText variant="regular" className="text-ink-700 text-sm text-center">
              {t('allMatchBody')}
            </StyledText>
          </View>
        ) : null}

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

        {!allVariancesHaveReasons ? (
          <StyledText
            variant="semibold"
            accessibilityLiveRegion="polite"
            className="text-persimmon-700 text-sm mt-2"
          >
            {t('commitDisabledReason')}
          </StyledText>
        ) : null}

        <View className="flex-row gap-x-3 mt-3">
          <TouchableOpacity
            onPress={() => setViewState('counting')}
            accessibilityRole="button"
            className="flex-1 min-h-[48px] bg-paper-100 border border-paper-300 rounded-xl items-center justify-center"
          >
            <StyledText variant="extrabold" className="text-ink-700">
              {t('backToCount')}
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCommit}
            disabled={!allVariancesHaveReasons || commitMut.isPending}
            accessibilityRole="button"
            accessibilityState={{
              disabled: !allVariancesHaveReasons || commitMut.isPending,
              busy: commitMut.isPending,
            }}
            className={`flex-1 min-h-[48px] rounded-xl items-center justify-center ${
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
      <View className="bg-paper-50 px-4 py-3 border-b border-paper-300 gap-y-2">
        <View className="flex-row items-center justify-between">
          <StyledText variant="extrabold" className="text-ink-900 text-base">
            {t('progressLabel', { counted: countedCount, total: totalProducts })}
          </StyledText>
          <StyledText variant="extrabold" className="text-sage-700 text-sm">
            {progressPct}%
          </StyledText>
        </View>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: totalProducts, now: countedCount }}
          className="h-2 rounded-full bg-paper-300 overflow-hidden"
        >
          <View
            className="h-full bg-sage-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </View>
        <View className="flex-row items-start gap-x-1.5">
          <FontAwesome name="info-circle" size={13} color="#564E45" style={{ marginTop: 2 }} />
          <StyledText variant="regular" className="text-ink-700 text-sm flex-1">
            {t('countHint')}
          </StyledText>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(p) => String(p.id)}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        renderScrollComponent={(props) => (
          <KeyboardAwareScrollView {...props} bottomOffset={64} />
        )}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: fabClearance - tabBarBottomOffset,
        }}
        renderSectionHeader={({ section }) => (
          <StocktakeCategoryHeader
            categoryName={section.title}
            productCount={section.total}
            countedCount={section.counted}
            expanded={Boolean(openCategories?.has(section.title))}
            onToggle={() => toggleCategory(section.title)}
          />
        )}
        renderItem={({ item }) => {
          const count = countsMap[item.id];
          const expected = count ? count.expectedQty : item.quantity;
          return (
            <View className="pl-1">
              <StocktakeCountRow
                product={item}
                expectedQty={expected}
                countedQty={count ? count.countedQty : null}
                onCountChange={(qty) => handleCountChange(item.id, expected, qty)}
              />
            </View>
          );
        }}
      />

      {/* Footer controls */}
      <View className="bg-paper-50 p-4 border-t border-paper-300 flex-row gap-x-3">
        <TouchableOpacity
          onPress={handleAbandon}
          accessibilityRole="button"
          className="min-h-[48px] bg-semantic-danger-50 border border-semantic-danger-100 px-4 rounded-xl items-center justify-center"
        >
          <StyledText variant="extrabold" className="text-semantic-danger text-sm">
            {t('discardCta')}
          </StyledText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleFinish}
          accessibilityRole="button"
          className="flex-1 min-h-[48px] bg-persimmon-500 rounded-xl items-center justify-center active:bg-persimmon-600"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-base">
            {t('finishReviewCta')}
          </StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default withProf(StocktakeScreen, 'inventory/stocktake');
