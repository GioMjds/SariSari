import { useCallback, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyledText } from '@/components/elements';
import { logger } from '@/lib/logger';
import { formatPesos } from '@/lib';

interface SwipeConfirmButtonProps {
  onConfirm: () => void;
  disabled: boolean;
  isSubmitting: boolean;
  isEmpty: boolean;
  customerMissing: boolean;
  total: number;
}

const THUMB_SIZE = 52;
const PADDING = 4;
const CONFIRM_THRESHOLD = 0.8;

export function SwipeConfirmButton({
  onConfirm,
  disabled,
  isSubmitting,
  isEmpty,
  customerMissing,
  total,
}: SwipeConfirmButtonProps) {
  const translateX = useSharedValue(0);
  const containerWidth = useSharedValue(0);

  const logSwipeBegin = useCallback((cw: number, tx: number) => {
    logger.info(
      {
        event: 'swipe_gesture_begin',
        feature: 'checkout',
        containerWidth: cw,
        translateX: tx,
      },
      'Swipe gesture began',
    );
  }, []);

  const logSwipeConfirm = useCallback((progress: number) => {
    logger.info(
      {
        event: 'swipe_gesture_confirm',
        feature: 'checkout',
        progress,
      },
      'Swipe gesture confirmed - triggering onConfirm',
    );
  }, []);

  // Confirm fires on release past the threshold, so a drag can still be aborted.
  const pan = useMemo(() => {
    return Gesture.Pan()
      .enabled(!disabled && !isSubmitting)
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onBegin(() => {
        scheduleOnRN(logSwipeBegin, containerWidth.value, translateX.value);
      })
      .onUpdate((e) => {
        const maxTranslate = Math.max(
          containerWidth.value - THUMB_SIZE - PADDING * 2,
          0,
        );
        if (maxTranslate <= 0) return;
        translateX.value = Math.max(0, Math.min(e.translationX, maxTranslate));
      })
      .onEnd(() => {
        const maxTranslate = Math.max(
          containerWidth.value - THUMB_SIZE - PADDING * 2,
          0,
        );
        if (maxTranslate <= 0) return;
        const progress = translateX.value / maxTranslate;
        if (progress >= CONFIRM_THRESHOLD) {
          scheduleOnRN(logSwipeConfirm, progress);
          scheduleOnRN(onConfirm);
        }
      })
      .onFinalize(() => {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
      });
  }, [
    disabled,
    isSubmitting,
    logSwipeBegin,
    logSwipeConfirm,
    onConfirm,
    containerWidth,
    translateX,
  ]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => {
    const maxTranslate = Math.max(
      containerWidth.value - THUMB_SIZE - PADDING * 2,
      1,
    );
    const progress = Math.min(translateX.value / maxTranslate, 1);
    return { opacity: 1 - progress };
  });

  if (disabled) {
    const icon = isEmpty
      ? 'shopping-cart'
      : customerMissing
        ? 'user-plus'
        : 'check';
    const label = isEmpty
      ? 'Add items to continue'
      : customerMissing
        ? 'Choose a suki to continue'
        : `Confirm · ${formatPesos(total)}`;

    return (
      <View
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={label}
        className="h-[60px] rounded-full flex-row items-center justify-center bg-paper-300 border border-paper-400"
      >
        <FontAwesome name={icon} size={14} color="#3D372F" />
        <StyledText
          variant="extrabold"
          className="text-[15px] text-ink-600 ml-2.5"
          numberOfLines={1}
        >
          {label}
        </StyledText>
      </View>
    );
  }

  if (isSubmitting) {
    return (
      <View
        accessibilityLiveRegion="polite"
        className="h-[60px] rounded-full flex-row items-center justify-center bg-persimmon-500"
      >
        <ActivityIndicator color="#FFFFFF" size="small" />
        <StyledText variant="extrabold" className="text-white text-base ml-2.5">
          Recording sale...
        </StyledText>
      </View>
    );
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        className="h-[60px] rounded-full overflow-hidden bg-persimmon-500"
        onLayout={(e) => {
          containerWidth.value = e.nativeEvent.layout.width;
        }}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Confirm sale for ${formatPesos(total)}`}
        accessibilityHint="Slide right to confirm. Screen reader users can double tap."
        accessibilityActions={[{ name: 'activate', label: 'Confirm sale' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'activate') onConfirm();
        }}
      >
        <Animated.View
          className="absolute inset-0 items-center justify-center pl-12"
          style={labelStyle}
          pointerEvents="none"
        >
          <StyledText
            variant="extrabold"
            className="text-white text-[15px]"
            numberOfLines={1}
          >
            Slide to confirm
          </StyledText>
        </Animated.View>

        <Animated.View
          className="absolute top-[4px] left-[4px] w-[52px] h-[52px] rounded-full bg-paper-50 items-center justify-center"
          style={thumbStyle}
        >
          <FontAwesome name="chevron-right" size={16} color="#C8460F" />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
