import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { HintRing } from '@/components/onboarding/HintRing';
import { formatPesos } from '@/lib/money';
import {
  DEMO_SALE_ITEMS,
  DemoCart,
  addToCart,
  cartQuantity,
  cartTotal,
} from '@/lib/onboardingDemo';
import type { DemoProps } from './types';

export function SalesDemo({ setPose, say, complete }: DemoProps) {
  const { t } = useTranslation('onboarding');
  const [cart, setCart] = useState<DemoCart>({});
  const [paid, setPaid] = useState(false);

  const total = cartTotal(cart);
  const hasItems = cartQuantity(cart) > 0;
  const canPay = hasItems && !paid;

  const handlePay = (method: 'cash' | 'utang') => {
    if (!canPay) return;
    setPaid(true);
    setPose(method === 'cash' ? 'sales' : 'utang');
    say(method === 'cash' ? 'demoSalesDoneBubble' : 'demoSalesUtangBubble', {
      total: formatPesos(total),
    });
    complete();
  };

  return (
    <View className="gap-2">
      {DEMO_SALE_ITEMS.map((item, idx) => {
        const qty = cart[item.id] ?? 0;
        return (
          <HintRing key={item.id} active={!hasItems && idx === 0}>
            <Pressable
              disabled={paid}
              accessibilityRole="button"
              accessibilityLabel={t('demoSalesItemA11y', { name: item.name })}
              onPress={() => setCart((c) => addToCart(c, item.id))}
              className="min-h-[44px] flex-row items-center justify-between rounded-md border border-paper-400 bg-paper-100 px-3 py-2 active:bg-paper-300"
            >
              <StyledText variant="medium" className="text-ink-800 text-sm">
                {item.name}
                {qty > 0 ? `  x${qty}` : ''}
              </StyledText>
              <StyledText variant="semibold" className="text-ink-600 text-sm">
                {formatPesos(item.price)}
              </StyledText>
            </Pressable>
          </HintRing>
        );
      })}

      <View className="flex-row items-center justify-between px-1 pt-1">
        <StyledText variant="medium" className="text-ink-500 text-caption">
          {hasItems ? t('demoSalesTotal') : t('demoSalesEmpty')}
        </StyledText>
        <StyledText variant="extrabold" className="text-ink-900 text-base">
          {formatPesos(total)}
        </StyledText>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <HintRing active={canPay}>
            <Pressable
              disabled={!canPay}
              accessibilityRole="button"
              accessibilityLabel={t('demoSalesCash')}
              accessibilityState={{ disabled: !canPay }}
              onPress={() => handlePay('cash')}
              className={`min-h-[44px] items-center justify-center rounded-md bg-persimmon-600 active:bg-persimmon-700 ${
                canPay ? '' : 'opacity-50'
              }`}
            >
              <StyledText variant="semibold" className="text-white">
                {t('demoSalesCash')}
              </StyledText>
            </Pressable>
          </HintRing>
        </View>
        <Pressable
          disabled={!canPay}
          accessibilityRole="button"
          accessibilityLabel={t('demoSalesUtang')}
          accessibilityState={{ disabled: !canPay }}
          onPress={() => handlePay('utang')}
          className={`min-h-[44px] flex-1 items-center justify-center rounded-md border border-persimmon-600 active:bg-persimmon-50 ${
            canPay ? '' : 'opacity-50'
          }`}
        >
          <StyledText variant="semibold" className="text-persimmon-700">
            {t('demoSalesUtang')}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
