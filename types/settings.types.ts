export type AppSettingKey =
  | 'void_window_hours'
  | 'owner_pin_discount_threshold_pesos'
  | 'owner_pin_discount_threshold_percent'
  | 'biometric_unlock_enabled'
  | 'app_launch_lock_enabled';

export interface AppSettingRow {
  key: string;
  value: string;
  updatedAt: number;
}
