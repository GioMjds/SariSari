import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { AnimatePresence, MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { useToastStore } from '@/stores';
import { Toast as ToastType, ToastVariant } from '@/types/ui/Toast.types';

interface ProgressBarProps {
  duration: number;
  color: string;
}

const getVariantColors = (variant: ToastVariant = 'default') => {
  switch (variant) {
    case 'success':
      return {
        iconName: 'check-circle' as const,
        chipBg: 'bg-sage-50 border-sage-200/80',
        iconColor: '#3D5E1B',
        eyebrowText: 'SUCCESS',
        eyebrowColor: 'text-sage-700',
        accentColor: '#4F7A24',
        actionBorderColor: 'rgba(79, 122, 36, 0.35)',
        actionTextColor: 'text-sage-700',
        actionBgColor: 'bg-sage-50',
        progressBarColor: '#4F7A24',
      };
    case 'danger':
      return {
        iconName: 'exclamation-circle' as const,
        chipBg: 'bg-semantic-danger-50 border-semantic-danger-100/80',
        iconColor: '#C13030',
        eyebrowText: 'ERROR',
        eyebrowColor: 'text-semantic-danger',
        accentColor: '#C13030',
        actionBorderColor: 'rgba(193, 48, 48, 0.35)',
        actionTextColor: 'text-semantic-danger',
        actionBgColor: 'bg-semantic-danger-50',
        progressBarColor: '#C13030',
      };
    case 'info':
      return {
        iconName: 'info-circle' as const,
        chipBg: 'bg-semantic-info-50 border-semantic-info-100/80',
        iconColor: '#2E6FA8',
        eyebrowText: 'INFO',
        eyebrowColor: 'text-semantic-info',
        accentColor: '#2E6FA8',
        actionBorderColor: 'rgba(46, 111, 168, 0.35)',
        actionTextColor: 'text-semantic-info',
        actionBgColor: 'bg-semantic-info-50',
        progressBarColor: '#2E6FA8',
      };
    case 'warning':
      return {
        iconName: 'warning' as const,
        chipBg: 'bg-semantic-warning-50 border-semantic-warning-100/80',
        iconColor: '#A35F00',
        eyebrowText: 'WARNING',
        eyebrowColor: 'text-semantic-warning',
        accentColor: '#C77B0E',
        actionBorderColor: 'rgba(199, 123, 14, 0.35)',
        actionTextColor: 'text-semantic-warning',
        actionBgColor: 'bg-semantic-warning-50',
        progressBarColor: '#C77B0E',
      };
    case 'default':
    default:
      return {
        iconName: 'bell' as const,
        chipBg: 'bg-persimmon-50 border-persimmon-100',
        iconColor: '#E85A1F',
        eyebrowText: 'NOTICE',
        eyebrowColor: 'text-persimmon-700',
        accentColor: '#E85A1F',
        actionBorderColor: 'rgba(232, 90, 31, 0.35)',
        actionTextColor: 'text-persimmon-700',
        actionBgColor: 'bg-persimmon-50',
        progressBarColor: '#E85A1F',
      };
  }
};

const ProgressBar = ({ duration, color }: ProgressBarProps) => {
  const animWidth = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (!duration || duration <= 0) return;
    animWidth.setValue(100);
    Animated.timing(animWidth, {
      toValue: 0,
      duration: duration,
      useNativeDriver: false,
    }).start();
  }, [duration, animWidth]);

  if (!duration || duration <= 0) return null;

  const widthStyle = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="w-full h-[2.5px] bg-paper-300/40 overflow-hidden absolute bottom-0 left-0 right-0">
      <Animated.View
        style={{
          height: '100%',
          width: widthStyle,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
    </View>
  );
};

interface ToastItemProps {
  toast: ToastType;
  index: number;
  totalCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onDismiss: (id: string) => void;
}

