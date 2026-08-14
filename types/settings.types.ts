export type AppSettingKey =
  | 'void_window_hours'
  | 'owner_pin_discount_threshold_pesos'
  | 'owner_pin_discount_threshold_percent';

export interface AppSettingRow {
  key: string;
  value: string;
  updatedAt: number;
}

