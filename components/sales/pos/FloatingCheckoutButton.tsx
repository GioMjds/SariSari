import React from 'react';
import { Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface FloatingCheckoutButtonProps {
  itemCount: number;
  onPress: () => void;
}

export function FloatingCheckoutButton({
  itemCount,
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
    scale.value = withSpring(0.95);
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
      accessibilityLabel="Open checkout"
      style={[
        {
          position: 'absolute',
          bottom: tabBarBottomOffset + 16,
          right: 16,
          zIndex: 50,
        },
        animatedStyle,
      ]}
      className="w-14 h-14 rounded-full bg-persimmon-500 items-center justify-center shadow-persimmon-glow"
    >
      <MaterialIcons name="shopping-cart" size={24} color="#FFFFFF" />

      {/* Quantity badge */}
      <View className="absolute -top-1.5 -right-1.5 bg-paper-50 border border-persimmon-500 rounded-full min-w-[20px] h-[20px] px-1 items-center justify-center">
        <StyledText
          variant="extrabold"
          className="text-persimmon-600 text-[10px]"
        >
          {itemCount}
        </StyledText>
      </View>
    </AnimatedPressable>
  );
}
