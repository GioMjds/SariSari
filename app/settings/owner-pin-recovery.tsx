import { withProf } from '@/utils/perf';
import { router } from 'expo-router';
import { OwnerPinRecoveryFlow } from '@/components/auth/OwnerPinRecoveryFlow';
import { goBackToMore } from '@/components/more';

function OwnerPinRecoveryScreen() {
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

export default withProf(OwnerPinRecoveryScreen, 'settings/owner-pin-recovery');
