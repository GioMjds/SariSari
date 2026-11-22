import { withProf } from '@/utils/perf';
import { useEffect, useMemo, useState } from 'react';
import { SectionList, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/utils';
import { StyledText } from '@/components/elements';
import {
  useAbandonStocktake,
  useStocktakeCounts,
  useStocktakeSession,
  useUpsertStocktakeCount,
} from '@/hooks/useStocktake';
import { useProducts } from '@/hooks/useProducts';
import {
  StocktakeCategoryHeader,
  StocktakeClosedState,
  StocktakeCountRow,
  StocktakeScreenHeader,
  StocktakeSkeleton,
} from '@/components/inventory/stocktake';
import type { StocktakeCount } from '@/types/stocktake.types';

function StocktakeCountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('stocktake');

  const { data: session, isLoading } = useStocktakeSession(id ?? null);
  const { data: counts = [] } = useStocktakeCounts(id ?? null);
  const { getAllProductsQuery } = useProducts();
  const products = useMemo(
    () => getAllProductsQuery?.data ?? [],
    [getAllProductsQuery?.data],
  );
  const upsertMut = useUpsertStocktakeCount();
  const abandonMut = useAbandonStocktake();

  const countsMap = useMemo(() => {
    const map: Record<number, StocktakeCount> = {};
    for (const c of counts) map[c.productId] = c;
    return map;
  }, [counts]);

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

  const totalProducts = products.length;
  const countedCount = Object.keys(countsMap).length;
  const progressPct =
    totalProducts > 0 ? Math.round((countedCount / totalProducts) * 100) : 0;

  if (isLoading) return <StocktakeSkeleton />;
  if (!session || session.status !== 'in_progress' || !id) {
    return <StocktakeClosedState />;
  }

  const review = () => router.push(`/(edit-forms)/stocktake/${id}/review` as Href);

  const handleAbandon = () =>
    Alert.alert(t('abandonTitle'), '', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('abandonConfirm'),
        style: 'destructive',
        onPress: () => abandonMut.mutate(id, { onSuccess: () => router.back() }),
      },
    ]);

  // Warn when items were skipped; they keep their current stock on commit.
  const handleFinish = () => {
    const uncounted = totalProducts - countedCount;
    if (uncounted <= 0) return review();
    Alert.alert(t('uncountedTitle'), t('uncountedBody', { count: uncounted }), [
      { text: t('keepCounting'), style: 'cancel' },
      { text: t('finishReviewCta'), onPress: review },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-paper-200" edges={['top']}>
      <StocktakeScreenHeader title={t('countTitle')} step={t('stepOfTwo', { step: 1 })}>
        <View className="gap-y-2">
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
      </StocktakeScreenHeader>

      <SectionList
        sections={sections}
        keyExtractor={(p) => String(p.id)}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        renderScrollComponent={(props) => (
          <KeyboardAwareScrollView {...props} bottomOffset={64} />
        )}
        contentContainerStyle={{ padding: 16 }}
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
                onCountChange={(qty) =>
                  upsertMut.mutate({
                    sessionId: id,
                    productId: item.id,
                    expectedQty: expected,
                    countedQty: qty,
                  })
                }
              />
            </View>
          );
        }}
      />

      <View
        className="bg-paper-50 px-4 pt-3 border-t border-paper-300 flex-row gap-x-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
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
          className="flex-1 min-h-[48px] bg-persimmon-500 rounded-xl flex-row items-center justify-center gap-x-2 active:bg-persimmon-600"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-base">
            {t('finishReviewCta')}
          </StyledText>
          <FontAwesome name="arrow-right" size={14} color="#FAFAF7" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default withProf(StocktakeCountScreen, 'stocktake/count');
