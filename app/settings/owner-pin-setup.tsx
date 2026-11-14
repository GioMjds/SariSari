import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OwnerPinSetupFlow } from '@/components/auth/OwnerPinSetupFlow';
import { goBackToMore } from '@/components/more';
import { isOwnerPinConfigured } from '@/database/auth';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';

export default function OwnerPinSetupScreen() {
  const { t } = useTranslation('settings');
  const { runWithPinGuard } = useOwnerPinGuard();
  const [open, setOpen] = useState(false);

  // Changing an existing PIN needs the current PIN; first-time setup does not.
  useEffect(() => {
    let active = true;
    isOwnerPinConfigured()
      .then((configured) => {
        if (!active) return;
        if (!configured) {
          setOpen(true);
          return;
        }
        void runWithPinGuard({
          actionId: 'pin_change',
          title: t('pin.title'),
          actionDescription: t('pin_policy.actions.pin_change'),
          onApproved: () => setOpen(true),
          onCancel: goBackToMore,
        });
      })
      .catch(() => {
        if (active) goBackToMore();
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;

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
