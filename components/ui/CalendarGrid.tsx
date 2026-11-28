import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import {
  MONTHS,
  WEEKDAYS,
  formatSpoken,
  monthCells,
  toIso,
} from '@/lib/calendar';

export interface DayHighlight {
  from: string;
  to: string;
}

interface DaysProps {
  year: number;
  m0: number;
  selected: string;
  today: string;
  highlight?: DayHighlight | undefined;
  onSelect: (iso: string) => void;
}

const inRange = (iso: string, h?: DayHighlight) =>
  !!h && iso >= h.from && iso <= h.to;

/** Weekday header plus a fixed 6-week grid. A highlight range renders as one continuous band. */
export const CalendarDays = memo(function CalendarDays({
  year,
  m0,
  selected,
  today,
  highlight,
  onSelect,
}: DaysProps) {
  const cells = monthCells(year, m0);
  const weeks = Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  return (
    <View>
      <View className="flex-row">
        {WEEKDAYS.map((w, i) => (
          <View key={i} className="flex-1 h-8 items-center justify-center">
            <StyledText variant="extrabold" className="text-xs text-ink-500">
              {w}
            </StyledText>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((day, col) => {
            if (day === null) return <View key={col} className="flex-1 h-11" />;
            const iso = toIso(year, m0, day);
            const prev = week[col - 1];
            const next = week[col + 1];
            const banded = inRange(iso, highlight);
            const bandLeft = banded && !(prev != null && inRange(toIso(year, m0, prev), highlight));
            const bandRight = banded && !(next != null && inRange(toIso(year, m0, next), highlight));
            const isSelected = iso === selected;
            const isToday = iso === today;
            const isPast = iso < today;

            return (
              <Pressable
                key={col}
                onPress={() => onSelect(iso)}
                accessibilityRole="button"
                accessibilityLabel={`${formatSpoken(iso)}${isToday ? ', today' : ''}`}
                accessibilityState={{ selected: isSelected }}
                className="flex-1 h-11 items-center justify-center"
              >
                {({ pressed }) => (
                  <>
                    {banded ? (
                      <View
                        className={`absolute inset-y-0.5 inset-x-0 bg-persimmon-50 ${
                          bandLeft ? 'rounded-l-full ml-0.5' : ''
                        } ${bandRight ? 'rounded-r-full mr-0.5' : ''}`}
                      />
                    ) : null}
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        isSelected
                          ? 'bg-persimmon-600'
                          : isToday
                            ? 'border-2 border-cinnamon-500'
                            : ''
                      }`}
                      style={
                        pressed && !isSelected
                          ? { backgroundColor: '#E9E5D8' }
                          : undefined
                      }
                    >
                      <StyledText
                        variant={isSelected || isToday ? 'extrabold' : 'medium'}
                        className={`text-[15px] ${
                          isSelected
                            ? 'text-paper-50'
                            : isToday
                              ? 'text-cinnamon-500'
                              : isPast
                                ? 'text-ink-500'
                                : 'text-ink-900'
                        }`}
                        style={{ fontVariant: ['tabular-nums'] }}
                      >
                        {day}
                      </StyledText>
                    </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
});

interface MonthsProps {
  year: number;
  m0: number;
  todayYear: number;
  todayM0: number;
  onPick: (m0: number) => void;
}

/** 3 by 4 month grid for jumping far ahead, which expiry dates often need. */
export const CalendarMonths = memo(function CalendarMonths({
  year,
  m0,
  todayYear,
  todayM0,
  onPick,
}: MonthsProps) {
  return (
    <View className="flex-row flex-wrap" style={{ rowGap: 8 }}>
      {MONTHS.map((name, i) => {
        const active = i === m0;
        const current = year === todayYear && i === todayM0;
        return (
          <View key={name} style={{ width: '33.333%' }} className="px-1">
            <Pressable
              onPress={() => onPick(i)}
              accessibilityRole="button"
              accessibilityLabel={`${name} ${year}${current ? ', this month' : ''}`}
              accessibilityState={{ selected: active }}
              className={`h-[52px] rounded-xl items-center justify-center border ${
                active
                  ? 'bg-persimmon-600 border-persimmon-600'
                  : current
                    ? 'bg-paper-50 border-cinnamon-500'
                    : 'bg-paper-100 border-paper-300'
              }`}
              style={({ pressed }) =>
                pressed && !active ? { backgroundColor: '#E9E5D8' } : undefined
              }
            >
              <StyledText
                variant={active || current ? 'extrabold' : 'semibold'}
                className={`text-sm ${
                  active
                    ? 'text-paper-50'
                    : current
                      ? 'text-cinnamon-500'
                      : 'text-ink-800'
                }`}
              >
                {name.slice(0, 3)}
              </StyledText>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
});
