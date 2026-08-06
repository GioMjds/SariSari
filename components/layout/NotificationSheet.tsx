import { StyledText } from '@/components/elements';
import { DynamicHomeAlert } from '@/hooks/useHomeDashboardData';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, FlatList, Modal, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

const TAG = '[NotificationSheet]';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;
const DISMISS_VELOCITY = 600;
const OVERSCROLL_CAP = 44;
const SPRING_SNAP_BACK = { damping: 22, stiffness: 300, mass: 0.7 };
const SPRING_DISMISS = { damping: 26, stiffness: 240, mass: 0.8 };

export interface NotificationSheetProps {
  visible: boolean;
  alerts: DynamicHomeAlert[];
  onClose: () => void;
  onAlertAction: (alert: DynamicHomeAlert) => void;
  onSeeAll: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

interface AlertCardItemProps {
  type: DynamicHomeAlert['type'];
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}

function AlertCardItem({
  type,
  title,
  subtitle,
  actionLabel,
  onAction,
}: AlertCardItemProps) {
  const iconMap: Record<DynamicHomeAlert['type'], string> = {
    low_stock: '!',
    expiring: '~',
    overdue_debts: '$',
  };
  const colorMap: Record<DynamicHomeAlert['type'], string> = {
    low_stock: 'bg-persimmon-100',
    expiring: 'bg-amber-100',
    overdue_debts: 'bg-red-100',
  };
  return (
    <View className="flex-row items-start py-2.5 border-b border-paper-200 last:border-b-0">
      <View
        className={`w-8 h-8 rounded-full ${colorMap[type]} items-center justify-center mr-3 mt-0.5 flex-shrink-0`}
      >
        <StyledText variant="extrabold" className="text-ink-700 text-xs">
          {iconMap[type]}
        </StyledText>
      </View>
      <View className="flex-1 mr-2">
        <StyledText
          variant="semibold"
          className="text-ink-900 text-sm"
          numberOfLines={1}
        >
          {title}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-500 text-xs mt-0.5"
          numberOfLines={2}
        >
          {subtitle}
        </StyledText>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        hitSlop={8}
        className="min-h-[32px] px-3 rounded-lg bg-paper-200 active:bg-paper-300 items-center justify-center flex-shrink-0"
      >
        <StyledText variant="semibold" className="text-ink-700 text-xs">
          {actionLabel}
        </StyledText>
      </Pressable>
    </View>
  );
}

export function NotificationSheet({
  visible,
  alerts,
  onClose,
  onAlertAction,
  onSeeAll,
}: NotificationSheetProps) {
  const shouldReduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const topOffset = insets.top + 10;

  const translateY = useSharedValue(0);
  const isDismissing = useSharedValue(0);
  const sheetOpacity = useSharedValue(1);

  const prevVisible = useRef(visible);
  useEffect(() => {
    if (prevVisible.current !== visible) {
      prevVisible.current = visible;
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      isDismissing.value = 0;
      sheetOpacity.value = 1;
    } else {
      translateY.value = 0;
      isDismissing.value = 0;
      sheetOpacity.value = 0;
    }
  }, [visible, translateY, isDismissing, sheetOpacity]);

  const dismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (isDismissing.value === 1) return;
    isDismissing.value = 1;
    const exitDuration = shouldReduceMotion ? 0 : 200;
    sheetOpacity.value = withTiming(0, { duration: exitDuration });
    translateY.value = withTiming(
      -24,
      { duration: exitDuration },
      (finished) => {
        if (finished) {
          scheduleOnRN(dismiss);
        }
      },
    );
  }, [shouldReduceMotion, dismiss, translateY, isDismissing, sheetOpacity]);

  const resistedTranslate = (raw: number): number => {
    'worklet';
    if (raw <= 0) return 0;
    if (raw <= OVERSCROLL_CAP) return raw;
    return OVERSCROLL_CAP + Math.sqrt(raw - OVERSCROLL_CAP) * 7;
  };

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([6, 9999])
        .failOffsetY([-6, -9999])
        .onUpdate((event) => {
          if (shouldReduceMotion || isDismissing.value === 1) return;
          translateY.value = resistedTranslate(event.translationY);
        })
        .onEnd((event) => {
          const { translationY, velocityY } = event;
          const shouldDismiss =
            translationY > DISMISS_THRESHOLD || velocityY > DISMISS_VELOCITY;

          if (isDismissing.value === 1) return;

          if (shouldDismiss) {
            isDismissing.value = 1;
            const exitDuration = shouldReduceMotion ? 0 : 220;
            sheetOpacity.value = withTiming(0, { duration: exitDuration });
            translateY.value = withSpring(
              SCREEN_HEIGHT * 0.7,
              SPRING_DISMISS,
              (finished) => {
                if (finished) {
                  scheduleOnRN(dismiss);
                }
              },
            );
          } else {
            translateY.value = withSpring(0, SPRING_SNAP_BACK);
          }
        })
        .onFinalize((event) => {
          if (isDismissing.value !== 1) {
            translateY.value = withSpring(0, SPRING_SNAP_BACK);
          }
        }),
    [shouldReduceMotion, translateY, isDismissing, sheetOpacity, dismiss],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: sheetOpacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(
        translateY.value,
        [0, DISMISS_THRESHOLD],
        [1, 0],
        Extrapolation.CLAMP,
      ) * sheetOpacity.value,
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: interpolate(
          translateY.value,
          [0, DISMISS_THRESHOLD],
          [1, 1.7],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(
      translateY.value,
      [0, DISMISS_THRESHOLD * 0.4, DISMISS_THRESHOLD],
      [0.4, 0.75, 0.25],
      Extrapolation.CLAMP,
    ),
  }));

  const enterDuration = shouldReduceMotion ? 0 : 230;
  const sheetFrom = shouldReduceMotion
    ? { opacity: 1, translateY: 0 }
    : { opacity: 0, translateY: -18 };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, paddingTop: topOffset }} pointerEvents="box-none">
        {/* Backdrop */}
        <AnimatedView
          className="absolute inset-0"
          style={backdropStyle}
          pointerEvents="none"
        >
          <BlurView intensity={38} tint="dark" className="absolute inset-0" />
          <View
            className="absolute inset-0 bg-ink-900/30"
            pointerEvents="none"
          />
        </AnimatedView>

        {/* Tap-outside dismiss */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss notifications"
          onPress={() => {
            console.log(`${TAG} backdrop tap -> handleClose()`);
            handleClose();
          }}
          className="absolute inset-0"
        />

        <AnimatedView
          style={[
            sheetStyle,
            {
              shadowColor: '#0E0C0A',
              shadowOpacity: 0.2,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 14 },
              elevation: 18,
            },
          ]}
        >
          <GestureDetector gesture={panGesture}>
            <Animated.View>
              <MotiView
                from={sheetFrom}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: enterDuration }}
                exit={{ opacity: 0, translateY: 18 }}
                className="mx-3 rounded-2xl bg-paper-50 border border-paper-300 overflow-hidden"
                style={{
                  maxHeight: SCREEN_HEIGHT * 0.62,
                }}
              >
                {/* Drag handle */}
                <View className="items-center pt-2.5 pb-1" pointerEvents="none">
                  <AnimatedView
                    className="w-9 h-1 rounded-full bg-ink-200"
                    style={handleStyle}
                  />
                </View>

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 pt-1 pb-2.5">
                  <View className="flex-1 mr-3">
                    <StyledText
                      variant="extrabold"
                      className="text-ink-900 text-base"
                      numberOfLines={1}
                    >
                      Notifications
                    </StyledText>
                    <StyledText
                      variant="regular"
                      className="text-ink-400 text-xs"
                      numberOfLines={1}
                    >
                      {alerts.length === 0
                        ? 'Nothing needs your attention'
                        : `${alerts.length} active alert${alerts.length === 1 ? '' : 's'}`}
                    </StyledText>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close notifications"
                    onPress={() => {
                      console.log(`${TAG} close button (✕) tapped`);
                      handleClose();
                    }}
                    hitSlop={10}
                    className="w-8 h-8 rounded-full bg-paper-200 active:bg-paper-300 items-center justify-center"
                  >
                    <StyledText
                      variant="extrabold"
                      className="text-ink-600 text-xs"
                      style={{ lineHeight: 14 }}
                    >
                      ✕
                    </StyledText>
                  </Pressable>
                </View>

                {/* Divider */}
                <View className="h-px bg-paper-300" />

                {/* Content */}
                <FlatList
                  data={alerts}
                  keyExtractor={(item) => String(item.id)}
                  style={{ maxHeight: SCREEN_HEIGHT * 0.48 }}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 4,
                  }}
                  renderItem={({ item: alert }) => (
                    <AlertCardItem
                      type={alert.type}
                      title={alert.title}
                      subtitle={alert.subtitle}
                      actionLabel={alert.actionLabel}
                      onAction={() => {
                        console.log(
                          `${TAG} alert action tapped: id=${alert.id}`,
                        );
                        onAlertAction(alert);
                      }}
                    />
                  )}
                  ListEmptyComponent={
                    <View className="py-6 items-center">
                      <StyledText
                        variant="medium"
                        className="text-ink-400 text-sm text-center"
                      >
                        Store is operating smoothly. No alerts right now.
                      </StyledText>
                    </View>
                  }
                />

                {/* CTA */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="See all alerts"
                  onPress={() => {
                    console.log(`${TAG} see-all CTA tapped`);
                    onSeeAll();
                  }}
                  className="mx-4 my-3 min-h-[44px] rounded-xl bg-persimmon-500 active:bg-persimmon-600 items-center justify-center"
                >
                  <StyledText
                    variant="extrabold"
                    className="text-paper-50 text-sm"
                  >
                    See all alerts
                  </StyledText>
                </Pressable>
              </MotiView>
            </Animated.View>
          </GestureDetector>
        </AnimatedView>
      </View>
    </Modal>
  );
}
