import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { CustomerAvatar } from '@/components/customers/CustomerAvatar';
import { MoneyText } from '@/components/ui/MoneyText';
import { HintRing } from '@/components/onboarding/HintRing';
import {
  PRODUCT_ORDER,
  SCRIPTED_ORDERS,
  SEED_PRODUCTS,
  SUKI_NAME_KEY,
  TENDER_OPTIONS,
  type DayProductId,
  type SaleBeat,
} from '@/constants/onboardingDay';
import {
  cartMatches,
  cartQty,
  cartTotal,
  type DayAction,
  type DayState,
  type PosStage,
} from '@/lib/onboardingDay';
import { formatPesos } from '@/lib/money';

/**
 * PosReplica - prop-driven copy of the Sales POS for onboarding beats
 * 1 (cash) and 2 (utang). Tiles copy FastLaneCard's classes; the real
 * card is not reused because it calls a SQLite favorite mutation.
 * Everything, including which panel is open, lives in the day reducer,
 * so "Show me" can open the payment panels the same way a tap does.
 */

const TILE_CLASS =
  'min-h-[88px] justify-between rounded-2xl border border-paper-300 bg-paper-100 p-3 shadow-paper active:bg-paper-200/60';
const PRIMARY_CLASS =
  'min-h-[52px] items-center justify-center rounded-md bg-persimmon-600 px-4 active:bg-persimmon-700';
const SECONDARY_CLASS =
  'min-h-[52px] flex-1 items-center justify-center rounded-md bg-cinnamon-500 px-4 active:bg-cinnamon-600';

type Props = {
  mode: SaleBeat;
  state: DayState;
  dispatch: (action: DayAction) => void;
};

