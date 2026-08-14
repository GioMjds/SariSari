import { useContext } from 'react';
import {
  GuardOptions,
  OwnerPinGuardContext,
  OwnerPinGuardContextType,
} from '@/components/auth/OwnerPinGuardProvider';

export const useOwnerPinGuard = (): OwnerPinGuardContextType => {
  const ctx = useContext(OwnerPinGuardContext);
  if (!ctx) {
    return {
      runWithPinGuard: async (_options: GuardOptions) => {
        console.error(
          'OwnerPinGuardProvider is missing from component tree. Action denied.',
        );
      },
    };
  }
  return ctx;
};

