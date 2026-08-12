import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Href, useRouter, useSegments } from 'expo-router';
import { SubTabScreenShell } from '@/components/layout/SubTabScreenShell';
import { TopTabs } from '@/components/navigation';
import { InventorySpeedDialFab } from '@/components/inventory';
import { LogTransactionForm } from '@/components/inventory/ledger';
import { INVENTORY_SUB_TABS, type InventorySubTab } from '@/constants/tabs';
import { useTabProgress } from '@/hooks';
import type { InventoryEventType } from '@/types/inventory.types';
import { InventoryModalsHost } from './modals';

const SUB_TAB_SEGMENTS = [
  'products',
  'movements',
  'stocktake',
  'damaged',
  'recommendations',
] satisfies InventorySubTab[];

const INVENTORY_TAB_DEFS = [
  { key: 'products', label: 'PRODUCTS' },
  { key: 'movements', label: 'MOVEMENTS' },
  { key: 'stocktake', label: 'STOCKTAKE' },
  { key: 'damaged', label: 'DAMAGED' },
  { key: 'recommendations', label: 'RECOMMENDATIONS' },
] satisfies { key: InventorySubTab; label: string }[];

function isInventorySubTab(segment: string): segment is InventorySubTab {
  return (SUB_TAB_SEGMENTS as readonly string[]).includes(segment);
}

export default function InventoryLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [fabForm, setFabForm] = useState<{
    visible: boolean;
    type: InventoryEventType;
  }>({
    visible: false,
    type: 'adjustment',
  });

  const activeTab = useMemo<InventorySubTab>(() => {
    const last = segments[segments.length - 1] ?? '';
    return isInventorySubTab(last) ? last : 'products';
  }, [segments]);

  const progress = useTabProgress(activeTab, INVENTORY_SUB_TABS);

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

  const openAddProduct = useCallback(() => {
    router.push('/(edit-forms)/add-product' as Href);
  }, [router]);

  return (
    <SubTabScreenShell<InventorySubTab>
      tabs={INVENTORY_TAB_DEFS}
      activeTab={activeTab}
      onTabPress={handleTabChange}
      progress={progress}
    >
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
          <TopTabs.Screen name="movements" />
          <TopTabs.Screen name="stocktake" />
          <TopTabs.Screen name="damaged" />
          <TopTabs.Screen name="recommendations" />
        </TopTabs>

        {!isDetail ? (
          <InventorySpeedDialFab
            onAddProduct={openAddProduct}
            onAddCategory={() =>
              router.push('/(edit-forms)/add-category' as Href)
            }
            onAddSupplier={() =>
              router.push('/(edit-forms)/add-supplier' as Href)
            }
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
      />
    </SubTabScreenShell>
  );
}
