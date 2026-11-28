import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/ui/Sheet';
import { SheetActionGroup, SheetActionRow } from '@/components/ui/SheetActions';
import { ICON_COLOR } from '@/lib/theme';
import type { SupplierRow } from '@/lib/supplierList';
import { SupplierAvatar } from './SupplierAvatar';
import { useSupplierLabels } from './useSupplierLabels';

interface SupplierActionSheetProps {
  visible: boolean;
  row: SupplierRow | null;
  /** False when balances failed to load, so "nothing owed" must not be claimed. */
  balancesKnown: boolean;
  onClose: () => void;
  onPayables: (row: SupplierRow) => void;
  onEmpties: (row: SupplierRow) => void;
  onEdit: (row: SupplierRow) => void;
}

export function SupplierActionSheet({ visible, row, ...rest }: SupplierActionSheetProps) {
  // Keep the last row so the sheet still has content while it slides out.
  const [shown, setShown] = useState(row);
  useEffect(() => {
    if (row) setShown(row);
  }, [row]);

  if (!shown) return null;

  return (
    <Sheet visible={visible} onClose={rest.onClose}>
      <SheetBody row={shown} {...rest} />
    </Sheet>
  );
}

type SheetBodyProps = Omit<SupplierActionSheetProps, 'visible' | 'row'> & { row: SupplierRow };

function SheetBody({ row, balancesKnown, onClose, onPayables, onEmpties, onEdit }: SheetBodyProps) {
  const { t } = useTranslation('inventory');
  const { supplier, owed, emptiesOwed } = row;
  const { owedLabel, emptiesLabel } = useSupplierLabels(row);

  const payablesHint = owed > 0 ? owedLabel : balancesKnown ? t('supplierNothingOwed') : t('supplierBalanceUnknown');
  const emptiesHint =
    emptiesOwed > 0 ? emptiesLabel : balancesKnown ? t('supplierNoEmpties') : t('supplierBalanceUnknown');

  return (
    <>
      <View className="flex-row items-center gap-x-3 pb-4 border-b border-dashed border-paper-400">
        <SupplierAvatar name={supplier.name} large />
        <View className="flex-1 min-w-0">
          <StyledText variant="extrabold" accessibilityRole="header" numberOfLines={2} className="text-h3 text-ink-900">
            {supplier.name}
          </StyledText>
          {supplier.contact ? (
            <StyledText variant="medium" className="text-caption text-ink-500 mt-0.5" numberOfLines={1}>
              {supplier.contact}
            </StyledText>
          ) : null}
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('supplierCloseActions', { name: supplier.name })}
          hitSlop={4}
          className="w-10 h-10 -mr-2 rounded-pill items-center justify-center active:bg-paper-100"
        >
          <FontAwesome name="times" size={16} color={ICON_COLOR.inkMuted} />
        </Pressable>
      </View>

      <SheetActionGroup>
        <SheetActionRow
          icon="money"
          label={t('supplierActionPayables')}
          hint={payablesHint}
          iconColor={ICON_COLOR.persimmon}
          onPress={() => onPayables(row)}
        />
        <SheetActionRow
          icon="exchange"
          label={t('supplierActionEmpties')}
          hint={emptiesHint}
          onPress={() => onEmpties(row)}
        />
        <SheetActionRow
          icon="pencil"
          label={t('actionEditSupplier')}
          hint={t('supplierActionEditHint')}
          onPress={() => onEdit(row)}
        />
      </SheetActionGroup>
    </>
  );
}
