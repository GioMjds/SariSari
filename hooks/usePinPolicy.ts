import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPinPolicyOverrides,
  setPinPolicyOverride,
} from '@/database/pin-policy';
import type { PinActionId } from '@/lib/auth/pin-actions';

const pinPolicyKey = ['pinPolicy'] as const;

export const usePinPolicy = () => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: pinPolicyKey,
    queryFn: getPinPolicyOverrides,
  });
  const mutation = useMutation({
    mutationFn: ({ id, enabled }: { id: PinActionId; enabled: boolean }) =>
      setPinPolicyOverride(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: pinPolicyKey }),
  });
  return {
    overrides: query.data ?? {},
    isReady: query.isSuccess,
    setOverride: mutation.mutateAsync,
  };
};
