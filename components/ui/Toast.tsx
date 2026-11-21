import { useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { AnimatePresence, MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useToastStore } from '@/stores';
import { Toast as ToastType, ToastVariant } from '@/types/ui/Toast.types';

// Tone carries meaning through icon + spoken label, never color alone.
const TONES = {
  default: {
    icon: 'bell',
    label: 'Notice',
    tile: 'bg-persimmon-50',
    border: 'border-paper-300',
    color: '#C8460F',
  },
  success: {
    icon: 'check-circle',
    label: 'Success',
    tile: 'bg-sage-50',
    border: 'border-sage-200',
    color: '#3D5E1B',
  },
  danger: {
    icon: 'exclamation-circle',
    label: 'Error',
    tile: 'bg-semantic-danger-50',
    border: 'border-semantic-danger-100',
    color: '#C13030',
  },
  info: {
    icon: 'info-circle',
    label: 'Info',
    tile: 'bg-semantic-info-50',
    border: 'border-semantic-info-100',
    color: '#2E6FA8',
  },
  warning: {
    icon: 'exclamation-triangle',
    label: 'Warning',
    tile: 'bg-semantic-warning-50',
    border: 'border-semantic-warning-100',
    color: '#A35F00',
  },
} as const;

// Collapsed stack offsets for the 2nd/3rd card peeking under the front toast.
const STACK = [
  { y: 0, scale: 1, opacity: 1 },
  { y: 10, scale: 0.95, opacity: 0.9 },
  { y: 18, scale: 0.9, opacity: 0.7 },
  { y: 24, scale: 0.85, opacity: 0 },
];

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
  const reducedMotion = useReducedMotion();
  const dragY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -35 || g.vy < -0.4) {
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

  const tone = TONES[toast.variant || 'default'] ?? TONES.default;
  const toastWidth = Math.min(540, width - 32);
  const duration = toast.duration ?? 4000;

  const target = isExpanded
    ? { y: index * 74, scale: 1, opacity: index >= 5 ? 0 : 1 }
    : STACK[Math.min(index, STACK.length - 1)]!;

  return (
    <MotiView
      from={{
        opacity: 0,
        scale: reducedMotion ? 1 : 0.94,
        translateY: reducedMotion ? 0 : -16,
      }}
      animate={{
        opacity: target.opacity,
        scale: reducedMotion ? 1 : target.scale,
        translateY: reducedMotion ? 0 : target.y,
      }}
      exit={{
        opacity: 0,
        scale: reducedMotion ? 1 : 0.96,
        translateY: reducedMotion ? 0 : -12,
      }}
      transition={{ type: 'spring', damping: 22, stiffness: 240, mass: 0.8 }}
      style={{
        position: 'absolute',
        top: 0,
        left: (width - toastWidth) / 2,
        width: toastWidth,
        zIndex: 9999 - index,
      }}
      pointerEvents={target.opacity === 0 ? 'none' : 'auto'}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateY: dragY }] }}
      >
        <Pressable
          onPress={() => totalCount > 1 && onToggleExpand?.()}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          accessibilityLabel={`${tone.label}: ${toast.message}`}
          className={`w-full bg-paper-50 border ${tone.border} rounded-xl shadow-paper-lift overflow-hidden flex-row items-center pl-3 pr-1 py-2.5 gap-3`}
          style={{ minHeight: 60 }}
        >
          <View
            className={`w-9 h-9 rounded-lg items-center justify-center ${tone.tile}`}
          >
            <FontAwesome name={tone.icon} size={16} color={tone.color} />
          </View>

          <StyledText
            variant="semibold"
            className="flex-1 text-ink-900 text-[15px] leading-5"
            numberOfLines={3}
          >
            {toast.message}
          </StyledText>

          {!isExpanded && index === 0 && totalCount > 1 && (
            <View className="bg-paper-100 border border-paper-300 px-2 py-0.5 rounded-pill">
              <StyledText variant="semibold" className="text-caption text-ink-600">
                +{totalCount - 1}
              </StyledText>
            </View>
          )}

          {toast.action && (
            <Pressable
              onPress={() => {
                try {
                  toast.action?.onPress();
                } catch (err) {
                  console.error('Toast action error:', err);
                }
                onDismiss(toast.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={toast.action.label}
              className="min-h-[40px] px-3 rounded-lg items-center justify-center active:bg-paper-100"
            >
              <StyledText
                variant="extrabold"
                className="text-[14px]"
                style={{ color: tone.color }}
              >
                {toast.action.label}
              </StyledText>
            </Pressable>
          )}

          <Pressable
            onPress={() => onDismiss(toast.id)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            hitSlop={4}
            className="w-10 h-10 rounded-pill items-center justify-center active:bg-paper-100"
          >
            <FontAwesome name="times" size={14} color="#564E45" />
          </Pressable>

          {duration > 0 && !reducedMotion && (
            <MotiView
              from={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{
                type: 'timing',
                duration,
                easing: Easing.linear,
              }}
              className="absolute bottom-0 left-0 right-0 h-[3px]"
              style={{
                backgroundColor: tone.color,
                opacity: 0.35,
                transformOrigin: 'left',
              }}
            />
          )}
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

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
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
            onToggleExpand={() => setIsExpanded((prev) => !prev)}
            onDismiss={removeToast}
          />
        ))}
      </AnimatePresence>
    </View>
  );
};

export const ToastContainer = Toast;
