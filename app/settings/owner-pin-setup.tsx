import { router } from 'expo-router';
import { OwnerPinSetupFlow } from '@/components/auth/OwnerPinSetupFlow';
import { goBackToMore } from '@/components/more';

export default function OwnerPinSetupScreen() {
  return (
    <OwnerPinSetupFlow
      onDone={() => {
        if (router.canGoBack()) router.back();
        else goBackToMore();
      }}
      onCancel={goBackToMore}
    />
  );
}
