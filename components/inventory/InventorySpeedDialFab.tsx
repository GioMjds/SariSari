import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export interface InventorySpeedDialFabProps {
  onAddProduct: () => void;
  onScanBarcode: () => void;
  onAddCategory: () => void;
  onAddSupplier: () => void;
}

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 220,
  mass: 0.8,
} as const;

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
          <StyledText variant="extrabold" className="text-paper-50 text-base">
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

interface Actions {
  id: string;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
  isPrimary: boolean;
  onPress: () => void;
}

export function InventorySpeedDialFab({
  onAddProduct,
  onScanBarcode,
  onAddCategory,
  onAddSupplier,
}: InventorySpeedDialFabProps) {
  const [expanded, setExpanded] = useState(false);
  const tabBarBottomOffset = useTabBarBottomOffset();
  const bottomOffset = tabBarBottomOffset + 16;
  const expandProgress = useSharedValue(0);

  const handleOpen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpanded(true);
    expandProgress.value = withSpring(1, SPRING_CONFIG);
  }, [expandProgress]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    expandProgress.value = withSpring(0, SPRING_CONFIG, (finished) => {
      if (finished) scheduleOnRN(setExpanded, false);
    });
  }, [expandProgress]);

  const actions = [
    {
      id: 'add_product',
      label: 'Add Product',
      icon: 'plus',
      isPrimary: true,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        handleClose();
        onAddProduct();
      },
    },
    {
      id: 'add_category',
      label: 'Add Category',
      icon: 'tag',
      isPrimary: false,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        handleClose();
        onAddCategory();
      },
    },
    {
      id: 'add_supplier',
      label: 'Add Supplier',
      icon: 'users',
      isPrimary: false,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        handleClose();
        onAddSupplier();
      },
    },
    {
      id: 'scan_barcode',
      label: 'Scan Barcode',
      icon: 'barcode',
      isPrimary: false,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        handleClose();
        onScanBarcode();
      },
    },
  ] satisfies Actions[];

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
  }));

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
    <>
      {/* Collapsed FAB Trigger Button (on main screen) */}
      <View
        className="absolute right-5 items-end z-50 pointer-events-box-none"
        style={{ bottom: bottomOffset }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={handleOpen}
          accessibilityRole="button"
          accessibilityLabel="Inventory actions menu"
          accessibilityState={{ expanded: false }}
          className="w-16 h-16 rounded-full bg-persimmon-500 items-center justify-center shadow-xl border border-persimmon-400 active:scale-95"
        >
          <FontAwesome name="ellipsis-v" size={24} color="#FAFAF7" />
        </Pressable>
      </View>

      {/* Expanded Speed Dial Full-Screen Modal Backdrop & Animated Menu */}
      <Modal
        visible={expanded}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <View style={StyleSheet.absoluteFill} className="relative">
          {/* 100% Full-Screen Backdrop Overlay */}
          <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleClose}
              className="bg-ink-900/60"
            />
          </Animated.View>

          {/* Speed Dial Actions & Interactive Toggle FAB inside Modal */}
          <View
            className="absolute right-5 items-end z-50 pointer-events-box-none"
            style={{ bottom: bottomOffset }}
            pointerEvents="box-none"
          >
            {/* Actions Menu */}
            <View className="mb-3 items-end gap-y-3">
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

            {/* Close Toggle Button inside Modal with icon morphing */}
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close actions menu"
              accessibilityState={{ expanded: true }}
              className="w-16 h-16 rounded-full bg-ink-900 items-center justify-center shadow-xl border border-ink-700 active:scale-95"
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
        </View>
      </Modal>
    </>
  );
}
