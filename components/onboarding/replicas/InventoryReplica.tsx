import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui/StatusPill';
import { HintRing } from '@/components/onboarding/HintRing';
import {
  PRODUCT_ORDER,
  SCRIPTED_RESTOCK,
  SEED_PRODUCTS,
  type DayProductId,
} from '@/constants/onboardingDay';
import { isLowStock, type DayAction, type DayState } from '@/lib/onboardingDay';

/**
 * InventoryReplica - prop-driven copy of the Inventory products list
 * for onboarding beat 3. Low rows get a Restock button that opens a
 * delivery confirm panel with the scripted quantity. Which panel is
 * open lives in the day reducer so "Show me" can open it too.
 */

type Props = { state: DayState; dispatch: (action: DayAction) => void };

export function InventoryReplica({ state, dispatch }: Props) {
  const { t } = useTranslation('onboarding');
  const confirming = state.restockPanel;
  const done = state.beatDone.restock;
  const name = (id: DayProductId) => t(SEED_PRODUCTS[id].nameKey);
  const hint = t('coachHint');

  return (
    <View className="gap-2">
      <StyledText variant="extrabold" className="text-ink-900 text-base mb-1">
        {t('invTitle')}
      </StyledText>
      {PRODUCT_ORDER.map((id) => {
        const stock = state.products[id].stock;
        const low = isLowStock(stock);
        const canRestock = low && !done && confirming === null;
        return (
          <View
            key={id}
            className="min-h-[56px] flex-row items-center gap-3 rounded-lg border border-paper-400 bg-paper-50 px-3 py-2"
          >
            <View className="flex-1">
              <StyledText variant="semibold" className="text-ink-900 text-sm">
                {name(id)}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-600 text-caption"
              >
                {t('invStockCount', { count: stock })}
              </StyledText>
            </View>
            <StatusPill variant={low ? 'warning' : 'success'} size="sm">
              {low ? t('invLow') : t('invOk')}
            </StatusPill>
            {canRestock ? (
              <HintRing active>
                <Pressable
                  onPress={() => dispatch({ type: 'openRestock', id })}
                  accessibilityRole="button"
                  accessibilityLabel={t('invRestockA11y', { name: name(id) })}
                  accessibilityHint={hint}
                  className="min-h-[48px] items-center justify-center rounded-md bg-cinnamon-500 px-3 active:bg-cinnamon-600"
                >
                  <StyledText
                    variant="extrabold"
                    className="text-paper-50 text-sm"
                  >
                    {t('invRestock')}
                  </StyledText>
                </Pressable>
              </HintRing>
            ) : null}
          </View>
        );
      })}

      {confirming !== null && !done ? (
        <View className="mt-1 gap-2 rounded-2xl border border-paper-300 bg-paper-100 p-3">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('invDeliveryTitle', { name: name(confirming) })}
          </StyledText>
          <StyledText variant="extrabold" className="text-ink-900 text-h2">
            {t('invDeliveryQty', { qty: SCRIPTED_RESTOCK.qty })}
          </StyledText>
          <HintRing active>
            <Pressable
              onPress={() =>
                dispatch({
                  type: 'restock',
                  id: confirming,
                  qty: SCRIPTED_RESTOCK.qty,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={t('invConfirm')}
              accessibilityHint={hint}
              className="min-h-[52px] items-center justify-center rounded-md bg-persimmon-600 px-4 active:bg-persimmon-700"
            >
              <StyledText variant="extrabold" className="text-white text-base">
                {t('invConfirm')}
              </StyledText>
            </Pressable>
          </HintRing>
        </View>
      ) : null}
    </View>
  );
}
