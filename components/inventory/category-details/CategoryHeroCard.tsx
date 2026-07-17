import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import {
  MoneyText,
  ReceiptHero,
  ReceiptHeroDivider,
  StatusStamp,
} from '@/components/ui';
import { formatPesos } from '@/lib/money';

interface CategoryHeroCardProps {
  category: any;
  productsInCategory: any[];
  totalValue: number;
  totalUnits: number;
  lowStockCount: number;
  stampLabel: string;
  stampTone: any;
  stampRotate: number;
}

function MetaRow({
  label,
  value,
  valueTone = 'text-ink-900',
}: {
  label: string;
  value: string;
  valueTone?: string;
}) {
  return (
    <View className="flex-row items-baseline justify-between py-1.5">
      <StyledText variant="extrabold" className="label-caps text-ink-400">
        {label}
      </StyledText>
      <StyledText variant="extrabold" className={`text-mono ${valueTone}`}>
        {value}
      </StyledText>
    </View>
  );
}

export function CategoryHeroCard({
  category,
  productsInCategory,
  totalValue,
  totalUnits,
  lowStockCount,
  stampLabel,
  stampTone,
  stampRotate,
}: CategoryHeroCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 60 }}
    >
      <ReceiptHero tone="cinnamon" headerLabel="CATEGORY">
        {/* Eyebrow + status stamp */}
        <View className="px-5 pt-6 pb-3 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <StyledText variant="extrabold" className="label-caps text-ink-400">
              Category
            </StyledText>
            <StyledText
              variant="black"
              className="text-ink-900 text-3xl mt-1"
              style={{ letterSpacing: -0.5 }}
            >
              {category.name}
            </StyledText>
            <StyledText variant="regular" className="text-ink-500 text-sm mt-1">
              {productsInCategory.length}{' '}
              {productsInCategory.length === 1 ? 'product' : 'products'}
              {lowStockCount > 0 ? ` · ${lowStockCount} need restock` : ''}
            </StyledText>
          </View>
          <StatusStamp
            label={stampLabel}
            tone={stampTone}
            size="md"
            rotate={stampRotate}
          />
        </View>

        {/* Featured total-value plate */}
        <View className="px-5 py-5 bg-paper-100 border-y border-dashed border-ink-200">
          <StyledText
            variant="extrabold"
            className="label-caps text-ink-400 mb-2"
          >
            Total Value
          </StyledText>
          <View className="flex-row items-baseline">
            <MoneyText
              value={totalValue}
              size="display"
              className="text-ink-900 font-extrabold"
              style={{ fontSize: 40, letterSpacing: -1 }}
            />
          </View>
          <StyledText variant="medium" className="text-mono text-ink-500 mt-2">
            {totalUnits} {totalUnits === 1 ? 'unit' : 'units'} across{' '}
            {productsInCategory.length}{' '}
            {productsInCategory.length === 1 ? 'product' : 'products'}
          </StyledText>
        </View>

        <ReceiptHeroDivider label="STOCK OVERVIEW" tone="cinnamon" />

        {/* Meta block — items / units / low-stock */}
        <View className="px-5 pt-3 pb-5">
          <MetaRow label="PRODUCTS" value={`${productsInCategory.length}`} />
          <View className="h-px border-t border-dashed border-ink-200 my-1.5" />
          <MetaRow label="UNITS IN STOCK" value={`${totalUnits}`} />
          <View className="h-px border-t border-dashed border-ink-200 my-1.5" />
          <MetaRow
            label="NEED RESTOCK"
            value={`${lowStockCount}`}
            valueTone={
              lowStockCount === 0 ? 'text-sage-700' : 'text-semantic-warning'
            }
          />
          <View className="h-px border-t border-dashed border-ink-200 my-1.5" />
          <MetaRow
            label="AVG. PRICE"
            value={
              productsInCategory.length === 0
                ? '—'
                : formatPesos(
                    Math.round(
                      productsInCategory.reduce(
                        (s, p) => s + (p.price || 0),
                        0,
                      ) / productsInCategory.length,
                    ),
                  )
            }
          />
        </View>
      </ReceiptHero>
    </MotiView>
  );
}
