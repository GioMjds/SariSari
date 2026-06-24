import { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { MotiView } from 'moti';
import { Customer } from '@/types';
import { MoneyText, ReceiptHero, ReceiptHeroDivider, StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';

interface PriorityCustomerHeroProps {
  customer: Customer | null;
  hasOverdue: boolean;
  onAddPayment: () => void;
  onAddCredit: () => void;
  onViewDetails: () => void;
}

/**
 * PriorityCustomerHero — the "follow-up" lead. When the store
 * owner opens this tab, this is the first thing they see: the one
 * customer they should chase today.
 *
 * Composition follows the Follow-up Ledger hierarchy in the
 * redesign spec:
 *   - ReceiptHero (cinnamon tone) keeps the visual language of
 *     the rest of the app.
 *   - A bold customer name and total owed anchors the eye.
 *   - Quick actions (Add Payment / Add Credit) live inside the
 *     paper body, not as floating buttons, because the design
 *     treats the hero as a paper object, not a dashboard widget.
 *   - When no one owes anything, the hero flips to a cleared-ledger
 *     affirmation — sage tone, friendly, not celebratory.
 */
export const PriorityCustomerHero = memo(function PriorityCustomerHero({
  customer,
  hasOverdue,
  onAddPayment,
  onAddCredit,
  onViewDetails,
}: PriorityCustomerHeroProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 80 }}
    >
      <View className="px-4 mt-2 mb-4">
        {customer ? (
          <ReceiptHero
            tone={hasOverdue ? 'cinnamon' : 'persimmon'}
            headerLabel={hasOverdue ? 'FOLLOW UP — OVERDUE' : 'TOP BALANCE'}
            headerCode={hasOverdue ? 'URGENT' : 'PRIORITY'}
          >
            {/* Eyebrow + status pill row */}
            <View className="px-5 pt-4 flex-row items-center justify-between">
              <StyledText
                variant="extrabold"
                className="label-caps text-ink-400"
              >
                {hasOverdue ? 'Highest urgency' : 'Most owed'}
              </StyledText>
              {hasOverdue && (
                <StatusPill variant="danger" size="sm" dot>
                  Overdue
                </StatusPill>
              )}
            </View>

            {/* Name */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onViewDetails}
              className="px-5 pt-2 pb-1"
              accessibilityRole="button"
              accessibilityLabel={`View ${customer.name} details`}
            >
              <StyledText
                variant="black"
                className="text-ink-900 text-2xl"
                numberOfLines={1}
              >
                {customer.name}
              </StyledText>
            </TouchableOpacity>

            <ReceiptHeroDivider
              label="OUTSTANDING"
              tone={hasOverdue ? 'cinnamon' : 'persimmon'}
            />

            {/* Hero money — featured */}
            <View className="px-5 py-5 bg-paper-100 border-y border-dashed border-ink-200">
              <View className="flex-row items-baseline">
                <MoneyText
                  value={customer.outstanding_balance}
                  size="hero"
                  variant={hasOverdue ? 'danger' : 'default'}
                  className="text-ink-900"
                  style={{ fontSize: 44, letterSpacing: -1.2 }}
                />
              </View>
              <View className="flex-row items-center mt-2">
                <FontAwesome name="clock-o" size={11} color="#7A7165" />
                <StyledText
                  variant="medium"
                  className="text-mono text-ink-500 ml-1.5"
                >
                  {customer.last_transaction_date
                    ? `Last activity ${formatDistanceToNow(new Date(customer.last_transaction_date), { addSuffix: true })}`
                    : 'No prior transactions'}
                </StyledText>
              </View>
            </View>

            {/* Quick actions — sage primary, persimmon secondary */}
            <View className="px-5 py-4 flex-row gap-2.5">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onAddPayment}
                accessibilityRole="button"
                accessibilityLabel={`Add payment for ${customer.name}`}
                className="flex-1 bg-sage-500 rounded-xl py-3 flex-row items-center justify-center press-scale"
                style={{
                  shadowColor: '#4F7A24',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.18,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <FontAwesome name="money" size={14} color="#FBF7EE" />
                <StyledText
                  variant="extrabold"
                  className="text-paper-50 text-sm ml-2"
                >
                  Add Payment
                </StyledText>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onAddCredit}
                accessibilityRole="button"
                accessibilityLabel={`Add credit for ${customer.name}`}
                className="flex-1 bg-paper-50 rounded-xl py-3 flex-row items-center justify-center border border-ink-200 press-scale"
              >
                <FontAwesome name="plus-circle" size={14} color="#623418" />
                <StyledText
                  variant="extrabold"
                  className="text-cinnamon-700 text-sm ml-2"
                >
                  Add Credit
                </StyledText>
              </TouchableOpacity>
            </View>
          </ReceiptHero>
        ) : (
          <ReceiptHero tone="sage" headerLabel="ALL CLEARED" headerCode="RESIBO">
            <View className="px-5 py-6 items-center paper-texture">
              <View
                className="w-14 h-14 rounded-full bg-sage-50 items-center justify-center mb-3 border border-sage-500"
              >
                <FontAwesome name="check" size={22} color="#4F7A24" />
              </View>
              <StyledText
                variant="black"
                className="text-ink-900 text-xl text-center"
              >
                All balances cleared
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-500 text-sm text-center mt-2 px-3"
              >
                Every suki is settled. Great work — keep the ledger clean.
              </StyledText>
            </View>
          </ReceiptHero>
        )}
      </View>
    </MotiView>
  );
});