export const ToastItem = ({
  toast,
  index,
  totalCount = 1,
  isExpanded = false,
  onToggleExpand,
  onDismiss,
}: ToastItemProps) => {
  const { width } = useWindowDimensions();
  const [reducedMotion, setReducedMotion] = useState(false);
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReducedMotion(enabled);
    });

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (active) setReducedMotion(enabled);
      },
    );

    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 6;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -35 || gestureState.vy < -0.4) {
          Animated.timing(dragY, {
            toValue: -120,
            duration: 160,
            useNativeDriver: true,
          }).start(() => onDismiss(toast.id));
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
            speed: 16,
          }).start();
        }
      },
    }),
  ).current;

  const {
    iconName,
    chipBg,
    iconColor,
    eyebrowText,
    eyebrowColor,
    accentColor,
    actionBorderColor,
    actionTextColor,
    actionBgColor,
    progressBarColor,
  } = getVariantColors(toast.variant || 'default');

  const toastWidth = Math.min(540, width - 32);

  // Sonner Card Stacking Math
  let targetTranslateY = 0;
  let targetScale = 1;
  let targetOpacity = 1;

  if (isExpanded) {
    targetTranslateY = index * 74;
    targetScale = 1;
    targetOpacity = index >= 5 ? 0 : 1;
  } else {
    if (index === 0) {
      targetTranslateY = 0;
      targetScale = 1;
      targetOpacity = 1;
    } else if (index === 1) {
      targetTranslateY = 12;
      targetScale = 0.94;
      targetOpacity = 0.92;
    } else if (index === 2) {
      targetTranslateY = 22;
      targetScale = 0.88;
      targetOpacity = 0.75;
    } else {
      targetTranslateY = 28;
      targetScale = 0.82;
      targetOpacity = 0;
    }
  }

  const duration = toast.duration ?? 4000;

  return (
    <MotiView
      from={{
        opacity: 0,
        scale: reducedMotion ? 1 : 0.92,
        translateY: reducedMotion ? 0 : -20,
      }}
      animate={{
        opacity: targetOpacity,
        scale: reducedMotion ? 1 : targetScale,
        translateY: reducedMotion ? 0 : targetTranslateY,
      }}
      exit={{
        opacity: 0,
        scale: reducedMotion ? 1 : 0.95,
        translateY: reducedMotion ? 0 : -16,
      }}
      transition={{
        type: 'spring',
        damping: 22,
        stiffness: 240,
        mass: 0.8,
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: (width - toastWidth) / 2,
        width: toastWidth,
        zIndex: 9999 - index,
      }}
      pointerEvents={targetOpacity === 0 ? 'none' : 'auto'}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      accessibilityLabel={`${eyebrowText}: ${toast.message}`}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateY: dragY }],
        }}
      >
        <Pressable
          onPress={() => {
            if (totalCount > 1 && onToggleExpand) {
              onToggleExpand();
            }
          }}
          className="w-full bg-paper-50 border border-paper-300 rounded-2xl shadow-paper-lift overflow-hidden flex-row items-center py-3.5 px-4 gap-3"
          style={{
            minHeight: toast.action ? 66 : 56,
          }}
        >
          {/* Left Variant Vertical Pill Accent */}
          <View
            style={{
              width: 4,
              height: 32,
              borderRadius: 999,
              backgroundColor: accentColor,
            }}
          />

          {/* Icon Badge Chip */}
          <View
            className={`w-9 h-9 rounded-xl items-center justify-center border ${chipBg}`}
          >
            <FontAwesome name={iconName as any} size={16} color={iconColor} />
          </View>

          {/* Text Content */}
          <View className="flex-1 justify-center py-0.5">
            <View className="flex-row items-center gap-2">
              <StyledText
                variant="extrabold"
                style={{ letterSpacing: 1.4 }}
                className={`${eyebrowColor} text-[10px] uppercase`}
              >
                {eyebrowText}
              </StyledText>

              {/* Stack Counter Badge (When collapsed and index === 0 and multiple toasts exist) */}
              {!isExpanded && index === 0 && totalCount > 1 && (
                <View className="bg-paper-200 border border-paper-300 px-1.5 py-0.5 rounded-full">
                  <StyledText
                    variant="extrabold"
                    className="text-[9px] text-ink-500"
                  >
                    +{totalCount - 1}
                  </StyledText>
                </View>
              )}
            </View>

            <StyledText
              variant="semibold"
              className="text-ink-800 text-sm mt-0.5 leading-snug"
              numberOfLines={2}
            >
              {toast.message}
            </StyledText>
          </View>

          {/* Optional Action Button */}
          {toast.action && (
            <TouchableOpacity
              onPress={() => {
                try {
                  toast.action?.onPress();
                } catch (err) {
                  console.error('Toast action error:', err);
                }
                onDismiss(toast.id);
              }}
              accessibilityLabel={toast.action.label}
              className={`border rounded-xl justify-center items-center px-3 py-1.5 ${actionBgColor}`}
              style={{ borderColor: actionBorderColor, minHeight: 36 }}
              activeOpacity={0.7}
            >
              <StyledText
                variant="extrabold"
                className={`${actionTextColor} text-[11px] tracking-wide uppercase`}
              >
                {toast.action.label}
              </StyledText>
            </TouchableOpacity>
          )}

          {/* Dismiss Button */}
          <TouchableOpacity
            onPress={() => onDismiss(toast.id)}
            accessibilityLabel="Dismiss notification"
            className="w-7 h-7 rounded-full items-center justify-center bg-paper-100/60 active:bg-paper-200"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome name="times" size={12} color="#7A7165" />
          </TouchableOpacity>

          {/* Animated Auto-Dismiss Progress Bar */}
          <ProgressBar duration={duration} color={progressBarColor} />
        </Pressable>
      </Animated.View>
    </MotiView>
  );
};

export const Toast = () => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        elevation: 9999,
        alignItems: 'center',
      }}
    >
      <AnimatePresence>
        {toasts.map((t, i) => (
          <ToastItem
            key={t.id}
            toast={t}
            index={i}
            totalCount={toasts.length}
            isExpanded={isExpanded}
            onToggleExpand={handleToggleExpand}
            onDismiss={removeToast}
          />
        ))}
      </AnimatePresence>
    </View>
  );
};

export const ToastContainer = Toast;
