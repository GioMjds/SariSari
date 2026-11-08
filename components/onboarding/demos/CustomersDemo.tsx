import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui/StatusPill';
import { HintRing } from '@/components/onboarding/HintRing';
import { formatPesos } from '@/lib/money';
import { markPaid } from '@/lib/onboardingDemo';
import type { DemoProps } from './types';

const START_BALANCE = 350;
const CUSTOMER_NAME = 'Aling Nena';

export function CustomersDemo({ setPose, say, complete }: DemoProps) {
  const { t } = useTranslation('onboarding');
  const [balance, setBalance] = useState(START_BALANCE);
  const cleared = balance === 0;

  const handleMarkPaid = () => {
    if (cleared) return;
    setBalance((b) => markPaid(b));
    setPose('balanceCleared');
    say('demoCustDoneBubble');
    complete();
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <StyledText variant="semibold" className="text-ink-900 text-base">
          {CUSTOMER_NAME}
        </StyledText>
        <StatusPill variant={cleared ? 'success' : 'danger'} size="sm">
          {cleared ? t('demoCustPaid') : t('demoCustOwes')}
        </StatusPill>
      </View>

      <View className="flex-row items-end justify-between">
        <StyledText variant="medium" className="text-ink-500 text-caption">
          {t('demoCustBalance')}
        </StyledText>
        <StyledText variant="extrabold" className="text-ink-900 text-h1">
          {formatPesos(balance)}
        </StyledText>
      </View>

      <HintRing active={!cleared}>
        <Pressable
          disabled={cleared}
          accessibilityRole="button"
          accessibilityLabel={t('demoCustMarkPaid')}
          accessibilityState={{ disabled: cleared }}
          onPress={handleMarkPaid}
          className={`min-h-[44px] items-center justify-center rounded-2xl bg-persimmon-500 ${
            cleared ? 'opacity-50' : ''
          }`}
        >
          <StyledText variant="semibold" className="text-white">
            {t('demoCustMarkPaid')}
          </StyledText>
        </Pressable>
      </HintRing>
    </View>
  );
}
