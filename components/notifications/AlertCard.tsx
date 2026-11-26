import { memo, type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { ProductThumb } from '@/components/ui';
import { CustomerAvatar } from '@/components/customers/CustomerAvatar';
import { formatPesos } from '@/lib/money';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import type { DynamicHomeAlert } from '@/hooks/useSystemNotifications';

export type AlertActionKind = 'open' | 'primary' | 'secondary' | 'followUp';

interface AlertCardProps {
  alert: DynamicHomeAlert;
  /** True while this card's inline write (mark contacted) is in flight. */
  isBusy: boolean;
  onAction: (alert: DynamicHomeAlert, kind: AlertActionKind) => void;
}

type FaName = ComponentProps<typeof FontAwesome>['name'];

const TONES = {
  danger: {
    chip: 'bg-semantic-danger-50',
    text: 'text-semantic-danger',
    icon: '#C13030',
    bar: 'bg-semantic-danger',
  },
  warning: {
    chip: 'bg-semantic-warning-50',
    text: 'text-ink-700',
    icon: '#C77B0E',
    bar: 'bg-semantic-warning',
  },
} as const;

type Tone = keyof typeof TONES;

function localMidnight(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

function AlertCardComponent({ alert, isBusy, onAction }: AlertCardProps) {
  const { t, i18n } = useTranslation('notifications');
  const isProduct = alert.type === 'low_stock';
  const isUtang = !isProduct;
  const qty = alert.quantity ?? 0;

  // Per-type chip, meter, right-side figure, and button labels.
  let tone: Tone = 'warning';
  let chipIcon: FaName = 'warning';
  let chipLabel = '';
  let meter: number | null = null;
  let meterCaption: string | null = null;
  let figure: string | null = null;
  let primary = { label: '', icon: 'check' as FaName };
  let secondary = t('actionViewItem');

  if (alert.type === 'low_stock') {
    const out = qty === 0;
    tone = out ? 'danger' : 'warning';
    chipIcon = out ? 'exclamation-circle' : 'arrow-down';
    chipLabel = out ? t('chipOut') : t('chipLeft', { count: qty });
    meter = Math.min(1, qty / LOW_STOCK_THRESHOLD);
    meterCaption = t('restockAt', { count: LOW_STOCK_THRESHOLD });
    primary = { label: t('actionRestock'), icon: 'truck' };
  } else if (alert.type === 'overdue_debts') {
    tone = 'danger';
    chipIcon = 'exclamation-circle';
    chipLabel = t('chipOverdue', { count: alert.overdueDays ?? 0 });
    figure = formatPesos(alert.amount ?? 0);
    primary = { label: t('actionRecordPayment'), icon: 'money' };
    secondary = alert.contactedToday
      ? t('contactedToday')
      : t('actionContacted');
  } else {
    const pct = Math.round((alert.pctUsed ?? 0) * 100);
    chipLabel = t('chipNearLimit', { pct });
    meter = Math.min(1, alert.pctUsed ?? 0);
    figure = formatPesos(alert.amount ?? 0);
    primary = { label: t('actionRecordPayment'), icon: 'money' };
    secondary = t('actionViewLedger');
  }

  const toneStyle = TONES[tone];
  const isOverdue = alert.type === 'overdue_debts';
  const contactDisabled = isOverdue && (isBusy || !!alert.contactedToday);

  const followUpLabel = alert.followUpBy
    ? t('followUpOn', {
        date: localMidnight(alert.followUpBy).toLocaleDateString(
          i18n.language,
          { month: 'short', day: 'numeric' },
        ),
      })
    : t('followUpNone');

  return (
    <View
      className={`mx-4 my-1.5 rounded-2xl border bg-paper-50 ${
        alert.urgent ? 'border-semantic-danger-100' : 'border-paper-300'
      }`}
    >
      {/* Who or what, and why it is here. Tap opens the source record. */}
      <Pressable
        onPress={() => onAction(alert, 'open')}
        accessibilityRole="button"
        accessibilityLabel={[alert.title, chipLabel, figure]
          .filter(Boolean)
          .join(', ')}
        accessibilityHint={t(isUtang ? 'openLedgerHint' : 'openProductHint')}
        className="flex-row items-center px-4 pt-4 pb-3 rounded-t-2xl active:bg-paper-100"
      >
        {isProduct ? (
          <ProductThumb
            name={alert.title}
            imageUri={alert.imageUri}
            className="w-14 h-14 rounded-xl"
          />
        ) : (
          <CustomerAvatar
            name={alert.title}
            photoUri={alert.imageUri}
            size={56}
          />
        )}

        <View className="flex-1 min-w-0 ml-3">
          <StyledText
            variant="extrabold"
            numberOfLines={2}
            className="text-base text-ink-900"
          >
            {alert.title}
          </StyledText>
          <View
            className={`self-start flex-row items-center mt-1.5 px-2 py-1 rounded-full ${toneStyle.chip}`}
          >
            <FontAwesome
              name={chipIcon}
              size={11}
              color={toneStyle.icon}
              style={{ marginRight: 4 }}
            />
            <StyledText
              variant="semibold"
              maxFontSizeMultiplier={1.4}
              className={`text-xs ${toneStyle.text}`}
            >
              {chipLabel}
            </StyledText>
          </View>
        </View>

        {figure ? (
          <View className="items-end ml-3">
            <StyledText
              variant="extrabold"
              className={`text-base ${
                isOverdue ? 'text-semantic-danger' : 'text-ink-900'
              }`}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {figure}
            </StyledText>
            {isUtang ? (
              <StyledText variant="medium" className="text-xs text-ink-500">
                {t('utangLabel')}
              </StyledText>
            ) : null}
          </View>
        ) : null}
      </Pressable>

      <View className="px-4 pb-4">
        {meter !== null ? (
          <View className="mb-3" importantForAccessibility="no-hide-descendants">
            <View className="h-1.5 rounded-full bg-paper-300 overflow-hidden">
              <View
                className={`h-full rounded-full ${toneStyle.bar}`}
                style={{ width: `${Math.max(4, meter * 100)}%` }}
              />
            </View>
            {meterCaption ? (
              <StyledText variant="regular" className="text-xs text-ink-500 mt-1">
                {meterCaption}
              </StyledText>
            ) : null}
          </View>
        ) : null}

        {isOverdue ? (
          <Pressable
            onPress={() => onAction(alert, 'followUp')}
            accessibilityRole="button"
            accessibilityLabel={followUpLabel}
            className="min-h-11 mb-2 px-3 py-2 rounded-xl border border-paper-300 bg-paper-100 flex-row items-center active:opacity-70"
          >
            <FontAwesome
              name={alert.followUpBy ? 'calendar-check-o' : 'calendar-plus-o'}
              size={14}
              color="#28231D"
              style={{ marginRight: 8 }}
            />
            <StyledText
              variant="semibold"
              maxFontSizeMultiplier={1.4}
              className="flex-1 text-sm text-ink-700"
            >
              {followUpLabel}
            </StyledText>
            <FontAwesome
              name="chevron-right"
              size={11}
              color="#28231D"
              style={{ opacity: 0.6 }}
            />
          </Pressable>
        ) : null}

        {/* Secondary left, primary right; labels wrap, never clip. */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => onAction(alert, 'secondary')}
            disabled={contactDisabled}
            accessibilityRole="button"
            accessibilityLabel={`${secondary}, ${alert.title}`}
            accessibilityState={{ disabled: contactDisabled }}
            className={`flex-1 min-h-12 px-2 py-2 rounded-xl border flex-row items-center justify-center ${
              isOverdue
                ? 'border-sage-300 bg-sage-50 active:bg-sage-100'
                : 'border-paper-400 bg-paper-50 active:bg-paper-100'
            } ${contactDisabled && !alert.contactedToday ? 'opacity-50' : ''}`}
          >
            {isOverdue ? (
              <FontAwesome
                name="check-circle"
                size={14}
                color="#2C4413"
                style={{ marginRight: 6 }}
              />
            ) : null}
            <StyledText
              variant="extrabold"
              maxFontSizeMultiplier={1.4}
              className={`shrink text-center text-sm ${
                isOverdue ? 'text-sage-700' : 'text-ink-700'
              }`}
            >
              {secondary}
            </StyledText>
          </Pressable>
          <Pressable
            onPress={() => onAction(alert, 'primary')}
            accessibilityRole="button"
            accessibilityLabel={`${primary.label}, ${alert.title}`}
            className="flex-1 min-h-12 px-2 py-2 rounded-xl bg-persimmon-600 active:bg-persimmon-700 flex-row items-center justify-center"
          >
            <FontAwesome
              name={primary.icon}
              size={14}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant="extrabold"
              maxFontSizeMultiplier={1.4}
              className="shrink text-center text-sm text-white"
            >
              {primary.label}
            </StyledText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export const AlertCard = memo(AlertCardComponent);
