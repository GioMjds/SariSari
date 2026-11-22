import { withProf } from '@/utils/perf';
import { StyledText } from '@/components/elements';
import {
  SaleDetailsFooter,
  SaleDetailsHeader,
  SaleDetailsHero,
  SaleDetailsItemList,
  SaleDetailsSkeleton,
} from '@/components/sales';
import { ReceiptHero, ReceiptHeroDivider } from '@/components/ui';
import { useDeleteSale, useGetSale } from '@/hooks';
import { Alert } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Pressable, ScrollView, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Height of the sticky correction bar above the safe-area inset.
const ACTION_BAR_HEIGHT = 76;

function SaleDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const numericId = Number(id);
  const { data: sale, isLoading, isError, refetch } = useGetSale(numericId);
  const deleteSaleMutation = useDeleteSale();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

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
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/sales/receipts' as Href);
              }
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
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/sales/receipts' as Href);
  };

  const handleVoid = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/sale-correction/${numericId}?mode=void` as Href);
  };

  const handleRefund = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/sale-correction/${numericId}?mode=refund` as Href);
  };

  const handlePriceCorrection = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/price-correction/${numericId}` as Href);
  };

  const canCorrect = !!sale && !sale.cancelled_at;
  const tone = sale?.cancelled_at
    ? 'cinnamon'
    : sale?.payment_type === 'credit'
      ? 'persimmon'
      : 'sage';

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <SaleDetailsHeader
        saleId={numericId}
        onBack={handleBack}
        onDelete={sale ? handleDeleteSale : undefined}
      />

      {isLoading ? (
        <SaleDetailsSkeleton />
      ) : !sale ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-paper-100 border border-paper-300 items-center justify-center">
            <FontAwesome name="file-text-o" size={24} color="#564E45" />
          </View>
          <StyledText variant="black" accessibilityRole="header" className="text-ink-900 text-xl mt-4 text-center">
            {isError ? "Couldn't load this resibo" : 'Resibo not found'}
          </StyledText>
          <StyledText variant="regular" className="text-ink-500 text-sm mt-1 text-center">
            {isError
              ? 'Something went wrong reading this sale. Try again.'
              : 'This sale may have been deleted.'}
          </StyledText>
          <Pressable
            onPress={isError ? () => refetch() : handleBack}
            accessibilityRole="button"
            className="mt-6 min-h-12 px-6 rounded-xl bg-persimmon-500 items-center justify-center active:bg-persimmon-700"
          >
            <StyledText variant="extrabold" className="text-paper-50 text-base">
              {isError ? 'Try again' : 'Back to receipts'}
            </StyledText>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: insets.bottom + (canCorrect ? ACTION_BAR_HEIGHT + 24 : 32),
            }}
            showsVerticalScrollIndicator={false}
          >
            <MotiView
              from={{ opacity: 0, translateY: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: reduceMotion ? 120 : 280 }}
            >
              <ReceiptHero tone={tone}>
                <SaleDetailsHero sale={sale} />
                <SaleDetailsItemList sale={sale} />
                <View className="pt-3 pb-5">
                  <ReceiptHeroDivider label="thank you" tone="sage" />
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-xs text-center mt-1 px-5"
                    style={{ lineHeight: 18 }}
                  >
                    {'Salamat sa iyong pagbili.\nKeep this resibo for your records.'}
                  </StyledText>
                </View>
              </ReceiptHero>
            </MotiView>
          </ScrollView>

          {canCorrect && (
            <SaleDetailsFooter
              bottomInset={insets.bottom}
              onVoid={handleVoid}
              onRefund={handleRefund}
              onPriceCorrection={handlePriceCorrection}
            />
          )}
        </>
      )}
    </View>
  );
}

export default withProf(SaleDetails, 'sale-details/[id]');
