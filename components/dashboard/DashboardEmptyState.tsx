import { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useTranslation } from 'react-i18next';

interface DashboardEmptyStateProps {
  onAddProduct: () => void;
  onStartFirstSale: () => void;
}

/**
 * DashboardEmptyState — setup nudges for a brand-new store.
 *
 * Renders inside the attention-queue slot when there are no products
 * and no sales yet. Two big paper buttons: Add Product starts the
 * catalog, Start First Sale routes to the POS so the owner can begin
 * recording transactions immediately.
 */
export const DashboardEmptyState = memo(function DashboardEmptyState({
  onAddProduct,
  onStartFirstSale,
}: DashboardEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <View
      className="bg-paper-50 mx-4 mb-4 rounded-2xl border border-ink-100 p-5"
      style={{
        shadowColor: '#564E45',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <StyledText variant="extrabold" className="label-caps text-ink-400 mb-1">
        {t('common:emptyEyebrow')}
      </StyledText>
      <StyledText variant="black" className="text-ink-900 text-lg mb-1">
        {t('common:emptyTitle')}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm mb-4"
      >
        {t('common:emptyBody')}
      </StyledText>

      <TouchableOpacity
        onPress={onAddProduct}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('common:emptyAddProduct')}
        className="bg-persimmon-500 rounded-pill py-3 flex-row items-center justify-center mb-2.5 press-scale"
        style={{
          shadowColor: '#E85A1F',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <FontAwesome name="plus" size={14} color="#FBF7EE" />
        <StyledText
          variant="extrabold"
          className="text-paper-50 text-sm ml-2"
        >
          {t('common:emptyAddProduct')}
        </StyledText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onStartFirstSale}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('common:emptyFirstSale')}
        className="bg-paper-100 rounded-pill py-3 flex-row items-center justify-center border border-ink-200 press-scale"
      >
        <FontAwesome name="shopping-cart" size={14} color="#623418" />
        <StyledText
          variant="extrabold"
          className="text-cinnamon-700 text-sm ml-2"
        >
          {t('common:emptyFirstSale')}
        </StyledText>
      </TouchableOpacity>
    </View>
  );
});