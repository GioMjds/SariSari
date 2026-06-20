import React from 'react';
import { Text } from 'react-native';
import { formatCompactCurrency, formatCurrency } from '@/utils/formatters';

type MoneyTextProps = {
  value: number; // integer centavos
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'display';
  variant?: 'default' | 'success' | 'danger';
  compact?: boolean;
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
}: MoneyTextProps) {
  const pesos = value / 100;

  const formatted = compact
    ? formatCompactCurrency(pesos)
    : formatCurrency(pesos);

  return (
    <Text className={`${sizeMap[size]} ${variantMap[variant]} font-extrabold`}>
      {formatted}
    </Text>
  );
}

export { MoneyText };
