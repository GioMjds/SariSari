import { memo, useMemo } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import type { WeekStatus } from '@/hooks/useHomeDashboardData';
import type { DayTotal } from './home-state';

export interface DashboardTodayCardProps {
  /** Local day as yyyy-MM-dd. */
  today: string;
  salesTotal: number;
  transactionCount: number;
  itemsSold: number;
  changeVsYesterday: number | null;
  week: DayTotal[];
  weekStatus: WeekStatus;
  profitToday: number | null;
  utangToday: number;
  collectedToday: number;
  onPress: () => void;
}

const BAR_MAX_HEIGHT = 44;
// Above this font scale the three stats no longer fit side by side.
const STACK_FONT_SCALE = 1.15;

export const DashboardTodayCard = memo(function DashboardTodayCard({
  today,
  salesTotal,
  transactionCount,
  itemsSold,
  changeVsYesterday,
  week,
  weekStatus,
  profitToday,
  utangToday,
  collectedToday,
  onPress,
}: DashboardTodayCardProps) {
  const { t, i18n } = useTranslation('common');
  const { fontScale } = useWindowDimensions();
  const lang = i18n.language;

  const dateLabel = useMemo(
    () =>
      parseISO(today).toLocaleDateString(lang, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [today, lang],
  );

  const bars = useMemo(() => {
    const max = Math.max(...week.map((d) => d.amount), 1);
    const ready = weekStatus === 'ready';
    return week.map((d) => ({
      ...d,
      height:
        ready && d.amount > 0
          ? Math.max((d.amount / max) * BAR_MAX_HEIGHT, 4)
          : 2,
      tone: !ready
        ? 'bg-ink-100'
        : d.isToday
          ? 'bg-persimmon-500'
          : d.amount > 0
            ? 'bg-cinnamon-300'
            : 'bg-ink-100',
      day: parseISO(d.date).toLocaleDateString(lang, { weekday: 'short' }),
    }));
  }, [week, weekStatus, lang]);

  const weekTotal = useMemo(
    () => week.reduce((sum, d) => sum + d.amount, 0),
    [week],
  );

  const title = t('dashboard.today.title', {
    defaultValue: 'Cash sales today',
  });
  const total = formatPesos(salesTotal);
  const countLine = t('dashboard.today.countLine', {
    sales: transactionCount,
    items: itemsSold,
    defaultValue: '{{sales}} sales · {{items}} items',
  });
  const changeLine =
    changeVsYesterday === null
      ? null
      : t('dashboard.today.vsYesterday', {
          value: `${changeVsYesterday > 0 ? '+' : ''}${changeVsYesterday}%`,
          defaultValue: '{{value}} vs this time yesterday',
        });

  const stats = [
    {
      key: 'profit',
      label: t('dashboard.today.profit', { defaultValue: 'Profit' }),
      value: profitToday === null ? '-' : formatPesos(profitToday),
    },
    {
      key: 'utang',
      label: t('dashboard.today.utangGiven', { defaultValue: 'Utang given' }),
      value: formatPesos(utangToday),
    },
    {
      key: 'collected',
      label: t('dashboard.today.collected', { defaultValue: 'Collected' }),
      value: formatPesos(collectedToday),
    },
  ];

  // The card is one button, so its label must carry everything drawn inside it.
  const a11yLabel = [
    dateLabel,
    title,
    total,
    changeLine,
    countLine,
    ...stats.map((s) => `${s.label} ${s.value}`),
    weekStatus === 'ready'
      ? t('dashboard.today.weekA11y', {
          total: formatPesos(weekTotal),
          defaultValue: 'Last 7 days cash sales, {{total}} total',
        })
      : null,
  ]
    .filter(Boolean)
    .join(', ');

  const stacked = fontScale > STACK_FONT_SCALE;

  return (
    <View className="px-4 mb-4">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={t('dashboard.today.hint', {
          defaultValue: 'Opens reports',
        })}
        className="bg-paper-50 rounded-2xl border border-ink-100 p-4 active:bg-paper-100"
      >
        <View className="flex-row items-center justify-between">
          <StyledText variant="medium" className="flex-1 text-sm text-ink-500">
            {dateLabel}
          </StyledText>
          <FontAwesome name="chevron-right" size={11} color="#564E45" />
        </View>

        <StyledText variant="semibold" className="text-sm text-ink-600 mt-3">
          {title}
        </StyledText>
        <StyledText
          variant="extrabold"
          className="text-display text-ink-900 mt-1"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {total}
        </StyledText>

        <View className="flex-row items-center flex-wrap mt-2 gap-2">
          {changeVsYesterday !== null && changeLine ? (
            <ChangeChip value={changeVsYesterday} label={changeLine} />
          ) : null}
          <StyledText variant="regular" className="text-sm text-ink-600">
            {countLine}
          </StyledText>
        </View>

        {weekStatus === 'error' ? null : (
          <View className="mt-4">
            <View
              className="flex-row items-end justify-between"
              style={{ height: BAR_MAX_HEIGHT }}
            >
              {bars.map((b) => (
                <View key={b.date} className="flex-1 items-center">
                  <View
                    className={`w-5 rounded-t-md ${b.tone}`}
                    style={{ height: b.height }}
                  />
                </View>
              ))}
            </View>
            <View className="flex-row justify-between mt-1.5">
              {bars.map((b) => (
                <StyledText
                  key={b.date}
                  variant={b.isToday ? 'extrabold' : 'regular'}
                  numberOfLines={1}
                  className={`flex-1 text-center text-caption ${
                    b.isToday ? 'text-ink-900' : 'text-ink-500'
                  }`}
                >
                  {b.day}
                </StyledText>
              ))}
            </View>
          </View>
        )}

        <View
          className={`mt-4 pt-3 border-t border-dashed border-ink-200 ${
            stacked ? 'gap-2' : 'flex-row'
          }`}
        >
          {stats.map((s, index) => (
            <View
              key={s.key}
              className={
                stacked
                  ? 'flex-row items-baseline justify-between'
                  : `flex-1 ${
                      index < stats.length - 1
                        ? 'border-r border-ink-100 pr-3 mr-3'
                        : ''
                    }`
              }
            >
              <StyledText
                variant="regular"
                className="text-caption text-ink-500"
              >
                {s.label}
              </StyledText>
              <StyledText
                variant="extrabold"
                className="text-sm text-ink-900 mt-0.5"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {s.value}
              </StyledText>
            </View>
          ))}
        </View>
      </Pressable>
    </View>
  );
});

function ChangeChip({ value, label }: { value: number; label: string }) {
  const tone =
    value > 0
      ? {
          box: 'bg-sage-50',
          text: 'text-sage-600',
          color: '#3D5E1B',
          icon: 'arrow-up',
        }
      : value < 0
        ? {
            box: 'bg-semantic-danger-50',
            text: 'text-semantic-danger',
            color: '#C13030',
            icon: 'arrow-down',
          }
        : {
            box: 'bg-ink-50',
            text: 'text-ink-600',
            color: '#3D372F',
            icon: 'minus',
          };

  return (
    <View className={`flex-row items-center px-2 py-1 rounded-md ${tone.box}`}>
      <FontAwesome
        name={tone.icon as keyof typeof FontAwesome.glyphMap}
        size={10}
        color={tone.color}
      />
      <StyledText
        variant="semibold"
        className={`text-caption ml-1 ${tone.text}`}
      >
        {label}
      </StyledText>
    </View>
  );
}
