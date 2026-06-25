import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Customer } from '@/types';
import { formatPesos } from '@/lib/money';
import { StyledText } from '@/components/elements';

interface AddCreditHeaderProps {
  customer?: Customer | null;
  onBack: () => void;
}

/**
 * AddCreditHeader — top bar with back button, title eyebrow, and
 * the dark `bg-cinnamon-500` suki hero card showing the customer's
 * outstanding balance. The header sits on the cream page background
 * (`bg-background`) above the ticket sheet.
 */
export function AddCreditHeader({ customer, onBack }: AddCreditHeaderProps) {
  return (
    <View className="px-5 pt-3 pb-4 bg-background">
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <View className="items-center">
          <StyledText variant="extrabold" className="text-ink-900 text-h2">
            New Credit
          </StyledText>
          <StyledText
            variant="medium"
            className="label-caps text-ink-400 mt-0.5"
          >
            Utang Slip
          </StyledText>
        </View>

        <View className="w-10 h-10" />
      </View>

      {customer && (
        <View className="bg-cinnamon-500 rounded-3xl shadow-paper-deep px-5 py-4 flex-row items-center justify-between overflow-hidden">
          <View className="flex-1 pr-3">
            <StyledText
              variant="medium"
              className="label-caps text-paper-200 opacity-90"
            >
              Suki
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-h3 mt-0.5"
              numberOfLines={1}
            >
              {customer.name}
            </StyledText>
          </View>
          <View className="items-end">
            <StyledText
              variant="medium"
              className="label-caps text-paper-200 opacity-90"
            >
              Outstanding
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-base mt-0.5"
            >
              {formatPesos(customer.outstanding_balance)}
            </StyledText>
          </View>
        </View>
      )}
    </View>
  );
}
