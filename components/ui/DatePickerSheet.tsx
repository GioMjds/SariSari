import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/ui/Sheet';
import {
  CalendarDays,
  CalendarMonths,
  type DayHighlight,
} from '@/components/ui/CalendarGrid';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { addDaysIso } from '@/lib/dueDates';
import {
  MONTHS,
  formatLong,
  parseIso,
  shiftMonth,
  todayIso,
} from '@/lib/calendar';

export type DateTone = 'danger' | 'warning' | 'ok' | 'neutral';

export interface DateDescription {
  text: string;
  tone: DateTone;
}

export interface DateShortcut {
  label: string;
  /** Days counted from today. */
  days: number;
}

export interface DatePickerLabels {
  title: string;
  noDate: string;
  confirm: string;
  clear: string;
  today: string;
  prevMonth: string;
  nextMonth: string;
  chooseMonth: string;
  prevYear: string;
  nextYear: string;
  /** Legend text for the highlight band, shown only when a highlight is set. */
  highlight?: string;
}

interface Props {
  visible: boolean;
  /** YYYY-MM-DD, or empty for no date. */
  value: string;
  labels: DatePickerLabels;
  onClose: () => void;
  /** Called with the chosen YYYY-MM-DD, or an empty string when cleared. */
  onConfirm: (iso: string) => void;
  /** Dates in this range get a soft band, such as a warning window. */
  highlight?: DayHighlight;
  shortcuts?: readonly DateShortcut[];
  /** Plain-words status for the chosen date, shown beside it with an icon. */
  describe?: (iso: string) => DateDescription | null;
}

const TONE: Record<
  DateTone,
  { box: string; text: string; icon: keyof typeof FontAwesome.glyphMap; color: string }
> = {
  danger: {
    box: 'bg-semantic-danger-50 border-semantic-danger/30',
    text: 'text-semantic-danger',
    icon: 'exclamation-circle',
    color: '#C13030',
  },
  warning: {
    box: 'bg-persimmon-50 border-persimmon-300',
    text: 'text-persimmon-700',
    icon: 'clock-o',
    color: '#A1370C',
  },
  ok: {
    box: 'bg-sage-50 border-sage-200',
    text: 'text-sage-700',
    icon: 'check-circle',
    color: '#2C4413',
  },
  neutral: {
    box: 'bg-paper-100 border-paper-300',
    text: 'text-ink-700',
    icon: 'calendar',
    color: '#564E45',
  },
};

const SWIPE_DISTANCE = 48;
const SWIPE_VELOCITY = 600;
const tick = () => Haptics.selectionAsync().catch(() => {});

/**
 * Warm-paper calendar sheet that replaces the native date dialog. Pick a day,
 * jump months or years, use shortcuts, then confirm; nothing is applied until Set date.
 */
