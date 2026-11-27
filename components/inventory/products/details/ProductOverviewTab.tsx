import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import {
  parseLedgerDate,
  type LedgerRowData,
} from '@/components/inventory/ledger/ledgerMath';
import { formatPesos } from '@/lib/money';
import type { Product } from '@/types';
import { MovementRow } from './ProductMovementsTab';

const TABULAR = StyleSheet.create({
  nums: { fontVariant: ['tabular-nums'] },
}).nums;
const RECENT_LIMIT = 3;

interface ProductOverviewTabProps {
  product: Product;
  rows: LedgerRowData[];
  unitLabel: string;
  onEdit: () => void;
  onSeeAllMovements: () => void;
  onDelete: () => void;
}

const formatDate = (value: string): string => {
  const d = parseLedgerDate(value);
  return d ? format(d, 'MMM d, yyyy') : '—';
};

export const ProductOverviewTab = memo(function ProductOverviewTab({
  product,
  rows,
  unitLabel,
  onEdit,
  onSeeAllMovements,
  onDelete,
}: ProductOverviewTabProps) {
  const { t } = useTranslation('inventory');
  const cost = product.cost_price ?? null;

  // Preview rows lose their day header, so the date joins the time label.
  const recent = useMemo(
    () =>
      rows.slice(0, RECENT_LIMIT).map((row) => ({
        ...row,
        timeLabel: row.time
          ? `${format(row.time, 'MMM d')} · ${row.timeLabel}`
          : row.timeLabel,
      })),
    [rows],
  );

  const info: { label: string; value: string }[] = [
    {
      label: t('details_category'),
      value: product.category?.trim() || t('details_uncategorized'),
    },
    { label: t('details_sku'), value: product.sku || t('details_none') },
    {
      label: t('details_barcode'),
      value: product.barcode || t('details_none'),
    },
    { label: t('details_unit'), value: unitLabel },
    ...(product.wholesale_barcode
      ? [
          {
            label: t('details_wholesaleBarcode'),
            value: product.wholesale_barcode,
          },
        ]
      : []),
    { label: t('details_added'), value: formatDate(product.created_at) },
    { label: t('details_updated'), value: formatDate(product.updated_at) },
  ];

  return (
    <View>
      {/* Stock value */}
      <View className="mx-4 p-4 bg-paper-50 rounded-2xl border border-ink-100">
        <StyledText variant="extrabold" className="text-ink-900 text-sm mb-3">
          {t('details_stockValue')}
        </StyledText>
        <View className="flex-row">
          {cost !== null && (
            <ValueCell
              label={t('details_atCost')}
              value={formatPesos(cost * product.quantity)}
            />
          )}
          <ValueCell
            label={t('details_atPrice')}
            value={formatPesos(product.price * product.quantity)}
          />
        </View>
        <View className="flex-row items-center mt-3 pt-3 border-t border-dashed border-ink-200">
          <Ionicons
            name="notifications-outline"
            size={14}
            className="text-ink-400"
          />
          <StyledText
            variant="medium"
            className="text-ink-600 text-xs ml-1.5 flex-1"
          >
            {t('details_lowAt', {
              count: LOW_STOCK_THRESHOLD,
              unit: unitLabel,
            })}
          </StyledText>
        </View>
      </View>

      {/* Recent stock changes */}
      {recent.length > 0 && (
        <View className="mt-5">
          <SectionHeader
            title={t('details_recent')}
            action={t('details_seeAll')}
            onAction={onSeeAllMovements}
          />
          {recent.map((row, i) => (
            <MovementRow
              key={`${row.type}-${row.id}-${row.time}`}
              row={row}
              unitLabel={unitLabel}
              isFirst={i === 0}
              isLast={i === recent.length - 1}
            />
          ))}
        </View>
      )}

      {/* Product info */}
      <View className="mt-5">
        <SectionHeader
          title={t('details_info')}
          action={t('details_infoEdit')}
          onAction={onEdit}
        />
        <View className="mx-4 bg-paper-50 rounded-2xl border border-ink-100">
          {info.map((row, idx) => (
            <View
              key={row.label}
              accessible
              accessibilityLabel={`${row.label}, ${row.value}`}
              className={`px-4 py-3 flex-row items-center justify-between ${
                idx < info.length - 1
                  ? 'border-b border-dashed border-ink-200'
                  : ''
              }`}
            >
              <StyledText variant="medium" className="text-ink-500 text-sm">
                {row.label}
              </StyledText>
              <StyledText
                variant="semibold"
                className="text-ink-900 text-sm flex-1 text-right ml-4"
                style={TABULAR}
                numberOfLines={1}
              >
                {row.value}
              </StyledText>
            </View>
          ))}
        </View>
      </View>

      {/* Destructive action, kept apart from everyday actions */}
      <View className="mx-4 mt-6 pt-2 border-t border-dashed border-ink-200">
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          className="min-h-[48px] flex-row items-center justify-center active:opacity-70"
        >
          <Ionicons
            name="trash-outline"
            size={16}
            className="text-semantic-danger"
          />
          <StyledText
            variant="extrabold"
            className="text-semantic-danger text-sm ml-2"
          >
            {t('actionDeleteProduct')}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
});

function ValueCell({ label, value }: { label: string; value: string }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${value}`}
      className="flex-1"
    >
      <StyledText variant="semibold" className="text-ink-500 text-xs">
        {label}
      </StyledText>
      <StyledText
        variant="black"
        className="text-ink-900 text-lg"
        style={TABULAR}
        numberOfLines={1}
      >
        {value}
      </StyledText>
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="px-5 mb-2 flex-row items-center justify-between">
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-ink-900 text-sm"
      >
        {title}
      </StyledText>
      {action && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={`${action}, ${title}`}
          hitSlop={12}
          className="min-h-[44px] justify-center active:opacity-70"
        >
          <StyledText variant="extrabold" className="text-cinnamon-700 text-sm">
            {action}
          </StyledText>
        </Pressable>
      ) : null}
    </View>
  );
}
