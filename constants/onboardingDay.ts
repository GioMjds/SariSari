import type { SariState } from '@/components/mascot';
import type { Pesos } from '@/lib/money';

/**
 * Sample data for the onboarding "day at your store" walkthrough.
 * Nothing here is ever written to SQLite. Display names are i18n keys
 * in the `onboarding` namespace.
 */

export type DayProductId = 'kopiko' | 'pandesal' | 'luckyMe' | 'cokeMismo';
export type DaySukiId = 'nena';
export type BeatId = 'cash' | 'utang' | 'restock' | 'close';
export type SaleBeat = Extract<BeatId, 'cash' | 'utang'>;

export const isSaleBeat = (beat: BeatId): beat is SaleBeat =>
  beat === 'cash' || beat === 'utang';

export const BEAT_ORDER: readonly BeatId[] = [
  'cash',
  'utang',
  'restock',
  'close',
];

export const PRODUCT_ORDER: readonly DayProductId[] = [
  'kopiko',
  'pandesal',
  'luckyMe',
  'cokeMismo',
];

export type SeedProduct = { price: Pesos; stock: number; nameKey: string };

export const SEED_PRODUCTS: Readonly<Record<DayProductId, SeedProduct>> = {
  kopiko: { price: 15 as Pesos, stock: 5, nameKey: 'dayProductKopiko' },
  pandesal: { price: 8 as Pesos, stock: 30, nameKey: 'dayProductPandesal' },
  luckyMe: { price: 20 as Pesos, stock: 12, nameKey: 'dayProductLuckyMe' },
  cokeMismo: { price: 24 as Pesos, stock: 10, nameKey: 'dayProductCokeMismo' },
};

export const SUKI_NAME_KEY: Readonly<Record<DaySukiId, string>> = {
  nena: 'daySukiNena',
};

/** What the customer in each sale beat asks for. */
export const SCRIPTED_ORDERS: Readonly<
  Record<SaleBeat, Readonly<Partial<Record<DayProductId, number>>>>
> = {
  cash: { kopiko: 2, pandesal: 1 },
  utang: { luckyMe: 2, cokeMismo: 1 },
};

export const CASH_TENDERED = 50 as Pesos;
/** Bills the cash beat offers. The first one is the scripted tap. */
export const TENDER_OPTIONS: readonly Pesos[] = [CASH_TENDERED, 100 as Pesos];

export const SCRIPTED_RESTOCK: { id: DayProductId; qty: number } = {
  id: 'kopiko',
  qty: 24,
};

export const SCRIPTED_PAYMENT: { suki: DaySukiId; amount: Pesos } = {
  suki: 'nena',
  amount: 40 as Pesos,
};

/** Stock at or below this count is flagged Low. */
export const LOW_STOCK_AT = 3;

export type BeatCopy = {
  clockKey: string;
  sceneKey: string;
  /** Shown when the cart has items the customer did not ask for. */
  nudgeKey: string | null;
  outcomeKey: string;
  pose: SariState;
  donePose: SariState;
};

export const BEAT_COPY: Readonly<Record<BeatId, BeatCopy>> = {
  cash: {
    clockKey: 'clockCash',
    sceneKey: 'beatCashScene',
    nudgeKey: 'beatCashNudge',
    outcomeKey: 'beatCashOutcome',
    pose: 'sales',
    donePose: 'sales',
  },
  utang: {
    clockKey: 'clockUtang',
    sceneKey: 'beatUtangScene',
    nudgeKey: 'beatUtangNudge',
    outcomeKey: 'beatUtangOutcome',
    pose: 'utang',
    donePose: 'utang',
  },
  restock: {
    clockKey: 'clockRestock',
    sceneKey: 'beatRestockScene',
    nudgeKey: null,
    outcomeKey: 'beatRestockOutcome',
    pose: 'low-stock',
    donePose: 'inventory',
  },
  close: {
    clockKey: 'clockClose',
    sceneKey: 'beatCloseScene',
    nudgeKey: null,
    outcomeKey: 'beatCloseOutcome',
    pose: 'reports',
    donePose: 'balance-cleared',
  },
};