export function PosReplica({ mode, state, dispatch }: Props) {
  const { t } = useTranslation('onboarding');
  const stage = state.posStage[mode];
  const setStage = (next: PosStage) =>
    dispatch({ type: 'setPosStage', beat: mode, stage: next });
  const order = SCRIPTED_ORDERS[mode];
  const name = (id: DayProductId) => t(SEED_PRODUCTS[id].nameKey);
  const nena = t(SUKI_NAME_KEY.nena);
  const hint = t('coachHint');

  if (state.beatDone[mode]) {
    const text =
      mode === 'cash' && state.receipts.cash
        ? t('posPaidCash', {
            total: formatPesos(state.receipts.cash.total),
            change: formatPesos(state.receipts.cash.change),
          })
        : state.receipts.utang
          ? t('posPaidUtang', {
              total: formatPesos(state.receipts.utang.total),
              name: nena,
            })
          : '';
    return (
      <View className="min-h-[120px] items-center justify-center rounded-2xl bg-sage-50 px-4 py-6">
        <StyledText
          variant="extrabold"
          className="text-sage-700 text-base text-center"
        >
          {text}
        </StyledText>
      </View>
    );
  }

  const ready = cartMatches(state.cart, mode);
  const extraId =
    state.cart.find((l) => l.qty > (order[l.id] ?? 0))?.id ?? null;
  const missingId =
    extraId === null
      ? (PRODUCT_ORDER.find(
          (id) => cartQty(state.cart, id) < (order[id] ?? 0),
        ) ?? null)
      : null;

  if (stage === 'cart') {
    return (
      <View className="gap-3">
        <View className="flex-row flex-wrap justify-between gap-y-2">
          {PRODUCT_ORDER.map((id) => {
            const stock = state.products[id].stock - cartQty(state.cart, id);
            const target = missingId === id;
            return (
              <View key={id} className="w-[48%]">
                <HintRing active={target}>
                  <Pressable
                    onPress={() => dispatch({ type: 'addToCart', id })}
                    accessibilityRole="button"
                    accessibilityLabel={t('posAddA11y', { name: name(id) })}
                    accessibilityHint={target ? hint : undefined}
                    className={TILE_CLASS}
                  >
                    <StyledText
                      variant="extrabold"
                      className="text-ink-900 text-sm"
                    >
                      {name(id)}
                    </StyledText>
                    <View className="flex-row items-end justify-between">
                      <MoneyText value={state.products[id].price} size="sm" />
                      <StyledText
                        variant="medium"
                        className="text-ink-600 text-caption"
                      >
                        {t('posStock', { count: stock })}
                      </StyledText>
                    </View>
                  </Pressable>
                </HintRing>
              </View>
            );
          })}
        </View>

        <View className="rounded-2xl border border-paper-300 bg-paper-50 p-3 gap-2">
          {state.cart.length === 0 ? (
            <StyledText
              variant="medium"
              className="text-ink-600 text-sm text-center py-2"
            >
              {t('posCartEmpty')}
            </StyledText>
          ) : (
            state.cart.map((line) => (
              <View key={line.id} className="flex-row items-center gap-2">
                <HintRing active={extraId === line.id}>
                  <Pressable
                    onPress={() =>
                      dispatch({ type: 'removeFromCart', id: line.id })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={t('posRemoveA11y', {
                      name: name(line.id),
                    })}
                    accessibilityHint={extraId === line.id ? hint : undefined}
                    className="h-12 w-12 items-center justify-center rounded-md border border-paper-400 bg-paper-100 active:bg-paper-200"
                  >
                    <StyledText
                      variant="extrabold"
                      className="text-ink-900 text-lg"
                    >
                      -
                    </StyledText>
                  </Pressable>
                </HintRing>
                <StyledText
                  variant="semibold"
                  className="flex-1 text-ink-900 text-sm"
                >
                  {`${line.qty} x ${name(line.id)}`}
                </StyledText>
                <MoneyText
                  value={state.products[line.id].price * line.qty}
                  size="sm"
                />
              </View>
            ))
          )}
          <View className="flex-row items-center justify-between border-t border-paper-300 pt-2">
            <StyledText variant="semibold" className="text-ink-700 text-sm">
              {t('posTotal')}
            </StyledText>
            <MoneyText value={cartTotal(state)} size="lg" />
          </View>
        </View>

        <HintRing active={ready}>
          <Pressable
            onPress={() => setStage('pay')}
            disabled={!ready}
            accessibilityRole="button"
            accessibilityLabel={t('posCheckout')}
            accessibilityHint={ready ? hint : undefined}
            accessibilityState={{ disabled: !ready }}
            className={`${PRIMARY_CLASS} ${ready ? '' : 'opacity-50'}`}
          >
            <StyledText variant="extrabold" className="text-white text-base">
              {t('posCheckout')}
            </StyledText>
          </Pressable>
        </HintRing>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <StyledText variant="semibold" className="text-ink-700 text-sm">
          {t('posTotal')}
        </StyledText>
        <MoneyText value={cartTotal(state)} size="lg" />
      </View>

      {stage === 'pay' ? (
        <>
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('posPayWith')}
          </StyledText>
          <View className="flex-row gap-2">
            {(['cash', 'utang'] as const).map((method) => {
              const enabled = method === mode;
              const label = method === 'cash' ? t('posCash') : t('posUtang');
              return (
                <View key={method} className="flex-1">
                  <HintRing active={enabled}>
                    <Pressable
                      onPress={() =>
                        setStage(method === 'cash' ? 'tender' : 'suki')
                      }
                      disabled={!enabled}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityHint={enabled ? hint : undefined}
                      accessibilityState={{ disabled: !enabled }}
                      className={`${SECONDARY_CLASS} ${enabled ? '' : 'opacity-40'}`}
                    >
                      <StyledText
                        variant="extrabold"
                        className="text-paper-50 text-base"
                      >
                        {label}
                      </StyledText>
                    </Pressable>
                  </HintRing>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {stage === 'tender' ? (
        <>
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('posTendered')}
          </StyledText>
          <View className="flex-row gap-2">
            {TENDER_OPTIONS.map((amount, i) => (
              <View key={amount} className="flex-1">
                <HintRing active={i === 0}>
                  <Pressable
                    onPress={() =>
                      dispatch({ type: 'checkoutCash', tendered: amount })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={t('posTenderA11y', {
                      amount: formatPesos(amount),
                    })}
                    accessibilityHint={i === 0 ? hint : undefined}
                    className={SECONDARY_CLASS}
                  >
                    <StyledText
                      variant="extrabold"
                      className="text-paper-50 text-base"
                    >
                      {formatPesos(amount)}
                    </StyledText>
                  </Pressable>
                </HintRing>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {stage === 'suki' ? (
        <>
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('posPickSuki')}
          </StyledText>
          <HintRing active>
            <Pressable
              onPress={() => dispatch({ type: 'checkoutUtang', suki: 'nena' })}
              accessibilityRole="button"
              accessibilityLabel={t('posPickSukiA11y', { name: nena })}
              accessibilityHint={hint}
              className="min-h-[56px] flex-row items-center gap-3 rounded-lg border border-paper-400 bg-paper-50 px-3 active:bg-paper-100"
            >
              <CustomerAvatar name={nena} size={40} />
              <StyledText
                variant="semibold"
                className="flex-1 text-ink-900 text-sm"
              >
                {nena}
              </StyledText>
              <MoneyText value={state.sukiBalances.nena} size="sm" />
            </Pressable>
          </HintRing>
        </>
      ) : null}

      <Pressable
        onPress={() => setStage('cart')}
        accessibilityRole="button"
        accessibilityLabel={t('posEditCart')}
        className="min-h-[44px] items-center justify-center active:opacity-70"
      >
        <StyledText
          variant="semibold"
          className="text-persimmon-700 text-sm underline"
        >
          {t('posEditCart')}
        </StyledText>
      </Pressable>
    </View>
  );
}
