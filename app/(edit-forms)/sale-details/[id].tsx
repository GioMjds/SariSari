import { withProf } from '@/utils/perf';
import { StyledText } from '@/components/elements';
import {
  SaleDetailsFooter,
  SaleDetailsHeader,
  SaleDetailsHero,
  SaleDetailsItemList,
  SaleDetailsSkeleton,
  SaleFixSheet,
  SaleMoreSheet,
} from '@/components/sales';
import { ReceiptHero, ReceiptHeroDivider } from '@/components/ui';
import { useDeleteSale, useGetSale, useSaleCorrections } from '@/hooks';
import { useAppSetting } from '@/hooks/useAppSetting';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import { useProfile } from '@/hooks/useProfile';
import { buildSaleReceiptText, shareSaleReceiptPdf } from '@/lib/saleReceipt';
import { ICON_COLOR } from '@/lib/theme';
import { useToastStore } from '@/stores/ToastStore';
import { Alert, formatReceiptRef, parseStoredTimestamp } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Starting guess for the sticky bar until onLayout reports its real height.
const ACTION_BAR_HEIGHT = 76;
// Receipt and footer stop growing here so tablets get a readable ticket, not a stretched phone one.
const TICKET_MAX_WIDTH = 480;
const DEFAULT_VOID_WINDOW_HOURS = 24;

function SaleDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const numericId = Number(id);
  const { data: sale, isLoading, isError, refetch } = useGetSale(numericId);
  const { data: corrections } = useSaleCorrections(Number.isFinite(numericId) ? numericId : null);
  const { value: windowSetting } = useAppSetting('void_window_hours');
  const { profile } = useProfile();
  const { runWithPinGuard } = useOwnerPinGuard();
  const addToast = useToastStore((s) => s.addToast);
  const deleteSaleMutation = useDeleteSale();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [fixOpen, setFixOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [footerHeight, setFooterHeight] = useState<number | null>(null);
  // Set when Delete is confirmed; the PIN prompt opens only after the More sheet has left, so iOS never stacks two modals.
  const deleteQueued = useRef(false);

  const refLabel = formatReceiptRef(numericId);
  const storeName = profile?.storeName?.trim() || 'Sari-sari store';
  const latestCorrection = corrections?.at(-1);
  const windowHours = Number(windowSetting) || DEFAULT_VOID_WINDOW_HOURS;
  const saleTime = parseStoredTimestamp(sale?.timestamp)?.getTime() ?? Date.now();
  const windowOpen = (Date.now() - saleTime) / 36e5 <= windowHours;

  // First recorded old price per line, so a line fixed twice still shows the original.
  const oldPrices = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of corrections ?? []) {
      if (c.kind !== 'price_correction') continue;
      for (const line of c.lines) if (!map.has(line.saleItemId)) map.set(line.saleItemId, line.oldPrice);
    }
    return map;
  }, [corrections]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/sales/receipts' as Href);
  };

  const handleBack = () => {
    Haptics.selectionAsync().catch(() => {});
    goBack();
  };

  const openSheet = (open: (v: boolean) => void) => {
    Haptics.selectionAsync().catch(() => {});
    open(true);
  };

  const pushCorrection = (path: string) => {
    Haptics.selectionAsync().catch(() => {});
    setFixOpen(false);
    router.push(path as Href);
  };

  const handleCopyRef = async () => {
    await Clipboard.setStringAsync(refLabel);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setMoreOpen(false);
    addToast({ message: `Copied ${refLabel}`, variant: 'success', duration: 2500 });
  };

  const queueDelete = () => {
    deleteQueued.current = true;
    setMoreOpen(false);
  };

  const handleMoreClosed = () => {
    if (!deleteQueued.current) return;
    deleteQueued.current = false;
    void handleDeleteSale();
  };

  const handleDeleteSale = async () => {
    await runWithPinGuard({
      actionId: 'sale_delete',
      title: 'Delete sale',
      actionDescription: `Delete resibo ${refLabel} and return its stock to inventory.`,
      onApproved: async () => {
        try {
          await deleteSaleMutation.mutateAsync(numericId);
          addToast({ message: `Deleted resibo ${refLabel}`, variant: 'success', duration: 3000 });
          goBack();
        } catch {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          Alert.alert('Error', 'Failed to delete sale. Try again.');
        }
      },
    });
  };

  const shareText = async () => {
    if (!sale) return;
    const text = buildSaleReceiptText(sale, storeName);
    try {
      await Share.share({ message: text, title: `Resibo ${refLabel}` });
    } catch {
      await Clipboard.setStringAsync(text);
      addToast({ message: 'Resibo copied. Paste it in your chat app.', variant: 'default', duration: 3500 });
    }
  };

  const sharePdf = async () => {
    if (!sale) return;
    setSharing(true);
    const ok = await shareSaleReceiptPdf(sale, storeName);
    setSharing(false);
    if (!ok) Alert.alert('Could not share PDF', 'Try sharing as text instead.');
  };

  // iOS expects an action sheet for a choice of actions; Android keeps its native dialog.
  const handleShare = () => {
    Haptics.selectionAsync().catch(() => {});
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Share resibo',
          options: ['As text (SMS or chat)', 'As PDF', 'Cancel'],
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === 0) void shareText();
          if (index === 1) void sharePdf();
        },
      );
      return;
    }
    Alert.alert('Share resibo', 'How do you want to send this resibo?', [
      { text: 'As text (SMS or chat)', onPress: shareText },
      { text: 'As PDF', onPress: sharePdf },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const customerId = sale?.customer_credit_id;
  const openCustomer = customerId
    ? () => {
        Haptics.selectionAsync().catch(() => {});
        router.push(`/(edit-forms)/credit-details/${customerId}` as Href);
      }
    : undefined;

  const canFix = !!sale && !sale.cancelled_at;
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
        onMore={sale ? () => openSheet(setMoreOpen) : undefined}
      />

      {isLoading ? (
        <SaleDetailsSkeleton />
      ) : !sale ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-paper-100 border border-paper-300 items-center justify-center">
            <FontAwesome name="file-text-o" size={24} color={ICON_COLOR.inkMuted} />
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
            className="mt-6 min-h-12 px-6 rounded-xl bg-persimmon-600 items-center justify-center active:bg-persimmon-700"
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
              paddingBottom: (footerHeight ?? insets.bottom + ACTION_BAR_HEIGHT) + 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            <MotiView
              className="w-full self-center"
              style={{ maxWidth: TICKET_MAX_WIDTH }}
              from={{ opacity: 0, translateY: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: reduceMotion ? 120 : 280 }}
            >
              <ReceiptHero tone={tone}>
                <SaleDetailsHero sale={sale} correction={latestCorrection} onOpenCustomer={openCustomer} />
                <SaleDetailsItemList sale={sale} oldPrices={oldPrices} />
                <View className="pt-3 pb-5">
                  <ReceiptHeroDivider />
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

          <SaleDetailsFooter
            bottomInset={insets.bottom}
            onShare={handleShare}
            sharing={sharing}
            onFix={canFix ? () => openSheet(setFixOpen) : undefined}
            onLayout={setFooterHeight}
          />

          <SaleFixSheet
            visible={fixOpen}
            onClose={() => setFixOpen(false)}
            windowOpen={windowOpen}
            windowHours={windowHours}
            onVoid={() => pushCorrection(`/sale-correction/${numericId}?mode=void`)}
            onRefund={() => pushCorrection(`/sale-correction/${numericId}?mode=refund`)}
            onPriceCorrection={() => pushCorrection(`/price-correction/${numericId}`)}
          />
          <SaleMoreSheet
            visible={moreOpen}
            onClose={() => setMoreOpen(false)}
            onClosed={handleMoreClosed}
            refLabel={refLabel}
            onCopyRef={handleCopyRef}
            canDelete={!sale.cancelled_at && (corrections?.length ?? 0) === 0}
            deleting={deleteSaleMutation.isPending}
            onDelete={queueDelete}
          />
        </>
      )}
    </View>
  );
}

export default withProf(SaleDetails, 'sale-details/[id]');
