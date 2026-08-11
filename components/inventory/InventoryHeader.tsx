import { View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
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
  progress?: SharedValue<number>;
}

type InventoryTabMeta = {
  label: string;
};

const INVENTORY_TAB_META = {
  products: { label: 'PRODUCTS' },
  movements: { label: 'MOVEMENTS' },
  damaged: { label: 'DAMAGED' },
  stocktake: { label: 'STOCKTAKE' },
  recommendations: { label: 'RECOMMENDATIONS' },
} satisfies Record<InventorySubTab, InventoryTabMeta>;

export function InventoryHeader(props: InventoryHeaderProps) {
  const overview = useInventoryOverview();
  const { progress } = props;
  const tabs = INVENTORY_SUB_TABS.map((t) => ({
    key: t,
    label: INVENTORY_TAB_META[t].label,
  })) satisfies SubTabItem<InventorySubTab>[];

  return (
    <View className="bg-paper-200 px-4 pt-1 pb-2 gap-y-2">
      <SubTabControl
        tabs={tabs}
        activeTab={props.active}
        onTabPress={(k) => props.onTabChange(k as InventorySubTab)}
        {...(progress ? { progress } : {})}
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
