import StyledText from '@/components/elements/StyledText';
import ReceiptHero, {
  ReceiptHeroDivider,
  ReceiptHeroMeta,
  ReceiptHeroTotal,
} from '@/components/ui/ReceiptHero';
import StatusStamp from '@/components/ui/StatusStamp';
import { useSales } from '@/hooks/useSales';
import { Alert } from '@/utils/alert';
import { parseStoredTimestamp } from '@/utils/timezone';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * SaleDetails — "Resibo" (Receipt) view.
 *
 * Reimagined as an editorial paper receipt:
 *   - Hero = perforated ReceiptHero with ink-stamped status
 *   - Items list = a ledger of monospaced rows separated by
 *     dashed dividers (like an itemised receipt)
 *   - Footer = grand-total plate in deep cinnamon, anchored to
 *     the bottom of the scroll
 *
 * Color palette: see tailwind.config.js — persimmon / cinnamon /
 * sage / ink / paper. The screen does NOT use the old "primary" /
 * "secondary" token names so the design intent is explicit.
 */

export default function SaleDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { useGetSale, deleteSaleMutation } = useSales();
  const { data: sale, isLoading } = useGetSale(Number(id));

  const handleDeleteSale = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
    Alert.alert(
      'Delete Sale',
      'Are you sure you want to delete this sale? This will restore the inventory.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSaleMutation.mutateAsync(Number(id));
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {});
              router.back();
            } catch {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              ).catch(() => {});
              Alert.alert('Error', 'Failed to delete sale');
            }
          },
        },
      ],
    );
  };

  const handleBack = () => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  };

  // ─── Loading state ───────────────────────────────────────────────
  if (isLoading || !sale) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        {/* Slim top bar so loading state still feels intentional */}
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <Pressable
            onPress={handleBack}
            hitSlop={20}
            className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>
        </View>
        <View className="flex-1 justify-center items-center">
          <View
            className="w-12 h-12 rounded-full border-2 border-ink-200 animate-pulse"
            style={{ borderTopColor: '#E85A1F' }}
          />
          <StyledText variant="medium" className="text-ink-500 mt-4 label-caps">
            Loading resibo…
          </StyledText>
        </View>
      </SafeAreaView>
    );
  }

  const isCredit = sale.payment_type === 'credit';
  const timestamp = parseStoredTimestamp(sale.timestamp) || new Date();
  const dateLine = format(timestamp, 'MMM dd, yyyy · hh:mm a');
  const dateShort = format(timestamp, 'MM/dd/yy');
  const timeShort = format(timestamp, 'hh:mm a');
  const itemsCount = sale.items_count;
  const stampTone = isCredit ? 'persimmon' : 'sage';
  const stampLabel = isCredit ? 'UTANG' : 'CASH';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* ─── Top bar — minimal, no title bar ─────────────────────
					Title sits on the receipt itself; the top bar only carries
			    the back button + a small actions row (delete). */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable
          onPress={handleBack}
          hitSlop={20}
          className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <StyledText variant="extrabold" className="label-caps text-ink-400">
          Sale · {String(sale.id).padStart(5, '0')}
        </StyledText>

        <Pressable
          onPress={handleDeleteSale}
          hitSlop={20}
          className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="trash" size={14} color="#C13030" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Receipt Hero (staggered fade-in) ──────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 480, delay: 60 }}
        >
          <ReceiptHero tone="persimmon">
            {/* Eyebrow stamp + customer block */}
            <View className="px-5 pt-6 pb-3 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <StyledText
                  variant="black"
                  className="text-ink-900 text-3xl"
                  style={{ letterSpacing: -0.5 }}
                >
                  {isCredit ? 'Utang Record' : 'Paid in Full'}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-sm mt-1"
                >
                  {dateLine}
                </StyledText>
              </View>
              <StatusStamp
                label={stampLabel}
                tone={stampTone}
                size="md"
                rotate={isCredit ? -8 : 6}
              />
            </View>

            {/* Customer block (credit sales only) — printed like
						    a "bill to" line on a real invoice */}
            {isCredit && sale.customer_name && (
              <View className="mx-5 mt-1 mb-2 bg-paper-100 rounded-xl px-4 py-3 border border-dashed border-ink-200">
                <StyledText className="label-caps text-ink-400 mb-1">
                  Bill to
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-lg"
                >
                  {sale.customer_name}
                </StyledText>
                <View className="flex-row items-center mt-1">
                  <FontAwesome name="clock-o" size={11} color="#7A7165" />
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-xs ml-1.5"
                  >
                    Due on request
                  </StyledText>
                </View>
              </View>
            )}

            {/* Meta block — date, time, item count, ref no. */}
            <ReceiptHeroMeta
              rows={[
                { label: 'Date', value: dateShort },
                { label: 'Time', value: timeShort },
                {
                  label: 'Items',
                  value: `${itemsCount} ${itemsCount === 1 ? 'pc' : 'pcs'}`,
                },
                {
                  label: 'Ref №',
                  value: `R-${String(sale.id).padStart(6, '0')}`,
                },
              ]}
            />

            {/* Grand total — printed plate */}
            <ReceiptHeroTotal
              label={isCredit ? 'BALANCE OUTSTANDING' : 'TOTAL PAID'}
              amount={sale.total / 100}
            />
          </ReceiptHero>
        </MotiView>

        {/* ─── Items — Itemised ledger ─────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 480, delay: 140 }}
        >
          <View className="mx-4 mt-7">
            {/* Section eyebrow */}
            <View className="flex-row items-center justify-between mb-3 px-1">
              <StyledText variant="black" className="label-caps text-ink-700">
                Itemised list
              </StyledText>
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-persimmon-500 mr-1.5" />
                <StyledText variant="medium" className="text-mono text-ink-500">
                  {sale.items.length} lines
                </StyledText>
              </View>
            </View>

            {/* Item rows — printed-receipt style */}
            <View className="bg-paper-50 rounded-3xl shadow-paper border border-ink-100 overflow-hidden">
              {sale.items.map((item, index) => {
                const lineTotal = item.quantity * item.price;
                const isLast = index === sale.items.length - 1;
                return (
                  <MotiView
                    key={item.id}
                    from={{ opacity: 0, translateX: -8 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{
                      type: 'timing',
                      duration: 360,
                      delay: 220 + index * 60,
                    }}
                  >
                    <View
                      className={`px-5 py-4 ${isLast ? '' : 'border-b border-dashed border-ink-200'}`}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <StyledText
                            variant="extrabold"
                            className="text-ink-900 text-base"
                            numberOfLines={2}
                          >
                            {item.product_name}
                          </StyledText>
                          <View className="flex-row items-center mt-1.5">
                            <View className="bg-paper-200 rounded-md px-2 py-0.5">
                              <StyledText
                                variant="medium"
                                className="text-mono text-ink-700"
                              >
                                {item.quantity}×
                              </StyledText>
                            </View>
                            <StyledText
                              variant="regular"
                              className="text-ink-500 text-xs ml-2"
                            >
                              @
                              <StyledText
                                variant="medium"
                                className="text-ink-700"
                              >
                                {item.price.toLocaleString('en-PH', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </StyledText>
                            </StyledText>
                          </View>
                        </View>
                        <StyledText
                          variant="extrabold"
                          className="text-ink-900 text-base"
                          style={{ letterSpacing: -0.2 }}
                        >
                          {lineTotal.toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </StyledText>
                      </View>
                    </View>
                  </MotiView>
                );
              })}

              {/* Ledger footer — dashes + total line */}
              <View className="bg-paper-100 px-5 py-3 flex-row items-center justify-between border-t border-dashed border-ink-300">
                <StyledText
                  variant="medium"
                  className="label-caps text-ink-500"
                >
                  Subtotal
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className="text-mono text-ink-900"
                >
                  {sale.total.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </StyledText>
              </View>
            </View>
          </View>
        </MotiView>

        {/* ─── Footer note ─────────────────────────────────── */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 480, delay: 320 }}
        >
          <View className="mx-4 mt-7">
            <ReceiptHeroDivider label="thank you" tone="sage" />
            <StyledText
              variant="regular"
              className="text-ink-500 text-xs text-center mt-3"
              style={{ lineHeight: 18 }}
            >
              Salamat sa iyong pagbili.
              {'\n'}Keep this resibo for your records.
            </StyledText>
          </View>
        </MotiView>
      </ScrollView>

      {/* ─── Sticky grand-total plate (deep cinnamon) ──────── */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 520, delay: 220 }}
        className="absolute bottom-0 left-0 right-0"
      >
        <View className="px-4 pb-5 pt-3">
          <View className="bg-cinnamon-500 rounded-3xl shadow-paper-deep px-5 py-4 flex-row items-center justify-between overflow-hidden">
            {/* Decorative dot pattern on the right */}
            <View
              className="absolute -right-2 -top-2 w-24 h-24 rounded-full opacity-20"
              style={{ backgroundColor: '#FFC4A8' }}
            />
            <View
              className="absolute right-12 top-4 w-8 h-8 rounded-full opacity-15"
              style={{ backgroundColor: '#FFC4A8' }}
            />

            <View className="flex-1">
              <StyledText
                variant="medium"
                className="label-caps text-paper-200 opacity-90"
              >
                {isCredit ? 'Utang total' : 'Grand total'}
              </StyledText>
              <View className="flex-row items-baseline mt-1">
                <StyledText
                  variant="medium"
                  className="text-paper-100 text-base mr-1"
                  style={{ letterSpacing: -0.5 }}
                >
                  ₱
                </StyledText>
                <StyledText
                  variant="black"
                  className="text-paper-50 text-3xl"
                  style={{ letterSpacing: -0.5 }}
                >
                  {sale.total.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </StyledText>
              </View>
            </View>

            <Pressable
              onPress={handleDeleteSale}
              hitSlop={12}
              className="w-12 h-12 rounded-full bg-persimmon-500 items-center justify-center shadow-paper active:opacity-80"
              style={{ marginLeft: 12 }}
            >
              <FontAwesome name="trash" size={16} color="#FFF1EA" />
            </Pressable>
          </View>
        </View>
      </MotiView>
    </SafeAreaView>
  );
}
