import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import type { DayTotal } from './home-state';

export interface DashboardTodayCardProps {
  salesTotal: number;
  transactionCount: number;
  itemsSold: number;
  changeVsYesterday: number | null;
  week: DayTotal[];
  profitToday: number | null;
  utangToday: number;
  collectedToday: number;
  onPress: () => void;
}

const BAR_MAX_HEIGHT = 44;

export const DashboardTodayCard = memo(function DashboardTodayCard({
  salesTotal,
  transactionCount,
  itemsSold,
  changeVsYesterday,
  week,
  profitToday,
  utangToday,
  collectedToday,
  onPress,
}: DashboardTodayCardProps) {
  const { t, i18n } = useTranslation('common');
  const lang = i18n.language;

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString(lang, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [lang],
  );

  const bars = useMemo(() => {
    const max = Math.max(...week.map((d) => d.amount), 1);
    return week.map((d) => ({
      ...d,
      height: d.amount > 0 ? Math.max((d.amount / max) * BAR_MAX_HEIGHT, 4) : 2,
      day: parseISO(d.date).toLocaleDateString(lang, { weekday: 'narrow' }),
    }));
  }, [week, lang]);

  const weekTotal = useMemo(
    () => week.reduce((sum, d) => sum + d.amount, 0),
    [week],
  );

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
  const profit = profitToday === null ? '-' : formatPesos(profitToday);

  return (
    <View className="px-4 mb-4">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={[
          t('dashboard.today.title', { defaultValue: 'Cash sales today' }),
          total,
          changeLine,
          countLine,
        ]
          .filter(Boolean)
          .join(', ')}
        accessibilityHint={t('dashboard.today.hint', {
          defaultValue: 'Opens reports',
        })}
        className="bg-paper-50 rounded-2xl border border-ink-100 p-4 active:opacity-90"
      >
        <View className="flex-row items-center justify-between">
          <StyledText variant="medium" className="text-sm text-ink-500">
            {dateLabel}
          </StyledText>
          <FontAwesome name="chevron-right" size={11} color="#7A7165" />
        </View>

        <StyledText variant="semibold" className="text-sm text-ink-600 mt-3">
          {t('dashboard.today.title', { defaultValue: 'Cash sales today' })}
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

        <View
          className="mt-4"
          accessible
          accessibilityLabel={t('dashboard.today.weekA11y', {
            total: formatPesos(weekTotal),
            defaultValue: 'Last 7 days cash sales, {{total}} total',
          })}
        >
          <View
            className="flex-row items-end justify-between"
            style={{ height: BAR_MAX_HEIGHT }}
          >
            {bars.map((b) => (
              <View key={b.date} className="flex-1 items-center">
                <View
                  className={`w-5 rounded-t-md ${
                    b.isToday
                      ? 'bg-persimmon-500'
                      : b.amount > 0
                        ? 'bg-cinnamon-200'
                        : 'bg-ink-100'
                  }`}
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
                className={`flex-1 text-center text-caption ${
                  b.isToday ? 'text-ink-900' : 'text-ink-500'
                }`}
              >
                {b.day}
              </StyledText>
            ))}
          </View>
        </View>

        <View className="flex-row mt-4 pt-3 border-t border-dashed border-ink-200">
          <Stat
            label={t('dashboard.today.profit', { defaultValue: 'Profit' })}
            value={profit}
          />
          <Stat
            label={t('dashboard.today.utangGiven', {
              defaultValue: 'Utang given',
            })}
            value={formatPesos(utangToday)}
          />
          <Stat
            label={t('dashboard.today.collected', {
              defaultValue: 'Collected',
            })}
            value={formatPesos(collectedToday)}
            last
          />
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

function Stat({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-1 ${last ? '' : 'border-r border-ink-100 pr-3 mr-3'}`}
    >
      <StyledText variant="regular" className="text-caption text-ink-500">
        {label}
      </StyledText>
      <StyledText
        variant="extrabold"
        className="text-sm text-ink-900 mt-0.5"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </StyledText>
    </View>
  );
}
