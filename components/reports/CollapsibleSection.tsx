import { StyledText } from '@/components/elements';
import { AnimatePresence, MotiView } from 'moti';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

/**
 * CollapsibleSection — A "tear-off coupon" style accordion.
 * Visually mimics a folded perforated receipt: a heading strip
 * with a perforation rule, a small inked chevron, and an
 * expandable body that animates its height with a smooth slide.
 *
 * Uses Moti's enter/exit transitions on the body container,
 * while the heading itself stays pinned.
 */

type CollapsibleSectionProps = {
  number: string;
  title: string;
  subtitle?: string;
  tone?: 'persimmon' | 'sage' | 'cinnamon' | 'ink';
  icon?: ReactNode;
  /** Controlled or uncontrolled default. */
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children: ReactNode;
  rightBadge?: ReactNode;
};

const TONE_NUMBER_COLOR: Record<
  NonNullable<CollapsibleSectionProps['tone']>,
  string
> = {
  persimmon: 'text-persimmon-600',
  sage: 'text-sage-600',
  cinnamon: 'text-cinnamon-700',
  ink: 'text-ink-700',
};

const TONE_ICON_BG: Record<
  NonNullable<CollapsibleSectionProps['tone']>,
  string
> = {
  persimmon: 'bg-persimmon-100',
  sage: 'bg-sage-100',
  cinnamon: 'bg-cinnamon-100',
  ink: 'bg-ink-100',
};

const TONE_BAR: Record<NonNullable<CollapsibleSectionProps['tone']>, string> = {
  persimmon: 'bg-persimmon-500',
  sage: 'bg-sage-500',
  cinnamon: 'bg-cinnamon-500',
  ink: 'bg-ink-900',
};

export function CollapsibleSection({
  number,
  title,
  subtitle,
  tone = 'persimmon',
  icon,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  children,
  rightBadge,
}: CollapsibleSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const handlePress = () => {
    if (!isControlled) setInternalExpanded((v) => !v);
    onToggle?.();
  };

  return (
    <View className="rounded-card bg-paper-50 shadow-paper overflow-hidden border border-ink-100">
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${isExpanded ? 'expanded' : 'collapsed'}`}
        className="active:opacity-80"
      >
        {/* Top tone bar */}
        <View className={`h-1 ${TONE_BAR[tone]}`} />

        <View className="px-4 pt-4 pb-4 flex-row items-center">
          <View
            className={`w-10 h-10 rounded-md items-center justify-center mr-3 ${TONE_ICON_BG[tone]}`}
          >
            {icon}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center">
              <StyledText
                variant="extrabold"
                className={`text-label ${TONE_NUMBER_COLOR[tone]} mr-2`}
                style={{ letterSpacing: 1.6 }}
              >
                {number}
              </StyledText>
              {rightBadge}
            </View>
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-lg"
              style={{ letterSpacing: -0.2 }}
            >
              {title}
            </StyledText>
            {subtitle && (
              <StyledText
                variant="medium"
                className="text-ink-400 text-xs mt-0.5"
              >
                {subtitle}
              </StyledText>
            )}
          </View>

          {/* Chevron stamp */}
          <MotiView
            animate={{ rotate: isExpanded ? '180deg' : '0deg' }}
            transition={{ type: 'timing', duration: 180 }}
            className="w-7 h-7 rounded-full border border-ink-200 items-center justify-center"
          >
            <StyledText variant="extrabold" className="text-ink-700 text-xs">
              ▾
            </StyledText>
          </MotiView>
        </View>

        {/* Perforation rule between header and body */}
        <View
          style={{
            marginHorizontal: 16,
            borderBottomWidth: 1,
            borderStyle: 'dashed',
            borderColor: '#D1D5DC',
          }}
        />
      </Pressable>

      {/* Body */}
      <AnimatePresence>
        {isExpanded && (
          <MotiView
            from={{ opacity: 0, translateY: -4 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -4 }}
            transition={{ type: 'timing', duration: 220 }}
          >
            <View className="px-4 py-4">{children}</View>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}
