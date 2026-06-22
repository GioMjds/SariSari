import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
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

const getVariantColors = (variant: ToastVariant) => {
  switch (variant) {
    case 'success':
      return {
        iconName: 'check-circle',
        chipBg: 'bg-secondary-50',
        iconColor: '#3D5E1B',
        eyebrowText: 'SUCCESS',
        eyebrowColor: 'text-secondary-500',
        accentColor: 'rgba(79, 122, 36, 0.35)',
        actionTextColor: 'text-secondary-500',
      };
    case 'danger':
      return {
        iconName: 'exclamation-circle',
        chipBg: 'bg-red-50',
        iconColor: '#C13030',
        eyebrowText: 'ERROR',
        eyebrowColor: 'text-semantic-danger',
        accentColor: 'rgba(193, 48, 48, 0.35)',
        actionTextColor: 'text-semantic-danger',
      };
    case 'info':
      return {
        iconName: 'info-circle',
        chipBg: 'bg-blue-50',
        iconColor: '#2E6FA8',
        eyebrowText: 'INFO',
        eyebrowColor: 'text-semantic-info',
        accentColor: 'rgba(46, 111, 168, 0.35)',
        actionTextColor: 'text-semantic-info',
      };
    case 'warning':
      return {
        iconName: 'warning',
        chipBg: 'bg-amber-50',
        iconColor: '#A35F00',
        eyebrowText: 'WARNING',
        eyebrowColor: 'text-semantic-warning',
        accentColor: 'rgba(199, 123, 14, 0.35)',
        actionTextColor: 'text-semantic-warning',
      };
    case 'default':
    default:
      return {
        iconName: 'bell',
        chipBg: 'bg-paper-200',
        iconColor: '#623418',
        eyebrowText: 'NOTICE',
        eyebrowColor: 'text-cinnamon-400',
        accentColor: 'rgba(142, 74, 35, 0.35)',
        actionTextColor: 'text-cinnamon-400',
      };
  }
};

interface ToastItemProps {
  toast: ToastType;
  index: number;
  onDismiss: (id: string) => void;
}

export const ToastItem = ({ toast, index, onDismiss }: ToastItemProps) => {
  const { width } = useWindowDimensions();
  const [reducedMotion, setReducedMotion] = useState(false);

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

  const {
    iconName,
    chipBg,
    iconColor,
    eyebrowText,
    eyebrowColor,
    accentColor,
    actionTextColor,
  } = getVariantColors(toast.variant || 'default');

  const toastWidth = Math.min(560, width - 32);
  const targetTranslateY = index >= 4 ? -100 : index * 76;
  const targetOpacity = index >= 4 ? 0 : 1;

  return (
    <MotiView
      from={{
        opacity: 0,
        scale: reducedMotion ? 1 : 0.96,
        translateY: reducedMotion ? 0 : targetTranslateY - 8,
      }}
      animate={{
        opacity: targetOpacity,
        scale: index >= 4 ? (reducedMotion ? 1 : 0.95) : 1,
        translateY: reducedMotion ? 0 : targetTranslateY,
      }}
      exit={{
        opacity: 0,
        scale: reducedMotion ? 1 : 0.98,
        translateY: reducedMotion ? 0 : targetTranslateY - 4,
      }}
      transition={{
        type: 'timing',
        duration: reducedMotion ? 100 : 220,
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: (width - toastWidth) / 2,
        width: toastWidth,
        zIndex: 9999 - index,
      }}
      pointerEvents={index >= 4 ? 'none' : 'auto'}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      accessibilityLabel={`${eyebrowText}: ${toast.message}`}
    >
      <View
        className="w-full bg-paper-50 border border-paper-300 rounded-xl shadow-paper-lift py-[14px] px-[16px] flex-row items-center gap-[12px]"
        style={{ minHeight: toast.action ? 64 : 52 }}
      >
        {/* Icon Chip */}
        <View
          className={`w-9 h-9 rounded-full items-center justify-center ${chipBg}`}
        >
          <FontAwesome name={iconName as any} size={18} color={iconColor} />
        </View>

        {/* Text Container */}
        <View className="flex-1 justify-center">
          <StyledText
            variant="extrabold"
            style={{ letterSpacing: 1.54 }}
            className={`${eyebrowColor} text-[11px] uppercase`}
          >
            {eyebrowText}
          </StyledText>
          <StyledText
            variant="semibold"
            className="text-ink-700 text-sm mt-0.5"
            numberOfLines={2}
          >
            {toast.message}
          </StyledText>
        </View>

        {/* Action Button (Optional) */}
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
            className="border rounded-lg justify-center items-center px-3 py-1.5"
            style={{ borderColor: accentColor, minHeight: 36 }}
          >
            <StyledText
              variant="extrabold"
              className={`${actionTextColor} text-[12px] uppercase`}
            >
              {toast.action.label}
            </StyledText>
          </TouchableOpacity>
        )}

        {/* Dismiss Button */}
        <TouchableOpacity
          onPress={() => onDismiss(toast.id)}
          accessibilityLabel="Dismiss notification"
          className="w-6 h-6 items-center justify-center"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome name="times" size={14} color="#A89F90" />
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

export const Toast = () => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const insets = useSafeAreaInsets();

  const output = (
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
          <ToastItem key={t.id} toast={t} index={i} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </View>
  );

  return output;
};

export const ToastContainer = Toast;
