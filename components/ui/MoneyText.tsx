import React from 'react';
import { formatCompactCurrency, formatCurrency } from '@/utils/formatters';
import StyledText from '../elements/StyledText';

type MoneyTextProps = {
  value: number; // integer centavos OR pesos (see fromPesos)
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'display';
  variant?: 'default' | 'success' | 'danger';
  compact?: boolean;
  /**
   * When true, `value` is interpreted as a peso amount (e.g. 12.50) and is
   * multiplied by 100 internally to produce centavos before formatting.
   * Use this at the render edge when the upstream data is in pesos.
   * Default is false — `value` is treated as integer centavos.
   */
  fromPesos?: boolean;
  className?: string;
};

const sizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  display: 'text-display',
};

const variantMap = {
  default: 'text-warm-900',
  success: 'text-semantic-success',
  danger: 'text-semantic-danger',
};

export default function MoneyText({
  value,
  size = 'md',
  variant = 'default',
  compact = false,
  fromPesos = false,
  className,
}: MoneyTextProps) {
  const centavos = fromPesos ? value * 100 : value;
  const pesos = centavos / 100;

  const formatted = compact
    ? formatCompactCurrency(pesos)
    : formatCurrency(pesos);

  return (
    <StyledText
      className={`${sizeMap[size]} ${variantMap[variant]} font-extrabold${className ? ` ${className}` : ''}`}
    >
      {formatted}
    </StyledText>
  );
}
