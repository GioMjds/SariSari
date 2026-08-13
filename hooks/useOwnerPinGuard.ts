import { useContext } from 'react';
import { OwnerPinGuardContext } from '@/components/auth/OwnerPinGuardProvider';

export const useOwnerPinGuard = () => {
  const ctx = useContext(OwnerPinGuardContext);
  if (!ctx) {
    throw new Error(
      'useOwnerPinGuard must be used within an OwnerPinGuardProvider',
    );
  }
  return ctx;
};
