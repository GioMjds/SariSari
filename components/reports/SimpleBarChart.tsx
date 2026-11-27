import { StyledText } from '@/components/elements';
import { format, parseISO } from 'date-fns';
import { MotiView } from 'moti';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { formatCompactCurrency } from '@/utils';

interface SimpleBarChartProps {
  data: { date: string; amount: number }[];
  height?: number;
  barColor?: string;
  accentColor?: string;
  _dataKey?: string;
}

export const AlmanacBarChart = memo(function AlmanacBarChart({
  data,
  height = 200,
  barColor = '#623418',
  accentColor = '#E85A1F',
}: SimpleBarChartProps) {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const hasMounted = useRef(false);
  const shouldAnimate = hasMounted.current;

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  if (data.length === 0) {
    return (
      <View
        className="items-center justify-center border border-dashed border-ink-200 rounded-md"
        style={{ height }}
      >
        <StyledText variant="extrabold" className="text-sm text-ink-500 mb-1">
          {t('common:reports.trend.empty')}
        </StyledText>
        <StyledText variant="medium" className="text-ink-500 text-xs">
          {t('common:reports.trend.emptyHint')}
        </StyledText>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.amount), 1);
  const maxIndex = data.reduce(
    (maxIdx, p, i, arr) => (p.amount > (arr[maxIdx]?.amount ?? 0) ? i : maxIdx),
    0,
  ) as number;
  const todayIndex = data.length - 1;

  const formatLabel = (v: number) => {
    return formatCompactCurrency(v);
  };

  const peakDay = data[maxIndex];

  return (
    <View
      accessibilityLabel={t('common:reports.trend.chartA11y', {
        day: peakDay ? format(parseISO(peakDay.date), 'EEE d') : '',
        amount: formatLabel(peakDay?.amount ?? 0),
      })}
    >
      {/* Headline row */}
      <View className="flex-row items-baseline justify-between mb-3">
        <StyledText variant="extrabold" className="text-sm text-ink-900">
          {t('common:reports.trend.chartTitle')}
        </StyledText>
        <StyledText variant="semibold" className="text-xs text-persimmon-700">
          {t('common:reports.trend.peak', {
            amount: formatLabel(peakDay?.amount ?? 0),
          })}
        </StyledText>
      </View>

      {/* Chart area */}
      <View
        className="flex-row items-end justify-between px-1"
        style={{ height }}
      >
        {data.map((point, index) => {
          const barHeight = (point.amount / maxValue) * (height - 56);
          const isPeak = index === maxIndex;
          const isToday = index === todayIndex;
          const isSelected = selectedIndex === index;
          const day = parseISO(point.date);
          const label = (
            <StyledText
              variant="extrabold"
              className="text-[10px] text-ink-900"
              style={{ letterSpacing: 0.4 }}
            >
              {formatLabel(point.amount)}
            </StyledText>
          );
          const fill = isPeak ? accentColor : isSelected ? '#623418' : barColor;

          return (
            <Pressable
              key={`bar-${index}`}
              onPress={() => setSelectedIndex(isSelected ? null : index)}
              accessibilityRole="button"
              accessibilityLabel={t('common:reports.trend.barA11y', {
                day: format(day, 'EEE d'),
                amount: formatLabel(point.amount),
              })}
              accessibilityState={{ selected: isSelected }}
              className="flex-1 items-center justify-end mx-0.5"
            >
              {/* Value label (only on peak or selected for clarity) */}
              {isPeak || isSelected ? (
                <MotiView
                  from={{ opacity: shouldAnimate ? 0 : 1 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 220 }}
                  className="mb-1"
                >
                  {label}
                </MotiView>
              ) : (
                // Hidden placeholder keeps bar heights aligned without an animated node per bar.
                <View className="mb-1" style={{ opacity: 0 }}>
                  {label}
                </View>
              )}

              {/* Inked column */}
              <View className="w-full items-center">
                <View
                  className="w-full"
                  style={{
                    height: Math.max(barHeight, 6),
                    backgroundColor: fill,
                  }}
                />
                {/* Tick mark base (a 1px dark line under the bar) */}
                <View className="w-full h-[2px] bg-ink-900 mt-0" />
              </View>

              {/* Day label */}
              <View className="mt-2 items-center">
                <StyledText
                  variant="semibold"
                  className={`text-[10px] ${
                    isToday ? 'text-persimmon-600' : 'text-ink-700'
                  }`}
                  style={{ letterSpacing: 0.3 }}
                >
                  {day.getDate()}
                </StyledText>
                <StyledText
                  variant="medium"
                  className="text-[10px] text-ink-400 uppercase"
                  style={{ letterSpacing: 1 }}
                >
                  {format(day, 'EEE')}
                </StyledText>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Baseline rule */}
      <View className="h-px bg-ink-900 mt-2 mx-1" />
    </View>
  );
});

export { AlmanacBarChart as SimpleBarChart };
