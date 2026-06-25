import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { PaymentFormData } from './useAddPaymentForm';

type Method = PaymentFormData['paymentMethod'];

interface PaymentMethodSelectorProps {
  control: Control<PaymentFormData>;
}

interface MethodOption {
  id: Method;
  label: string;
  icon: 'money' | 'bank' | 'ellipsis-h';
}

const METHOD_OPTIONS: MethodOption[] = [
  { id: 'cash', label: 'Cash', icon: 'money' },
  { id: 'bank_transfer', label: 'Bank', icon: 'bank' },
  { id: 'other', label: 'Other', icon: 'ellipsis-h' },
];

/**
 * PaymentMethodSelector — Cash / Bank / Other toggle chips. Three
 * equal-width segments styled as a segmented control on the cream
 * paper background. Selected state uses `bg-cinnamon-500` for
 * high-contrast active state.
 */
export function PaymentMethodSelector({ control }: PaymentMethodSelectorProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Payment Method
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          How the suki paid
        </StyledText>
      </View>

      <Controller
        control={control}
        name="paymentMethod"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row gap-2">
            {METHOD_OPTIONS.map((option) => {
              const active = value === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => onChange(option.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Payment method: ${option.label}`}
                  accessibilityState={{ selected: active }}
                  className={`press-scale flex-1 items-center justify-center flex-row py-3 rounded-xl border ${
                    active
                      ? 'bg-cinnamon-500 border-cinnamon-500'
                      : 'bg-paper-100 border-ink-100 active:bg-paper-200'
                  }`}
                >
                  <FontAwesome
                    name={option.icon}
                    size={14}
                    color={active ? '#FBF7EE' : '#564E45'}
                  />
                  <StyledText
                    variant="extrabold"
                    className={`text-sm ml-1.5 ${
                      active ? 'text-paper-50' : 'text-ink-700'
                    }`}
                  >
                    {option.label}
                  </StyledText>
                </Pressable>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}
