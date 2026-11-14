import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface PaymentTypeToggleProps {
  paymentType: 'cash' | 'credit';
  onChange: (type: 'cash' | 'credit') => void;
}

export function PaymentTypeToggle({
  paymentType,
  onChange,
}: PaymentTypeToggleProps) {
  return (
    <View
      className="flex-row gap-1 bg-paper-100 rounded-2xl p-1 border border-paper-300"
      accessibilityRole="radiogroup"
    >
      <PaymentTypeButton
        type="cash"
        label="Cash"
        icon="money"
        active={paymentType === 'cash'}
        onPress={() => onChange('cash')}
        accessibilityLabel="Pay with cash"
      />
      <PaymentTypeButton
        type="credit"
        label="Utang"
        icon="book"
        active={paymentType === 'credit'}
        onPress={() => onChange('credit')}
        accessibilityLabel="Pay on credit (utang)"
      />
    </View>
  );
}

interface PaymentTypeButtonProps {
  type: 'cash' | 'credit';
  label: string;
  icon: 'money' | 'book';
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

function PaymentTypeButton({
  type,
  label,
  icon,
  active,
  onPress,
  accessibilityLabel,
}: PaymentTypeButtonProps) {
  const activeBg = type === 'cash' ? 'bg-sage-600' : 'bg-amber-700';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      className={`flex-1 min-h-[48px] rounded-xl flex-row items-center justify-center ${
        active ? activeBg : 'active:bg-paper-200'
      }`}
    >
      <FontAwesome
        name={icon}
        size={14}
        color={active ? '#FFFFFF' : '#564E45'}
        style={{ marginRight: 8 }}
      />
      <StyledText
        variant="extrabold"
        className={`text-[15px] ${active ? 'text-white' : 'text-ink-700'}`}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}
