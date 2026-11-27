import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Skeleton } from '@/components/ui';
import { formatPesos } from '@/lib/money';
import type { DeliveryReceiptSummary } from '@/types/deliveries.types';
import { receiptDate, supplierInitials } from './receiptList';

type ChipTone = 'danger' | 'success' | 'warning' | 'neutral';

const CHIP_TONES: Record<ChipTone, { box: string; text: string; icon: string }> = {
  danger: {
    box: 'bg-semantic-danger-50 border-semantic-danger-100',
    text: 'text-semantic-danger',
    icon: '#C13030',
  },
  success: {
    box: 'bg-sage-50 border-sage-200',
    text: 'text-sage-700',
    icon: '#3D5E1B',
  },
  warning: {
    box: 'bg-semantic-warning-50 border-semantic-warning-100',
    text: 'text-semantic-warning',
    icon: '#C77B0E',
  },
  neutral: {
    box: 'bg-ink-100 border-ink-200',
    text: 'text-ink-700',
    icon: '#564E45',
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
  const { t } = useTranslation('receiving');
  const isDraft = r.status === 'draft';
  const isVoided = r.status === 'voided';
  const date = receiptDate(r);
  const time = date ? format(date, 'hh:mm a') : '—';
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
      <View className="flex-row items-center">
        <View
          className={`w-11 h-11 rounded-full items-center justify-center mr-3 border ${
            isVoided
              ? 'bg-ink-100 border-ink-200'
              : 'bg-cinnamon-50 border-cinnamon-100'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-sm ${isVoided ? 'text-ink-500' : 'text-cinnamon-700'}`}
          >
            {supplierInitials(r.supplierName)}
          </StyledText>
        </View>

        <View className="flex-1 mr-2">
          <StyledText
            variant="semibold"
            className={`text-base ${isVoided ? 'text-ink-600' : 'text-ink-900'}`}
            numberOfLines={1}
          >
            {r.supplierName}
          </StyledText>
          <View className="flex-row items-center mt-0.5">
            <FontAwesome name="file-text-o" size={11} color="#7A7165" />
            <StyledText
              variant="regular"
              className="text-xs text-ink-500 ml-1.5 flex-shrink"
              numberOfLines={1}
            >
              {invoice}
            </StyledText>
          </View>
        </View>

        <View className="items-end">
          <StyledText
            variant="extrabold"
            className={`text-base ${
              isVoided
                ? 'text-ink-400 line-through'
                : isDraft
                  ? 'text-ink-700'
                  : 'text-ink-900'
            }`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatPesos(r.totalCost)}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-xs text-ink-500 mt-0.5"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {timeLabel}
          </StyledText>
        </View>
      </View>

      <View
        className={`flex-row items-center justify-between mt-3 pt-3 border-t ${
          isDraft ? 'border-dashed border-ink-200' : 'border-ink-100'
        }`}
      >
        <View className="flex-row items-center gap-2">
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
            <FontAwesome name="chevron-right" size={10} color="#C8460F" />
          </View>
        ) : (
          <FontAwesome name="chevron-right" size={10} color="#A89F90" />
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
          <Skeleton width={'35%'} height={10} style={{ marginTop: 8 }} />
        </View>
        <View className="items-end">
          <Skeleton width={72} height={14} />
          <Skeleton width={56} height={10} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View className="flex-row justify-between mt-3 pt-3 border-t border-ink-100">
        <Skeleton width={110} height={16} borderRadius={8} />
        <Skeleton width={12} height={12} />
      </View>
    </View>
  );
}
