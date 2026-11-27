import { memo } from 'react';
import { View, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { Skeleton } from '@/components/ui';
import { useToastStore } from '@/stores';
import { Supplier } from '@/types/suppliers.types';
import type { ProductInsights } from './productInsights';

interface ProductSupplierTabProps {
  supplier: Supplier | null;
  isLoading: boolean;
  insights: ProductInsights;
  unitLabel: string;
  onLinkSupplier: () => void;
}

export const ProductSupplierTab = memo(function ProductSupplierTab({
  supplier,
  isLoading,
  insights,
  unitLabel,
  onLinkSupplier,
}: ProductSupplierTabProps) {
  const { t } = useTranslation('inventory');
  const addToast = useToastStore((s) => s.addToast);
  const openLink = (url: string) =>
    Linking.openURL(url).catch(() =>
      addToast({ message: t('details_contactFailed'), variant: 'danger' }),
    );

  if (isLoading) {
    return (
      <View
        className="mx-4 p-5 bg-paper-50 rounded-2xl border border-ink-100"
        accessibilityState={{ busy: true }}
      >
        <View className="flex-row items-center">
          <Skeleton width={48} height={48} borderRadius={12} />
          <View className="ml-4 flex-1">
            <Skeleton width="60%" height={16} borderRadius={4} />
            <Skeleton
              width="35%"
              height={12}
              borderRadius={4}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
        <Skeleton height={48} borderRadius={12} style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!supplier) {
    return (
      <View className="mx-4 items-center px-6 py-8 bg-paper-50 rounded-2xl border border-dashed border-ink-200">
        <SariMascot state="inventory" size={96} style={{ marginBottom: 12 }} />
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-lg text-center"
        >
          {t('details_noSupplierTitle')}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-600 text-sm text-center mt-1 leading-5"
        >
          {t('details_noSupplierBody')}
        </StyledText>
        <Pressable
          onPress={onLinkSupplier}
          accessibilityRole="button"
          className="mt-5 min-h-[48px] px-6 bg-persimmon-500 rounded-xl flex-row items-center justify-center active:bg-persimmon-700"
        >
          <Ionicons name="link-outline" size={16} className="text-paper-50" />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-sm ml-2"
          >
            {t('details_linkSupplier')}
          </StyledText>
        </Pressable>
      </View>
    );
  }

  const contact = supplier.contact?.trim();
  // Contact is free text, so only digits and a leading plus go into the dial link.
  const phone = contact?.replace(/[^\d+]/g, '') ?? '';
  const notes = supplier.notes?.trim();

  return (
    <View className="mx-4 bg-paper-50 rounded-2xl border border-ink-100 p-5">
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-xl bg-cinnamon-50 items-center justify-center mr-4">
          <Ionicons name="business" size={24} className="text-cinnamon-500" />
        </View>
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            className="text-ink-900 text-lg"
            numberOfLines={2}
          >
            {supplier.name}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-ink-600 text-sm mt-0.5"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {contact || t('details_noContact')}
          </StyledText>
        </View>
      </View>

      {phone ? (
        <View className="flex-row gap-3 mt-4">
          <ContactButton
            icon="call"
            label={t('details_call')}
            a11y={t('details_callA11y', { name: supplier.name })}
            onPress={() => openLink(`tel:${phone}`)}
          />
          <ContactButton
            icon="chatbubble-ellipses"
            label={t('details_text')}
            a11y={t('details_textA11y', { name: supplier.name })}
            onPress={() => openLink(`sms:${phone}`)}
          />
        </View>
      ) : null}

      <View className="mt-4 pt-4 border-t border-dashed border-ink-200">
        <StyledText variant="semibold" className="text-ink-500 text-xs">
          {t('details_lastDelivery')}
        </StyledText>
        <StyledText
          variant="semibold"
          className="text-ink-900 text-sm mt-0.5"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {insights.lastRestockAt !== null && insights.lastRestockQty !== null
            ? t('details_onDate', {
                value: t('details_qtyUnit', {
                  count: insights.lastRestockQty,
                  unit: unitLabel,
                }),
                date: format(insights.lastRestockAt, 'MMM d'),
              })
            : t('details_never')}
        </StyledText>
      </View>

      <View className="mt-4 pt-4 border-t border-dashed border-ink-200">
        <StyledText variant="semibold" className="text-ink-500 text-xs">
          {t('details_supplierNotes')}
        </StyledText>
        <StyledText
          variant="regular"
          className={`text-sm mt-0.5 leading-5 ${notes ? 'text-ink-900' : 'text-ink-500'}`}
        >
          {notes || t('details_noNotes')}
        </StyledText>
      </View>

      <Pressable
        onPress={onLinkSupplier}
        accessibilityRole="button"
        className="mt-4 min-h-[44px] items-center justify-center active:opacity-70"
      >
        <StyledText variant="extrabold" className="text-cinnamon-700 text-sm">
          {t('details_changeSupplier')}
        </StyledText>
      </Pressable>
    </View>
  );
});

function ContactButton({
  icon,
  label,
  a11y,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  a11y: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      className="flex-1 min-h-[48px] bg-paper-100 border border-ink-200 rounded-xl flex-row items-center justify-center active:opacity-80"
    >
      <Ionicons name={icon} size={16} className="text-cinnamon-500" />
      <StyledText variant="extrabold" className="text-ink-900 text-sm ml-2">
        {label}
      </StyledText>
    </Pressable>
  );
}
