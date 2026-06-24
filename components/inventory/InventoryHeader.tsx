import { memo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface InventoryHeaderProps {
  subtitle: string;
  onOpenGuide: () => void;
  onOpenFilter: () => void;
  onAddProduct: () => void;
  activeFilterCount: number;
}

export const InventoryHeader = memo(function InventoryHeader({
  subtitle,
  onOpenGuide,
  onOpenFilter,
  onAddProduct,
  activeFilterCount,
}: InventoryHeaderProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 320 }}
    >
      <View className="bg-cinnamon-500 px-5 pt-5 pb-6">
        {/* Monogram dot and Eyebrow */}
        <View className="flex-row items-center mb-3">
          <View
            className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2"
            style={{
              shadowColor: '#564E45',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <StyledText
              variant="black"
              className="text-paper-50 text-xl font-extrabold"
            >
              ₱
            </StyledText>
          </View>
          <StyledText
            variant="extrabold"
            className="text-label text-paper-200 opacity-80"
            style={{ letterSpacing: 1.4 }}
          >
            STOCK HOME
          </StyledText>
        </View>

        {/* Title and Subtitle + Buttons Row */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <StyledText
              variant="extrabold"
              className="text-h1 text-paper-50"
              style={{ letterSpacing: -0.28 }}
            >
              Stock
            </StyledText>
            <StyledText
              variant="regular"
              className="text-sm text-paper-200 opacity-90 mt-1"
            >
              {subtitle}
            </StyledText>
          </View>

          {/* Action buttons on the right */}
          <View className="flex-row gap-2 items-center">
            {/* Filter sliders button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenFilter}
              className="relative w-11 h-11 rounded-full items-center justify-center bg-paper-50/15"
            >
              <FontAwesome name="sliders" size={18} color="#FBF7EE" />
              {activeFilterCount > 0 && (
                <View className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-persimmon-500 items-center justify-center border-2 border-cinnamon-500">
                  <StyledText
                    variant="black"
                    className="text-paper-50 text-[10px] font-extrabold"
                  >
                    {activeFilterCount}
                  </StyledText>
                </View>
              )}
            </TouchableOpacity>

            {/* Guide question-circle button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenGuide}
              className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15"
            >
              <FontAwesome name="question-circle" size={18} color="#FBF7EE" />
            </TouchableOpacity>

            {/* Plus add-product button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onAddProduct}
              className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15"
            >
              <FontAwesome name="plus" size={18} color="#FBF7EE" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </MotiView>
  );
});

