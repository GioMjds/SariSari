import { withProf } from '@/utils/perf';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Href, router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  useCreditHistory,
  useCustomerDetails,
  useDeleteCustomer,
  useProfile,
} from '@/hooks';
import { useModalStore } from '@/stores';
import { splitCredits } from '@/lib/creditDetails';
import { CreditTransaction } from '@/types/credits.types';
import { StyledText } from '@/components/elements';
import {
  BalanceCard,
  CreditDetailsHeader,
  CreditDetailsSkeleton,
  CustomerNotFound,
  LEDGER_ACTION_BAR_HEIGHT,
  LedgerActionBar,
  LedgerTabContent,
  StatementShareButton,
  TabNavigation,
  UtangTabContent,
  type CreditDetailTab,
} from '@/components/utang/credit-details';

function CustomerDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('utang');
  const queryClient = useQueryClient();
  const { openModal } = useModalStore();
  const insets = useSafeAreaInsets();

  const {
    data: customer,
    isLoading,
    isRefetching,
    refetch,
  } = useCustomerDetails(id);

  const { data: history = [] } = useCreditHistory(id);
  const { profile } = useProfile();

  const deleteCustomerMutation = useDeleteCustomer();

  const [activeTab, setActiveTab] = useState<CreditDetailTab>('utang');
  const [searchByTab, setSearchByTab] = useState<
    Record<CreditDetailTab, string>
  >({ utang: '', ledger: '' });

  const { open, settled } = useMemo(
    () => splitCredits(customer?.credits ?? []),
    [customer?.credits],
  );

  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['credit-history', id] });
  }, [refetch, queryClient, id]);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  }, []);

  const handleDeleteCustomer = useCallback(() => {
    if (!customer) return;
    openModal({
      title: t('detailDeleteTitle'),
      description: t('detailDeleteBody', { name: customer.name }),
      variant: 'danger',
      icon: 'trash',
      buttons: [
        { text: t('detailCancel'), style: 'cancel' },
        {
          text: t('detailDeleteConfirm'),
          style: 'destructive',
          onPress: () => {
            deleteCustomerMutation.mutate(customer.id);
          },
        },
      ],
    });
  }, [customer, openModal, deleteCustomerMutation, t]);

  const handleAddCredit = useCallback(() => {
    if (!customer) return;
    Haptics.selectionAsync().catch(() => {});
    router.push(`/(edit-forms)/add-credit/${customer.id}` as Href);
  }, [customer]);

  const handleAddPayment = useCallback(() => {
    if (!customer) return;
    Haptics.selectionAsync().catch(() => {});
    router.push(`/(edit-forms)/add-payment/${customer.id}` as Href);
  }, [customer]);

  const handleQuickSettle = useCallback(
    (credit: CreditTransaction) => {
      if (!customer) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      router.push(
        `/(edit-forms)/add-payment/${customer.id}?creditId=${credit.id}` as Href,
      );
    },
    [customer],
  );

  const handleUtangSearch = useCallback(
    (v: string) => setSearchByTab((s) => ({ ...s, utang: v })),
    [],
  );
  const handleLedgerSearch = useCallback(
    (v: string) => setSearchByTab((s) => ({ ...s, ledger: v })),
    [],
  );

  if (isLoading) return <CreditDetailsSkeleton />;

  if (!customer) return <CustomerNotFound onBack={handleBack} />;

  const storeName = profile?.storeName?.trim() || 'your sari-sari store';
  const hasBalance = customer.outstanding_balance > 0;
  const subtitle = [customer.phone, customer.address]
    .filter(Boolean)
    .join(' · ');
  const bottomPad = LEDGER_ACTION_BAR_HEIGHT + Math.max(insets.bottom, 12) + 24;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: Math.max(insets.top, 40) }}
    >
      <CreditDetailsHeader
        name={customer.name}
        photoUri={customer.photo_uri}
        subtitle={subtitle}
        onBack={handleBack}
        action={
          <StatementShareButton
            customer={customer}
            credits={customer.credits}
            storeName={storeName}
            disabled={!hasBalance}
          />
        }
      />

      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bottomOffset={64}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPad }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor="#623418"
            colors={['#E85A1F']}
          />
        }
      >
        <View className="px-4">
          <BalanceCard customer={customer} openCredits={open} />
        </View>

        <View className="px-4 mt-5">
          <TabNavigation
            activeTab={activeTab}
            onChange={setActiveTab}
            counts={{ utang: open.length, ledger: history.length }}
          />
        </View>

        <View className="px-4 mt-4">
          {activeTab === 'utang' ? (
            <UtangTabContent
              open={open}
              settled={settled}
              searchValue={searchByTab.utang}
              onSearchChange={handleUtangSearch}
              onQuickSettle={handleQuickSettle}
            />
          ) : (
            <LedgerTabContent
              history={history}
              payments={customer.payments}
              searchValue={searchByTab.ledger}
              onSearchChange={handleLedgerSearch}
            />
          )}
        </View>

        {/* Kept away from the money actions so it is never hit by mistake. */}
        <View className="px-4 mt-8 items-center">
          <Pressable
            onPress={handleDeleteCustomer}
            accessibilityRole="button"
            accessibilityHint={t('detailDeleteHint')}
            className="press-scale min-h-[44px] px-4 flex-row items-center justify-center"
          >
            <FontAwesome name="trash-o" size={14} color="#C13030" />
            <StyledText
              variant="semibold"
              className="text-semantic-danger text-sm ml-2"
            >
              {t('detailDelete')}
            </StyledText>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      <LedgerActionBar
        canCollect={hasBalance}
        onAddPayment={handleAddPayment}
        onAddCredit={handleAddCredit}
      />
    </View>
  );
}

export default withProf(CustomerDetails, 'credit-details/[id]');
