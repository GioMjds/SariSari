import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';
import type { SupplierRow } from '@/lib/supplierList';
import { getTodayDateString } from '@/utils/timezone';

/** Display strings and the overdue flag shared by the supplier row and its action sheet. */
export function useSupplierLabels(row: SupplierRow) {
  const { t } = useTranslation('inventory');
  const { supplier, owed, nextDueDate, emptiesOwed } = row;

  const terms =
    supplier.paymentTermsDays == null
      ? t('supplierTermsCod')
      : t('supplierTermsDays', { count: supplier.paymentTermsDays });
  const owedLabel = t('supplierOwedBadge', { amount: formatPesos(owed) });
  const emptiesLabel = t('supplierEmptiesBadge', { count: emptiesOwed });
  const overdue = owed > 0 && nextDueDate != null && nextDueDate < getTodayDateString();

  return { terms, owedLabel, emptiesLabel, overdue, overdueLabel: t('supplierOverdue') };
}
