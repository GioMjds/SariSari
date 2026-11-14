import { router } from 'expo-router';
import { OwnerPinRecoveryFlow } from '@/components/auth/OwnerPinRecoveryFlow';
import { goBackToMore } from '@/components/more';

export default function OwnerPinRecoveryScreen() {
  return (
    <OwnerPinRecoveryFlow
      onDone={() => {
        if (router.canGoBack()) router.back();
        else goBackToMore();
      }}
      onCancel={goBackToMore}
    />
  );
}
