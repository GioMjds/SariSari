import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';

/**
 * StatusStamp — a rotated, double-stroked badge that reads like an
 * inked rubber stamp. Use sparingly — it's loud. Best on hero surfaces.
 *
 * Mounts with a spring rotate-in and respects the OS-level "Reduce
 * Motion" setting: when enabled, the stamp fades in without rotate/scale.
 *
 * @example
 *   <StatusStamp label="CASH" tone="sage" />
 *   <StatusStamp label="CREDIT" tone="persimmon" />
 */

type Tone = 'persimmon' | 'sage' | 'cinnamon' | 'ink';

const TONE_MAP: Record<Tone, { border: string; text: string; bg: string }> = {
  persimmon: {
    border: 'border-persimmon-500',
    text: 'text-persimmon-600',
    bg: 'bg-persimmon-50',
  },
  sage: { border: 'border-sage-500', text: 'text-sage-600', bg: 'bg-sage-50' },
  cinnamon: {
    border: 'border-cinnamon-500',
    text: 'text-cinnamon-700',
    bg: 'bg-cinnamon-50',
  },
  ink: { border: 'border-ink-700', text: 'text-ink-700', bg: 'bg-paper-50' },
};

type Props = {
  label: string;
  tone?: Tone;
  rotate?: number;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
};

export function StatusStamp({
  label,
  tone = 'persimmon',
  rotate = -6,
  size = 'md',
  icon,
}: Props) {
  const colors = TONE_MAP[tone];
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

  const sizeClasses = {
    sm: 'px-3 py-1',
    md: 'px-4 py-2',
    lg: 'px-5 py-3',
  }[size];

  const textClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  }[size];

  return (
    <MotiView
      from={{
        opacity: 0,
        rotate: '0deg',
        scale: reducedMotion ? 1 : 0.9,
      }}
      animate={{
				opacity: 1,
				rotate: reducedMotion ? '0deg' : `${rotate}deg`,
				scale: 1,
			}}
      transition={
        reducedMotion
          ? { type: 'timing', duration: 180 }
          : { type: 'spring', damping: 12, stiffness: 180 }
      }
    >
      <View
        accessibilityRole="text"
        accessibilityLabel={label}
        className={`${colors.bg} ${colors.border} border-2 rounded-md ${sizeClasses} flex-row items-center self-start`}
      >
        {icon && <View className="mr-1.5">{icon}</View>}
        <StyledText
          variant="extrabold"
          className={`${colors.text} ${textClasses}`}
          style={{ letterSpacing: 1.5 }}
        >
          {label}
        </StyledText>
      </View>
    </MotiView>
  );
}
