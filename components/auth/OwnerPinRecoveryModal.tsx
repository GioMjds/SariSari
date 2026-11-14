import { FC } from 'react';
import { Modal } from 'react-native';
import { OwnerPinRecoveryFlow } from './OwnerPinRecoveryFlow';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Full-screen host for the recovery flow. Settings navigates to the
 * `/settings/owner-pin-recovery` route instead; this host serves the PIN
 * challenge and the launch lock, which sit above the router.
 */
export const OwnerPinRecoveryModal: FC<Props> = ({
  visible,
  onSuccess,
  onCancel,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="fullScreen"
    onRequestClose={onCancel}
    statusBarTranslucent
  >
    <OwnerPinRecoveryFlow onDone={onSuccess} onCancel={onCancel} />
  </Modal>
);
