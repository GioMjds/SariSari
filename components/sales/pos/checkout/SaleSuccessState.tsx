import { useEffect } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';
import { StyledText } from '@/components/elements';
import { MoneyText, ReceiptHero, ReceiptHeroMeta } from '@/components/ui';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatPesos } from '@/lib/money';
import { ICON_COLOR } from '@/lib/theme';

const SALE_ANIMATION = require('@/assets/lottie/sale-recorded.json');
const UTANG_ANIMATION = require('@/assets/lottie/utang-recorded.json');
const MAX_LINES = 5;
// Keeps the receipt and buttons at a scannable width on tablets and wide windows.
const COLUMN = { width: '100%', maxWidth: 560, alignSelf: 'center' } as const;

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
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isCash = paymentType === 'cash';
  const title = isCash ? 'Sale recorded' : 'Utang recorded';
  const time = format(recordedAt, "'Today,' h:mm a");
  const shownLines = lines.slice(0, MAX_LINES);
  const hiddenCount = lines.length - shownLines.length;
  const heroSize = isLandscape ? 96 : 144;

  // Screen readers get the outcome once on arrival; live regions do not fire on mount.
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `${title}, ${formatPesos(recordedTotal)}`,
    );
  }, [title, recordedTotal]);

  return (
    // Page tone matches ReceiptHero's perforation dots so the cut-outs read as holes.
    <View
      className="flex-1 bg-paper-200"
      style={{ paddingLeft: insets.left, paddingRight: insets.right }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={COLUMN}>
          <View className="items-center px-4">
            {/* Plays once and holds the finished pose; reduced motion jumps straight to it */}
            <View
              accessible={false}
              importantForAccessibility="no-hide-descendants"
            >
              <LottieView
                source={isCash ? SALE_ANIMATION : UTANG_ANIMATION}
                loop={false}
                style={{ width: heroSize, height: heroSize }}
                {...(reducedMotion ? { progress: 1 } : { autoPlay: true })}
              />
            </View>

            <StyledText
              variant="black"
              accessibilityRole="header"
              className="text-ink-900 text-[26px] mt-1 text-center"
            >
              {title}
            </StyledText>
            <StyledText variant="medium" className="text-ink-500 text-[14px] mt-1">
              {time}
            </StyledText>
            {!isCash && (
              <StyledText
                variant="medium"
                className="text-ink-900 text-[14px] mt-2 text-center leading-5"
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
                  shrinkToFit
                  className="text-ink-900 mt-0.5"
                />
              </View>

              <View className="px-5 pt-4">
                {shownLines.map((line) => (
                  <LineRow key={line.key} line={line} />
                ))}
                {hiddenCount > 0 && (
                  <StyledText
                    variant="medium"
                    className="text-ink-500 text-[13px] py-2"
                  >
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
                  ...(customerName
                    ? [{ label: 'Suki', value: customerName }]
                    : []),
                ]}
              />
            </ReceiptHero>
          </Animated.View>
        </View>
      </ScrollView>

      <View
        className="pt-3 border-t border-paper-300 bg-paper-50"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {/* Side by side in landscape so the buttons do not eat the short screen height */}
        <View
          className={`px-4 gap-3 ${isLandscape ? 'flex-row-reverse' : ''}`}
          style={COLUMN}
        >
          <Pressable
            onPress={onNewSale}
            accessibilityRole="button"
            accessibilityLabel="Start a new sale"
            className={`min-h-[56px] rounded-2xl bg-persimmon-600 flex-row items-center justify-center active:bg-persimmon-700 ${isLandscape ? 'flex-1' : ''}`}
          >
            <FontAwesome
              name="plus"
              size={14}
              color={ICON_COLOR.paper}
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
            className={`min-h-[52px] rounded-2xl bg-paper-100 border border-paper-400 flex-row items-center justify-center active:bg-paper-300 ${isLandscape ? 'flex-1' : ''}`}
          >
            <FontAwesome
              name="list-alt"
              size={14}
              color={ICON_COLOR.ink}
              style={{ marginRight: 8 }}
            />
            <StyledText variant="extrabold" className="text-ink-800 text-[15px]">
              View receipts
            </StyledText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function LineRow({ line }: { line: RecordedLine }) {
  return (
    <View
      accessible
      accessibilityLabel={`${line.name}, ${line.quantity} ${line.unitName}, ${formatPesos(line.lineTotal)}`}
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
