import React from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { formatPesos } from '@/lib';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface FloatingCheckoutButtonProps {
  itemCount: number;
  total?: number;
  onPress: () => void;
}

export function FloatingCheckoutButton({
  itemCount,
  total,
  onPress,
}: FloatingCheckoutButtonProps) {
  const tabBarBottomOffset = useTabBarBottomOffset();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (itemCount === 0) {
    return null;
  }

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Review Cart, ${itemCount} items${typeof total === 'number' ? `, total ${formatPesos(total)}` : ''}`}
      style={[
        {
          position: 'absolute',
          bottom: tabBarBottomOffset + 8,
          left: 0,
          right: 0,
          zIndex: 50,
        },
        animatedStyle,
      ]}
      className="mx-4 mb-2 min-h-[52px] rounded-3xl bg-cinnamon-500 shadow-lg shadow-cinnamon-500/25 px-4 py-3 flex-row items-center justify-between active:scale-[0.98]"
    >
      {/* Left Badge: total item count */}
      <View className="bg-white/20 px-2.5 py-1 rounded-full flex-row items-center space-x-1.5">
        <FontAwesome name="shopping-basket" size={12} color="#FFFFFF" />
        <StyledText variant="bold" className="text-white text-xs">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </StyledText>
      </View>

      {/* Center CTA */}
      <StyledText variant="bold" className="text-white text-base">
        Review Cart
      </StyledText>

      {/* Right Section: total price display & chevron-right */}
      <View className="flex-row items-center space-x-2">
        {typeof total === 'number' && (
          <StyledText variant="extrabold" className="text-white text-base">
            {formatPesos(total)}
          </StyledText>
        )}
        <FontAwesome name="chevron-right" size={14} color="#FFFFFF" />
      </View>
    </AnimatedPressable>
  );
}

