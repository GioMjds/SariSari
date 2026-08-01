import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Href,
  Stack,
  useLocalSearchParams,
  useRouter,
  useSegments,
} from 'expo-router';
import { TopTabs } from '@/components/navigation';
import { InventoryHeader, InventorySpeedDialFab } from '@/components/inventory';
import {
  ReceiveStockModal,
  AdjustStockModal,
} from '@/components/inventory/modals/';
import { BarcodeScannerModal } from '@/components/ui';
import type { InventorySubTab } from '@/constants/tabs';
import { useRestockSignal } from '@/stores/useInventorySelection';

const SUB_TAB_SEGMENTS = [
  'products',
  'stock',
  'movements',
  'analytics',
] satisfies InventorySubTab[];

export default function InventoryLayout() {
  const segments = useSegments();
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ q?: string }>();
  const search = searchParams.q as string;

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const restock = useRestockSignal();

  const activeTab = useMemo<InventorySubTab>(() => {
    const last = String(segments[segments.length - 1] ?? '') as InventorySubTab;
    return SUB_TAB_SEGMENTS.includes(last) ? last : 'products';
  }, [segments]);

  const lastSegment = String(segments[segments.length - 1] ?? '');
  const isDetail =
    segments.length > 0 &&
    lastSegment !== '(tabs)' &&
    lastSegment !== 'inventory' &&
    !SUB_TAB_SEGMENTS.includes(lastSegment as InventorySubTab);

  const handleTabChange = useCallback(
    (t: InventorySubTab) => {
      router.push(`/(tabs)/inventory/${t}` as Href);
    },
    [router],
  );

  const handleSearchChange = useCallback(
    (next: string) => {
      router.setParams({ q: next });
    },
    [router],
  );

  const handlePillPress = useCallback(
    (kind: 'low' | 'out' | 'near_expiry' | 'overstock') => {
      router.push({ pathname: '/inventory/stock', params: { filter: kind } });
    },
    [router],
  );

  const openAddProduct = useCallback(() => {
    router.push('/(edit-forms)/add-product' as Href);
  }, [router]);

  useEffect(() => {
    if (restock.restockProductId !== null) {
      setReceiveOpen(true);
    }
  }, [restock.restockProductId]);

  return (
    <View className="flex-1 bg-paper-200">
      <Stack.Screen options={{ headerShown: false }} />
      {!isDetail ? (
        <InventoryHeader
          active={activeTab}
          search={search}
          onSearchChange={handleSearchChange}
          onOpenScanner={() => setScannerOpen(true)}
          onTabChange={handleTabChange}
          onPillPress={handlePillPress}
        />
      ) : null}

      <View className="flex-1 bg-paper-200 relative">
        <TopTabs
          initialRouteName="products"
          screenOptions={{
            swipeEnabled: true,
            lazy: true,
            lazyPreloadDistance: 0,
            tabBarStyle: { display: 'none' },
          }}
        >
          <TopTabs.Screen name="products" />
          <TopTabs.Screen name="stock" />
          <TopTabs.Screen name="movements" />
          <TopTabs.Screen name="analytics" />
        </TopTabs>
      </View>

      {!isDetail ? (
        <InventorySpeedDialFab
          onAddProduct={openAddProduct}
          onReceiveStock={() => setReceiveOpen(true)}
          onStockAdjustment={() => setAdjustOpen(true)}
          onScanBarcode={() => setScannerOpen(true)}
        />
      ) : null}

      <ReceiveStockModal
        visible={receiveOpen}
        onClose={() => {
          setReceiveOpen(false);
          restock.clearRestock();
        }}
      />
      <AdjustStockModal
        visible={adjustOpen}
        onClose={() => setAdjustOpen(false)}
      />
      <BarcodeScannerModal
        mode="single"
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={() => setScannerOpen(false)}
      />
    </View>
  );
}
