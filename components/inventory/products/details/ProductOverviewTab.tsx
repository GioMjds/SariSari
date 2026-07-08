import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { Product } from '@/types';
import { formatPesos } from '@/lib/money';

interface ProductOverviewTabProps {
  product: Product;
  onEdit: () => void;
  onRestock: () => void;
  onAdjust: () => void;
  onDamaged: () => void;
  onDelete: () => void;
}

/**
 * ProductOverviewTab — the body of the Overview tab.
 *
 * The product identity, stock status, and selling price all live in
 * `ProductDetailsHero` above the tab strip. This component is
 * strictly the "what can I do with this product" surface:
 *
 *   1. Edit Product — single primary affordance, kept inside the
 *      tab body so the top bar can stay quiet.
 *   2. Stock actions — three ghost buttons (Restock / Adjust /
 *      Damaged) using the established sage / persimmon / danger
 *      tinted tiles.
 *   3. Financials — cost / markup / margin tile row, shown only
 *      when cost price is recorded.
 *   4. Danger zone — destructive Delete action at the bottom,
 *      separated by a dashed divider.
 *
 * Pure presentational. The screen owns the data and the handlers.
 */
export const ProductOverviewTab = React.memo(function ProductOverviewTab({
  product,
  onEdit,
  onRestock,
  onAdjust,
  onDamaged,
  onDelete,
}: ProductOverviewTabProps) {
  const costPrice = product.cost_price ?? null;
  const price = product.price;
  const markup =
    costPrice !== null && costPrice !== undefined ? price - costPrice : null;
  const margin =
    costPrice !== null && costPrice !== undefined && costPrice > 0
      ? ((price - costPrice) / costPrice) * 100
      : null;

  const hasFinancials =
    costPrice !== null || markup !== null || margin !== null;

  return (
    <View className="flex-1">
      {/* ── Edit Product — single primary affordance ──────────── */}
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 320, delay: 80 }}
        className="mx-4 mb-4"
      >
        <TouchableOpacity
          onPress={onEdit}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Edit product details"
          className="bg-persimmon-500 rounded-2xl py-3.5 flex-row items-center justify-center press-scale"
          style={{
            shadowColor: '#E85A1F',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.22,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <FontAwesome name="pencil" size={14} color="#FBF7EE" />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-sm ml-2"
          >
            Edit Product
          </StyledText>
        </TouchableOpacity>
      </MotiView>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <View className="mx-4 mb-4">
        <StyledText
          variant="extrabold"
          className="label-caps text-ink-400 mb-2"
        >
          Stock Actions
        </StyledText>
        <View className="flex-row gap-2.5">
          <TouchableOpacity
            onPress={onRestock}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Restock this product"
            className="flex-1 bg-sage-50 border border-sage-200 rounded-xl py-3 items-center justify-center gap-1 active:scale-[0.97]"
          >
            <FontAwesome name="plus" size={14} color="#4F7A24" />
            <StyledText
              variant="extrabold"
              className="text-sage-700 text-xs"
            >
              Restock
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onAdjust}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Adjust stock"
            className="flex-1 bg-persimmon-50 border border-persimmon-100 rounded-xl py-3 items-center justify-center gap-1 active:scale-[0.97]"
          >
            <Ionicons name="options" size={15} color="#E85A1F" />
            <StyledText
              variant="extrabold"
              className="text-persimmon-700 text-xs"
            >
              Adjust
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDamaged}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Mark damaged stock"
            className="flex-1 bg-semantic-danger-50 border border-semantic-danger-100 rounded-xl py-3 items-center justify-center gap-1 active:scale-[0.97]"
          >
            <Ionicons name="warning" size={15} color="#C13030" />
            <StyledText
              variant="extrabold"
              className="text-semantic-danger text-xs"
            >
              Damaged
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Financials — only when cost is recorded ─────────────── */}
      {hasFinancials && (
        <View className="mx-4 mb-4">
          <StyledText
            variant="extrabold"
            className="label-caps text-ink-400 mb-2"
          >
            Financials
          </StyledText>
          <View className="flex-row gap-3">
            {costPrice !== null && (
              <View className="flex-1 bg-paper-50 rounded-xl border border-ink-100 px-3 py-2.5 shadow-paper">
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-400 mb-1"
                >
                  Cost
                </StyledText>
                <MoneyText
                  value={costPrice}
                  size="md"
                  className="text-ink-800 font-extrabold"
                />
              </View>
            )}
            {markup !== null && (
              <View className="flex-1 bg-sage-50 rounded-xl border border-sage-100 px-3 py-2.5">
                <StyledText
                  variant="extrabold"
                  className="label-caps text-sage-700 mb-1"
                >
                  Markup
                </StyledText>
                <MoneyText
                  value={markup}
                  size="md"
                  className="text-sage-600 font-extrabold"
                />
              </View>
            )}
            {margin !== null && (
              <View className="flex-1 bg-sage-50 rounded-xl border border-sage-100 px-3 py-2.5">
                <StyledText
                  variant="extrabold"
                  className="label-caps text-sage-700 mb-1"
                >
                  Margin
                </StyledText>
                <StyledText
                  variant="black"
                  className="text-sage-600 text-base"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {margin.toFixed(1)}%
                </StyledText>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── At-a-glance facts (derived) ──────────────────────────── */}
      <View className="mx-4 mb-4">
        <StyledText
          variant="extrabold"
          className="label-caps text-ink-400 mb-2"
        >
          At a Glance
        </StyledText>
        <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper overflow-hidden">
          <GlanceRow
            icon="clock-o"
            label="Last updated"
            value={
              product.updated_at
                ? new Date(product.updated_at).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                  })
                : '—'
            }
          />
          <View className="h-px border-t border-dashed border-ink-200 mx-4" />
          <GlanceRow
            icon="money"
            label="Inventory value"
            value={formatPesos(product.price * product.quantity)}
            isLast
          />
        </View>
      </View>

      {/* ── Danger Zone ───────────────────────────────────────────── */}
      <View className="mx-4 pt-3 border-t border-dashed border-ink-200">
        <TouchableOpacity
          onPress={onDelete}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Delete this product"
          className="flex-row items-center justify-center gap-2 py-3 active:scale-[0.97]"
        >
          <FontAwesome name="trash" size={13} color="#C13030" />
          <StyledText
            variant="extrabold"
            className="text-semantic-danger text-sm"
          >
            Delete Product
          </StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
});

/* ─── At-a-glance row ─────────────────────────────────────────── */

function GlanceRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: keyof typeof FontAwesome.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View className="px-4 py-3 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <FontAwesome name={icon} size={12} color="#7A7165" />
        <StyledText
          variant="extrabold"
          className="label-caps text-ink-400 ml-2"
        >
          {label}
        </StyledText>
      </View>
      <StyledText
        variant="extrabold"
        className="text-mono text-ink-900"
      >
        {value}
      </StyledText>
    </View>
  );
}
