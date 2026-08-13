import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { StyledText } from '@/components/elements';
import { useGetSale, useProfile, useRefundSale, useVoidSale } from '@/hooks';
import { formatPesos } from '@/lib/money';
import { useToastStore } from '@/stores';
import { parseStoredTimestamp } from '@/utils';
import type {
  RefundReasonCode,
  VoidReasonCode,
} from '@/types/corrections.types';

const VOID_REASONS = [
  { value: 'customer_changed_mind', label: 'Customer Changed Mind' },
  { value: 'misprinted_price', label: 'Misprinted Price' },
  { value: 'wrong_item_scanned', label: 'Wrong Item Scanned' },
  { value: 'other', label: 'Other Reason' },
] satisfies { value: VoidReasonCode; label: string }[];

const REFUND_REASONS = [
  { value: 'returned_damaged', label: 'Returned Damaged' },
  { value: 'returned_other', label: 'Returned Other' },
] satisfies { value: RefundReasonCode; label: string }[];

export default function SaleCorrectionScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addToast = useToastStore((state) => state.addToast);

  const numericId = Number(id);
  const isVoid = mode === 'void' || mode !== 'refund';

  const { data: sale, isLoading } = useGetSale(numericId);
  const { profile } = useProfile();
  const voidSaleMutation = useVoidSale();
  const refundSaleMutation = useRefundSale();

  const [reason, setReason] = useState<string>(
    isVoid ? 'customer_changed_mind' : 'returned_damaged',
  );
  const [witness, setWitness] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = isVoid ? VOID_REASONS : REFUND_REASONS;
  const screenTitle = isVoid ? 'Void Sale' : 'Refund Sale';
  const actionButtonText = isVoid ? 'Confirm Void' : 'Confirm Refund';

  const handleSubmit = async () => {
    if (!reason || !witness.trim()) {
      addToast({ message: 'Reason and witness required', variant: 'danger' });
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

      addToast({ message: 'Correction recorded', variant: 'success' });
      router.back();
    } catch (err: any) {
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
    <View className="flex-1 bg-paper-200">
      {/* Cinnamon Header */}
      <View
        className="bg-cinnamon-500 px-5 pb-6 flex-row items-center gap-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={20}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 rounded-full bg-cinnamon-600 items-center justify-center border border-paper-50/20 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#FBF7EE" />
        </Pressable>

        <StyledText
          variant="extrabold"
          className="text-paper-50 text-xl flex-1"
        >
          {screenTitle}
        </StyledText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Sale Summary Section */}
          <View className="bg-paper-50 p-4 rounded-2xl border border-warm-100 mb-4">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-base mb-3"
            >
              Sale Summary
            </StyledText>

            {isLoading || !sale ? (
              <StyledText variant="medium" className="text-ink-400 text-sm">
                Loading sale details...
              </StyledText>
            ) : (
              <View className="gap-2">
                <View className="flex-row justify-between items-center">
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-sm"
                  >
                    Sale Reference
                  </StyledText>
                  <StyledText
                    variant="semibold"
                    className="text-ink-800 text-sm"
                  >
                    Sale #{sale.id}
                  </StyledText>
                </View>

                <View className="flex-row justify-between items-center">
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-sm"
                  >
                    Date & Time
                  </StyledText>
                  <StyledText variant="medium" className="text-ink-700 text-sm">
                    {saleDateFormatted}
                  </StyledText>
                </View>

                <View className="flex-row justify-between items-center">
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-sm"
                  >
                    Payment Type
                  </StyledText>
                  <StyledText
                    variant="semibold"
                    className="text-ink-800 text-sm capitalize"
                  >
                    {sale.payment_type === 'credit' ? 'Utang (Credit)' : 'Cash'}
                  </StyledText>
                </View>

                <View className="flex-row justify-between items-center pt-2 border-t border-warm-100 mt-1">
                  <StyledText
                    variant="extrabold"
                    className="text-ink-900 text-base"
                  >
                    Total Amount
                  </StyledText>
                  <StyledText
                    variant="extrabold"
                    className="text-cinnamon-600 text-lg"
                  >
                    {formatPesos(sale.total)}
                  </StyledText>
                </View>
              </View>
            )}
          </View>

          {/* Reason Picker Section */}
          <View className="bg-paper-50 p-4 rounded-2xl border border-warm-100 mb-4">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-base mb-3"
            >
              Reason Code *
            </StyledText>

            <View className="flex-row flex-wrap gap-2">
              {options.map((opt) => {
                const isSelected = reason === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setReason(opt.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    className={`py-2.5 px-4 rounded-xl border ${
                      isSelected
                        ? 'bg-cinnamon-500 border-cinnamon-500'
                        : 'bg-paper-50 border-warm-200'
                    }`}
                  >
                    <StyledText
                      variant={isSelected ? 'semibold' : 'medium'}
                      className={`text-sm ${
                        isSelected ? 'text-paper-50' : 'text-ink-700'
                      }`}
                    >
                      {opt.label}
                    </StyledText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Witness & Note Inputs */}
          <View className="bg-paper-50 p-4 rounded-2xl border border-warm-100 mb-4">
            <StyledText
              variant="semibold"
              className="text-ink-800 text-sm mb-1.5"
            >
              Witness / Cashier Name *
            </StyledText>
            <TextInput
              value={witness}
              onChangeText={setWitness}
              placeholder="Enter witness name"
              placeholderTextColor="#A39E93"
              className="border border-warm-200 rounded-xl p-3 bg-paper-50 text-ink-700 text-base font-medium mb-4"
            />

            <StyledText
              variant="semibold"
              className="text-ink-800 text-sm mb-1.5"
            >
              Additional Note (Optional)
            </StyledText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add optional notes..."
              placeholderTextColor="#A39E93"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="border border-warm-200 rounded-xl p-3 bg-paper-50 text-ink-700 text-base font-medium min-h-[80px]"
            />
          </View>

          {/* Action Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting || isLoading}
            accessibilityRole="button"
            className="bg-cinnamon-500 p-4 rounded-2xl items-center active:opacity-90 shadow-paper disabled:opacity-50"
          >
            <StyledText variant="extrabold" className="text-paper-50 text-base">
              {isSubmitting ? 'Processing...' : actionButtonText}
            </StyledText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