export function DatePickerSheet({
  visible,
  value,
  labels,
  onClose,
  onConfirm,
  highlight,
  shortcuts = [],
  describe,
}: Props) {
  const reducedMotion = useReducedMotion();
  const today = todayIso();
  const todayYmd = parseIso(today)!;

  const [draft, setDraft] = useState('');
  const [view, setView] = useState({ y: todayYmd.y, m0: todayYmd.m0 });
  const [mode, setMode] = useState<'days' | 'months'>('days');
  // 1 slides the new month in from the right, -1 from the left.
  const [direction, setDirection] = useState<1 | -1>(1);

  // Each open starts from the saved value, on its month, in day view.
  useEffect(() => {
    if (!visible) return;
    const p = parseIso(value);
    setDraft(p ? value : '');
    setView(p ? { y: p.y, m0: p.m0 } : { y: todayYmd.y, m0: todayYmd.m0 });
    setMode('days');
    // todayYmd changes only at midnight; opening re-seeds from value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value]);

  const goMonth = useCallback((delta: number) => {
    setDirection(delta >= 0 ? 1 : -1);
    setView((v) => shiftMonth(v.y, v.m0, delta));
  }, []);

  const goYear = (delta: number) => {
    tick();
    setView((v) => ({ y: v.y + delta, m0: v.m0 }));
  };

  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-16, 16])
        .onEnd((e) => {
          const far = Math.abs(e.translationX) > SWIPE_DISTANCE;
          const fast = Math.abs(e.velocityX) > SWIPE_VELOCITY;
          if (far || fast) scheduleOnRN(goMonth, e.translationX < 0 ? 1 : -1);
        }),
    [goMonth],
  );

  const pick = (iso: string) => {
    tick();
    setDraft(iso);
  };

  const applyShortcut = (days: number) => {
    tick();
    const iso = addDaysIso(days);
    const p = parseIso(iso)!;
    setDraft(iso);
    setDirection(1);
    setView({ y: p.y, m0: p.m0 });
    setMode('days');
  };

  const info = draft ? (describe?.(draft) ?? null) : null;
  const tone = TONE[info?.tone ?? 'neutral'];
  const slide = reducedMotion
    ? undefined
    : (direction === 1 ? SlideInRight : SlideInLeft).duration(200);
  const fade = reducedMotion ? undefined : FadeIn.duration(150);

  return (
    <Sheet visible={visible} onClose={onClose} title={labels.title}>
      {/* Summary: the chosen date in words plus its status, with an icon so colour is not alone. */}
      <View
        accessibilityLiveRegion="polite"
        className="rounded-2xl border border-dashed border-paper-400 bg-paper-100 px-4 py-3 flex-row items-center gap-x-3"
      >
        <View className="flex-1">
          <StyledText
            variant="black"
            numberOfLines={1}
            className={`text-h2 ${draft ? 'text-ink-900' : 'text-ink-500'}`}
          >
            {(draft && formatLong(draft)) || labels.noDate}
          </StyledText>
        </View>
        {info ? (
          <View
            className={`flex-row items-center gap-x-1.5 px-2.5 h-8 rounded-pill border ${tone.box}`}
          >
            <FontAwesome name={tone.icon} size={12} color={tone.color} />
            <StyledText variant="extrabold" className={`text-xs ${tone.text}`}>
              {info.text}
            </StyledText>
          </View>
        ) : null}
      </View>

      {/* Month and year navigation; the centre button swaps to the month grid. */}
      <View className="flex-row items-center">
        <NavButton
          icon="chevron-left"
          label={mode === 'days' ? labels.prevMonth : labels.prevYear}
          onPress={() => (mode === 'days' ? (tick(), goMonth(-1)) : goYear(-1))}
        />
        <Pressable
          onPress={() => {
            tick();
            setMode((m) => (m === 'days' ? 'months' : 'days'));
          }}
          accessibilityRole="button"
          accessibilityLabel={labels.chooseMonth}
          accessibilityState={{ expanded: mode === 'months' }}
          className="flex-1 h-11 flex-row items-center justify-center gap-x-2 rounded-xl active:bg-paper-100"
        >
          <StyledText variant="extrabold" className="text-base text-ink-900">
            {mode === 'days' ? `${MONTHS[view.m0]} ${view.y}` : view.y}
          </StyledText>
          <FontAwesome
            name={mode === 'days' ? 'caret-down' : 'caret-up'}
            size={14}
            color="#564E45"
          />
        </Pressable>
        <NavButton
          icon="chevron-right"
          label={mode === 'days' ? labels.nextMonth : labels.nextYear}
          onPress={() => (mode === 'days' ? (tick(), goMonth(1)) : goYear(1))}
        />
      </View>

      <View style={{ minHeight: 296 }} className="overflow-hidden">
        {mode === 'days' ? (
          <GestureDetector gesture={swipe}>
            <Animated.View
              key={`${view.y}-${view.m0}`}
              {...(slide && { entering: slide })}
            >
              <CalendarDays
                year={view.y}
                m0={view.m0}
                selected={draft}
                today={today}
                highlight={highlight}
                onSelect={pick}
              />
            </Animated.View>
          </GestureDetector>
        ) : (
          <Animated.View
            key={`months-${view.y}`}
            {...(fade && { entering: fade })}
          >
            <CalendarMonths
              year={view.y}
              m0={view.m0}
              todayYear={todayYmd.y}
              todayM0={todayYmd.m0}
              onPick={(m0) => {
                tick();
                setView((v) => ({ y: v.y, m0 }));
                setMode('days');
              }}
            />
          </Animated.View>
        )}
      </View>

      {/* Legend explains the ring and the band so neither relies on colour alone. */}
      <View className="flex-row items-center gap-x-4">
        <View className="flex-row items-center gap-x-1.5">
          <View className="w-3.5 h-3.5 rounded-full border-2 border-cinnamon-500" />
          <StyledText variant="medium" className="text-xs text-ink-600">
            {labels.today}
          </StyledText>
        </View>
        {highlight && labels.highlight ? (
          <View className="flex-row items-center gap-x-1.5 flex-1">
            <View className="w-5 h-3.5 rounded-full bg-persimmon-100" />
            <StyledText
              variant="medium"
              numberOfLines={1}
              className="text-xs text-ink-600 flex-1"
            >
              {labels.highlight}
            </StyledText>
          </View>
        ) : null}
      </View>

      {shortcuts.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 8 }}
          className="grow-0"
        >
          {shortcuts.map((s) => {
            const active = draft === addDaysIso(s.days);
            return (
              <Pressable
                key={s.label}
                onPress={() => applyShortcut(s.days)}
                accessibilityRole="button"
                accessibilityLabel={s.label}
                accessibilityState={{ selected: active }}
                className={`min-h-[44px] px-4 rounded-pill border items-center justify-center ${
                  active
                    ? 'bg-ink-900 border-ink-900'
                    : 'bg-paper-50 border-ink-200 active:bg-paper-100'
                }`}
              >
                <StyledText
                  variant={active ? 'extrabold' : 'semibold'}
                  className={`text-sm ${active ? 'text-paper-50' : 'text-ink-700'}`}
                >
                  {s.label}
                </StyledText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View className="flex-row gap-x-3">
        <Pressable
          onPress={() => onConfirm('')}
          disabled={!value && !draft}
          accessibilityRole="button"
          accessibilityLabel={labels.clear}
          accessibilityState={{ disabled: !value && !draft }}
          className={`min-h-[52px] px-5 rounded-xl items-center justify-center border border-ink-200 bg-paper-100 active:bg-paper-200 ${
            !value && !draft ? 'opacity-40' : ''
          }`}
        >
          <StyledText variant="extrabold" className="text-base text-ink-700">
            {labels.clear}
          </StyledText>
        </Pressable>
        <Pressable
          onPress={() => draft && onConfirm(draft)}
          disabled={!draft}
          accessibilityRole="button"
          accessibilityLabel={labels.confirm}
          accessibilityState={{ disabled: !draft }}
          className={`flex-1 min-h-[52px] rounded-xl items-center justify-center ${
            draft
              ? 'bg-persimmon-600 active:bg-persimmon-700'
              : 'bg-ink-100'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-base ${draft ? 'text-paper-50' : 'text-ink-400'}`}
          >
            {labels.confirm}
          </StyledText>
        </Pressable>
      </View>
    </Sheet>
  );
}

function NavButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof FontAwesome.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      className="w-11 h-11 rounded-full items-center justify-center bg-paper-100 border border-paper-300 active:bg-paper-200"
    >
      <FontAwesome name={icon} size={14} color="#0E0C0A" />
    </Pressable>
  );
}
