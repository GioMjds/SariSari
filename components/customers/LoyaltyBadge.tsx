import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { LoyaltyTier } from '@/types/credits.types';

interface LoyaltyBadgeProps {
  tier?: LoyaltyTier;
  showLabel?: boolean;
}

type LoyaltyBadgeConfig = {
  label: string;
  stars: number;
  color: string;
  bg: string;
};

export const LoyaltyBadge: React.FC<LoyaltyBadgeProps> = ({
  tier = 'new',
  showLabel = true,
}) => {
  const config = {
    new: { label: 'New', stars: 1, color: '#4F7A24', bg: 'bg-sage-100' },
    regular: {
      label: 'Regular',
      stars: 2,
      color: '#E85A1F',
      bg: 'bg-cinnamon-100',
    },
    loyal: { label: 'Loyal', stars: 3, color: '#D97706', bg: 'bg-amber-100' },
    vip: { label: 'VIP', stars: 4, color: '#7C3AED', bg: 'bg-purple-100' },
    elite: { label: 'Elite', stars: 5, color: '#059669', bg: 'bg-emerald-100' },
  } satisfies Record<LoyaltyTier, LoyaltyBadgeConfig>;

  const current = config[tier] || config.new;

  return (
    <View
      className={`flex-row items-center px-2 py-0.5 rounded-full ${current.bg}`}
    >
      <View className="flex-row items-center mr-1">
        {Array.from({ length: current.stars }).map((_, i) => (
          <FontAwesome
            key={i}
            name="star"
            size={10}
            color={current.color}
            style={{ marginRight: i < current.stars - 1 ? 1 : 0 }}
          />
        ))}
      </View>
      {showLabel && (
        <StyledText
          variant="semibold"
          className="text-[10px]"
          style={{ color: current.color }}
        >
          {current.label}
        </StyledText>
      )}
    </View>
  );
};
