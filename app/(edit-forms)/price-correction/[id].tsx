import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { useCorrectSalePrice, useGetSale, useProfile } from '@/hooks';
import { formatPesos, tryParsePesosInput } from '@/lib/money';
import { useToastStore } from '@/stores';
import type { PriceCorrectionReasonCode } from '@/types/corrections.types';

type ReasonOption = {
  value: PriceCorrectionReasonCode;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
};

const REASON_OPTIONS: ReasonOption[] = [
  { value: 'misprinted_price', label: 'Misprinted Price', icon: 'tag' },
  {
    value: 'shelf_price_changed',
    label: 'Shelf Price Changed',
    icon: 'shopping-basket',
  },
];

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

  const handleReasonSelect = (val: PriceCorrectionReasonCode) => {
    Haptics.selectionAsync().catch(() => {});
    setReason(val);
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
  const totalDelta = updatedTotal - originalTotal;

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      addToast({
        message: `Invalid price for: ${invalidItems.join(', ')}`,
        variant: 'danger',
      });
      return;
    }

    if (priceChanges.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
      addToast({
        message: 'No price changes were made',
        variant: 'danger',
      });
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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      addToast({ message: 'Price correction recorded', variant: 'success' });
      router.back();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
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
      {/* Header */}
      <View
        className="bg-cinnamon-600 px-5 pb-5 flex-row items-center gap-3 border-b border-warm-900/20"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.back();
          }}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 rounded-full bg-paper-50/15 items-center justify-center border border-paper-50/20 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={15} color="#FBF7EE" />
        </Pressable>

        <View className="flex-1">
          <StyledText variant="medium" className="text-paper-100/70 label-caps">
            ITEM PRICE ADJUSTMENT
          </StyledText>
          <StyledText variant="extrabold" className="text-paper-50 text-xl">
            Price Correction
          </StyledText>
        </View>

        <View className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-300/30 flex-row items-center gap-1.5">
          <FontAwesome name="pencil" size={12} color="#FDE68A" />
          <StyledText variant="extrabold" className="text-amber-100 text-xs">
            #{id}
          </StyledText>
        </View>
      </View>

      <KeyboardAwareScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={64}
      >
        {/* Info Callout */}
        <View className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-4 flex-row items-start gap-3">
          <View className="w-9 h-9 rounded-xl bg-amber-100 items-center justify-center">
            <FontAwesome name="info-circle" size={18} color="#92400E" />
          </View>
          <View className="flex-1">
            <StyledText
              variant="extrabold"
              className="text-amber-900 text-sm mb-1"
            >
              How Price Correction works:
            </StyledText>
            <StyledText
              variant="regular"
              className="text-amber-800 text-xs leading-5"
            >
              • Adjust unit prices for any item without altering quantities
              {'\n'}• Subtotal & grand total recalculate automatically{'\n'}•
              Reverses/updates ledger difference without destroying history
            </StyledText>
          </View>
        </View>

        {/* Sale Items Price Editing Card */}
        <View className="bg-paper-50 p-4 rounded-2xl border border-warm-200 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between pb-3 border-b border-warm-200 divider-dotted mb-3">
            <View className="flex-row items-center gap-2">
              <FontAwesome name="tags" size={14} color="#623418" />
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-base"
              >
                Adjust Unit Prices
              </StyledText>
            </View>
            <StyledText
              variant="semibold"
              className="text-ink-500 text-xs label-caps"
            >
              {sale?.items?.length ?? 0} ITEMS
            </StyledText>
          </View>

          {isLoading || !sale ? (
            <View className="py-6 items-center">
              <StyledText variant="medium" className="text-ink-400 text-sm">
                Loading items...
              </StyledText>
            </View>
          ) : sale.items.length === 0 ? (
            <View className="py-6 items-center">
              <StyledText variant="medium" className="text-ink-400 text-sm">
                No items found in this sale.
              </StyledText>
            </View>
          ) : (
            <View className="gap-3">
              {sale.items.map((item) => {
                const editVal = edits[item.id];
                const hasEdited =
                  editVal !== undefined && editVal.trim() !== '';
                const parsedNewPrice = hasEdited
                  ? tryParsePesosInput(editVal)
                  : item.price;
                const itemDelta = (parsedNewPrice - item.price) * item.quantity;
                const isChanged = hasEdited && parsedNewPrice !== item.price;

                return (
                  <View
                    key={item.id}
                    className="p-3 rounded-xl bg-paper-100/70 border border-warm-200/80 gap-2"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <StyledText
                          variant="extrabold"
                          className="text-ink-900 text-sm"
                          numberOfLines={1}
                        >
                          {item.product_name}
                        </StyledText>
                        <StyledText
                          variant="regular"
                          className="text-ink-500 text-xs mt-0.5"
                        >
                          Qty: {item.quantity} · Orig unit price:{' '}
                          {formatPesos(item.price)}
                        </StyledText>
                      </View>

                      {/* Input Field */}
                      <View className="flex-row items-center gap-1 bg-paper-50 border border-warm-300 rounded-xl px-2.5 py-1">
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
                          className="text-ink-900 text-base font-bold w-20 text-right py-1"
                        />
                      </View>
                    </View>

                    {/* Per Item Comparison Delta Badge */}
                    {isChanged && (
                      <View className="flex-row items-center justify-between pt-2 border-t border-warm-200/60">
                        <StyledText
                          variant="medium"
                          className="text-ink-600 text-xs"
                        >
                          Line Total: {formatPesos(item.price * item.quantity)}{' '}
                          →{' '}
                          <StyledText
                            variant="extrabold"
                            className="text-ink-900"
                          >
                            {formatPesos(parsedNewPrice * item.quantity)}
                          </StyledText>
                        </StyledText>
                        <View
                          className={`px-2 py-0.5 rounded-md ${
                            itemDelta < 0 ? 'bg-emerald-100' : 'bg-amber-100'
                          }`}
                        >
                          <StyledText
                            variant="extrabold"
                            className={`text-[11px] ${
                              itemDelta < 0
                                ? 'text-emerald-800'
                                : 'text-amber-800'
                            }`}
                          >
                            {itemDelta > 0 ? '+' : ''}
                            {formatPesos(itemDelta)}
                          </StyledText>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Live Subtotal Recalculation Card */}
        <View className="bg-paper-50 p-4 rounded-2xl border border-warm-200 mb-4 shadow-sm">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-base mb-3"
          >
            Recalculation Summary
          </StyledText>

          <View className="gap-2.5">
            <View className="flex-row justify-between items-center">
              <StyledText variant="regular" className="text-ink-500 text-xs">
                Original Sale Total
              </StyledText>
              <StyledText variant="semibold" className="text-ink-700 text-xs">
                {formatPesos(originalTotal)}
              </StyledText>
            </View>

            <View className="flex-row justify-between items-center">
              <StyledText variant="regular" className="text-ink-500 text-xs">
                Net Price Difference
              </StyledText>
              <StyledText
                variant="extrabold"
                className={`text-xs ${
                  totalDelta < 0
                    ? 'text-emerald-700'
                    : totalDelta > 0
                      ? 'text-amber-700'
                      : 'text-ink-500'
                }`}
              >
                {totalDelta > 0 ? '+' : ''}
                {formatPesos(totalDelta)}
              </StyledText>
            </View>

            <View className="flex-row justify-between items-center pt-3 border-t border-warm-200 divider-dotted mt-1">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-sm uppercase tracking-wider"
              >
                Updated Sale Total
              </StyledText>
              <StyledText
                variant="extrabold"
                className="text-cinnamon-600 text-xl"
              >
                {formatPesos(updatedTotal)}
              </StyledText>
            </View>
          </View>
        </View>

        {/* Reason Code Picker */}
        <View className="bg-paper-50 p-4 rounded-2xl border border-warm-200 mb-4 shadow-sm">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-base mb-1"
          >
            Reason Code *
          </StyledText>
          <StyledText variant="regular" className="text-ink-500 text-xs mb-3">
            Specify why prices are being modified
          </StyledText>

          <View className="gap-2">
            {REASON_OPTIONS.map((opt) => {
              const isSelected = reason === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleReasonSelect(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={opt.label}
                  className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                    isSelected
                      ? 'bg-cinnamon-50 border-cinnamon-500'
                      : 'bg-paper-50 border-warm-200'
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-8 h-8 rounded-lg items-center justify-center ${
                        isSelected ? 'bg-cinnamon-500' : 'bg-paper-200'
                      }`}
                    >
                      <FontAwesome
                        name={opt.icon}
                        size={14}
                        color={isSelected ? '#FBF7EE' : '#564E45'}
                      />
                    </View>
                    <StyledText
                      variant={isSelected ? 'extrabold' : 'medium'}
                      className={`text-sm ${
                        isSelected ? 'text-cinnamon-950' : 'text-ink-800'
                      }`}
                    >
                      {opt.label}
                    </StyledText>
                  </View>

                  <View
                    className={`w-5 h-5 rounded-full border items-center justify-center ${
                      isSelected
                        ? 'border-cinnamon-500 bg-cinnamon-500'
                        : 'border-warm-300 bg-paper-50'
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

        {/* Audit Verification */}
        <View className="bg-paper-50 p-4 rounded-2xl border border-warm-200 mb-5 shadow-sm">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-base mb-1"
          >
            Audit Verification
          </StyledText>
          <StyledText variant="regular" className="text-ink-500 text-xs mb-3">
            Enter cashier or witness details for compliance
          </StyledText>

          <View className="mb-4">
            <StyledText
              variant="semibold"
              className="text-ink-800 text-xs mb-1.5"
            >
              Witness / Cashier Name *
            </StyledText>
            <View className="flex-row items-center border border-warm-300 rounded-xl px-3 bg-paper-50">
              <FontAwesome name="user" size={14} color="#8C8275" />
              <TextInput
                value={witness}
                onChangeText={setWitness}
                placeholder="e.g., Ate Nena / Shift Manager"
                placeholderTextColor="#A39E93"
                className="flex-1 py-3 px-2.5 text-ink-900 text-sm font-medium"
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
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Notes on pricing error or approval..."
              placeholderTextColor="#A39E93"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="border border-warm-300 rounded-xl p-3 bg-paper-50 text-ink-900 text-sm font-medium min-h-[80px]"
            />
          </View>
        </View>

        {/* Submit Action Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Save Price Correction"
          className="bg-cinnamon-600 p-4 rounded-2xl items-center active:opacity-90 shadow-sm flex-row justify-center gap-2 disabled:opacity-50"
        >
          <FontAwesome
            name={isSubmitting ? 'spinner' : 'check-circle'}
            size={16}
            color="#FBF7EE"
          />
          <StyledText variant="extrabold" className="text-paper-50 text-base">
            {isSubmitting ? 'Saving Correction...' : 'Save Price Correction'}
          </StyledText>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
