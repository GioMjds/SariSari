import { View } from 'react-native';
import type { FontAwesome } from '@expo/vector-icons';
import { SearchBar } from '@/components/ui';
import { SubTabControl, type SubTabItem } from '@/components/navigation';
import { INVENTORY_SUB_TABS, InventorySubTab } from '@/constants/tabs';
import { InventoryAlertPills } from './InventoryAlertPills';
import { useInventoryOverview } from '@/hooks/useInventoryOverview';

export interface InventoryHeaderProps {
  active: InventorySubTab;
  search: string;
  onSearchChange: (s: string) => void;
  onOpenScanner: () => void;
  onTabChange: (t: InventorySubTab) => void;
  onPillPress: (kind: 'low' | 'out' | 'near_expiry' | 'overstock') => void;
}

type InventoryTabMeta = {
  icon: keyof typeof FontAwesome.glyphMap;
  label: string;
};

const INVENTORY_TAB_META = {
  products: { icon: 'cube', label: 'PRODUCTS' },
  stock: { icon: 'archive', label: 'STOCK' },
  movements: { icon: 'exchange', label: 'MOVEMENTS' },
  analytics: { icon: 'line-chart', label: 'ANALYTICS' },
  stocktake: { icon: 'check-square', label: 'STOCKTAKE' },
} satisfies Record<InventorySubTab, InventoryTabMeta>;

export function InventoryHeader(props: InventoryHeaderProps) {
  const overview = useInventoryOverview();
  const tabs = INVENTORY_SUB_TABS.map((t) => ({
    key: t,
    label: INVENTORY_TAB_META[t].label,
    icon: INVENTORY_TAB_META[t].icon,
  })) satisfies SubTabItem<InventorySubTab>[];

  return (
    <View className="bg-paper-200 px-4 pt-1 pb-2 gap-y-2">
      <SubTabControl
        tabs={tabs}
        activeTab={props.active}
        onTabPress={(k) => props.onTabChange(k as InventorySubTab)}
      />
      <SearchBar
        value={props.search}
        onChange={props.onSearchChange}
        placeholder="Search products..."
      />

      <InventoryAlertPills
        counts={overview.counts}
        onPress={props.onPillPress}
      />
    </View>
  );
}
