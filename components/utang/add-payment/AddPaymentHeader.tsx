import { View } from 'react-native';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { Customer } from '@/types';
import { formatPesos } from '@/lib/money';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { parseStoredTimestamp } from '@/utils/timezone';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { CustomerAvatar } from '@/components/customers/CustomerAvatar';
import { shortDate } from '@/components/utang/credit-details/labels';

interface AddPaymentHeaderProps {
  customer: Customer;
  openCount: number;
  oldestDate: string | null;
}

// Who is paying and how much they owe, so the cashier never records against the wrong suki.
export function AddPaymentHeader({
  customer,
  openCount,
  oldestDate,
}: AddPaymentHeaderProps) {
  const { t } = useTranslation('utang');
  const reducedMotion = useReducedMotion();
  const balance = customer.outstanding_balance;
  const oldest = oldestDate ? parseStoredTimestamp(oldestDate) : null;

  const summary =
    openCount > 0
      ? [
          t(
            openCount === 1
              ? 'detailOpenItemsSingular'
              : 'detailOpenItemsPlural',
            { count: openCount },
          ),
          oldest && !Number.isNaN(oldest.getTime())
            ? t('detailOpenSince', { date: shortDate(oldest) })
            : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : t('detailSettledMessage');

  return (
    <MotiView
      from={{ opacity: 0, translateY: reducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 240 }}
    >
      <View
        accessible
        accessibilityLabel={`${customer.name}, ${t('addPaymentOwes')} ${formatPesos(balance)}, ${summary}`}
        className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper px-4 py-4"
      >
        <View className="flex-row items-center">
          <CustomerAvatar
            name={customer.name}
            photoUri={customer.photo_uri}
            size={48}
          />
          <View className="flex-1 ml-3 mr-2">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-lg"
              numberOfLines={1}
            >
              {customer.name}
            </StyledText>
            {customer.phone ? (
              <StyledText
                variant="regular"
                className="text-ink-500 text-sm"
                numberOfLines={1}
              >
                {customer.phone}
              </StyledText>
            ) : null}
          </View>
          <View className="items-end">
            <StyledText variant="semibold" className="text-ink-600 text-xs">
              {t('addPaymentOwes')}
            </StyledText>
            <MoneyText
              value={balance}
              size="xl"
              className={balance > 0 ? 'text-ink-900' : 'text-sage-700'}
              shrinkToFit
              numberOfLines={1}
            />
          </View>
        </View>

        <View className="mt-3 pt-3 border-t border-dashed border-ink-200">
          <StyledText variant="medium" className="text-ink-600 text-sm">
            {summary}
          </StyledText>
        </View>
      </View>
    </MotiView>
  );
}
