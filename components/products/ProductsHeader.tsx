import { memo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface ProductsHeaderProps {
  productCount: number;
  lowCount: number;
  outCount: number;
  onSettingsPress?: () => void;
}

export const ProductsHeader = memo(function ProductsHeader({
  productCount,
  lowCount,
  outCount,
  onSettingsPress,
}: ProductsHeaderProps) {
  const subtitle = `${productCount} products · ${lowCount} low · ${outCount} out`;

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
              className="text-paper-50 text-sm font-extrabold"
            >
              ₱
            </StyledText>
          </View>
          <StyledText
            variant="extrabold"
            className="text-label text-paper-200 opacity-80 text-[10px]"
            style={{ letterSpacing: 1.4 }}
          >
            CATALOG
          </StyledText>
        </View>

        {/* Title and Subtitle + Buttons Row */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <StyledText
              variant="extrabold"
              className="text-h1 text-paper-50 text-3xl"
              style={{ letterSpacing: -0.28 }}
            >
              Your Products
            </StyledText>
            <StyledText
              variant="regular"
              className="text-sm text-paper-200 opacity-90 mt-1"
            >
              {subtitle}
            </StyledText>
          </View>

          {/* Settings button on the right */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSettingsPress}
            className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15"
          >
            <FontAwesome name="cog" size={18} color="#FBF7EE" />
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
});
