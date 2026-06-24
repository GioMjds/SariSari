import { type TextStyle } from 'react-native';
import { MotiView } from 'moti';
import { formatCurrency } from '@/utils';
import { StyledText } from '@/components/elements';

type MoneyTextProps = {
  /** Integer centavos. With `fromPesos`, a peso amount that gets ×100. */
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'display' | 'hero';
  variant?: 'default' | 'success' | 'danger';
  /**
   * When true, `value` is interpreted as a peso amount (e.g. 12.50) and is
   * multiplied by 100 internally to produce centavos before formatting.
   * Use this at the render edge when the upstream data is in pesos.
   * Default is false — `value` is treated as integer centavos.
   */
  fromPesos?: boolean;
  /** Currency symbol prefix. Defaults to the Philippine peso sign. */
  currency?: string;
  className?: string;
  style?: TextStyle;
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
 * MoneyText — renders integer-centavo values via `formatCurrency()`,
 * keeping the integer-centavos invariant intact end-to-end (see
 * AGENTS.md §1). The display tier fades between value changes so
 * the receipt total feels alive without distracting the eye.
 */
export function MoneyText({
  value,
  size = 'md',
  variant = 'default',
  fromPesos = false,
  currency = '₱',
  className,
  style,
}: MoneyTextProps) {
  const centavos = fromPesos ? value * 100 : value;
  const pesos = centavos / 100;
  const formatted = formatCurrency(pesos);
  const formattedWithoutPeso = formatted.replace(/^₱/, '');
  const animateValue = size === 'display' || size === 'hero';

  const text = (
    <StyledText
      style={[style, { fontVariant: ['tabular-nums'] }]}
      className={`${sizeMap[size]} ${variantMap[variant]} font-extrabold${className ? ` ${className}` : ''}`}
    >
      {currency !== '₱' && (
        <StyledText
          variant="medium"
          className="text-ink-500 text-sm mr-1.5"
        >
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