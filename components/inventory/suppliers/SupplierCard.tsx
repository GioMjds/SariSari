import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { ICON_COLOR } from '@/lib/theme';
import type { SupplierRow } from '@/lib/supplierList';
import { SupplierAvatar } from './SupplierAvatar';
import { useSupplierLabels } from './useSupplierLabels';

interface SupplierCardProps {
  row: SupplierRow;
  onPress: (row: SupplierRow) => void;
}

export const SupplierCard = memo(function SupplierCard({ row, onPress }: SupplierCardProps) {
  const { t } = useTranslation('inventory');
  const { supplier, owed, emptiesOwed } = row;
  const { terms, owedLabel, emptiesLabel, overdue, overdueLabel } = useSupplierLabels(row);

  const a11yLabel = [
    supplier.name,
    supplier.contact,
    terms,
    owed > 0 ? (overdue ? `${owedLabel}, ${overdueLabel}` : owedLabel) : null,
    emptiesOwed > 0 ? emptiesLabel : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => onPress(row)}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={t('supplierRowHint')}
      className="bg-paper-50 rounded-2xl p-3 mb-2 mx-4 min-h-[64px] border border-ink-100 active:bg-paper-100"
    >
      <View className="flex-row items-center">
        <SupplierAvatar name={supplier.name} />

        <View className="flex-1 pr-2">
          <StyledText variant="extrabold" className="text-ink-900 text-base" numberOfLines={1}>
            {supplier.name}
          </StyledText>
          <StyledText variant="regular" className="text-caption text-ink-500 mt-0.5" numberOfLines={2}>
            {supplier.contact ? `${supplier.contact} · ${terms}` : terms}
          </StyledText>
          {owed > 0 || emptiesOwed > 0 ? (
            <View className="flex-row flex-wrap gap-1.5 mt-2">
              {owed > 0 ? (
                <View
                  className={`px-2 py-1 rounded-md border ${
                    overdue ? 'bg-semantic-danger-50 border-semantic-danger' : 'bg-cinnamon-50 border-cinnamon-300'
                  }`}
                >
                  <StyledText
                    variant="extrabold"
                    className={`text-caption ${overdue ? 'text-semantic-danger' : 'text-cinnamon-600'}`}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {overdue ? `${owedLabel} · ${overdueLabel}` : owedLabel}
                  </StyledText>
                </View>
              ) : null}
              {emptiesOwed > 0 ? (
                <View className="px-2 py-1 rounded-md border bg-sage-50 border-sage-300">
                  <StyledText
                    variant="extrabold"
                    className="text-caption text-sage-600"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {emptiesLabel}
                  </StyledText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Ellipsis, not a chevron: the row opens an action sheet instead of pushing a screen. */}
        <Ionicons name="ellipsis-horizontal" size={20} color={ICON_COLOR.inkMuted} />
      </View>
    </Pressable>
  );
});
