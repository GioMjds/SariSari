import { Pressable, ScrollView, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { SariMascot } from '@/components/mascot';

interface SaleSuccessStateProps {
  recordedTotal: number;
  itemCountLabel: string;
  piecesLabel: string;
  paymentType: 'cash' | 'credit';
  customerName: string | undefined;
  insets: { top: number; bottom: number; left: number; right: number };
  onNewSale: () => void;
  onViewReceipts: () => void;
}

export function SaleSuccessState({
  recordedTotal,
  itemCountLabel,
  piecesLabel,
  paymentType,
  customerName,
  insets,
  onNewSale,
  onViewReceipts,
}: SaleSuccessStateProps) {
  const isCash = paymentType === 'cash';

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="flex-1 bg-paper-50"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          {/* Sari acts out the outcome: coin into the jar, or a check on the utang ledger */}
          <SariMascot
            state={isCash ? 'sale-recorded' : 'utang-recorded'}
            size={148}
            accessibilityLabel={
              isCash
                ? 'Sari drops a coin into the jar'
                : 'Sari checks off the utang on her ledger'
            }
          />

          <StyledText variant="black" className="text-ink-900 text-[26px] mt-2">
            {isCash ? 'Sale recorded' : 'Utang recorded'}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-[14px] mt-1">
            {isCash
              ? 'Cash received.'
              : `Added to ${customerName ?? 'the suki'}'s utang.`}
          </StyledText>
        </View>

        {/* Receipt card: dashed border mirrors a paper receipt */}
        <View className="mt-6 rounded-2xl p-4 bg-white border border-dashed border-paper-400">
          <StyledText variant="medium" className="text-ink-500 text-[13px]">
            {isCash ? 'Total recorded' : 'Utang added'}
          </StyledText>
          <View className="flex-row items-baseline mt-0.5">
            <MoneyText
              value={recordedTotal}
              size="hero"
              numberOfLines={1}
              className="text-ink-900 flex-1"
            />
            <StyledText variant="extrabold" className="text-ink-500 text-xs ml-2">
              PHP
            </StyledText>
          </View>

          <View className="h-px bg-paper-300 my-3" />

          <ReceiptRow label="Items" value={itemCountLabel} />
          <ReceiptRow label="Pieces" value={piecesLabel} />
          <ReceiptRow
            label="Payment"
            value={paymentType === 'cash' ? 'Cash' : 'Utang'}
          />
          {customerName ? <ReceiptRow label="Suki" value={customerName} /> : null}
        </View>
      </ScrollView>

      <View
        className="px-4 pt-3 gap-3 border-t border-paper-300 bg-paper-50"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={onNewSale}
          accessibilityRole="button"
          accessibilityLabel="Start a new sale"
          className="min-h-[56px] rounded-2xl bg-persimmon-500 flex-row items-center justify-center active:bg-persimmon-600"
        >
          <FontAwesome
            name="plus"
            size={14}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <StyledText variant="extrabold" className="text-white text-[16px]">
            New sale
          </StyledText>
        </Pressable>

        <Pressable
          onPress={onViewReceipts}
          accessibilityRole="button"
          accessibilityLabel="View saved receipts"
          className="min-h-[52px] rounded-2xl bg-paper-100 border border-paper-400 flex-row items-center justify-center active:bg-paper-300"
        >
          <FontAwesome
            name="list-alt"
            size={14}
            color="#28231D"
            style={{ marginRight: 8 }}
          />
          <StyledText variant="extrabold" className="text-ink-800 text-[15px]">
            View receipts
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <StyledText variant="medium" className="text-ink-500 text-[14px]">
        {label}
      </StyledText>
      <StyledText
        variant="extrabold"
        className="text-ink-900 text-[14px] ml-4 flex-shrink"
        numberOfLines={1}
      >
        {value}
      </StyledText>
    </View>
  );
}
