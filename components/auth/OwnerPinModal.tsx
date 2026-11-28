import { FC } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements/StyledText';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AuthScreenShell } from './AuthScreenShell';
import { OWNER_PIN_LENGTH } from './OwnerPinSetupFlow';
import { PinBoxes } from './PinBoxes';
import { PinPad } from './PinPad';
import { useOwnerPinEntry } from './useOwnerPinEntry';

interface Props {
  visible: boolean;
  title?: string;
  actionDescription?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onForgotPin?: () => void;
}

/** Full-screen owner PIN challenge styled like the app lock screen. */
export const OwnerPinModal: FC<Props> = ({
  visible,
  title,
  actionDescription,
  onSuccess,
  onCancel,
  onForgotPin,
}) => {
  const { t } = useTranslation('settings');
  const reducedMotion = useReducedMotion();
  const entry = useOwnerPinEntry(visible, onSuccess);

  return (
    <Modal
      visible={visible}
      animationType={reducedMotion ? 'fade' : 'slide'}
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 bg-paper-200">
        <AuthScreenShell
          sari={entry.showError ? 'error' : 'default'}
          title={title || t('pin.title')}
          subtitle={actionDescription || t('pin.enter_pin')}
          onBack={onCancel}
          backLabel={t('pin.back_a11y')}
          footer={
            <>
              <PinPad
                disabled={entry.lockedOut}
                onDigit={entry.handleDigit}
                onBackspace={entry.handleBackspace}
              />
              {onForgotPin ? (
                <Pressable
                  testID="owner-pin-forgot"
                  accessibilityRole="button"
                  onPress={onForgotPin}
                  className="min-h-[48px] items-center justify-center mt-2 active:opacity-70"
                >
                  <StyledText
                    variant="semibold"
                    className="text-persimmon-700 text-[15px]"
                  >
                    {t('pin.forgot_pin')}
                  </StyledText>
                </Pressable>
              ) : null}
            </>
          }
        >
          <PinBoxes
            testID="owner-pin-boxes"
            accessibilityLabel={t('pin.enter_pin')}
            value={entry.pin}
            length={OWNER_PIN_LENGTH}
            status={entry.boxStatus}
            shakeKey={entry.shakeKey}
            active={!entry.lockedOut}
          />
          <View className="min-h-[44px] justify-center mt-1 w-full items-center">
            {entry.message ? (
              <StyledText
                variant="semibold"
                className="text-semantic-danger text-sm text-center"
              >
                {entry.message}
              </StyledText>
            ) : null}
          </View>
        </AuthScreenShell>
      </View>
    </Modal>
  );
};
