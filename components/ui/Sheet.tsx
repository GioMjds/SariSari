import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
// Tracks real keyboard frames on both platforms, where RN's version does nothing on edge-to-edge Android.
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 900;

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(screenHeight);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  // Enter on open; slide out before unmounting so close never snaps.
  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      translateY.value = withTiming(0, {
        duration: reducedMotion ? 0 : 260,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateY.value = withTiming(
        screenHeight,
        { duration: reducedMotion ? 0 : 180, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        },
      );
    }
  }, [visible, mounted, reducedMotion, screenHeight, translateY]);

  // Drag only from the handle/header so inner lists keep their own scroll.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(8)
        .failOffsetY(-8)
        .onUpdate((e) => {
          translateY.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
          if (
            e.translationY > DISMISS_DISTANCE ||
            e.velocityY > DISMISS_VELOCITY
          ) {
            scheduleOnRN(onClose);
          } else {
            translateY.value = withSpring(0, { damping: 22, stiffness: 260 });
          }
        }),
    [onClose, translateY],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, 400],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 justify-end"
        >
          <Animated.View
            className="absolute inset-0 bg-ink-900/50"
            style={backdropStyle}
          >
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="flex-1"
            />
          </Animated.View>

          <Animated.View
            accessibilityViewIsModal
            onAccessibilityEscape={onClose}
            className="bg-paper-50 rounded-t-xl border-t border-x border-paper-300 shadow-paper-lift"
            style={[
              sheetStyle,
              {
                // Shrinks above the keyboard so inner scroll views take the cut.
                flexShrink: 1,
                maxHeight: screenHeight - insets.top - 24,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <GestureDetector gesture={pan}>
              <View>
                <View className="items-center pt-2.5 pb-1.5">
                  <View className="w-10 h-1 rounded-pill bg-ink-200" />
                </View>
                {title ? (
                  <View className="flex-row items-center pl-5 pr-2 pb-3 border-b border-dashed border-paper-400">
                    <StyledText
                      variant="extrabold"
                      accessibilityRole="header"
                      className="flex-1 text-h2 text-ink-900"
                    >
                      {title}
                    </StyledText>
                    <Pressable
                      onPress={onClose}
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                      hitSlop={4}
                      className="w-10 h-10 rounded-pill items-center justify-center active:bg-paper-100"
                    >
                      <FontAwesome name="times" size={16} color="#564E45" />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </GestureDetector>
            <View className="px-5 pt-3 gap-y-4 shrink">{children}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
