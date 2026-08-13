import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Customer } from '@/types';
import { formatPesos } from '@/lib/money';
import { StyledText } from '@/components/elements';

interface AddPaymentHeaderProps {
  customer?: Customer | null;
  quickSettle?: boolean;
  onBack: () => void;
}

export function AddPaymentHeader({
  customer,
  quickSettle = false,
  onBack,
}: AddPaymentHeaderProps) {
  return (
    <View className="px-5 pt-3 pb-4 bg-background">
      {/* Standard Header Card matching AddProductHeader / EditProductHeader / AddCustomerHeader */}
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={onBack}
          hitSlop={{ top: 16, bottom: 16, left: 20, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="press-scale w-11 h-11 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <View className="flex-1 px-3 items-center">
          <StyledText
            variant="extrabold"
            className="label-caps text-ink-400"
            style={{ fontSize: 10 }}
          >
            {quickSettle ? 'TARGETED BAYAD' : 'BAYAD SLIP'}
          </StyledText>
          <StyledText variant="black" className="text-ink-900 text-lg mt-0.5">
            {quickSettle ? 'Quick Settle' : 'Record Payment'}
          </StyledText>
        </View>

        {/* Optical balance spacer */}
        <View className="w-11 h-11" />
      </View>

      {/* Suki Passbook Hero Card */}
      {customer && (
        <View className="bg-cinnamon-500 rounded-3xl shadow-paper-deep px-5 py-4 overflow-hidden relative mt-3">
          {/* Decorative ₱ watermark */}
          <StyledText
            variant="black"
            className="absolute -right-2 -top-3 text-paper-100 opacity-10 leading-none"
            style={{ fontSize: 120 }}
          >
            ₱
          </StyledText>

          <View className="flex-row items-center justify-between mb-2 relative">
            <View className="bg-persimmon-500/20 border border-persimmon-400/40 rounded-full px-2.5 py-0.5">
              <StyledText
                variant="extrabold"
                className="label-caps text-persimmon-300"
                style={{ fontSize: 9 }}
              >
                {quickSettle ? 'Targeted Settle' : 'Suki Passbook'}
              </StyledText>
            </View>
            <StyledText
              variant="medium"
              className="label-caps text-paper-200 opacity-80"
            >
              Account Summary
            </StyledText>
          </View>

          <View className="flex-row items-end justify-between relative mt-1">
            <View className="flex-1 pr-3">
              <StyledText
                variant="medium"
                className="label-caps text-paper-200 opacity-80"
              >
                Suki Name
              </StyledText>
              <StyledText
                variant="extrabold"
                className="text-paper-50 text-xl mt-0.5"
                numberOfLines={1}
              >
                {customer.name}
              </StyledText>
              {customer.phone ? (
                <StyledText
                  variant="regular"
                  className="text-paper-200 text-xs mt-0.5 opacity-90"
                >
                  {customer.phone}
                </StyledText>
              ) : null}
            </View>

            <View className="items-end">
              <StyledText
                variant="medium"
                className="label-caps text-paper-200 opacity-80"
              >
                Outstanding
              </StyledText>
              <StyledText
                variant="extrabold"
                className="text-paper-50 text-lg mt-0.5"
              >
                {formatPesos(customer.outstanding_balance)}
              </StyledText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

