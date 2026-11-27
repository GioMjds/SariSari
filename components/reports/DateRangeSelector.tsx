import { StyledText } from '@/components/elements';
import { DateRangeType } from '@/types';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableOpacity, View } from 'react-native';

interface DateRangeSelectorProps {
  activeRange: DateRangeType;
  onRangeChange: (range: DateRangeType) => void;
}

const ranges = [
  'today',
  'yesterday',
  'last7days',
  'thisMonth',
] satisfies DateRangeType[];

export function DateRangeSelector({
  activeRange,
  onRangeChange,
}: DateRangeSelectorProps) {
  const { t } = useTranslation();
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 12 }}
      >
        {ranges.map((range) => {
          const isActive = activeRange === range;
          return (
            <TouchableOpacity
              key={range}
              activeOpacity={0.7}
              onPress={() => onRangeChange(range)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`mr-2 rounded-pill overflow-hidden border ${
                isActive
                  ? 'bg-ink-900 border-ink-900'
                  : 'bg-paper-50 border-ink-200'
              }`}
            >
              <View className="px-4 py-3 flex-row items-center">
                {isActive && (
                  <View className="w-1.5 h-1.5 rounded-full bg-persimmon-500 mr-1.5" />
                )}
                <StyledText
                  variant={isActive ? 'extrabold' : 'semibold'}
                  className={`text-xs ${
                    isActive ? 'text-paper-50' : 'text-ink-700'
                  }`}
                  style={{ letterSpacing: 0.4 }}
                >
                  {t(`common:reports.ranges.${range}`)}
                </StyledText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
