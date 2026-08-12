import { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export type AlertKind = 'low' | 'out' | 'near_expiry' | 'overstock';

let globalReducedMotionCached = false;
let globalReducedMotionInitialized = false;

export interface InventoryAlertPillsProps {
  counts: { low: number; out: number; nearExpiry: number; overstock: number };
  onPress: (kind: AlertKind) => void;
}

interface PillConfig {
  kind: AlertKind;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
  iconColor: string;
  bg: string;
  border: string;
  text: string;
}

const PILLS = [
  {
    kind: 'low',
    label: 'Low',
    icon: 'exclamation-triangle',
    iconColor: '#B45309',
    bg: 'bg-amber-50',
    border: 'border-amber-500',
    text: 'text-amber-700',
  },
  {
    kind: 'out',
    label: 'Out',
    icon: 'times-circle',
    iconColor: '#BE123C',
    bg: 'bg-rose-50',
    border: 'border-rose-500',
    text: 'text-rose-700',
  },
  {
    kind: 'near_expiry',
    label: 'Near Expiry',
    icon: 'clock-o',
    iconColor: '#C2410C',
    bg: 'bg-persimmon-50',
    border: 'border-persimmon-500',
    text: 'text-persimmon-700',
  },
  {
    kind: 'overstock',
    label: 'Overstock',
    icon: 'arrow-up',
    iconColor: '#78350F',
    bg: 'bg-cinnamon-50',
    border: 'border-cinnamon-500',
    text: 'text-cinnamon-700',
  },
] satisfies PillConfig[];

export function InventoryAlertPills({
  counts,
  onPress,
}: InventoryAlertPillsProps) {
  const [reduceMotion, setReduceMotion] = useState(
    () => globalReducedMotionCached,
  );

  useEffect(() => {
    let active = true;
    if (!globalReducedMotionInitialized) {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
        globalReducedMotionCached = enabled;
        globalReducedMotionInitialized = true;
        if (active) setReduceMotion(enabled);
      });
    }
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        globalReducedMotionCached = enabled;
        globalReducedMotionInitialized = true;
        if (active) setReduceMotion(enabled);
      },
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const handlePress = (kind: AlertKind) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress(kind);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="py-1 gap-2"
    >
      {PILLS.map((pill, i) => {
        const count =
          pill.kind === 'low'
            ? counts.low
            : pill.kind === 'out'
              ? counts.out
              : pill.kind === 'near_expiry'
                ? counts.nearExpiry
                : counts.overstock;

        // Replace the `any` type of the `Wrapper` variable for proper type invocation
        const Wrapper: any = reduceMotion ? View : MotiView;
        
        const wrapperProps = reduceMotion
          ? {}
          : {
              from: { opacity: 0, translateY: 6 },
              animate: { opacity: 1, translateY: 0 },
              transition: { type: 'timing', duration: 200, delay: 60 * i },
            };

        return (
          <Wrapper key={pill.kind} {...wrapperProps}>
            <Pressable
              onPress={() => handlePress(pill.kind)}
              accessibilityRole="button"
              accessibilityLabel={`${pill.label} stock pill, ${count} items`}
              accessibilityState={{ selected: false }}
              className={`min-h-[44px] px-3 rounded-pill flex-row items-center gap-1.5 border ${pill.bg} ${pill.border}`}
            >
              <FontAwesome name={pill.icon} size={12} color={pill.iconColor} />
              <StyledText
                variant="extrabold"
                className={`text-xs ${pill.text}`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {count}
              </StyledText>
              <StyledText variant="medium" className={`text-xs ${pill.text}`}>
                {pill.label}
              </StyledText>
            </Pressable>
          </Wrapper>
        );
      })}
    </ScrollView>
  );
}
