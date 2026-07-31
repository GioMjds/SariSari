import { View } from 'react-native';
import type { FontAwesome } from '@expo/vector-icons';
import { SearchBar } from '@/components/ui';
import { SubTabControl, type SubTabItem } from '@/components/navigation';
import { INVENTORY_SUB_TABS, InventorySubTab } from '@/constants/tabs';
import { InventoryAlertPills } from './InventoryAlertPills';
import { InventoryHeroCard } from './InventoryHeroCard';
import { useInventoryOverview } from '@/hooks/useInventoryOverview';

export interface InventoryHeaderProps {
  active: InventorySubTab;
  search: string;
  onSearchChange: (s: string) => void;
  onOpenScanner: () => void;
  onTabChange: (t: InventorySubTab) => void;
  onPillPress: (kind: 'low' | 'out' | 'near_expiry' | 'overstock') => void;
}

const INVENTORY_TAB_META: Record<
  InventorySubTab,
  { icon: keyof typeof FontAwesome.glyphMap; label: string }
> = {
  products: { icon: 'cube', label: 'PRODUCTS' },
  stock: { icon: 'archive', label: 'STOCK' },
  movements: { icon: 'exchange', label: 'MOVEMENTS' },
  analytics: { icon: 'line-chart', label: 'ANALYTICS' },
};

export function InventoryHeader(props: InventoryHeaderProps) {
  const overview = useInventoryOverview();
  const tabs = INVENTORY_SUB_TABS.map((t) => ({
    key: t,
    label: INVENTORY_TAB_META[t].label,
    icon: INVENTORY_TAB_META[t].icon,
  })) satisfies SubTabItem<InventorySubTab>[];

  return (
    <View className="bg-paper-200 px-4 pt-1 pb-3 gap-y-2">
      <SearchBar
        value={props.search}
        onChange={props.onSearchChange}
        placeholder="Search products..."
      />

      <SubTabControl
        tabs={tabs}
        activeTab={props.active}
        onTabPress={(k) => props.onTabChange(k as InventorySubTab)}
      />

      <InventoryAlertPills
        counts={overview.counts}
        onPress={props.onPillPress}
      />

      <InventoryHeroCard
        totalValue={overview.totalValue}
        productCount={overview.productCount}
        unitCount={overview.unitCount}
      />
    </View>
  );
}
