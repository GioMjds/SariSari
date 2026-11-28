import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppSetting, setAppSetting } from '@/database/settings';
import { NEAR_EXPIRY_WINDOW_DAYS } from '@/constants/stocks';
import type { AppSettingKey } from '@/types/settings.types';

const appSettingKey = {
  appSetting: ['appSetting'] as const,
  appSettingKey: (key: AppSettingKey) =>
    [...appSettingKey.appSetting, key] as const,
};

export const useAppSetting = (key: AppSettingKey) => {
  const query = useQuery({
    queryKey: appSettingKey.appSettingKey(key),
    queryFn: () => getAppSetting(key),
    staleTime: 5 * 60 * 1000,
  });
  return { value: query.data ?? null, isLoading: query.isLoading };
};

export const useSetAppSetting = (key: AppSettingKey) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: string) => setAppSetting(key, value),
    // Optimistic write so controlled switches do not snap back while the DB write runs.
    onMutate: async (value) => {
      const queryKey = appSettingKey.appSettingKey(key);
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, value);
      return { previous };
    },
    onError: (_err, _value, ctx) =>
      qc.setQueryData(appSettingKey.appSettingKey(key), ctx?.previous ?? null),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: appSettingKey.appSettingKey(key) }),
  });
};

/** Store-wide near-expiry window in days, defaulting until the owner sets it. */
export const useNearExpiryDays = (): number => {
  const { value } = useAppSetting('near_expiry_days');
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : NEAR_EXPIRY_WINDOW_DAYS;
};
