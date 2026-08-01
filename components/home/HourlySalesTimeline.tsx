import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatCurrency, HourlySalesGroup } from '@/utils';

export interface HourlySalesTimelineProps {
  hourlyData: HourlySalesGroup[];
}

export function HourlySalesTimeline({ hourlyData }: HourlySalesTimelineProps) {
  const filteredHours = hourlyData.filter(
    (h) => h.total > 0 || (h.hour >= 7 && h.hour <= 21),
  );
  const maxTotal = Math.max(...filteredHours.map((h) => h.total), 1);

  const formatHourLabel = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:00 ${period}`;
  };

  return (
    <View className="px-4 mb-4">
      <View className="bg-paper-50 rounded-2xl p-4 border border-ink-100 shadow-sm">
        <StyledText variant="extrabold" className="text-ink-900 text-sm mb-3">
          Peak Sales Hours
        </StyledText>
        <View className="gap-2.5">
          {filteredHours.slice(0, 6).map((item) => {
            const barPct = Math.round((item.total / maxTotal) * 100);
            return (
              <View key={item.hour} className="flex-row items-center">
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-xs w-16"
                >
                  {formatHourLabel(item.hour)}
                </StyledText>
                <View className="flex-1 h-3 bg-paper-200 rounded-full mx-2 overflow-hidden">
                  <View
                    className="h-full bg-cinnamon-500 rounded-full"
                    style={{ width: `${barPct}%` }}
                  />
                </View>
                <StyledText
                  variant="extrabold"
                  className="text-ink-800 text-xs w-16 text-right"
                >
                  {formatCurrency(item.total)}
                </StyledText>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
