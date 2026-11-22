import { withProf } from '@/utils/perf';
import { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/utils';
import { StyledText } from '@/components/elements';
import { useToastStore, useStocktakeReasons, type StocktakeReasonLine } from '@/stores';
import {
  useCommitStocktake,
  useStocktakeCounts,
  useStocktakeSession,
} from '@/hooks/useStocktake';
import { useProducts } from '@/hooks/useProducts';
import {
  StocktakeClosedState,
  StocktakeScreenHeader,
  StocktakeSkeleton,
  StocktakeVarianceRow,
  StocktakeVarianceSummary,
} from '@/components/inventory/stocktake';

const HUB = '/(tabs)/inventory/stocktake' as Href;
const NO_REASONS: Record<number, StocktakeReasonLine> = {};

function StocktakeReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('stocktake');
  const addToast = useToastStore((s) => s.addToast);

  const { data: session, isLoading } = useStocktakeSession(id ?? null);
  const { data: counts = [] } = useStocktakeCounts(id ?? null);
  const { getAllProductsQuery } = useProducts();
  const commitMut = useCommitStocktake();
  const reasonsMap = useStocktakeReasons((s) =>
    s.sessionId === id ? s.reasons : NO_REASONS,
  );
  const setLine = useStocktakeReasons((s) => s.setLine);

  const productsById = useMemo(
    () => new Map((getAllProductsQuery?.data ?? []).map((p) => [p.id, p])),
    [getAllProductsQuery?.data],
  );
  const totalProducts = productsById.size;

  const varianceRows = useMemo(
    () => counts.filter((c) => c.countedQty !== c.expectedQty),
    [counts],
  );

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
  const allVariancesHaveReasons = reasonsPicked === varianceRows.length;

  if (isLoading) return <StocktakeSkeleton />;
  // Skip the closed state right after commit so it does not flash during the exit.
  if (!id || (!commitMut.isSuccess && session?.status !== 'in_progress')) {
    return <StocktakeClosedState />;
  }

  const handleCommit = () => {
    if (!allVariancesHaveReasons) return;
    Alert.alert(
      t('commitConfirmTitle'),
      t('commitConfirmBody', { count: varianceRows.length }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('commitCta'),
          onPress: async () => {
            try {
              await commitMut.mutateAsync({ sessionId: id, reasonPerLine: reasonsMap });
              addToast({ message: t('commitSuccess'), variant: 'success' });
              router.dismissTo(HUB);
            } catch {
              Alert.alert(t('commitError'));
            }
          },
        },
      ],
    );
  };

  const commitDisabled = !allVariancesHaveReasons || commitMut.isPending;

  return (
    <SafeAreaView className="flex-1 bg-paper-200" edges={['top']}>
      <StocktakeScreenHeader title={t('varianceReview')} step={t('stepOfTwo', { step: 2 })} />

      <KeyboardAwareScrollView
        bottomOffset={64}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
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
              onReasonChange={(reasonCode) => setLine(id, c.productId, { reasonCode })}
              onNoteChange={(note) => setLine(id, c.productId, { note })}
            />
          );
        })}
      </KeyboardAwareScrollView>

      <View
        className="bg-paper-50 px-4 pt-3 border-t border-paper-300 gap-y-2"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        {!allVariancesHaveReasons ? (
          <StyledText
            variant="semibold"
            accessibilityLiveRegion="polite"
            className="text-persimmon-700 text-sm"
          >
            {t('commitDisabledReason')}
          </StyledText>
        ) : null}
        <View className="flex-row gap-x-3">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            className="flex-1 min-h-[48px] bg-paper-100 border border-paper-300 rounded-xl items-center justify-center"
          >
            <StyledText variant="extrabold" className="text-ink-700">
              {t('backToCount')}
            </StyledText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCommit}
            disabled={commitDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: commitDisabled, busy: commitMut.isPending }}
            className={`flex-1 min-h-[48px] rounded-xl items-center justify-center ${
              allVariancesHaveReasons ? 'bg-persimmon-500 active:bg-persimmon-600' : 'bg-paper-300'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={allVariancesHaveReasons ? 'text-paper-50' : 'text-ink-600'}
            >
              {t('commitCta')}
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default withProf(StocktakeReviewScreen, 'stocktake/review');
