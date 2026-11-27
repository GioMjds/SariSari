import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { memo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type BentoGridProps = {
  children: ReactNode[];
};

export function BentoGrid({ children }: BentoGridProps) {
  return <View className="gap-3">{children}</View>;
}

/** Small "?" button that opens a plain-language explanation; hit area reaches 44pt. */
export function InfoButton({
  onPress,
  label,
  tone = 'ink',
}: {
  onPress: () => void;
  label: string;
  tone?: 'ink' | 'paper';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      className={`w-6 h-6 rounded-full items-center justify-center active:opacity-60 ${
        tone === 'paper' ? 'bg-paper-50/20' : 'bg-ink-100'
      }`}
    >
      <FontAwesome
        name="question"
        size={11}
        color={tone === 'paper' ? '#FBF7EE' : '#564E45'}
      />
    </Pressable>
  );
}

export type Delta = { pct: number; label: string };

/** Change against the previous period; direction is carried by icon and words, not color alone. */
export function DeltaChip({
  delta,
  goodWhenUp = true,
  onDark = false,
}: {
  delta: Delta;
  goodWhenUp?: boolean;
  onDark?: boolean;
}) {
  const up = delta.pct > 0;
  const flat = delta.pct === 0;
  const good = flat ? null : up === goodWhenUp;
  const text = onDark
    ? 'text-paper-50'
    : good === null
      ? 'text-ink-600'
      : good
        ? 'text-sage-700'
        : 'text-semantic-danger';
  const bg = onDark
    ? 'bg-paper-50/15'
    : good === null
      ? 'bg-ink-100'
      : good
        ? 'bg-sage-50'
        : 'bg-semantic-danger-50';
  const iconColor = onDark
    ? '#FBF7EE'
    : good === null
      ? '#564E45'
      : good
        ? '#3D5E1B'
        : '#C13030';

  return (
    <View
      className={`self-start flex-row items-center rounded-pill px-2 py-1 ${bg}`}
    >
      <FontAwesome
        name={flat ? 'minus' : up ? 'arrow-up' : 'arrow-down'}
        size={10}
        color={iconColor}
      />
      <StyledText variant="semibold" className={`text-xs ml-1 ${text}`}>
        {delta.label}
      </StyledText>
    </View>
  );
}

type BentoHeroProps = {
  kicker: string;
  headline: string;
  subline?: string;
  footer?: ReactNode;
  icon?: ReactNode;
  info?: ReactNode;
  delta?: ReactNode;
  accent?: 'persimmon' | 'sage' | 'cinnamon' | 'ink';
  animationKey?: string;
  accessibilityLabel?: string;
};

const HERO_ACCENT_BG = {
  persimmon: 'bg-persimmon-500',
  sage: 'bg-sage-700',
  cinnamon: 'bg-cinnamon-500',
  ink: 'bg-ink-900',
} satisfies Record<NonNullable<BentoHeroProps['accent']>, string>;

export const BentoHero = memo(function BentoHero({
  kicker,
  headline,
  subline,
  footer,
  icon,
  info,
  delta,
  accent = 'persimmon',
  animationKey,
  accessibilityLabel,
}: BentoHeroProps) {
  const reducedMotion = useReducedMotion();

  return (
    <MotiView
      key={animationKey}
      from={{
        opacity: reducedMotion ? 1 : 0,
        translateY: reducedMotion ? 0 : 12,
      }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: reducedMotion ? 0 : 240 }}
      className={`rounded-card overflow-hidden ${HERO_ACCENT_BG[accent]} shadow-paper-lift`}
    >
      <View className="px-5 pt-4 pb-4">
        <View className="flex-row items-start">
          <View
            accessible
            accessibilityLabel={accessibilityLabel}
            className="flex-1"
          >
            <View className="flex-row items-center">
              {icon && <View className="mr-2 opacity-90">{icon}</View>}
              <StyledText
                variant="extrabold"
                className="text-sm text-paper-100"
              >
                {kicker}
              </StyledText>
            </View>

            <StyledText
              variant="black"
              className="text-paper-50 mt-1"
              style={{ fontSize: 44, lineHeight: 50, letterSpacing: -1.2 }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {headline}
            </StyledText>
            {subline && (
              <StyledText
                variant="medium"
                className="text-paper-100 text-sm leading-5"
              >
                {subline}
              </StyledText>
            )}
          </View>
          {info}
        </View>
        {delta && <View className="mt-2">{delta}</View>}
      </View>

      {footer && <View className="bg-paper-50 px-5 py-4">{footer}</View>}
    </MotiView>
  );
});

/**
 * BentoKPICard — secondary KPI tile. Each variant gets a topical accent
 * strip on the left so they're distinguishable in a glance.
 */
type BentoKPICardProps = {
  kicker: string;
  headline: string;
  subline?: string;
  icon: ReactNode;
  info?: ReactNode;
  delta?: ReactNode;
  accent: 'sage' | 'persimmon' | 'cinnamon' | 'ink';
  footer?: ReactNode;
};

const CARD_ACCENT_BAR: Record<BentoKPICardProps['accent'], string> = {
  sage: 'bg-sage-500',
  persimmon: 'bg-persimmon-500',
  cinnamon: 'bg-cinnamon-500',
  ink: 'bg-ink-900',
};

const CARD_ICON_BG: Record<BentoKPICardProps['accent'], string> = {
  sage: 'bg-sage-100',
  persimmon: 'bg-persimmon-100',
  cinnamon: 'bg-cinnamon-100',
  ink: 'bg-ink-100',
};

export const BentoKPICard = memo(function BentoKPICard({
  kicker,
  headline,
  subline,
  icon,
  info,
  delta,
  accent,
  footer,
}: BentoKPICardProps) {
  return (
    <View className="flex-1 rounded-card bg-paper-50 shadow-paper overflow-hidden flex-row">
      {/* Left accent rule — like the binding edge of a passport */}
      <View className={`w-1.5 ${CARD_ACCENT_BAR[accent]}`} />

      <View className="flex-1 p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View
            className={`w-9 h-9 rounded-md items-center justify-center ${CARD_ICON_BG[accent]}`}
          >
            {icon}
          </View>
          {info}
        </View>

        <StyledText variant="extrabold" className="text-xs text-ink-600 mb-1">
          {kicker}
        </StyledText>

        <StyledText
          variant="black"
          className="text-ink-900"
          style={{ fontSize: 24, lineHeight: 28, letterSpacing: -0.6 }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {headline}
        </StyledText>

        {subline && (
          <StyledText
            variant="medium"
            className="text-ink-500 text-xs mt-0.5"
            numberOfLines={2}
          >
            {subline}
          </StyledText>
        )}

        {delta && <View className="mt-2">{delta}</View>}

        {footer && (
          <View className="mt-3 pt-2 border-t border-dashed border-ink-200">
            {footer}
          </View>
        )}
      </View>
    </View>
  );
});
