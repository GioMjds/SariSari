import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { goBackToMore, MoreDetailHeader } from '@/components/more';
import { RepriceRow } from '@/components/pricing';
import {
  useApplyReprice,
  useDismissRepriceFlag,
  useRepriceFlags,
} from '@/hooks/usePriceHistory';
import { useToastStore } from '@/stores';

export default function RepriceScreen() {
  const { t } = useTranslation('pricing');
  const bottomOffset = useTabBarBottomOffset();
  const addToast = useToastStore((s) => s.addToast);
  const flagsQuery = useRepriceFlags();
  const applyMutation = useApplyReprice();
  const dismissMutation = useDismissRepriceFlag();

  const flags = flagsQuery.data ?? [];
  const busy = applyMutation.isPending || dismissMutation.isPending;

  const handleApply = (productId: number, newPrice: number) => {
    applyMutation.mutate(
      { productId, newPrice },
      {
        onSuccess: () =>
          addToast({ message: t('updatedToast'), variant: 'success' }),
        onError: () =>
          addToast({ message: t('errorToast'), variant: 'danger' }),
      },
    );
  };

  const handleKeep = (productId: number) => {
    dismissMutation.mutate(productId, {
      onSuccess: () =>
        addToast({ message: t('keptToast'), variant: 'success' }),
      onError: () => addToast({ message: t('errorToast'), variant: 'danger' }),
    });
  };

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title={t('title')}
        subtitle={t('subtitle')}
        onBack={goBackToMore}
        backAccessibilityLabel={t('back')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomOffset + 16,
          rowGap: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={flagsQuery.isRefetching}
            onRefresh={() => {
              void flagsQuery.refetch();
            }}
            tintColor="#623418"
            colors={['#E85A1F']}
          />
        }
      >
        {flagsQuery.isLoading ? (
          <ActivityIndicator color="#E85A1F" />
        ) : flagsQuery.isError ? (
          <StyledText variant="regular" className="text-sm text-ink-600">
            {t('loadError')}
          </StyledText>
        ) : flags.length === 0 ? (
          <View className="items-center rounded-2xl border border-paper-300 bg-paper-50 p-6">
            <StyledText variant="extrabold" className="text-base text-ink-900">
              {t('emptyTitle')}
            </StyledText>
            <StyledText
              variant="regular"
              className="mt-1 text-center text-sm text-ink-500"
            >
              {t('emptyBody')}
            </StyledText>
          </View>
        ) : (
          flags.map((flag) => (
            <RepriceRow
              key={flag.productId}
              flag={flag}
              busy={busy}
              onApply={handleApply}
              onKeep={handleKeep}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
