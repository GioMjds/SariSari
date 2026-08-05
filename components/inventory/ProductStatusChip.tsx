import React from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export type ProductStockStatus =
  'healthy' | 'low_stock' | 'out_of_stock' | 'near_expiry' | 'newly_added';

export interface ProductStatusChipProps {
  status: ProductStockStatus;
}

interface StatusConfig {
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
  iconColor: string;
  bg: string;
  border: string;
  text: string;
}

const STATUS_CONFIG = {
  healthy: {
    label: 'Healthy',
    icon: 'check-circle',
    iconColor: '#2D6A4F',
    bg: 'bg-sage-50',
    border: 'border-sage-500',
    text: 'text-sage-700',
  },
  low_stock: {
    label: 'Low Stock',
    icon: 'exclamation-triangle',
    iconColor: '#B45309',
    bg: 'bg-amber-50',
    border: 'border-amber-500',
    text: 'text-amber-700',
  },
  out_of_stock: {
    label: 'Out of Stock',
    icon: 'times-circle',
    iconColor: '#BE123C',
    bg: 'bg-rose-50',
    border: 'border-rose-500',
    text: 'text-rose-700',
  },
  near_expiry: {
    label: 'Near Expiry',
    icon: 'clock-o',
    iconColor: '#C2410C',
    bg: 'bg-persimmon-50',
    border: 'border-persimmon-500',
    text: 'text-persimmon-700',
  },
  newly_added: {
    label: 'Newly Added',
    icon: 'star',
    iconColor: '#78350F',
    bg: 'bg-paper-100',
    border: 'border-cinnamon-500',
    text: 'text-cinnamon-700',
  },
} satisfies Record<ProductStockStatus, StatusConfig>;

export function ProductStatusChip({ status }: ProductStatusChipProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={cfg.label}
      className={`flex-row items-center gap-x-1 px-2.5 h-6.5 rounded-pill border ${cfg.bg} ${cfg.border}`}
    >
      <FontAwesome name={cfg.icon} size={11} color={cfg.iconColor} />
      <StyledText
        variant="extrabold"
        className={`text-xs ${cfg.text}`}
      >
        {cfg.label}
      </StyledText>
    </View>
  );
}
