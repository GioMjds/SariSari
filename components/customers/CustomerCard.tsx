import { FC, memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Customer } from '@/types/credits.types';
import { CustomerAvatar } from './CustomerAvatar';
import { formatPesos } from '@/lib';

interface CustomerCardProps {
  customer: Customer;
  onPress: (customer: Customer) => void;
  /** Days the oldest unpaid utang is past due. 0 or omitted means not overdue. */
  overdueDays?: number;
}

// Stored dates are `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`. Build the Date from
// the date part only so it never shifts a day across timezones.
function formatActivityDate(value: string, locale: string): string | null {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const CustomerCard: FC<CustomerCardProps> = memo(function CustomerCard({
  customer,
  onPress,
  overdueDays = 0,
}) {
  const { t, i18n } = useTranslation('utang');
  const hasBalance = customer.outstanding_balance > 0;
  const isOverdue = hasBalance && overdueDays > 0;
  const amount = formatPesos(customer.outstanding_balance);
  const overdueText = t('collectionOverdueChip', { days: overdueDays });
  const lastActivity = customer.last_transaction_date
    ? formatActivityDate(customer.last_transaction_date, i18n.language)
    : null;

  // A suki who owes money always has a record, so never claim otherwise.
  const activityText = lastActivity
    ? t('cardLastActivity', { date: lastActivity })
    : hasBalance
      ? null
      : t('cardNoActivity');

  const baseLabel = hasBalance
    ? t('cardA11yWithUtang', { name: customer.name, amount })
    : t('cardA11yPaidUp', { name: customer.name });

  return (
    <Pressable
      onPress={() => onPress(customer)}
      accessibilityRole="button"
      accessibilityLabel={isOverdue ? `${baseLabel}, ${overdueText}` : baseLabel}
      accessibilityHint={t('collectionRowOpenDetailsHint')}
      className="mx-4 mb-2.5 px-4 py-3.5 min-h-[72px] bg-paper-50 rounded-2xl border border-paper-300 flex-row items-center active:bg-paper-100"
    >
      <CustomerAvatar
        name={customer.name}
        photoUri={customer.photo_uri ?? null}
        size={48}
      />

      <View className="ml-3 flex-1 min-w-0">
        <StyledText
          variant="extrabold"
          numberOfLines={2}
          className="text-ink-900 text-base"
        >
          {customer.name}
        </StyledText>
        {isOverdue ? (
          <View className="self-start flex-row items-center mt-1 px-2 py-0.5 rounded-full bg-semantic-danger-50">
            <FontAwesome
              name="exclamation-circle"
              size={12}
              color="#C13030"
              style={{ marginRight: 4 }}
            />
            <StyledText
              variant="semibold"
              className="text-xs text-semantic-danger"
            >
              {overdueText}
            </StyledText>
          </View>
        ) : null}
        {activityText ? (
          <StyledText
            variant="medium"
            numberOfLines={1}
            className="text-ink-500 text-sm mt-0.5"
          >
            {activityText}
          </StyledText>
        ) : null}
        {customer.phone ? (
          <StyledText
            variant="regular"
            numberOfLines={1}
            className="text-ink-400 text-xs mt-0.5"
          >
            {customer.phone}
          </StyledText>
        ) : null}
      </View>

      <View className="items-end ml-3">
        {hasBalance ? (
          <>
            <StyledText
              variant="extrabold"
              className="text-persimmon-700 text-lg"
            >
              {amount}
            </StyledText>
            <StyledText variant="medium" className="text-ink-500 text-xs">
              {t('cardUtangLabel')}
            </StyledText>
          </>
        ) : (
          <View className="flex-row items-center">
            <FontAwesome
              name="check-circle"
              size={16}
              color="#3D5E1B"
              style={{ marginRight: 5 }}
            />
            <StyledText variant="semibold" className="text-sage-700 text-sm">
              {t('cardPaidUp')}
            </StyledText>
          </View>
        )}
      </View>

      <FontAwesome
        name="chevron-right"
        size={12}
        color="#A89F90"
        style={{ marginLeft: 10 }}
      />
    </Pressable>
  );
});

export default CustomerCard;
