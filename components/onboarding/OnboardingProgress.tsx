import { View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';

/**
 * OnboardingProgress - slim segmented bar plus a "N of M" counter,
 * exposed to screen readers as one progressbar element. The parent
 * passes pre-translated strings so this stays presentational.
 */

type Props = {
  currentIndex: number; // 0-based
  totalSteps: number;
  label: string;
  counterText: string;
};

export function OnboardingProgress({
  currentIndex,
  totalSteps,
  label,
  counterText,
}: Props) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: totalSteps, now: currentIndex + 1 }}
      className="flex-1 flex-row items-center gap-3"
    >
      <View
        importantForAccessibility="no-hide-descendants"
        className="flex-1 flex-row gap-1"
      >
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const reached = idx <= currentIndex;
          return (
            <MotiView
              key={idx}
              animate={{ opacity: reached ? 1 : 0.35 }}
              transition={{ type: 'timing', duration: 240 }}
              className={`h-1.5 flex-1 rounded-full ${
                reached ? 'bg-persimmon-500' : 'bg-ink-300'
              }`}
            />
          );
        })}
      </View>
      <StyledText variant="semibold" className="text-ink-500 text-caption">
        {counterText}
      </StyledText>
    </View>
  );
}
