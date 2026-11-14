import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { CustomerAvatar } from '@/components/customers/CustomerAvatar';
import { MoneyText } from '@/components/ui/MoneyText';
import { StatusPill } from '@/components/ui/StatusPill';
import { HintRing } from '@/components/onboarding/HintRing';
import { SCRIPTED_PAYMENT, SUKI_NAME_KEY } from '@/constants/onboardingDay';
import type { DayAction, DayState } from '@/lib/onboardingDay';
import { formatPesos } from '@/lib/money';

/**
 * HomeCloseReplica - prop-driven copy of the Home "today" tiles plus
 * one suki row, for onboarding beat 4. Totals come from what the owner
 * did in beats 1-2. The payment button records the scripted P40.
 */

type Props = { state: DayState; dispatch: (action: DayAction) => void };

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-1 min-h-[72px] justify-between rounded-2xl border border-paper-300 bg-paper-100 p-3">
      <StyledText variant="medium" className="text-ink-600 text-caption">
        {label}
      </StyledText>
      {children}
    </View>
  );
}

export function HomeCloseReplica({ state, dispatch }: Props) {
  const { t } = useTranslation('onboarding');
  const done = state.beatDone.close;
  const suki = SCRIPTED_PAYMENT.suki;
  const nena = t(SUKI_NAME_KEY[suki]);

  return (
    <View className="gap-3">
      <StyledText variant="extrabold" className="text-ink-900 text-base">
        {t('homeTitle')}
      </StyledText>
      <View className="flex-row gap-2">
        <Tile label={t('homeTodaySales')}>
          <MoneyText value={state.sales.total} size="md" />
        </Tile>
        <Tile label={t('homeItemsSold')}>
          <StyledText variant="extrabold" className="text-ink-900 text-base">
            {String(state.sales.items)}
          </StyledText>
        </Tile>
        <Tile label={t('homeUtangOut')}>
          <MoneyText value={state.sales.utangOut} size="md" />
        </Tile>
      </View>

      <StyledText variant="semibold" className="text-ink-700 text-sm">
        {t('homeSukiTitle')}
      </StyledText>
      <View className="min-h-[64px] flex-row items-center gap-3 rounded-lg border border-paper-400 bg-paper-50 px-3 py-2">
        <CustomerAvatar name={nena} size={40} />
        <View className="flex-1">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {nena}
          </StyledText>
          <View className="flex-row items-center gap-1">
            <StyledText variant="regular" className="text-ink-600 text-caption">
              {t('homeBalance')}
            </StyledText>
            <MoneyText value={state.sukiBalances[suki]} size="sm" />
          </View>
        </View>
        {done ? (
          <StatusPill variant="success" size="sm">
            {t('homePaid')}
          </StatusPill>
        ) : (
          <HintRing active>
            <Pressable
              onPress={() =>
                dispatch({
                  type: 'receivePayment',
                  suki,
                  amount: SCRIPTED_PAYMENT.amount,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={t('homeRecordPayment', {
                amount: formatPesos(SCRIPTED_PAYMENT.amount),
              })}
              accessibilityHint={t('coachHint')}
              className="min-h-[48px] items-center justify-center rounded-md bg-cinnamon-500 px-3 active:bg-cinnamon-600"
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                {t('homeRecordPayment', {
                  amount: formatPesos(SCRIPTED_PAYMENT.amount),
                })}
              </StyledText>
            </Pressable>
          </HintRing>
        )}
      </View>
    </View>
  );
}
