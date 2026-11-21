import { memo } from 'react';
import { ScrollView, View } from 'react-native';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
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
}

export const LedgerToolbar = memo(function LedgerToolbar({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  counts,
}: LedgerToolbarProps) {
  const { t } = useTranslation('inventory');
  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 220 }}
    >
      <View className="px-4 pt-4 pb-2">
        <StyledText variant="regular" className="text-ink-600 text-xs mb-2">
          {t('movementsSubtitle')} {t('movementsLegend')}
        </StyledText>
        <TabGuide
          guideId="movements"
          steps={[t('movementsGuide1'), t('movementsGuide2'), t('movementsGuide3')]}
        />
        <View className="bg-paper-50 border border-ink-200 rounded-2xl shadow-paper overflow-hidden">
          <View className="px-3 pt-3 pb-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search notes or dates…"
              accessibilityLabel="Search ledger entries"
              debounceMs={200}
            />
          </View>

          <View className="px-2 pb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 6,
                paddingVertical: 6,
                alignItems: 'center',
                gap: 2,
              }}
              className="bg-paper-200 rounded-xl"
              style={{ flexGrow: 0 }}
            >
              <Chip
                label={t('movementFilterAll')}
                count={
                  (counts.restock ?? 0) +
                  (counts.damaged ?? 0) +
                  (counts.adjustment ?? 0)
                }
                active={selectedType === 'all'}
                onPress={() => setSelectedType('all')}
                accessibilityLabel="Show all ledger entries"
              />
              <Chip
                label={t('movementFilterRestock')}
                count={counts.restock ?? 0}
                active={selectedType === 'restock'}
                onPress={() => setSelectedType('restock')}
                accessibilityLabel="Show only restock entries"
              />
              <Chip
                label={t('movementFilterDamaged')}
                count={counts.damaged ?? 0}
                active={selectedType === 'damaged'}
                onPress={() => setSelectedType('damaged')}
                accessibilityLabel="Show only damaged entries"
              />
              <Chip
                label={t('movementFilterAdjust')}
                count={counts.adjustment ?? 0}
                active={selectedType === 'adjustment'}
                onPress={() => setSelectedType('adjustment')}
                accessibilityLabel="Show only adjustment entries"
              />
            </ScrollView>
          </View>
        </View>
      </View>
    </MotiView>
  );
});
