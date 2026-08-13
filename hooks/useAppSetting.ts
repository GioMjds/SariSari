import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppSetting, setAppSetting } from '@/database/settings';
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: appSettingKey.appSettingKey(key) }),
  });
};
