import { View, Pressable } from 'react-native';
import { StyledText } from '@/components/elements';

type StatusVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';
type StatusSize = 'sm' | 'md';

type StatusPillProps = {
  variant: StatusVariant;
  size?: StatusSize;
  children: React.ReactNode;
  /**
   * When true, render a small leading dot in the variant color.
   * Useful when stacking pills or when the pill needs to be
   * distinguishable in a busy list.
   */
  dot?: boolean;
  /**
   * When set, the pill becomes a Pressable button with a11y role
   * "button" and a press-scale animation. Useful for "Mark paid"
   * style actions on a customer row.
   */
  onPress?: () => void;
  /** Override the default a11y label (the rendered text is used otherwise). */
  accessibilityLabel?: string;
};

const variantMap: Record<
  StatusVariant,
  { bg: string; text: string; border: string }
> = {
  success: {
    bg: 'bg-sage-50',
    text: 'text-sage-700',
    border: 'border-sage-500',
  },
  danger: {
    bg: 'bg-semantic-danger-50',
    text: 'text-semantic-danger',
    border: 'border-semantic-danger',
  },
  warning: {
    bg: 'bg-semantic-warning-50',
    text: 'text-semantic-warning',
    border: 'border-semantic-warning',
  },
  info: {
    bg: 'bg-semantic-info-50',
    text: 'text-semantic-info',
    border: 'border-semantic-info',
  },
  neutral: {
    bg: 'bg-ink-100',
    text: 'text-ink-700',
    border: 'border-ink-300',
  },
};

const sizeMap: Record<StatusSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

/**
 * StatusPill — a small, color-coded tag rendered on a tinted surface.
 * Replaces the stock Tailwind `bg-red-50` etc. with the brand semantic
 * ramps defined in `tailwind.config.js` so success/danger/warning/info
 * read consistently across the app.
 */
export function StatusPill({
  variant,
  size = 'md',
  children,
  dot = false,
  onPress,
  accessibilityLabel,
}: StatusPillProps) {
  const styles = variantMap[variant];
  const a11yLabel = accessibilityLabel ?? (typeof children === 'string' ? children : undefined);

  const content = (
    <>
      {dot && (
        <View
          testID="status-pill-dot"
          className="w-1.5 h-1.5 rounded-full bg-current opacity-80 mr-1.5"
        />
      )}
      <StyledText
        variant="semibold"
        className={`${styles.text} ${sizeMap[size]}`}
      >
        {children}
      </StyledText>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        className={`${styles.bg} ${styles.border} border ${sizeMap[size]} rounded-full press-scale active:opacity-70 self-start flex-row items-center`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className={`${styles.bg} ${styles.border} border ${sizeMap[size]} rounded-full self-start flex-row items-center`}
    >
      {content}
    </View>
  );
}