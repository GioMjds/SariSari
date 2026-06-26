import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';
import { format, isValid } from 'date-fns';
import { MotiView } from 'moti';
import { Payment } from '@/types/credits.types';
import { formatPesos } from '@/lib/money';
import { parseStoredTimestamp } from '@/utils/timezone';
import { StyledText } from '@/components/elements';

interface PaymentCardProps {
  payment: Payment;
  /**
   * Position in the list — drives the staggered entry animation. When
   * omitted, no entrance animation is rendered (the card appears bare).
   */
  index?: number;
}

/**
 * PaymentCard — one row in the Payments tab.
 *
 * Reads like a receipt line: a method icon (cash / bank / other) on
 * the left, the amount on the right, and the timestamp sitting under
 * the label. Optional notes float in their own dashed callout below
 * so they don't compete with the money line for attention.
 */
export function PaymentCard({ payment, index }: PaymentCardProps) {
  const paymentDate = parseStoredTimestamp(payment.date);
  const method = describeMethod(payment.payment_method);

  const card = (
    <View
      className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper mb-3 overflow-hidden"
      accessibilityLabel={`Payment of ${formatPesos(payment.amount)} received`}
    >
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          {/* Method badge + label + date */}
          <View className="flex-1 pr-3 flex-row items-start">
            <View
              className={`w-10 h-10 rounded-full ${method.bg} items-center justify-center mr-3 border ${method.border}`}
            >
              <FontAwesome name={method.icon} size={14} color={method.color} />
            </View>
            <View className="flex-1">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-base"
                numberOfLines={1}
              >
                Payment Received
              </StyledText>
              <StyledText
                variant="medium"
                className="text-mono text-ink-500 mt-0.5"
              >
                {paymentDate && isValid(paymentDate)
                  ? format(paymentDate, 'MMM dd, yyyy · h:mm a')
                  : 'Unknown date'}
              </StyledText>
              <StyledText
                variant="medium"
                className="text-mono text-ink-500 mt-1"
              >
                Method: {method.label}
              </StyledText>
            </View>
          </View>

          {/* Amount — green to signal money coming in */}
          <StyledText
            variant="black"
            className="text-semantic-success text-lg"
          >
            {formatPesos(payment.amount)}
          </StyledText>
        </View>

        {payment.notes && payment.notes.trim() !== '' && (
          <View className="mt-3 rounded-xl border-l-2 border-ink-300 bg-paper-100 px-3 py-2">
            <StyledText
              variant="medium"
              className="text-ink-700 text-caption"
            >
              {payment.notes}
            </StyledText>
          </View>
        )}
      </View>
    </View>
  );

  if (typeof index !== 'number') return card;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 60 + index * 35 }}
    >
      {card}
    </MotiView>
  );
}

/* ─── Method badge ───────────────────────────────────────────────────── */

type MethodVisual = {
  label: string;
  icon: 'money' | 'bank' | 'ellipsis-h';
  bg: string;
  border: string;
  color: string;
};

function describeMethod(method: Payment['payment_method']): MethodVisual {
  switch (method) {
    case 'cash':
      return {
        label: 'Cash',
        icon: 'money',
        bg: 'bg-sage-50',
        border: 'border-sage-500',
        color: '#4F7A24',
      };
    case 'bank_transfer':
      return {
        label: 'Bank Transfer',
        icon: 'bank',
        bg: 'bg-persimmon-50',
        border: 'border-persimmon-300',
        color: '#C8460F',
      };
    default:
      return {
        label: 'Other',
        icon: 'ellipsis-h',
        bg: 'bg-paper-100',
        border: 'border-ink-300',
        color: '#564E45',
      };
  }
}
