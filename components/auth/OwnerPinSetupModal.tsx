import { FC } from 'react';
import { Modal } from 'react-native';
import { OwnerPinSetupFlow } from './OwnerPinSetupFlow';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Full-screen host for the setup flow. Settings navigates to the
 * `/settings/owner-pin-setup` route instead; this host serves callers that
 * must resume an action afterwards (OwnerPinGuardProvider).
 */
export const OwnerPinSetupModal: FC<Props> = ({
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
    <OwnerPinSetupFlow onDone={onSuccess} onCancel={onCancel} />
  </Modal>
);
