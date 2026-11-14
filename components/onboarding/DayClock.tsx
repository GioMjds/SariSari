import { useState } from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * DayClock - onboarding header. Shows the simulated time of day and a
 * timeline whose marker moves from opening to closing as the owner
 * walks through the day. One progressbar element for screen readers;
 * the parent passes translated strings. Reduce Motion jumps the marker.
 */

const MARKER = 14;

type Props = {
  currentIndex: number; // 0-based
  totalSteps: number;
  timeLabel: string;
  counterText: string;
  label: string;
};

export function DayClock({
  currentIndex,
  totalSteps,
  timeLabel,
  counterText,
  label,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const fraction = totalSteps > 1 ? currentIndex / (totalSteps - 1) : 0;
  const x = Math.max(0, (trackWidth - MARKER) * fraction);
  const transition = reducedMotion
    ? ({ type: 'timing', duration: 0 } as const)
    : ({ type: 'timing', duration: 240 } as const);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: totalSteps, now: currentIndex + 1 }}
    >
      <View className="flex-row items-baseline justify-between mb-2">
        <StyledText variant="extrabold" className="text-ink-900 text-base">
          {timeLabel}
        </StyledText>
        <StyledText variant="semibold" className="text-ink-600 text-caption">
          {counterText}
        </StyledText>
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        className="h-3.5 justify-center"
      >
        <View className="h-1 rounded-full bg-paper-400" />
        <MotiView
          animate={{ width: x + MARKER / 2 }}
          transition={transition}
          className="absolute left-0 h-1 rounded-full bg-persimmon-500"
        />
        <MotiView
          animate={{ translateX: x }}
          transition={transition}
          className="absolute left-0 h-3.5 w-3.5 rounded-full border-2 border-paper-50 bg-persimmon-600"
        />
      </View>
    </View>
  );
}
