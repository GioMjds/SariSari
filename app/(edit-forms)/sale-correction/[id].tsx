import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { useGetSale, useProfile, useRefundSale, useVoidSale } from '@/hooks';
import { formatPesos } from '@/lib/money';
import { useToastStore } from '@/stores';
import { parseStoredTimestamp } from '@/utils';
import type {
  RefundReasonCode,
  VoidReasonCode,
} from '@/types/corrections.types';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type ReasonOption<T extends string> = {
  value: T;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
};

const VOID_REASONS = [
  {
    value: 'customer_changed_mind',
    label: 'Customer Changed Mind',
    icon: 'user-times',
  },
  { value: 'wrong_item_scanned', label: 'Wrong Item Scanned', icon: 'barcode' },
  { value: 'misprinted_price', label: 'Misprinted Price', icon: 'tag' },
  { value: 'other', label: 'Other Reason', icon: 'ellipsis-h' },
] satisfies ReasonOption<VoidReasonCode>[];

const REFUND_REASONS = [
  {
    value: 'returned_damaged',
    label: 'Returned Damaged',
    icon: 'exclamation-circle',
  },
  { value: 'returned_other', label: 'Returned Other', icon: 'refresh' },
] satisfies ReasonOption<RefundReasonCode>[];

export default function SaleCorrectionScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const numericId = Number(id);
  const isVoid = mode === 'void';
  const isValidMode = isVoid || mode === 'refund';

  const { data: sale, isLoading } = useGetSale(numericId);
  const { profile } = useProfile();
  const voidSaleMutation = useVoidSale();
  const refundSaleMutation = useRefundSale();

  const [reason, setReason] = useState<string>(
    isValidMode ? 'customer_changed_mind' : 'returned_damaged',
  );
  const [witness, setWitness] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const voidOptions = VOID_REASONS;
  const refundOptions = REFUND_REASONS;
  const options = isVoid ? voidOptions : refundOptions;
  const screenTitle = isVoid ? 'Void Sale' : 'Refund Sale';
  const actionButtonText = isVoid ? 'Confirm Void Sale' : 'Confirm Refund';

  const handleReasonSelect = (val: string) => {
    Haptics.selectionAsync().catch(() => {});
    setReason(val);
  };

  const handleSubmit = async () => {
    if (!reason || !witness.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      addToast({
        message: 'Reason code and witness name are required',
        variant: 'danger',
      });
      return;
    }

    setIsSubmitting(true);
    const actorUser = profile?.ownerName?.trim() || 'owner';
    const noteTrimmed = note.trim();
    const notePayload = noteTrimmed ? { note: noteTrimmed } : {};

    try {
      if (isVoid) {
        await voidSaleMutation.mutateAsync({
          saleId: numericId,
          actorUser,
          witnessUser: witness.trim(),
          reasonCode: reason,
          ...notePayload,
        });
      } else {
        await refundSaleMutation.mutateAsync({
          saleId: numericId,
          actorUser,
          witnessUser: witness.trim(),
          reasonCode: reason as RefundReasonCode,
          ...notePayload,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      addToast({
        message: isVoid ? 'Sale successfully voided' : 'Refund recorded',
        variant: 'success',
      });
      router.back();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      addToast({
        message: err?.message || 'Failed to submit correction',
        variant: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saleDateFormatted = sale?.timestamp
    ? format(
        parseStoredTimestamp(sale.timestamp) || new Date(),
        'MMM dd, yyyy · hh:mm a',
      )
    : '—';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Standard Header Card matching AddProductHeader / EditProductHeader / AddPaymentHeader */}
      <View className="px-5 pt-3 pb-4 bg-background">
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.back();
            }}
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
              TRANSACTION CORRECTION
            </StyledText>
            <StyledText variant="black" className="text-ink-900 text-lg mt-0.5">
              {screenTitle}
            </StyledText>
          </View>

          <View className="bg-paper-100 border border-ink-100 px-2.5 py-1 rounded-full flex-row items-center gap-1">
            <FontAwesome
              name={isVoid ? 'ban' : 'undo'}
              size={11}
              color={isVoid ? '#991B1B' : '#92400E'}
            />
            <StyledText
              variant="extrabold"
              className={`text-xs ${isVoid ? 'text-rose-900' : 'text-amber-900'}`}
            >
              #{id}
            </StyledText>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollView
        className="flex-1 px-4 pt-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={64}
      >
        {/* Action Impact Callout Card — Minimalist thermal design */}
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View
              className={`px-2.5 py-1 rounded-full flex-row items-center gap-1.5 border ${
                isVoid
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <FontAwesome
                name={isVoid ? 'exclamation-triangle' : 'info-circle'}
                size={12}
                color={isVoid ? '#991B1B' : '#92400E'}
              />
              <StyledText
                variant="extrabold"
                className={`text-xs label-caps ${
                  isVoid ? 'text-rose-900' : 'text-amber-900'
                }`}
              >
                {isVoid ? 'Void Action Impact' : 'Refund Action Impact'}
              </StyledText>
            </View>
            <StyledText variant="medium" className="text-ink-400 text-xs">
              Audit Trail
            </StyledText>
          </View>

          <StyledText
            variant="regular"
            className="text-ink-700 text-xs leading-5 mt-1"
          >
            •{' '}
            {isVoid
              ? 'Restores all sold item stock quantities'
              : 'Restores returned items to inventory'}
            {'\n'}• Reverses payment entry in cash control / suki credit ledger
            {'\n'}• Appends a permanent, tamper-evident record to the audit
            report
          </StyledText>
        </View>

        {/* Sale Receipt & Items Summary Section */}
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
          <View className="flex-row items-center justify-between pb-3">
            <View className="flex-row items-center gap-2">
              <FontAwesome name="file-text-o" size={14} color="#623418" />
              <StyledText
                variant="extrabold"
                className="label-caps text-cinnamon-500"
              >
                Resibo Summary
              </StyledText>
            </View>
            <StyledText
              variant="semibold"
              className="text-ink-400 text-xs label-caps"
            >
              SALE #{sale?.id ?? id}
            </StyledText>
          </View>

          {isLoading || !sale ? (
            <View className="py-6 items-center">
              <StyledText variant="medium" className="text-ink-400 text-sm">
                Loading sale details...
              </StyledText>
            </View>
          ) : (
            <View className="pt-3 gap-2.5">
              <View className="flex-row justify-between items-center">
                <StyledText variant="regular" className="text-ink-500 text-sm">
                  Date & Time
                </StyledText>
                <StyledText variant="semibold" className="text-ink-800 text-sm">
                  {saleDateFormatted}
                </StyledText>
              </View>

              <View className="flex-row justify-between items-center">
                <StyledText variant="regular" className="text-ink-500 text-sm">
                  Payment Type
                </StyledText>
                <View className="flex-row items-center gap-1.5">
                  <FontAwesome
                    name={sale.payment_type === 'credit' ? 'book' : 'money'}
                    size={11}
                    color="#623418"
                  />
                  <StyledText
                    variant="semibold"
                    className="text-ink-800 text-sm capitalize"
                  >
                    {sale.payment_type === 'credit'
                      ? `Utang (${sale.customer_name})`
                      : 'Cash Sale'}
                  </StyledText>
                </View>
              </View>

              {/* Line Items Preview */}
              {sale.items && sale.items.length > 0 && (
                <View className="mt-2 pt-2.5 border-t border-ink-100 gap-2">
                  <StyledText
                    variant="semibold"
                    className="text-ink-400 text-[10px] label-caps mb-0.5"
                  >
                    ITEMS ({sale.items.length})
                  </StyledText>
                  {sale.items.map((item) => (
                    <View
                      key={item.id}
                      className="flex-row justify-between items-center bg-paper-100/70 p-2.5 rounded-xl border border-ink-100"
                    >
                      <View className="flex-row items-center flex-1 mr-2 gap-2">
                        <View className="bg-paper-200 px-2 py-0.5 rounded-md border border-ink-100">
                          <StyledText
                            variant="extrabold"
                            className="text-ink-900 text-xs"
                          >
                            {item.quantity}x
                          </StyledText>
                        </View>
                        <StyledText
                          variant="extrabold"
                          className="text-ink-900 text-xs flex-1"
                          numberOfLines={1}
                        >
                          {item.product_name}
                        </StyledText>
                      </View>
                      <StyledText
                        variant="extrabold"
                        className="text-ink-900 text-xs"
                      >
                        {formatPesos(item.price * item.quantity)}
                      </StyledText>
                    </View>
                  ))}
                </View>
              )}

              <View className="flex-row justify-between items-center pt-3 border-t border-ink-200 mt-1">
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-sm uppercase tracking-wider"
                >
                  Total Amount
                </StyledText>
                <StyledText
                  variant="black"
                  className="text-cinnamon-600 text-2xl"
                >
                  {formatPesos(sale.total)}
                </StyledText>
              </View>
            </View>
          )}
        </View>

        {/* Reason Code Selection Section */}
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
          <StyledText
            variant="black"
            className="label-caps text-cinnamon-500 mb-1"
          >
            Reason Code *
          </StyledText>
          <StyledText variant="regular" className="text-ink-400 text-xs mb-3">
            Select the primary cause for this {isVoid ? 'void' : 'refund'}
          </StyledText>

          <View className="gap-2">
            {options.map((opt) => {
              const isSelected = reason === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleReasonSelect(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={opt.label}
                  className={`press-scale p-3.5 rounded-xl border flex-row items-center justify-between ${
                    isSelected
                      ? isVoid
                        ? 'bg-rose-50 border-rose-500'
                        : 'bg-cinnamon-50 border-cinnamon-500'
                      : 'bg-paper-100 border-ink-100 active:bg-paper-200'
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-8 h-8 rounded-lg items-center justify-center ${
                        isSelected
                          ? isVoid
                            ? 'bg-rose-600'
                            : 'bg-cinnamon-500'
                          : 'bg-paper-200 border border-ink-100'
                      }`}
                    >
                      <FontAwesome
                        name={opt.icon}
                        size={13}
                        color={isSelected ? '#FBF7EE' : '#564E45'}
                      />
                    </View>
                    <StyledText
                      variant={isSelected ? 'extrabold' : 'medium'}
                      className={`text-sm ${
                        isSelected
                          ? isVoid
                            ? 'text-rose-950'
                            : 'text-cinnamon-950'
                          : 'text-ink-800'
                      }`}
                    >
                      {opt.label}
                    </StyledText>
                  </View>

                  <View
                    className={`w-5 h-5 rounded-full border items-center justify-center ${
                      isSelected
                        ? isVoid
                          ? 'border-rose-500 bg-rose-500'
                          : 'border-cinnamon-500 bg-cinnamon-500'
                        : 'border-ink-200 bg-paper-50'
                    }`}
                  >
                    {isSelected && (
                      <FontAwesome name="check" size={10} color="#FBF7EE" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Audit Verification: Witness & Notes */}
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-5">
          <StyledText
            variant="black"
            className="label-caps text-cinnamon-500 mb-1"
          >
            Audit Verification
          </StyledText>
          <StyledText variant="regular" className="text-ink-400 text-xs mb-3">
            Enter cashier or witness details to authorize this record
          </StyledText>

          <View className="mb-4">
            <StyledText
              variant="semibold"
              className="text-ink-800 text-xs mb-1.5"
            >
              Witness / Cashier Name *
            </StyledText>
            <View className="bg-paper-100 rounded-xl border border-ink-100 flex-row items-center px-3 py-1 focus-within:border-persimmon-500">
              <FontAwesome name="user" size={14} color="#7A7165" />
              <TextInput
                value={witness}
                onChangeText={setWitness}
                placeholder="e.g., Ate Nena / Cashier Shift A"
                placeholderTextColor="#A89F90"
                className="flex-1 py-2.5 px-2.5 text-ink-900 text-sm font-medium"
              />
            </View>
          </View>

          <View>
            <StyledText
              variant="semibold"
              className="text-ink-800 text-xs mb-1.5"
            >
              Additional Note (Optional)
            </StyledText>
            <View className="bg-paper-100 rounded-xl border border-ink-100 p-3 focus-within:border-persimmon-500">
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Describe reason details or customer notes..."
                placeholderTextColor="#A89F90"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="text-ink-900 text-sm font-medium min-h-[70px]"
              />
            </View>
          </View>
        </View>

        {/* Primary Action Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting || isLoading}
          accessibilityRole="button"
          accessibilityLabel={actionButtonText}
          className={`rounded-2xl py-4 flex-row items-center justify-center ${
            isSubmitting || isLoading
              ? 'bg-ink-100 shadow-none'
              : isVoid
                ? 'bg-rose-700 shadow-paper'
                : 'bg-cinnamon-600 shadow-paper'
          }`}
          style={({ pressed }) => ({
            transform: [{ scale: !isSubmitting && pressed ? 0.98 : 1 }],
          })}
        >
          <FontAwesome
            name={isSubmitting ? 'spinner' : isVoid ? 'ban' : 'check-circle'}
            size={16}
            color={isSubmitting ? '#7A7165' : '#FBF7EE'}
          />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-base ml-2"
          >
            {isSubmitting ? 'Processing Correction...' : actionButtonText}
          </StyledText>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
