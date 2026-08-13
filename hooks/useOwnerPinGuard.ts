import { useContext } from 'react';
import { OwnerPinGuardContext } from '@/components/auth/OwnerPinGuardProvider';

export const useOwnerPinGuard = () => {
  const ctx = useContext(OwnerPinGuardContext);
  if (!ctx) {
    return {
      runWithPinGuard: async (options: {
        onApproved: () => Promise<void> | void;
      }) => {
        await options.onApproved();
      },
    };
  }
  return ctx;
};
