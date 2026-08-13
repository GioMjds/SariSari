export type AppSettingKey = 'void_window_hours';

export interface AppSettingRow {
  key: string;
  value: AppSettingKey;
  updatedAt: number;
}
