import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Skeleton } from '@/components/ui';
import { formatPesos } from '@/lib/money';
import type { DeliveryReceiptSummary } from '@/types/deliveries.types';
import { ICON } from './iconColors';
import { receiptDate, supplierInitials } from './receiptList';

type ChipTone = 'danger' | 'success' | 'warning' | 'neutral';

const CHIP_TONES: Record<ChipTone, { box: string; text: string; icon: string }> = {
  danger: {
    box: 'bg-semantic-danger-50 border-semantic-danger-100',
    text: 'text-semantic-danger',
    icon: ICON.danger,
  },
  success: {
    box: 'bg-sage-50 border-sage-200',
    text: 'text-sage-700',
    icon: ICON.sage600,
  },
  warning: {
    box: 'bg-semantic-warning-50 border-semantic-warning-100',
    text: 'text-semantic-warning-700',
    icon: ICON.warning700,
  },
  neutral: {
    box: 'bg-ink-100 border-ink-200',
    text: 'text-ink-700',
    icon: ICON.ink500,
  },
};

// Icon plus text so status never relies on color alone.
function Chip({
  tone,
  icon,
  label,
}: {
  tone: ChipTone;
  icon: keyof typeof FontAwesome.glyphMap;
  label: string;
}) {
  const s = CHIP_TONES[tone];
  return (
    <View
      className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full border ${s.box}`}
    >
      <FontAwesome name={icon} size={10} color={s.icon} />
      <StyledText variant="semibold" className={`text-xs ${s.text}`}>
        {label}
      </StyledText>
    </View>
  );
}

interface DeliveryReceiptRowProps {
  receipt: DeliveryReceiptSummary;
  onPress: (id: number) => void;
}

/** One delivery in the list, styled by status: dashed draft, received slip, or muted void. */
export const DeliveryReceiptRow = memo(function DeliveryReceiptRow({
  receipt: r,
  onPress,
}: DeliveryReceiptRowProps) {
  const { t, i18n } = useTranslation('receiving');
  const isDraft = r.status === 'draft';
  const isVoided = r.status === 'voided';
  const date = receiptDate(r);
  const time = date
    ? date.toLocaleTimeString(i18n.language, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
  const invoice = r.invoiceNo ?? t('noInvoice');
  const timeLabel = t(
    isDraft ? 'rowStarted' : isVoided ? 'rowVoided' : 'rowReceived',
    { time },
  );
  const statusLabel = isDraft
    ? t('statusDraft')
    : isVoided
      ? t('tabVoided')
      : r.shortageQty > 0
        ? t('shortageChip', { count: r.shortageQty })
        : t('complete');

  const cardClass = isDraft
    ? 'bg-paper-50 border-dashed border-ink-300'
    : isVoided
      ? 'bg-paper-100 border-ink-100'
      : 'bg-paper-50 border-ink-100 shadow-paper';

  return (
    <Pressable
      onPress={() => onPress(r.id)}
      accessibilityRole="button"
      accessibilityLabel={[
        r.supplierName,
        invoice,
        statusLabel,
        formatPesos(r.totalCost),
        t('lineItems', { count: r.lineCount }),
        timeLabel,
      ].join(', ')}
      accessibilityHint={isDraft ? t('draftHint') : t('openHint')}
      className={`mb-3 rounded-2xl border p-4 active:opacity-90 ${cardClass}`}
    >
      <View className="flex-row items-start">
        <View
          className={`w-11 h-11 rounded-full items-center justify-center mr-3 border ${
            isVoided
              ? 'bg-ink-100 border-ink-200'
              : 'bg-cinnamon-50 border-cinnamon-100'
          }`}
        >
          <StyledText
            variant="extrabold"
            maxFontSizeMultiplier={1.3}
            className={`text-sm ${isVoided ? 'text-ink-500' : 'text-cinnamon-700'}`}
          >
            {supplierInitials(r.supplierName)}
          </StyledText>
        </View>

        <View className="flex-1 mr-2">
          <StyledText
            variant="semibold"
            className={`text-base ${isVoided ? 'text-ink-600' : 'text-ink-900'}`}
            numberOfLines={2}
          >
            {r.supplierName}
          </StyledText>
          <View className="flex-row items-start mt-0.5">
            <FontAwesome
              name="file-text-o"
              size={11}
              color={ICON.ink400}
              style={{ marginTop: 3 }}
            />
            <StyledText
              variant="regular"
              className="text-xs text-ink-500 ml-1.5 flex-1"
              style={{ fontVariant: ['tabular-nums'] }}
              numberOfLines={2}
            >
              {invoice} · {timeLabel}
            </StyledText>
          </View>
        </View>

        <StyledText
          variant="extrabold"
          className={`text-base ${
            isVoided
              ? 'text-ink-500 line-through'
              : isDraft
                ? 'text-ink-700'
                : 'text-ink-900'
          }`}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatPesos(r.totalCost)}
        </StyledText>
      </View>

      <View
        className={`flex-row items-center justify-between mt-3 pt-3 border-t ${
          isDraft ? 'border-dashed border-ink-200' : 'border-ink-100'
        }`}
      >
        <View className="flex-row flex-wrap items-center gap-2 flex-1 mr-2">
          {isDraft ? (
            <Chip tone="warning" icon="pencil" label={t('statusDraft')} />
          ) : isVoided ? (
            <Chip tone="neutral" icon="ban" label={t('tabVoided')} />
          ) : r.shortageQty > 0 ? (
            <Chip
              tone="danger"
              icon="exclamation-triangle"
              label={t('shortageChip', { count: r.shortageQty })}
            />
          ) : (
            <Chip tone="success" icon="check" label={t('complete')} />
          )}
          <StyledText variant="regular" className="text-xs text-ink-600">
            {t('lineItems', { count: r.lineCount })}
          </StyledText>
        </View>

        {isDraft ? (
          <View className="flex-row items-center gap-1.5">
            <StyledText
              variant="semibold"
              className="text-xs text-persimmon-600"
            >
              {t('continueDraft')}
            </StyledText>
            <FontAwesome
              name="chevron-right"
              size={10}
              color={ICON.persimmon600}
            />
          </View>
        ) : (
          <FontAwesome name="chevron-right" size={10} color={ICON.ink300} />
        )}
      </View>
    </Pressable>
  );
});

/** Placeholder matching the row's layout so nothing shifts when data lands. */
export function DeliveryReceiptRowSkeleton() {
  return (
    <View className="mb-3 rounded-2xl border border-ink-100 bg-paper-50 p-4">
      <View className="flex-row items-center">
        <Skeleton width={44} height={44} circle />
        <View className="flex-1 mx-3">
          <Skeleton width={'60%'} height={14} />
          <Skeleton width={'45%'} height={10} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={72} height={14} />
      </View>
      <View className="flex-row justify-between mt-3 pt-3 border-t border-ink-100">
        <Skeleton width={110} height={16} borderRadius={8} />
        <Skeleton width={12} height={12} />
      </View>
    </View>
  );
}
