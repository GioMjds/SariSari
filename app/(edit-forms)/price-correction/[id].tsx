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
import { StyledText } from '@/components/elements';
import { useCorrectSalePrice, useGetSale, useProfile } from '@/hooks';
import { formatPesos, tryParsePesosInput } from '@/lib/money';
import { useToastStore } from '@/stores';
import type { PriceCorrectionReasonCode } from '@/types/corrections.types';

const REASON_OPTIONS = [
  { value: 'misprinted_price', label: 'Misprinted Price' },
  { value: 'shelf_price_changed', label: 'Shelf Price Changed' },
] satisfies { value: PriceCorrectionReasonCode; label: string }[];

export default function PriceCorrectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addToast = useToastStore((state) => state.addToast);

  const numericId = Number(id);
  const { data: sale, isLoading } = useGetSale(numericId);
  const { profile } = useProfile();
  const correctSalePriceMutation = useCorrectSalePrice();

  const [edits, setEdits] = useState<Record<number, string>>({});
  const [reason, setReason] =
    useState<PriceCorrectionReasonCode>('misprinted_price');
  const [witness, setWitness] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditChange = (saleItemId: number, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [saleItemId]: value,
    }));
  };

  const originalTotal = sale?.total ?? 0;

  const calculateUpdatedTotal = () => {
    if (!sale?.items) return 0;
    return sale.items.reduce((sum, item) => {
      const editVal = edits[item.id];
      let unitPrice = item.price;
      if (editVal !== undefined && editVal.trim() !== '') {
        const parsed = tryParsePesosInput(editVal);
        if (parsed > 0) {
          unitPrice = parsed;
        }
      }
      return sum + unitPrice * item.quantity;
    }, 0);
  };

  const updatedTotal = calculateUpdatedTotal();

  const handleSubmit = async () => {
    if (!reason || !witness.trim()) {
      addToast({ message: 'Reason and witness required', variant: 'danger' });
      return;
    }

    const priceChanges: { saleItemId: number; newPrice: number }[] = [];
    const invalidItems: string[] = [];

    if (sale?.items) {
      for (const item of sale.items) {
        const editVal = edits[item.id];
        if (editVal !== undefined && editVal.trim() !== '') {
          const parsedPrice = tryParsePesosInput(editVal);
          if (!(parsedPrice > 0)) {
            invalidItems.push(item.product_name);
          } else if (parsedPrice !== item.price) {
            priceChanges.push({ saleItemId: item.id, newPrice: parsedPrice });
          }
        }
      }
    }

    if (invalidItems.length > 0) {
      addToast({
        message: `Invalid price for: ${invalidItems.join(', ')}`,
        variant: 'danger',
      });
      return;
    }

    if (priceChanges.length === 0) {
      addToast({ message: 'No price changes made', variant: 'danger' });
      return;
    }

    setIsSubmitting(true);
    const actorUser = profile?.ownerName?.trim() || 'owner';
    const noteTrimmed = note.trim();

    try {
      await correctSalePriceMutation.mutateAsync({
        saleId: numericId,
        actorUser,
        witnessUser: witness.trim(),
        reasonCode: reason,
        priceChanges,
        ...(noteTrimmed ? { note: noteTrimmed } : {}),
      });

      addToast({ message: 'Price correction recorded', variant: 'success' });
      router.back();
    } catch (err: any) {
      addToast({
        message: err?.message || 'Failed to record price correction',
        variant: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Price Correction
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
          {/* Per-line items list card */}
          <View className="bg-paper-50 p-4 rounded-2xl border border-warm-100 mb-4">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-base mb-3"
            >
              Sale Items
            </StyledText>

            {isLoading || !sale ? (
              <StyledText variant="medium" className="text-ink-400 text-sm">
                Loading sale items...
              </StyledText>
            ) : sale.items.length === 0 ? (
              <StyledText variant="medium" className="text-ink-400 text-sm">
                No items in this sale.
              </StyledText>
            ) : (
              <View className="gap-3">
                {sale.items.map((item) => (
                  <View
                    key={item.id}
                    className="flex-row items-center justify-between py-2 border-b border-warm-100 last:border-b-0"
                  >
                    <View className="flex-1 mr-3">
                      <StyledText
                        variant="semibold"
                        className="text-ink-900 text-sm"
                        numberOfLines={1}
                      >
                        {item.product_name}
                      </StyledText>
                      <StyledText
                        variant="regular"
                        className="text-ink-500 text-xs mt-0.5"
                      >
                        Qty: {item.quantity} · Orig: {formatPesos(item.price)}
                      </StyledText>
                    </View>

                    <View className="flex-row items-center gap-1">
                      <StyledText
                        variant="semibold"
                        className="text-ink-600 text-sm"
                      >
                        ₱
                      </StyledText>
                      <TextInput
                        value={edits[item.id] ?? ''}
                        onChangeText={(val) => handleEditChange(item.id, val)}
                        placeholder={item.price.toString()}
                        placeholderTextColor="#A39E93"
                        keyboardType="decimal-pad"
                        className="border border-warm-200 rounded-xl px-3 py-2 bg-paper-50 text-ink-700 text-base font-semibold w-24 text-right"
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Live Subtotal Recalculation Card */}
          <View className="bg-paper-50 p-4 rounded-2xl border border-warm-100 mb-4">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-base mb-3"
            >
              Subtotal Recalculation
            </StyledText>
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <StyledText variant="regular" className="text-ink-500 text-sm">
                  Original Total
                </StyledText>
                <StyledText variant="semibold" className="text-ink-700 text-sm">
                  {formatPesos(originalTotal)}
                </StyledText>
              </View>

              <View className="flex-row justify-between items-center pt-2 border-t border-warm-100 mt-1">
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-base"
                >
                  Updated Total
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className="text-cinnamon-600 text-lg"
                >
                  {formatPesos(updatedTotal)}
                </StyledText>
              </View>
            </View>
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
              {REASON_OPTIONS.map((opt) => {
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
              {isSubmitting ? 'Processing...' : 'Save Price Correction'}
            </StyledText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
