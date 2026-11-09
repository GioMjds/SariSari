import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { goBackToMore, MoreDetailHeader } from '@/components/more';
import { SettingsSection } from '@/components/settings/SettingsPrimitives';
import {
  type PalengkeExportFormat,
  useExportPalengkeSheet,
  usePalengkeRestockPlan,
} from '@/hooks/useStockIntelligence';
import { useProfile } from '@/hooks/useProfile';
import { formatPesos } from '@/lib/money';

export default function PalengkeSheet() {
  const bottomOffset = useTabBarBottomOffset();
  const { profile } = useProfile();
  const { data: plan, isLoading, isError, refetch } = usePalengkeRestockPlan();
  const exportMutation = useExportPalengkeSheet();
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggleChecked = (productId: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleExport = async (format: PalengkeExportFormat) => {
    if (!plan || plan.totalItemsCount === 0) return;
    const ok = await exportMutation.mutateAsync({
      plan,
      storeName: profile?.storeName ?? 'SariSari',
      format,
    });
    if (!ok && format === 'pdf') {
      Alert.alert('Hindi ma-share', 'Hindi magawa ang PDF sa device na ito.');
    }
  };

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title="Palengke Sheet"
        subtitle="Restock checklist at kailangang puhunan"
        onBack={goBackToMore}
        backAccessibilityLabel="Back to More"
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomOffset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#623418" />
          </View>
        ) : isError || !plan ? (
          <View className="px-5 py-16 items-center">
            <StyledText variant="medium" className="text-ink-700 mb-3">
              Hindi ma-load ang restock plan.
            </StyledText>
            <Pressable
              onPress={() => refetch()}
              accessibilityRole="button"
              className="px-4 py-3 rounded-xl bg-paper-50 border border-paper-300 active:opacity-70"
            >
              <StyledText variant="semibold" className="text-ink-900">
                Subukan muli
              </StyledText>
            </Pressable>
          </View>
        ) : plan.totalItemsCount === 0 ? (
          <View className="px-5 py-16 items-center">
            <StyledText variant="semibold" className="text-ink-900 mb-1">
              Walang kailangang bilhin
            </StyledText>
            <StyledText variant="regular" className="text-ink-600 text-center">
              Walang out of stock o low stock na produkto.
            </StyledText>
          </View>
        ) : (
          <>
            <SettingsSection title="Kailangang puhunan">
              <View className="px-4 py-4">
                <StyledText
                  variant="extrabold"
                  className="text-3xl text-ink-900"
                >
                  {formatPesos(plan.totalEstimatedCapital)}
                </StyledText>
                <StyledText variant="regular" className="text-sm text-ink-600 mt-1">
                  Out of stock: {formatPesos(plan.outOfStockCapital)} (
                  {plan.outOfStockCount}) · Low stock:{' '}
                  {formatPesos(plan.lowStockCapital)}
                </StyledText>
                {plan.missingCostCount > 0 ? (
                  <StyledText
                    variant="regular"
                    className="text-sm text-ink-600 mt-1"
                  >
                    {plan.missingCostCount} aytem na walang cost price. Hindi
                    kasama sa kabuuan.
                  </StyledText>
                ) : null}
              </View>
            </SettingsSection>

            {plan.groups.map((group) => (
              <SettingsSection
                key={group.key}
                title={`${group.label} · ${formatPesos(group.subtotal)}`}
              >
                {group.items.map((item) => {
                  const isChecked = checked.has(item.productId);
                  return (
                    <Pressable
                      key={item.productId}
                      onPress={() => toggleChecked(item.productId)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChecked }}
                      accessibilityLabel={`${item.productName}, bibilhin ${item.suggestedQuantity} ${item.retailUnitName}`}
                      style={{ minHeight: 56 }}
                      className="flex-row items-center px-4 py-3 active:opacity-70"
                    >
                      <FontAwesome
                        name={isChecked ? 'check-square-o' : 'square-o'}
                        size={22}
                        color="#2A1A0E"
                      />
                      <View className="flex-1 mx-3">
                        <StyledText
                          variant="semibold"
                          className={`text-base ${isChecked ? 'text-ink-500 line-through' : 'text-ink-900'}`}
                        >
                          {item.productName}
                        </StyledText>
                        <StyledText
                          variant="regular"
                          className="text-xs text-ink-600"
                        >
                          {item.sku} · stock {item.currentStock}
                          {item.isOutOfStock ? ' · out of stock' : ''}
                        </StyledText>
                      </View>
                      <View className="items-end">
                        <StyledText
                          variant="semibold"
                          className="text-base text-ink-900"
                        >
                          {item.suggestedQuantity} {item.retailUnitName}
                        </StyledText>
                        <StyledText
                          variant="regular"
                          className="text-xs text-ink-600"
                        >
                          {item.costPrice === null
                            ? 'walang cost'
                            : formatPesos(item.subtotal)}
                        </StyledText>
                      </View>
                    </Pressable>
                  );
                })}
              </SettingsSection>
            ))}

            <View className="px-5 mt-6 flex-row gap-3">
              <Pressable
                onPress={() => handleExport('pdf')}
                disabled={exportMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Share PDF checklist"
                style={{ minHeight: 48 }}
                className="flex-1 items-center justify-center rounded-xl bg-persimmon-600 active:opacity-80"
              >
                <StyledText variant="extrabold" className="text-paper-50">
                  Share PDF
                </StyledText>
              </Pressable>
              <Pressable
                onPress={() => handleExport('text')}
                disabled={exportMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Share text checklist"
                style={{ minHeight: 48 }}
                className="flex-1 items-center justify-center rounded-xl bg-paper-50 border border-paper-300 active:opacity-70"
              >
                <StyledText variant="extrabold" className="text-ink-900">
                  Share Text
                </StyledText>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
