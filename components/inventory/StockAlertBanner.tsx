import React from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface StockAlertBannerProps {
  lowStockCount: number;
  outOfStockCount: number;
  onTap: () => void;
  activeFilter?: 'all' | 'low' | 'out';
  onClearFilter?: () => void;
}

export const StockAlertBanner = React.memo(function StockAlertBanner({
  lowStockCount,
  outOfStockCount,
  onTap,
  activeFilter = 'all',
  onClearFilter,
}: StockAlertBannerProps) {
  if (lowStockCount + outOfStockCount === 0) return null;

  const total = lowStockCount + outOfStockCount;
  const isFiltered = activeFilter !== 'all';

  const formatCount = (count: number, label: string) => {
    if (count > 9) return `9+ ${label}`;
    return `${count} ${label}`;
  };

  const lowStockText = formatCount(lowStockCount, 'low stock');
  const outOfStockText = formatCount(outOfStockCount, 'out of stock');

  const accessibilityLabel = `${total} ${total === 1 ? 'item needs' : 'items need'} attention: ${lowStockText}, ${outOfStockText}. Tap to view.`;

  return (
    <View className="bg-cinnamon-500 pb-4">
      <Pressable
        onPress={onTap}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
          className="mx-4 rounded-2xl p-4 flex-row items-center gap-3 bg-cinnamon-700"
          style={{ borderLeftWidth: 4, borderLeftColor: '#E85A1F' }}
        >
          {/* Left: 40x40 icon circular container */}
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(232, 90, 31, 0.2)' }}
          >
            <FontAwesome
              name="exclamation-triangle"
              size={16}
              color="#E85A1F"
            />
          </View>

          {/* Middle: Content */}
          <View className="flex-1">
            <StyledText
              variant="extrabold"
              className="label-caps text-persimmon-400 mb-0.5"
            >
              Attention
            </StyledText>
            <StyledText variant="semibold" className="text-h3 text-paper-50">
              {total} {total === 1 ? 'item needs' : 'items need'} attention
            </StyledText>
            <StyledText
              variant="regular"
              className="text-caption text-paper-200 opacity-80 mt-0.5"
            >
              {lowStockText} · {outOfStockText}
            </StyledText>
          </View>

          {/* Right: Chevron */}
          <View className="w-8 h-8 items-center justify-center">
            <FontAwesome
              name="chevron-right"
              size={14}
              color="#FBF7EE"
              style={{ opacity: 0.6 }}
            />
          </View>
        </MotiView>
      </Pressable>

      {isFiltered && (
        <MotiView
          from={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 20 }}
          transition={{ type: 'timing', duration: 200 }}
          className="mx-4 mt-2 flex-row items-center"
        >
          <StyledText
            variant="medium"
            className="text-caption text-paper-200 opacity-80"
          >
            Showing: needs attention ·{' '}
          </StyledText>
          <TouchableOpacity onPress={onClearFilter} activeOpacity={0.7}>
            <StyledText
              variant="extrabold"
              className="text-caption text-persimmon-300"
            >
              × clear
            </StyledText>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
});
