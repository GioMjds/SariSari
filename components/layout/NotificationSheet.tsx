import { useMemo, useEffect } from 'react';
import { Modal, Pressable, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useReducedMotion
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import { AlertCardItem } from '@/components/home';
import { DynamicHomeAlert } from '@/hooks/useHomeDashboardData';

const MAX_ALERTS = 3;
const DISMISS_TRANSLATE_THRESHOLD = 80;
const DISMISS_VELOCITY_THRESHOLD = 500;

export interface NotificationSheetProps {
  visible: boolean;
  alerts: DynamicHomeAlert[];
  onClose: () => void;
  onAlertAction: (alert: DynamicHomeAlert) => void;
  onSeeAll: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function NotificationSheet({
  visible,
  alerts,
  onClose,
  onAlertAction,
  onSeeAll,
}: NotificationSheetProps) {
  const shouldReduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  const visibleAlerts = useMemo(() => alerts.slice(0, MAX_ALERTS), [alerts]);
  const topOffset = insets.top + 12;
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      translateY.value = 0;
    }
  }, [visible, translateY]);

  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([8, 9999])
        .failOffsetY([-8, -9999])
        .onUpdate((event) => {
          if (shouldReduceMotion) return;
          translateY.value = Math.max(0, event.translationY);
        })
        .onEnd((event) => {
          if (shouldReduceMotion) {
            runOnJS(onClose)();
            return;
          }
          const shouldDismiss =
            event.translationY > DISMISS_TRANSLATE_THRESHOLD ||
            event.velocityY > DISMISS_VELOCITY_THRESHOLD;
          if (shouldDismiss) {
            translateY.value = withTiming(220, { duration: 180 }, () => {
              runOnJS(onClose)();
            });
          } else {
            translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
          }
        }),
    [onClose, shouldReduceMotion, translateY],
  );

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const enterDuration = shouldReduceMotion ? 0 : 220;
  const sheetFrom = shouldReduceMotion
    ? { opacity: 1, translateY: 0 }
    : { opacity: 0, translateY: -16 };
  const sheetEnter = shouldReduceMotion
    ? { opacity: 1, translateY: 0 }
    : { opacity: 1, translateY: 0 };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[StyleSheet.absoluteFill, { paddingTop: topOffset }]}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={40}
          tint="dark"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss notifications"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <AnimatedView style={sheetAnimatedStyle}>
          <MotiView
            from={sheetFrom}
            animate={sheetEnter}
            transition={{ type: 'timing', duration: enterDuration }}
            style={{
              marginHorizontal: 12,
              borderRadius: 16,
              backgroundColor: '#FBF7EE',
              borderWidth: 1,
              borderColor: '#EFE6D2',
              overflow: 'hidden',
              maxHeight: '60%',
              shadowColor: '#0E0C0A',
              shadowOpacity: 0.18,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 16,
            }}
          >
            <GestureDetector gesture={swipeGesture}>
              <View
                accessibilityRole="header"
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: '#EFE6D2',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <StyledText
                    variant="extrabold"
                    className="text-ink-900 text-base"
                    numberOfLines={1}
                  >
                    Notifications
                  </StyledText>
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-xs"
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
                  onPress={onClose}
                  hitSlop={8}
                  className="w-11 h-11 rounded-full bg-paper-200 items-center justify-center"
                >
                  <StyledText
                    variant="extrabold"
                    className="text-ink-700 text-base"
                  >
                    x
                  </StyledText>
                </Pressable>
              </View>
            </GestureDetector>

            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#EFE6D2',
                marginTop: 4,
              }}
              pointerEvents="none"
            />

            {visibleAlerts.length === 0 ? (
              <View className="px-4 py-6 items-center">
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-sm text-center"
                >
                  Store is operating smoothly. No alerts right now.
                </StyledText>
              </View>
            ) : (
              <View className="px-4 pt-1">
                {visibleAlerts.map((alert, index) => (
                  <AlertCardItem
                    key={alert.id}
                    index={index}
                    type={alert.type}
                    title={alert.title}
                    subtitle={alert.subtitle}
                    actionLabel={alert.actionLabel}
                    onAction={() => onAlertAction(alert)}
                  />
                ))}
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all alerts"
              onPress={onSeeAll}
              className="mx-4 my-3 min-h-[44px] rounded-xl bg-cinnamon-500 items-center justify-center"
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                See all alerts
              </StyledText>
            </Pressable>
          </MotiView>
        </AnimatedView>
      </View>
    </Modal>
  );
}
