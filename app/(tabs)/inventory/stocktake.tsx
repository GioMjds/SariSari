import { withProf } from '@/utils/perf';
import { ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/utils';
import { useFabClearance } from '@/components/inventory/InventorySpeedDialFab';
import {
  useActiveStocktakeSession,
  useStocktakeCounts,
  useRecentStocktakeSessions,
  useStartStocktake,
  useAbandonStocktake,
} from '@/hooks/useStocktake';
import { useProducts } from '@/hooks/useProducts';
import {
  StocktakeStartCard,
  StocktakeResumeCard,
  StocktakeHistoryList,
  StocktakeSkeleton,
} from '@/components/inventory/stocktake';

const countRoute = (id: string) => `/(edit-forms)/stocktake/${id}` as Href;

// Hub only: start or resume a count; counting and review live in (edit-forms)/stocktake.
function StocktakeScreen() {
  const router = useRouter();
  const { t } = useTranslation('stocktake');
  const fabClearance = useFabClearance();

  const { data: activeSession, isLoading } = useActiveStocktakeSession();
  const { data: counts = [] } = useStocktakeCounts(activeSession?.id ?? null);
  const { data: recentSessions = [] } = useRecentStocktakeSessions();
  const { getAllProductsQuery } = useProducts();
  const startMut = useStartStocktake();
  const abandonMut = useAbandonStocktake();

  const handleStart = async () => {
    try {
      const id = await startMut.mutateAsync(undefined);
      router.push(countRoute(id));
    } catch {
      Alert.alert(t('commitError'));
    }
  };

  const handleDiscard = (id: string) =>
    Alert.alert(t('abandonTitle'), '', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('abandonConfirm'),
        style: 'destructive',
        onPress: () => abandonMut.mutate(id),
      },
    ]);

  if (isLoading) return <StocktakeSkeleton />;

  const lastSession =
    recentSessions.find((s) => s.status === 'completed') ?? null;

  return (
    <ScrollView
      className="flex-1 bg-paper-200 p-4"
      contentContainerStyle={{ paddingBottom: fabClearance }}
    >
      {activeSession ? (
        <StocktakeResumeCard
          counted={counts.length}
          total={getAllProductsQuery?.data?.length ?? 0}
          startedAt={activeSession.startedAt}
          onResume={() => router.push(countRoute(activeSession.id))}
          onDiscard={() => handleDiscard(activeSession.id)}
        />
      ) : (
        <StocktakeStartCard
          lastSession={lastSession}
          onStart={handleStart}
          isStarting={startMut.isPending}
        />
      )}
      <StocktakeHistoryList
        sessions={recentSessions.filter((s) => s.status !== 'in_progress')}
      />
    </ScrollView>
  );
}

export default withProf(StocktakeScreen, 'inventory/stocktake');
