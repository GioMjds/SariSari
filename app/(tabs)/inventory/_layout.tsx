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
import { LogTransactionForm } from '@/components/inventory/ledger';
import type { InventorySubTab } from '@/constants/tabs';
import type { InventoryEventType } from '@/types/inventory.types';
import { InventoryModalsHost } from './modals';

const SUB_TAB_SEGMENTS = [
  'products',
  'stock',
  'movements',
  'analytics',
] satisfies InventorySubTab[];

function isInventorySubTab(segment: string): segment is InventorySubTab {
  return (SUB_TAB_SEGMENTS as readonly string[]).includes(segment);
}

export default function InventoryLayout() {
  const segments = useSegments();
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    q?: string;
    addCategory?: string;
    addSupplier?: string;
  }>();
  const search = searchParams.q ?? '';
  const [scannerOpen, setScannerOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [fabForm, setFabForm] = useState<{
    visible: boolean;
    type: InventoryEventType;
  }>({
    visible: false,
    type: 'adjustment',
  });

  useEffect(() => {
    if (searchParams.addCategory === 'true') {
      setCategoryOpen(true);
    }
  }, [searchParams.addCategory]);

  useEffect(() => {
    if (searchParams.addSupplier === 'true') {
      setSupplierOpen(true);
    }
  }, [searchParams.addSupplier]);

  const activeTab = useMemo<InventorySubTab>(() => {
    const last = segments[segments.length - 1] ?? '';
    return isInventorySubTab(last) ? last : 'products';
  }, [segments]);

  const lastSegment = segments[segments.length - 1] ?? '';
  const isDetail =
    segments.length > 0 &&
    lastSegment !== '(tabs)' &&
    lastSegment !== 'inventory' &&
    !isInventorySubTab(lastSegment);

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

        {!isDetail ? (
          <InventorySpeedDialFab
            onAddProduct={openAddProduct}
            onAddCategory={() => setCategoryOpen(true)}
            onAddSupplier={() => setSupplierOpen(true)}
            onScanBarcode={() => setScannerOpen(true)}
          />
        ) : null}

        <LogTransactionForm
          initialType={fabForm.type}
          visible={fabForm.visible}
          onClose={() => setFabForm({ visible: false, type: fabForm.type })}
          onSuccess={() => setFabForm({ visible: false, type: fabForm.type })}
        />
      </View>

      <InventoryModalsHost
        scannerOpen={scannerOpen}
        onCloseScanner={() => setScannerOpen(false)}
        categoryOpen={categoryOpen}
        onCloseCategory={() => {
          setCategoryOpen(false);
          if (searchParams.addCategory) {
            router.setParams({ addCategory: undefined });
          }
        }}
        supplierOpen={supplierOpen}
        onCloseSupplier={() => {
          setSupplierOpen(false);
          if (searchParams.addSupplier) {
            router.setParams({ addSupplier: undefined });
          }
        }}
      />
    </View>
  );
}
