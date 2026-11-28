import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { methodLabel } from '@/components/utang/credit-details/labels';
import { PaymentFormData } from './useAddPaymentForm';

type Method = PaymentFormData['paymentMethod'];

interface PaymentMethodSelectorProps {
  control: Control<PaymentFormData>;
}

const METHOD_OPTIONS: { id: Method; icon: 'money' | 'bank' | 'ellipsis-h' }[] = [
  { id: 'cash', icon: 'money' },
  { id: 'bank_transfer', icon: 'bank' },
  { id: 'other', icon: 'ellipsis-h' },
];

/** PaymentMethodSelector - Cash / Bank transfer / Other as a single-choice segmented control. */
export function PaymentMethodSelector({ control }: PaymentMethodSelectorProps) {
  const { t } = useTranslation('utang');

  return (
    <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper p-4">
      <StyledText variant="semibold" className="text-ink-700 text-sm mb-2">
        {t('addPaymentMethodLabel')}
      </StyledText>

      <Controller
        control={control}
        name="paymentMethod"
        render={({ field: { onChange, value } }) => (
          <View accessibilityRole="radiogroup" className="flex-row gap-2">
            {METHOD_OPTIONS.map((option) => {
              const active = value === option.id;
              const label = methodLabel(t, option.id);
              return (
                <Pressable
                  key={option.id}
                  onPress={() => onChange(option.id)}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ checked: active }}
                  className={`press-scale flex-1 min-h-[48px] items-center justify-center flex-row px-2 rounded-xl border ${
                    active
                      ? 'bg-cinnamon-500 border-cinnamon-500'
                      : 'bg-paper-100 border-ink-200 active:bg-paper-200'
                  }`}
                >
                  <FontAwesome name={option.icon} size={14} color={active ? '#FBF7EE' : '#564E45'} />
                  <StyledText
                    variant="extrabold"
                    numberOfLines={1}
                    className={`text-sm ml-1.5 flex-shrink-1 ${active ? 'text-paper-50' : 'text-ink-700'}`}
                  >
                    {label}
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
