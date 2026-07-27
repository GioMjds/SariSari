import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { AlertCategory } from './AlertFilterPills';

export interface AlertCardItemProps {
  index?: number;
  type: Exclude<AlertCategory, 'all'>;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}

export function AlertCardItem({
  index = 0,
  type,
  title,
  subtitle,
  actionLabel,
  onAction,
}: AlertCardItemProps) {
  const iconConfig = {
    low_stock: {
      icon: 'exclamation-triangle',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    expiring: {
      icon: 'calendar-times',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    overdue_debts: {
      icon: 'user-clock',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    unsynced: { icon: 'sync-alt', color: 'text-sky-600', bg: 'bg-sky-50' },
  }[type];

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onAction();
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, delay: index * 60 }}
      className="bg-paper-50 p-4 rounded-2xl border border-ink-100 mb-3 shadow-sm flex-row items-center justify-between"
    >
      <View className="flex-row items-center flex-1 mr-3">
        <View
          className={`w-10 h-10 rounded-full ${iconConfig.bg} items-center justify-center mr-3`}
        >
          <FontAwesome5
            name={iconConfig.icon as any}
            size={16}
            className={iconConfig.color}
          />
        </View>
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-sm"
            numberOfLines={1}
          >
            {title}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-ink-500 text-xs mt-0.5"
            numberOfLines={2}
          >
            {subtitle}
          </StyledText>
        </View>
      </View>

      <Pressable
        onPress={handleAction}
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel} for ${title}`}
        className="bg-cinnamon-500 px-4 min-h-[44px] rounded-xl items-center justify-center"
      >
        <StyledText variant="extrabold" className="text-paper-50 text-xs">
          {actionLabel}
        </StyledText>
      </Pressable>
    </MotiView>
  );
}
