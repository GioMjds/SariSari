import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Href, useRouter, useSegments } from 'expo-router';
import { SubTabScreenShell } from '@/components/layout/SubTabScreenShell';
import { TopTabs } from '@/components/navigation';
import { InventorySpeedDialFab } from '@/components/inventory';
import { INVENTORY_SUB_TABS, type InventorySubTab } from '@/constants/tabs';
import { useTabProgress } from '@/hooks';
import { InventoryModalsHost } from '@/components/inventory/InventoryModalsHost';
import { useAddCategorySheet } from '@/stores';

const TOP_TABS_SCREEN_OPTIONS = {
  tabBarStyle: { display: 'none' as const },
  swipeEnabled: false,
  lazy: true,
  lazyPreloadDistance: 0,
  freezeOnBlur: true,
} as const;

const INVENTORY_TAB_DEFS = [
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'movements', label: 'Movements' },
  { key: 'stocktake', label: 'Stocktake' },
  { key: 'restock', label: 'Restock' },
] satisfies { key: InventorySubTab; label: string }[];

const DEFAULT_TAB = INVENTORY_SUB_TABS[0];

function isInventorySubTab(segment: string): segment is InventorySubTab {
  return (INVENTORY_SUB_TABS as readonly string[]).includes(segment);
}

export default function InventoryLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);

  const { activeTab, isDetail } = useMemo(() => {
    const idx = segments.findIndex((s) => isInventorySubTab(s));
    return {
      activeTab: idx === -1 ? DEFAULT_TAB : (segments[idx] as InventorySubTab),
      isDetail: idx !== -1 && idx < segments.length - 1,
    };
  }, [segments]);

  const progress = useTabProgress(activeTab, INVENTORY_SUB_TABS);

  const handleTabPress = useCallback(
    (tab: InventorySubTab) => {
      if (tab === activeTab) return;
      router.navigate(`/(tabs)/inventory/${tab}` as Href);
    },
    [router, activeTab],
  );

  const openAddProduct = useCallback(
    () => router.push('/(edit-forms)/add-product' as Href),
    [router],
  );
  const openAddCategory = useAddCategorySheet((s) => s.show);
  const openAddSupplier = useCallback(
    () => router.push('/(edit-forms)/add-supplier' as Href),
    [router],
  );
  const openScanner = useCallback(() => setScannerOpen(true), []);
  const closeScanner = useCallback(() => setScannerOpen(false), []);

  return (
    <SubTabScreenShell<InventorySubTab>
      tabs={INVENTORY_TAB_DEFS}
      activeTab={activeTab}
      onTabPress={handleTabPress}
      progress={progress}
    >
      <View className="flex-1 bg-paper-200 relative">
        <TopTabs
          initialRouteName={DEFAULT_TAB}
          screenOptions={TOP_TABS_SCREEN_OPTIONS}
        >
          {INVENTORY_SUB_TABS.map((name) => 
            <TopTabs.Screen key={name} name={name} />
          )}
        </TopTabs>

        {!isDetail ? (
          <InventorySpeedDialFab
            onAddProduct={openAddProduct}
            onAddCategory={openAddCategory}
            onAddSupplier={openAddSupplier}
            onScanBarcode={openScanner}
          />
        ) : null}
      </View>

      <InventoryModalsHost
        scannerOpen={scannerOpen}
        onCloseScanner={closeScanner}
      />
    </SubTabScreenShell>
  );
}
