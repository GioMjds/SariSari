import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export interface InventorySpeedDialFabProps {
  onAddProduct: () => void;
  onScanBarcode: () => void;
  onAddCategory: () => void;
  onAddSupplier: () => void;
}

type IconName = keyof typeof FontAwesome.glyphMap;

const FAB_HEIGHT = 56;
const FAB_GAP = 16;
const MENU_WIDTH = 288;
const OPEN_SPRING = { damping: 20, stiffness: 260, mass: 0.8 } as const;
const PERSIMMON = '#E85A1F';
const INK = '#191612';
const PAPER = '#FAFAF7';

// Persimmon-tinted lift so the pill reads as the one raised control on the page.
const FAB_SHADOW = {
  shadowColor: '#A1370C',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.28,
  shadowRadius: 14,
  elevation: 8,
} as const;

const MENU_SHADOW = {
  shadowColor: '#564E45',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.18,
  shadowRadius: 24,
  elevation: 12,
} as const;

/** Bottom padding a list needs so its last row clears the tab bar and this FAB. */
export function useFabClearance(): number {
  return useTabBarBottomOffset() + FAB_GAP + FAB_HEIGHT + 16;
}

interface MenuAction {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  primary?: boolean;
  run: () => void;
}

export function InventorySpeedDialFab({
  onAddProduct,
  onScanBarcode,
  onAddCategory,
  onAddSupplier,
}: InventorySpeedDialFabProps) {
  const reducedMotion = useReducedMotion();
  const bottom = useTabBarBottomOffset() + FAB_GAP;
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);
  // Runs once the menu has fully closed, so the next screen or modal never overlaps it.
  const pendingAction = useRef<(() => void) | null>(null);
  // Guards onShow against a close that lands before the native modal finishes presenting.
  const wantOpen = useRef(false);

  const finishClose = useCallback(() => {
    setOpen(false);
    const next = pendingAction.current;
    pendingAction.current = null;
    next?.();
  }, []);

  const show = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    wantOpen.current = true;
    setOpen(true);
  }, []);

  // Start only once the modal is on screen; starting on press let it pop in mid-animation.
  const handleShow = useCallback(() => {
    if (!wantOpen.current) return;
    progress.value = reducedMotion
      ? withTiming(1, { duration: 0 })
      : withSpring(1, OPEN_SPRING);
  }, [progress, reducedMotion]);

  const hide = useCallback(
    (then?: () => void) => {
      wantOpen.current = false;
      pendingAction.current = then ?? null;
      progress.value = withTiming(
        0,
        { duration: reducedMotion ? 0 : 160, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) scheduleOnRN(finishClose);
        },
      );
    },
    [progress, reducedMotion, finishClose],
  );

  const actions: MenuAction[] = [
    {
      id: 'add_product',
      label: 'Add product',
      hint: 'Name, price and starting stock',
      icon: 'plus',
      primary: true,
      run: onAddProduct,
    },
    {
      id: 'scan_barcode',
      label: 'Scan barcode',
      hint: 'Find an item or add it by code',
      icon: 'barcode',
      run: onScanBarcode,
    },
    {
      id: 'add_category',
      label: 'Add category',
      hint: 'Group items into a shelf',
      icon: 'tag',
      run: onAddCategory,
    },
    {
      id: 'add_supplier',
      label: 'Add supplier',
      hint: 'Who you restock from',
      icon: 'truck',
      run: onAddSupplier,
    },
  ];

  const pick = (action: MenuAction) => {
    Haptics.impactAsync(
      action.primary
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
    hide(action.run);
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [12, 0], Extrapolation.CLAMP) },
      { scale: interpolate(progress.value, [0, 1], [0.92, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <>
      {/* Stays visible under the modal so there is no blank frame while it presents. */}
      <View
        className="absolute right-5 z-50"
        style={{ bottom }}
        pointerEvents={open ? 'none' : 'box-none'}
      >
        <FabPill progress={progress} expanded={false} onPress={show} />
      </View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onShow={handleShow}
        onRequestClose={() => hide()}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, backdropStyle]}
          className="bg-ink-900/55"
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => hide()}
            accessibilityRole="button"
            accessibilityLabel="Close add menu"
          />
        </Animated.View>

        <View
          className="absolute right-5 items-end gap-y-3"
          style={{ bottom }}
          pointerEvents="box-none"
        >
          <Animated.View
            accessibilityViewIsModal
            onAccessibilityEscape={() => hide()}
            className="bg-paper-50 rounded-2xl border border-paper-300"
            style={[
              { width: MENU_WIDTH, transformOrigin: 'bottom right' },
              MENU_SHADOW,
              menuStyle,
            ]}
          >
            <View className="px-4 pt-3.5 pb-3 border-b border-dashed border-paper-400">
              <StyledText
                variant="extrabold"
                accessibilityRole="header"
                className="text-h3 text-ink-900"
              >
                Add to inventory
              </StyledText>
              <StyledText variant="regular" className="text-caption text-ink-500">
                What are you adding today?
              </StyledText>
            </View>
            <View className="p-2 gap-y-1">
              {actions.map((action, index) => (
                <MenuRow
                  key={action.id}
                  action={action}
                  index={index}
                  progress={progress}
                  onPress={() => pick(action)}
                />
              ))}
            </View>
          </Animated.View>

          <FabPill progress={progress} expanded onPress={() => hide()} />
        </View>
      </Modal>
    </>
  );
}

