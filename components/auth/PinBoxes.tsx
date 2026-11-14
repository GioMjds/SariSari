import { StyledText } from '@/components/elements/StyledText';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FC, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type PinBoxStatus = 'idle' | 'error' | 'success';

interface Props {
  value: string;
  length?: number;
  secure?: boolean;
  status?: PinBoxStatus;
  shakeKey?: number;
  active?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

const SHAKE_STEP_MS = 55;

const SinglePinBox: FC<{
  char?: string | undefined;
  secure: boolean;
  status: PinBoxStatus;
  isCurrent: boolean;
  reducedMotion: boolean;
}> = ({ char, secure, status, isCurrent, reducedMotion }) => {
  const filled = char !== undefined;
  const dotScale = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      dotScale.value = filled ? 1 : 0;
      return;
    }

    if (filled) {
      dotScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    } else {
      dotScale.value = withTiming(0, { duration: 120 });
    }
  }, [filled, reducedMotion, dotScale]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  let boxClass =
    'w-16 h-20 rounded-2xl border-2 items-center justify-center mx-1.5 ';
  if (status === 'error') {
    boxClass += 'border-semantic-danger bg-semantic-danger-50';
  } else if (status === 'success') {
    boxClass += 'border-sage-500 bg-sage-50';
  } else if (isCurrent) {
    boxClass += 'border-persimmon-500 bg-paper-50';
  } else if (filled) {
    boxClass += 'border-persimmon-300 bg-persimmon-50';
  } else {
    boxClass += 'border-paper-300 bg-paper-100';
  }

  let dotClass = 'w-3 h-3 rounded-full ';
  if (status === 'error') {
    dotClass += 'bg-semantic-danger';
  } else if (status === 'success') {
    dotClass += 'bg-sage-500';
  } else {
    dotClass += 'bg-persimmon-500';
  }

  return (
    <View className={boxClass}>
      {filled &&
        (secure ? (
          <Animated.View style={dotStyle}>
            <View className={dotClass} />
          </Animated.View>
        ) : (
          <StyledText variant="extrabold" className="text-2xl text-ink-900">
            {char}
          </StyledText>
        ))}
    </View>
  );
};

export const PinBoxes: FC<Props> = ({
  value,
  length = 6,
  secure = true,
  status = 'idle',
  shakeKey = 0,
  active = true,
  testID,
  accessibilityLabel,
}) => {
  const shift = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (shakeKey === 0 || reducedMotion) return;

    shift.value = withSequence(
      withTiming(10, {
        duration: SHAKE_STEP_MS,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(-10, { duration: SHAKE_STEP_MS * 2 }),
      withTiming(6, { duration: SHAKE_STEP_MS * 2 }),
      withTiming(0, { duration: SHAKE_STEP_MS }),
    );
  }, [shakeKey, reducedMotion, shift]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value }],
  }));

  return (
    <View testID={testID} className="flex-row justify-center">
      <Animated.View
        accessible
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: `${value.length} of ${length}` }}
        style={shakeStyle}
        className="flex-row"
      >
        {Array.from({ length }, (_, idx) => {
          const char = value[idx];
          const isCurrent = active && idx === value.length && status === 'idle';

          return (
            <SinglePinBox
              key={idx}
              char={char}
              secure={secure}
              status={status}
              isCurrent={isCurrent}
              reducedMotion={reducedMotion}
            />
          );
        })}
      </Animated.View>
    </View>
  );
};
