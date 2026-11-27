import { memo } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TabGuide } from '../TabGuide';
import { SearchBar } from '@/components/ui';
import { InventoryEventType } from '@/types/inventory.types';
import { Chip } from './Chip';
import { LedgerTypeFilter } from './types';

interface LedgerToolbarProps {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  selectedType: LedgerTypeFilter;
  setSelectedType: (t: LedgerTypeFilter) => void;
  counts: Partial<Record<InventoryEventType, number>>;
  /** Movements renders the guide inside its list so it scrolls away; defaults to true. */
  showGuide?: boolean;
}

const CHIP_ROW_STYLE = { paddingHorizontal: 16, gap: 8 } as const;

export const LedgerToolbar = memo(function LedgerToolbar({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  counts,
  showGuide = true,
}: LedgerToolbarProps) {
  const { t } = useTranslation('inventory');
  const filters: { type: LedgerTypeFilter; label: string; count: number }[] = [
    {
      type: 'all',
      label: t('movementFilterAll'),
      count:
        (counts.restock ?? 0) +
        (counts.sale ?? 0) +
        (counts.damaged ?? 0) +
        (counts.adjustment ?? 0),
    },
    { type: 'restock', label: t('movementFilterRestock'), count: counts.restock ?? 0 },
    { type: 'sale', label: t('movementFilterSale'), count: counts.sale ?? 0 },
    { type: 'damaged', label: t('movementFilterDamaged'), count: counts.damaged ?? 0 },
    { type: 'adjustment', label: t('movementFilterAdjust'), count: counts.adjustment ?? 0 },
  ];

  return (
    <View className="pt-4 pb-1">
      <View className="px-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('movementsSearch')}
          accessibilityLabel={t('movementsSearch')}
          debounceMs={200}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={CHIP_ROW_STYLE}
        style={{ flexGrow: 0, marginTop: 10 }}
      >
        {filters.map((f) => (
          <Chip
            key={f.type}
            label={f.label}
            count={f.count}
            active={selectedType === f.type}
            onPress={() => setSelectedType(f.type)}
            accessibilityLabel={t('ledgerFilterA11y', { label: f.label, count: f.count })}
          />
        ))}
      </ScrollView>
      {showGuide && <MovementsGuide />}
    </View>
  );
});

export function MovementsGuide() {
  const { t } = useTranslation('inventory');
  return (
    <View className="px-4">
      <TabGuide
        guideId="movements"
        steps={[t('movementsGuide1'), t('movementsGuide2'), t('movementsGuide3')]}
      />
    </View>
  );
}
