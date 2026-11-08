import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { HintRing } from '@/components/onboarding/HintRing';
import { formatPesos } from '@/lib/money';
import { weeklyBarHeights } from '@/lib/onboardingDemo';
import type { DemoProps } from './types';

const DAYS = [
  { id: 'mon', labelKey: 'demoMoreDayMon', total: 800 },
  { id: 'tue', labelKey: 'demoMoreDayTue', total: 1250 },
  { id: 'wed', labelKey: 'demoMoreDayWed', total: 640 },
] as const;

const BAR_MAX_HEIGHT = 72;
const BAR_MIN_HEIGHT = 8;

export function ReportsDemo({ say, complete }: DemoProps) {
  const { t } = useTranslation('onboarding');
  const [selected, setSelected] = useState<string | null>(null);
  const heights = weeklyBarHeights(DAYS.map((d) => d.total));

  return (
    <View className="flex-row items-end justify-between gap-3">
      {DAYS.map((day, idx) => {
        const isSelected = selected === day.id;
        const barHeight =
          BAR_MIN_HEIGHT +
          Math.round((heights[idx] ?? 0) * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT));
        const label = t(day.labelKey);
        const total = formatPesos(day.total);
        return (
          <View key={day.id} className="flex-1">
            <HintRing active={selected === null && idx === 0}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('demoMoreDayBarA11y', { day: label, total })}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  setSelected(day.id);
                  say('demoMoreSelectedBubble', { day: label, total });
                  complete();
                }}
                className="min-h-[44px] items-center justify-end gap-1.5 rounded-2xl p-1"
                style={{ height: BAR_MAX_HEIGHT + 56 }}
              >
                <StyledText
                  variant="semibold"
                  className="text-ink-700 text-caption"
                >
                  {isSelected ? total : ' '}
                </StyledText>
                <View
                  className={`w-full rounded-xl ${
                    isSelected ? 'bg-persimmon-500' : 'bg-persimmon-200'
                  }`}
                  style={{ height: barHeight }}
                />
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-caption"
                >
                  {label}
                </StyledText>
              </Pressable>
            </HintRing>
          </View>
        );
      })}
    </View>
  );
}
