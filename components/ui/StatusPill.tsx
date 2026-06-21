import React from 'react';
import { View, Text } from 'react-native';

type StatusPillProps = {
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  children: React.ReactNode;
};

const variantMap = {
  success: {
    bg: 'bg-secondary-50',
    text: 'text-secondary-600',
    border: 'border-secondary-600',
  },
  danger: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  info: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  neutral: {
    bg: 'bg-warm-100',
    text: 'text-warm-700',
    border: 'border-warm-300',
  },
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function StatusPill({
  variant,
  size = 'md',
  children,
}: StatusPillProps) {
  const styles = variantMap[variant];

  return (
    <View
      className={`${styles.bg} ${styles.border} border ${sizeMap[size]} rounded-full`}
    >
      <Text className={`${styles.text} font-medium`}>{children}</Text>
    </View>
  );
}
