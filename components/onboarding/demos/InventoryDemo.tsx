import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui/StatusPill';
import { HintRing } from '@/components/onboarding/HintRing';
import { isLowStock, restock, stockRatio } from '@/lib/onboardingDemo';
import type { DemoProps } from './types';

const PRODUCTS = [
  { id: 'kape', name: 'Kape sachet', qty: 3 },
  { id: 'sabon', name: 'Sabon', qty: 14 },
  { id: 'asukal', name: 'Asukal', qty: 9 },
] as const;

const RESTOCK_AMOUNT = 12;

export function InventoryDemo({ setPose, say, complete }: DemoProps) {
  const { t } = useTranslation('onboarding');
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, p.qty])),
  );

  const handleRestock = (id: string) => {
    setQuantities((q) => ({ ...q, [id]: restock(q[id] ?? 0, RESTOCK_AMOUNT) }));
    setPose('inventory');
    say('demoInvDoneBubble');
    complete();
  };

  return (
    <View className="gap-3">
      {PRODUCTS.map((product) => {
        const qty = quantities[product.id] ?? 0;
        const low = isLowStock(qty);
        return (
          <View key={product.id} className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <StyledText variant="medium" className="text-ink-800 text-sm">
                {product.name}
              </StyledText>
              <StatusPill variant={low ? 'warning' : 'success'} size="sm">
                {low ? t('demoInvLow') : t('demoInvOk')}
              </StatusPill>
            </View>
            <View className="h-2 rounded-full bg-ink-100 overflow-hidden">
              <View
                // Low Stock amber from the DESIGN.md alert-kind palette.
                className={`h-2 rounded-full ${low ? 'bg-[#B45309]' : 'bg-sage-500'}`}
                style={{ width: `${Math.round(stockRatio(qty) * 100)}%` }}
              />
            </View>
            {low ? (
              <HintRing active>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('demoInvRestockA11y', {
                    name: product.name,
                  })}
                  onPress={() => handleRestock(product.id)}
                  className="min-h-[44px] items-center justify-center rounded-md bg-persimmon-600 active:bg-persimmon-700"
                >
                  <StyledText variant="semibold" className="text-white">
                    {t('demoInvRestock')}
                  </StyledText>
                </Pressable>
              </HintRing>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
