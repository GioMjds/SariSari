import { Pressable, ScrollView, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';
import { StyledText } from '@/components/elements';
import { MoneyText, ReceiptHero, ReceiptHeroMeta } from '@/components/ui';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SALE_ANIMATION = require('@/assets/lottie/sale-recorded.json');
const UTANG_ANIMATION = require('@/assets/lottie/utang-recorded.json');
const MAX_LINES = 5;

export interface RecordedLine {
  key: string;
  name: string;
  quantity: number;
  unitName: string;
  lineTotal: number;
}

interface SaleSuccessStateProps {
  recordedTotal: number;
  itemCountLabel: string;
  piecesLabel: string;
  paymentType: 'cash' | 'credit';
  customerName: string | undefined;
  lines: RecordedLine[];
  recordedAt: number;
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
  lines,
  recordedAt,
  insets,
  onNewSale,
  onViewReceipts,
}: SaleSuccessStateProps) {
  const reducedMotion = useReducedMotion();
  const isCash = paymentType === 'cash';
  const title = isCash ? 'Sale recorded' : 'Utang recorded';
  const time = format(recordedAt, "'Today,' h:mm a");
  const shownLines = lines.slice(0, MAX_LINES);
  const hiddenCount = lines.length - shownLines.length;

  return (
    // Page tone matches ReceiptHero's perforation dots so the cut-outs read as holes.
    <View className="flex-1 bg-paper-200">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-4">
          {/* Plays once and holds the finished pose; reduced motion jumps straight to it */}
          <View accessible={false} importantForAccessibility="no-hide-descendants">
            <LottieView
              source={isCash ? SALE_ANIMATION : UTANG_ANIMATION}
              loop={false}
              style={{ width: 144, height: 144 }}
              {...(reducedMotion ? { progress: 1 } : { autoPlay: true })}
            />
          </View>

          <StyledText
            variant="black"
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            className="text-ink-900 text-[26px] mt-1"
          >
            {title}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-[14px] mt-1">
            {time}
          </StyledText>
          {!isCash && (
            <StyledText
              variant="medium"
              className="text-ink-700 text-[14px] mt-2 text-center leading-5"
            >
              {`Added to ${customerName ?? 'the suki'}'s utang.\nNot counted in sales until paid.`}
            </StyledText>
          )}
        </View>

        <Animated.View
          className="mt-6"
          {...(reducedMotion
            ? {}
            : { entering: FadeInDown.delay(250).duration(280) })}
        >
          <ReceiptHero
            tone={isCash ? 'sage' : 'cinnamon'}
            headerLabel={isCash ? 'CASH SALE' : 'UTANG'}
          >
            <View className="px-5 pt-5">
              <StyledText variant="medium" className="text-ink-500 text-[13px]">
                {isCash ? 'Total received' : 'Utang added'}
              </StyledText>
              <MoneyText
                value={recordedTotal}
                size="hero"
                numberOfLines={1}
                className="text-ink-900 mt-0.5"
              />
            </View>

            <View className="px-5 pt-4">
              {shownLines.map((line) => (
                <LineRow key={line.key} line={line} />
              ))}
              {hiddenCount > 0 && (
                <StyledText variant="medium" className="text-ink-500 text-[13px] py-2">
                  {`+${hiddenCount} more ${hiddenCount === 1 ? 'item' : 'items'}`}
                </StyledText>
              )}
            </View>

            <ReceiptHeroMeta
              caps={false}
              rows={[
                { label: 'Items', value: itemCountLabel },
                { label: 'Pieces', value: piecesLabel },
                { label: 'Payment', value: isCash ? 'Cash' : 'Utang' },
                ...(customerName ? [{ label: 'Suki', value: customerName }] : []),
              ]}
            />
          </ReceiptHero>
        </Animated.View>
      </ScrollView>

      <View
        className="px-4 pt-3 gap-3 border-t border-paper-300 bg-paper-50"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={onNewSale}
          accessibilityRole="button"
          accessibilityLabel="Start a new sale"
          className="min-h-[56px] rounded-2xl bg-persimmon-600 flex-row items-center justify-center active:bg-persimmon-700"
        >
          <FontAwesome
            name="plus"
            size={14}
            color="#FAFAF7"
            style={{ marginRight: 8 }}
          />
          <StyledText variant="extrabold" className="text-paper-50 text-[16px]">
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

function LineRow({ line }: { line: RecordedLine }) {
  return (
    <View
      accessible
      accessibilityLabel={`${line.name}, ${line.quantity} ${line.unitName}`}
      className="flex-row items-center py-2 border-b border-dashed border-ink-200"
    >
      <View className="flex-1 min-w-0 mr-3">
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-[15px]"
          numberOfLines={1}
        >
          {line.name}
        </StyledText>
        <StyledText variant="medium" className="text-ink-500 text-[13px]">
          {`${line.quantity} × ${line.unitName}`}
        </StyledText>
      </View>
      <MoneyText value={line.lineTotal} size="md" className="text-ink-900" />
    </View>
  );
}
