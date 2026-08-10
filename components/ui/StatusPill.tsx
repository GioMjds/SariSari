import { View, Pressable } from 'react-native';
import { StyledText } from '@/components/elements';

type StatusVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';
type StatusSize = 'sm' | 'md';

type StatusPillProps = {
  variant: StatusVariant;
  size?: StatusSize;
  children: React.ReactNode;
  dot?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

type VariantMap = {
  bg: string;
  text: string;
  border: string;
};

const variantMap = {
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
} satisfies Record<StatusVariant, VariantMap>;

const containerSizeMap = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
} satisfies Record<StatusSize, string>;

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
} satisfies Record<StatusSize, string>;

export function StatusPill({
  variant,
  size = 'md',
  children,
  dot = false,
  onPress,
  accessibilityLabel,
}: StatusPillProps) {
  const styles = variantMap[variant];
  const a11yLabel =
    accessibilityLabel ?? (typeof children === 'string' ? children : undefined);

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
        className={`${styles.text} ${textSizeMap[size]}`}
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
        className={`${styles.bg} ${styles.border} border ${containerSizeMap[size]} rounded-full press-scale active:opacity-70 self-start flex-row items-center`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className={`${styles.bg} ${styles.border} border ${containerSizeMap[size]} rounded-full self-start flex-row items-center`}
    >
      {content}
    </View>
  );
}
