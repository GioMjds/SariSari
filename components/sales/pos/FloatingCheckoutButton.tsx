import React, { memo, useCallback, useMemo } from 'react';
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

const ICON_COLOR = '#FFFFFF';
const SPRING_CONFIG = { damping: 15, stiffness: 300 };

export interface FloatingCheckoutButtonProps {
  itemCount: number;
  total?: number;
  onPress: () => void;
}

export const FloatingCheckoutButton = memo(function FloatingCheckoutButton({
  itemCount,
  total,
  onPress,
}: FloatingCheckoutButtonProps) {
  const tabBarBottomOffset = useTabBarBottomOffset();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }, [onPress]);

  const containerStyle = useMemo(
    () => [
      {
        position: 'absolute' as const,
        bottom: tabBarBottomOffset + 8,
        left: 16,
        right: 16,
        zIndex: 50,
      },
      animatedStyle,
    ],
    [tabBarBottomOffset, animatedStyle],
  );

  if (itemCount === 0) {
    return null;
  }

  const formattedTotal = typeof total === 'number' ? formatPesos(total) : null;
  const accessibilityLabelText = `Checkout, ${itemCount} ${
    itemCount === 1 ? 'item' : 'items'
  }${formattedTotal ? `, total ${formattedTotal}` : ''}`;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabelText}
      accessibilityHint="Double tap to review items in cart and complete sale"
      style={containerStyle}
      className="min-h-[52px] rounded-2xl bg-cinnamon-500 shadow-raised px-4 py-3 flex-row items-center justify-between"
    >
      {/* Left Badge: total item count */}
      <View className="bg-white/25 border border-white/20 px-2.5 py-1 rounded-full flex-row items-center space-x-1.5 shrink-0">
        <FontAwesome name="shopping-basket" size={12} color={ICON_COLOR} />
        <StyledText
          variant="extrabold"
          className="text-white text-xs"
          numberOfLines={1}
        >
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </StyledText>
      </View>

      {/* Center CTA */}
      <View className="px-2 shrink items-center justify-center">
        <StyledText
          variant="extrabold"
          className="text-white text-base text-center"
          numberOfLines={1}
        >
          Checkout
        </StyledText>
      </View>

      {/* Right Section: total price display & chevron-right */}
      <View className="flex-row items-center space-x-2 shrink-0">
        {formattedTotal && (
          <StyledText
            variant="extrabold"
            className="text-white text-base"
            numberOfLines={1}
          >
            {formattedTotal}
          </StyledText>
        )}
        <FontAwesome name="chevron-right" size={14} color={ICON_COLOR} />
      </View>
    </AnimatedPressable>
  );
});

FloatingCheckoutButton.displayName = 'FloatingCheckoutButton';