interface FabPillProps {
  progress: SharedValue<number>;
  expanded: boolean;
  onPress: () => void;
}

/** Extended FAB: persimmon "Add" pill that turns into an ink "Close" pill as the menu opens. */
function FabPill({ progress, expanded, onPress }: FabPillProps) {
  const pressed = useSharedValue(0);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [PERSIMMON, INK]),
    transform: [{ scale: 1 - pressed.value * 0.05 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 45], Extrapolation.CLAMP)}deg` },
    ],
  }));
  const addLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0], Extrapolation.CLAMP),
  }));
  const closeLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 140 });
      }}
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Close add menu' : 'Add to inventory'}
      accessibilityHint={expanded ? undefined : 'Opens add product, scan, category and supplier'}
      accessibilityState={{ expanded }}
      hitSlop={6}
    >
      <Animated.View
        className="flex-row items-center rounded-pill pl-1.5 pr-5 gap-x-2.5"
        style={[{ height: FAB_HEIGHT }, FAB_SHADOW, pillStyle]}
      >
        <View className="w-11 h-11 rounded-pill items-center justify-center bg-paper-50/20">
          <Animated.View style={iconStyle}>
            <FontAwesome name="plus" size={18} color={PAPER} />
          </Animated.View>
        </View>
        <View>
          {/* Invisible sizer keeps the pill the same width for both labels. */}
          <StyledText variant="extrabold" className="text-[16px] opacity-0">
            Close
          </StyledText>
          <Animated.View style={[StyleSheet.absoluteFill, addLabelStyle]}>
            <StyledText variant="extrabold" className="text-[16px] text-paper-50">
              Add
            </StyledText>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, closeLabelStyle]}>
            <StyledText variant="extrabold" className="text-[16px] text-paper-50">
              Close
            </StyledText>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

interface MenuRowProps {
  action: MenuAction;
  index: number;
  progress: SharedValue<number>;
  onPress: () => void;
}

function MenuRow({ action, index, progress, onPress }: MenuRowProps) {
  const start = 0.15 + index * 0.08;
  const rowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [start, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [start, 1], [8, 0], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View style={rowStyle}>
      <Pressable
        onPress={onPress}
        accessibilityRole="menuitem"
        accessibilityLabel={action.label}
        accessibilityHint={action.hint}
        className={`min-h-[60px] px-2.5 rounded-xl flex-row items-center gap-x-3 ${
          action.primary
            ? 'bg-persimmon-50 border border-persimmon-100 active:bg-persimmon-100'
            : 'active:bg-paper-100'
        }`}
      >
        <View
          className={`w-10 h-10 rounded-xl items-center justify-center ${
            action.primary ? 'bg-persimmon-500' : 'bg-paper-100 border border-paper-300'
          }`}
        >
          <FontAwesome
            name={action.icon}
            size={action.primary ? 16 : 15}
            color={action.primary ? PAPER : '#623418'}
          />
        </View>
        <View className="flex-1">
          <StyledText variant="extrabold" className="text-[15px] text-ink-900">
            {action.label}
          </StyledText>
          <StyledText variant="regular" className="text-caption text-ink-500">
            {action.hint}
          </StyledText>
        </View>
        {action.primary ? (
          <FontAwesome name="angle-right" size={18} color="#C8460F" />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
