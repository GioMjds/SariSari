import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useTabBarBottomOffset } from '@/components/layout';

export interface InventorySpeedDialFabProps {
  onAddProduct: () => void;
  onReceiveStock: () => void;
  onMarkDamaged: () => void;
  onStockAdjustment: () => void;
  onScanBarcode: () => void;
}

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 220,
  mass: 0.8,
};

interface SpeedDialItemProps {
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
  isPrimary: boolean;
  onPress: () => void;
  index: number;
  total: number;
  expandProgress: SharedValue<number>;
}

function SpeedDialItem({
  label,
  icon,
  isPrimary,
  onPress,
  index,
  total,
  expandProgress,
}: SpeedDialItemProps) {
  const itemStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      expandProgress.value,
      [0.15 * index, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          expandProgress.value,
          [0, 1],
          [20 * (total - index), 0],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          expandProgress.value,
          [0, 1],
          [0.8, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View style={itemStyle}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="flex-row items-center gap-x-3 active:scale-95"
      >
        <View className="bg-ink-900 px-3.5 py-2 rounded-xl shadow-md border border-ink-700">
          <StyledText variant="extrabold" className="text-paper-50 text-md">
            {label}
          </StyledText>
        </View>

        <View
          className={`w-16 h-16 rounded-full items-center justify-center shadow-lg border ${
            isPrimary
              ? 'bg-persimmon-500 border-persimmon-400'
              : 'bg-cinnamon-500 border-cinnamon-400'
          }`}
        >
          <FontAwesome name={icon} size={20} color="#FAFAF7" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function InventorySpeedDialFab({
  onAddProduct,
  onScanBarcode,
}: InventorySpeedDialFabProps) {
  const [expanded, setExpanded] = useState(false);
  const tabBarBottomOffset = useTabBarBottomOffset();
  const bottomOffset = tabBarBottomOffset + 16;
  const expandProgress = useSharedValue(0);

  const handleToggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpanded((prev) => {
      const next = !prev;
      expandProgress.value = withSpring(next ? 1 : 0, SPRING_CONFIG);
      return next;
    });
  }, [expandProgress]);

  const actions = [
    {
      id: 'add_product',
      label: 'Add Product',
      icon: 'plus' as const,
      isPrimary: true,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        handleToggleExpand();
        onAddProduct();
      },
    },
    {
      id: 'scan_barcode',
      label: 'Scan Barcode',
      icon: 'barcode' as const,
      isPrimary: false,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        handleToggleExpand();
        onScanBarcode();
      },
    },
  ] as const;

  const ellipsisStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      expandProgress.value,
      [0, 0.4],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        rotate: `${interpolate(
          expandProgress.value,
          [0, 1],
          [0, 90],
          Extrapolation.CLAMP,
        )}deg`,
      },
      {
        scale: interpolate(
          expandProgress.value,
          [0, 1],
          [1, 0.4],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const closeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      expandProgress.value,
      [0.4, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        rotate: `${interpolate(
          expandProgress.value,
          [0, 1],
          [-90, 0],
          Extrapolation.CLAMP,
        )}deg`,
      },
      {
        scale: interpolate(
          expandProgress.value,
          [0, 1],
          [0.4, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View
      className="absolute right-5 items-end z-50 pointer-events-box-none"
      style={{ bottom: bottomOffset }}
      pointerEvents="box-none"
    >
        {/* Actions Menu */}
        <View
          className="mb-3 items-end gap-y-3"
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          {actions.map((action, index) => (
            <SpeedDialItem
              key={action.id}
              label={action.label}
              icon={action.icon}
              isPrimary={action.isPrimary}
              onPress={action.onPress}
              index={index}
              total={actions.length}
              expandProgress={expandProgress}
            />
          ))}
        </View>

        {/* Main 3-Dot FAB Trigger Button with smooth rotation and icon morphing */}
        <Pressable
          onPress={handleToggleExpand}
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? 'Close actions menu' : 'Inventory actions menu'
          }
          accessibilityState={{ expanded }}
          className={`w-16 h-16 rounded-full items-center justify-center shadow-xl border active:scale-95 ${
            expanded
              ? 'bg-ink-900 border-ink-700'
              : 'bg-persimmon-500 border-persimmon-400'
          }`}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              ellipsisStyle,
              { alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            <FontAwesome name="ellipsis-v" size={24} color="#FAFAF7" />
          </Animated.View>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              closeStyle,
              { alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            <FontAwesome name="close" size={20} color="#FAFAF7" />
          </Animated.View>
        </Pressable>
      </View>
  );
}
