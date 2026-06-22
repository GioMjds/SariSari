import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';

interface FilterChipsProps {
  filters: { lowStock: boolean; outOfStock: boolean };
  onChange: (next: { lowStock: boolean; outOfStock: boolean }) => void;
  onOpenMore: () => void;
}

const CHIP_BASE = 'mr-2 px-4 py-2 rounded-pill border flex-row items-center';
const CHIP_INACTIVE = 'bg-paper-50 border-ink-200';

const CHIP_SHADOW = {
  shadowColor: '#564E45',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
};

export const FilterChips = React.memo(function FilterChips({
  filters,
  onChange,
  onOpenMore,
}: FilterChipsProps) {
  const hasActive = filters.lowStock || filters.outOfStock;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 360, delay: 160 }}
    >
      <View className="mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            alignItems: 'center',
          }}
          style={{ flexGrow: 0 }}
        >
          {/* Low Stock Chip */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onChange({ lowStock: !filters.lowStock, outOfStock: false })}
            className={`${CHIP_BASE} ${
              filters.lowStock
                ? 'bg-persimmon-500 border-persimmon-500'
                : CHIP_INACTIVE
            }`}
            style={filters.lowStock ? CHIP_SHADOW : undefined}
          >
            <FontAwesome
              name="exclamation-triangle"
              size={12}
              color={filters.lowStock ? '#FBF7EE' : '#E85A1F'}
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant={filters.lowStock ? 'extrabold' : 'medium'}
              className={`text-sm ${
                filters.lowStock ? 'text-paper-50' : 'text-ink-700'
              }`}
            >
              Low Stock
            </StyledText>
          </TouchableOpacity>

          {/* Out of Stock Chip */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onChange({ lowStock: false, outOfStock: !filters.outOfStock })}
            className={`${CHIP_BASE} ${
              filters.outOfStock
                ? 'bg-persimmon-500 border-persimmon-500'
                : CHIP_INACTIVE
            }`}
            style={filters.outOfStock ? CHIP_SHADOW : undefined}
          >
            <FontAwesome
              name="times-circle"
              size={12}
              color={filters.outOfStock ? '#FBF7EE' : '#A89F90'}
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant={filters.outOfStock ? 'extrabold' : 'medium'}
              className={`text-sm ${
                filters.outOfStock ? 'text-paper-50' : 'text-ink-700'
              }`}
            >
              Out of Stock
            </StyledText>
          </TouchableOpacity>

          {/* More Chip */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onOpenMore}
            className={`${CHIP_BASE} ${CHIP_INACTIVE}`}
          >
            <FontAwesome
              name="ellipsis-h"
              size={14}
              color="#564E45"
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant="medium"
              className="text-sm text-ink-700"
            >
              More
            </StyledText>
            {hasActive ? (
              <View className="ml-2 w-2 h-2 rounded-full bg-persimmon-500" />
            ) : null}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </MotiView>
  );
});

