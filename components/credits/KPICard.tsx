import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: keyof typeof FontAwesome.glyphMap;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  onPress?: () => void;
}

export default function KPICard({
  title,
  value,
  icon,
  iconColor = '#B45309',
  trend,
  subtitle,
  onPress,
}: KPICardProps) {
  const Content = (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-warm-100">
      <View className="flex-row items-center justify-between mb-2">
        <StyledText variant="medium" className="text-warm-700 text-xs">
          {title}
        </StyledText>
        {icon && <FontAwesome name={icon} size={16} color={iconColor} />}
      </View>

      <View className="flex-row items-end justify-between">
        <StyledText variant="extrabold" className="text-2xl text-primary-500">
          {value}
        </StyledText>

        {trend && (
          <View className="flex-row items-center">
            <FontAwesome
              name={
                trend === 'up'
                  ? 'arrow-up'
                  : trend === 'down'
                    ? 'arrow-down'
                    : 'minus'
              }
              size={12}
              color={
                trend === 'up'
                  ? '#65A30D'
                  : trend === 'down'
                    ? '#DC2626'
                    : '#A8A29E'
              }
            />
          </View>
        )}
      </View>

      {subtitle && (
        <StyledText variant="regular" className="text-warm-600 text-xs mt-1">
          {subtitle}
        </StyledText>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
}
