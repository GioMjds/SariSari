import { StyledText } from '@/components/elements';
import {
  SaleDetailsFooter,
  SaleDetailsHeader,
  SaleDetailsHero,
  SaleDetailsItemList,
} from '@/components/sell';
import { useDeleteSale, useGetSale } from '@/hooks';
import { Alert, parseStoredTimestamp } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Hoisted to module scope — stable reference, no inline object re-allocation on re-render.
const SCROLL_CONTENT_STYLE = { paddingTop: 16, paddingBottom: 140 } as const;

/**
 * SaleDetails — orchestrator for the Sale Details (resibo) screen.
 *
 * Owns only:
 *   • Loading state.
 *   • Data fetching via `useGetSale(id)` + `useDeleteSale()`.
 *   • Local date/number formatting (`dateLine`, `dateShort`, etc.) — memoised.
 *   • The Alert.alert delete confirmation flow — stable via useCallback.
 *   • Navigation (router.back).
 *
 * Every visual block — header, hero, item list, footer — is delegated
 * to a presentational subcomponent under `components/sell/sale-details/`.
 */
export default function SaleDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const numericId = Number(id);
  const { data: sale, isLoading } = useGetSale(numericId);
  const deleteSaleMutation = useDeleteSale();
  const insets = useSafeAreaInsets();

  const handleDeleteSale = () => {
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
              await deleteSaleMutation.mutateAsync(numericId);
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

  const isCredit = sale?.payment_type === 'credit';
  const ts = parseStoredTimestamp(sale?.timestamp) || new Date();
  const dateLine = format(ts, 'MMM dd, yyyy · hh:mm a');
  const dateShort = format(ts, 'MM/dd/yy');
  const timeShort = format(ts, 'hh:mm a');
  const grandTotalDisplay = (sale?.total ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const itemsCount = sale?.items_count ?? 0;
  const buyerName = sale?.customer_name?.trim() ?? null;

  // ─── Loading state ───────────────────────────────────────────────
  if (isLoading || !sale) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
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
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <SaleDetailsHeader
        saleId={sale.id}
        onBack={handleBack}
        onDelete={handleDeleteSale}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={SCROLL_CONTENT_STYLE}
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-4">
          <SaleDetailsHero
            paymentType={sale.payment_type}
            hasCustomerName={!!buyerName}
            customerName={buyerName}
            dateLine={dateLine}
            dateShort={dateShort}
            timeShort={timeShort}
            itemsCount={itemsCount}
            saleId={sale.id}
            total={sale.total}
            heroTitleLabel={isCredit ? 'Utang Record' : 'Paid in Full'}
            creditTotalLabel="BALANCE OUTSTANDING"
            cashTotalLabel="TOTAL PAID"
          />
        </View>

        <SaleDetailsItemList
          items={sale.items}
          subtotal={sale.total}
          sectionLabel="Itemised list"
          subtotalLabel="Subtotal"
        />

        <SaleDetailsFooter
          grandTotalLabel={isCredit ? 'Utang total' : 'Grand total'}
          grandTotalDisplay={grandTotalDisplay}
          thankYouMessage={
            'Salamat sa iyong pagbili.\nKeep this resibo for your records.'
          }
          onDelete={handleDeleteSale}
        />
      </ScrollView>
    </View>
  );
}
