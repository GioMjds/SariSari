import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { RefreshableFlatList, SearchBar } from '@/components/ui';
import { SariMascot } from '@/components/mascot';
import { useFabClearance } from '@/components/inventory/InventorySpeedDialFab';
import { InventoryErrorState } from '@/components/inventory/InventoryErrorState';
import { useSuppliers } from '@/hooks';
import { useSupplierBalances } from '@/hooks/useSupplierPayables';
import { useAllEmptiesOwed } from '@/hooks/useSupplierEmpties';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ICON_COLOR } from '@/lib/theme';
import { buildSupplierRows, type SupplierRow } from '@/lib/supplierList';
import { SupplierActionSheet } from './SupplierActionSheet';
import { SupplierCard } from './SupplierCard';
import { SuppliersSkeleton } from './SuppliersSkeleton';

const NO_EMPTIES: ReadonlyMap<string, number> = new Map();

// Cap and center the list so rows do not stretch across a tablet window.
const CONTENT_WIDTH = {
  width: '100%',
  maxWidth: 640,
  alignSelf: 'center',
} as const;

function SuppliersTabComponent() {
  const router = useRouter();
  const { t } = useTranslation('inventory');
  const reducedMotion = useReducedMotion();
  const fabClearance = useFabClearance();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<SupplierRow | null>(null);

  const { getAllSuppliersQuery } = useSuppliers();
  const balancesQuery = useSupplierBalances();
  const emptiesQuery = useAllEmptiesOwed();

  const suppliers = getAllSuppliersQuery.data;
  const rows = useMemo(
    () =>
      buildSupplierRows(
        suppliers ?? [],
        balancesQuery.data ?? [],
        emptiesQuery.data ?? NO_EMPTIES,
        search,
      ),
    [suppliers, balancesQuery.data, emptiesQuery.data, search],
  );

  const refetchSuppliers = getAllSuppliersQuery.refetch;
  const refetchBalances = balancesQuery.refetch;
  const refetchEmpties = emptiesQuery.refetch;
  const refetchAll = useCallback(
    () =>
      Promise.all([refetchSuppliers(), refetchBalances(), refetchEmpties()]),
    [refetchSuppliers, refetchBalances, refetchEmpties],
  );
  const balancesKnown = !balancesQuery.isError && !emptiesQuery.isError;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  }, [refetchAll]);

  const openAdd = useCallback(
    () => router.push('/(edit-forms)/add-supplier' as Href),
    [router],
  );
  const openActions = useCallback((row: SupplierRow) => {
    setSelected(row);
    setSheetOpen(true);
  }, []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const go = useCallback(
    (path: string) => {
      setSheetOpen(false);
      router.push(path as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: SupplierRow; index: number }) => (
      <MotiView
        from={{
          opacity: reducedMotion ? 1 : 0,
          translateY: reducedMotion ? 0 : 10,
        }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: 'timing',
          duration: reducedMotion ? 0 : 240,
          delay: reducedMotion ? 0 : Math.min(index, 8) * 30,
        }}
      >
        <SupplierCard row={item} onPress={openActions} />
      </MotiView>
    ),
    [reducedMotion, openActions],
  );

  // Wait for all three so owed and empties badges land with the rows, not after.
  if (
    getAllSuppliersQuery.isLoading ||
    balancesQuery.isLoading ||
    emptiesQuery.isLoading
  ) {
    return <SuppliersSkeleton />;
  }

  if (getAllSuppliersQuery.isError) {
    return (
      <View style={CONTENT_WIDTH}>
        <InventoryErrorState
          title={t('supplierErrorTitle')}
          message={t('supplierErrorMessage')}
          onRetry={() => void refetchAll()}
        />
      </View>
    );
  }

  const hasSuppliers = (suppliers?.length ?? 0) > 0;

  return (
    <View className="flex-1">
      <RefreshableFlatList<SupplierRow>
        isRefreshing={refreshing}
        onRefresh={onRefresh}
        data={rows}
        keyExtractor={(item) => item.supplier.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[CONTENT_WIDTH, { paddingBottom: fabClearance }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          hasSuppliers ? (
            <View>
              {balancesKnown ? null : (
                <BalancesError onRetry={() => void refetchAll()} />
              )}
              <View className="px-4 mt-2 mb-3">
                <SearchBar
                  compact
                  value={search}
                  onChange={setSearch}
                  placeholder={t('searchSuppliersPlaceholder')}
                  accessibilityLabel={t('searchSuppliersPlaceholder')}
                  clearAccessibilityLabel={t('supplierClearSearch')}
                />
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          hasSuppliers ? (
            <NoMatches onClear={() => setSearch('')} />
          ) : (
            <SuppliersEmpty onAdd={openAdd} />
          )
        }
      />

      <SupplierActionSheet
        visible={sheetOpen}
        row={selected}
        balancesKnown={balancesKnown}
        onClose={closeSheet}
        onPayables={(r) =>
          go(`/(edit-forms)/supplier-payables/${r.supplier.id}`)
        }
        onEmpties={(r) => go(`/(edit-forms)/supplier-empties/${r.supplier.id}`)}
        onEdit={(r) => go(`/(edit-forms)/edit-supplier/${r.supplier.id}`)}
      />
    </View>
  );
}

function BalancesError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('inventory');
  return (
    <View
      accessibilityRole="alert"
      className="mx-4 mt-2 px-3 py-2 rounded-xl border border-semantic-warning bg-semantic-warning-50 flex-row items-center gap-x-3"
    >
      <StyledText
        variant="medium"
        className="flex-1 text-sm text-semantic-warning-700"
      >
        {t('supplierBalancesError')}
      </StyledText>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('errorRetry')}
        className="min-h-11 px-3 rounded-full items-center justify-center active:bg-semantic-warning-100"
      >
        <StyledText
          variant="extrabold"
          className="text-sm text-semantic-warning-700"
        >
          {t('errorRetry')}
        </StyledText>
      </Pressable>
    </View>
  );
}

function NoMatches({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation('inventory');
  return (
    <View className="items-center px-8 py-10">
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-ink-800 text-base text-center"
      >
        {t('supplierNoMatchTitle')}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm text-center mt-1"
      >
        {t('supplierNoMatchBody')}
      </StyledText>
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        className="mt-4 min-h-11 px-5 rounded-full border border-paper-400 bg-paper-50 items-center justify-center active:bg-paper-100"
      >
        <StyledText variant="extrabold" className="text-ink-700 text-sm">
          {t('supplierClearSearch')}
        </StyledText>
      </Pressable>
    </View>
  );
}

function SuppliersEmpty({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation('inventory');
  return (
    <View className="mx-4 mt-6 px-6 pt-6 pb-7 rounded-card bg-paper-50 border border-ink-100 items-center">
      <SariMascot state="inventory" size={150} defer />
      <StyledText
        variant="black"
        accessibilityRole="header"
        className="text-h2 text-ink-900 mt-3 text-center"
      >
        {t('supplierEmptyTitle')}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-body text-ink-500 mt-1.5 text-center"
      >
        {t('supplierEmptyBody')}
      </StyledText>
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={t('addSupplierA11y')}
        className="mt-5 min-h-[48px] px-6 rounded-pill bg-persimmon-600 flex-row items-center gap-x-2 active:bg-persimmon-700 press-scale"
      >
        <FontAwesome name="plus" size={13} color={ICON_COLOR.paper} />
        <StyledText variant="extrabold" className="text-paper-50 text-[15px]">
          {t('addSupplier')}
        </StyledText>
      </Pressable>
    </View>
  );
}

export const SuppliersTab = memo(SuppliersTabComponent);
