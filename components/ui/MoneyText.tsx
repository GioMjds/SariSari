import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import { MotiView } from 'moti';
import { type TextStyle } from 'react-native';

type MoneyTextProps = {
  /** Integer pesos. */
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'display' | 'hero';
  variant?: 'default' | 'success' | 'danger';
  /** Currency symbol prefix. Defaults to the Philippine peso sign. */
  currency?: string;
  className?: string;
  style?: TextStyle;
  /** Cap the line count so big totals don't wrap and break the layout. */
  numberOfLines?: number;
};

const sizeMap: Record<NonNullable<MoneyTextProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  display: 'text-display',
  hero: 'text-hero',
};

const variantMap = {
  default: 'text-warm-900',
  success: 'text-semantic-success',
  danger: 'text-semantic-danger',
};

/**
 * MoneyText — renders integer-peso values via `formatPesos()`,
 * keeping the integer-pesos invariant intact end-to-end. 
 * The display tier fades between value changes so the receipt
 * total feels alive without distracting the eye.
 */
export function MoneyText({
  value,
  size = 'md',
  variant = 'default',
  currency = '₱',
  className,
  style,
  numberOfLines,
}: MoneyTextProps) {
  const formatted = formatPesos(value);
  const formattedWithoutPeso = formatted.replace(/^₱/, '');
  const animateValue = size === 'display' || size === 'hero';

  const text = (
    <StyledText
      numberOfLines={numberOfLines}
      style={[style, { fontVariant: ['tabular-nums'] }]}
      className={`${sizeMap[size]} ${variantMap[variant]} font-extrabold${className ? ` ${className}` : ''}`}
    >
      {currency !== '₱' && (
        <StyledText variant="medium" className="text-ink-500 text-sm mr-1.5">
          {currency}
        </StyledText>
      )}
      {currency === '₱' ? formatted : formattedWithoutPeso}
    </StyledText>
  );

  if (!animateValue) return text;

  return (
    <MotiView
      key={formatted}
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 220 }}
    >
      {text}
    </MotiView>
  );
}
