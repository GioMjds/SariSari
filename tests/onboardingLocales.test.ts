import { FIRST_STEPS } from '@/constants/gettingStarted';
import {
  BEAT_COPY,
  SEED_PRODUCTS,
  SUKI_NAME_KEY,
} from '@/constants/onboardingDay';

const en = require('@/locales/en/onboarding.json') as Record<string, string>;
const tl = require('@/locales/tl/onboarding.json') as Record<string, string>;

describe('onboarding locales', () => {
  it('has the same keys in en and tl', () => {
    expect(Object.keys(tl).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty strings', () => {
    for (const [key, value] of Object.entries({ ...en })) {
      expect(`${key}:${value.trim().length > 0}`).toBe(`${key}:true`);
    }
    for (const [key, value] of Object.entries({ ...tl })) {
      expect(`${key}:${value.trim().length > 0}`).toBe(`${key}:true`);
    }
  });

  it('has no leftover tour or demo keys', () => {
    const stale = Object.keys(en).filter(
      (key) =>
        /^(tour|demo)[A-Z]/.test(key) ||
        key === 'finishTour' ||
        key === 'progressA11y',
    );
    expect(stale).toEqual([]);
  });

  it('defines every key the first-step cards reference', () => {
    for (const step of FIRST_STEPS) {
      for (const key of [step.titleKey, step.reasonKey]) {
        expect(`${key}:${key in en}`).toBe(`${key}:true`);
        expect(`${key}:${key in tl}`).toBe(`${key}:true`);
      }
    }
  });

  const DAY_UI_KEYS = [
    'clockBeforeOpen',
    'clockClosed',
    'clockA11y',
    'showMe',
    'showMeA11y',
    'beatDone',
    'coachHint',
    'continueLockedHint',
    'finishDay',
    'posAddA11y',
    'posRemoveA11y',
    'posStock',
    'posCartEmpty',
    'posTotal',
    'posCheckout',
    'posEditCart',
    'posPayWith',
    'posCash',
    'posUtang',
    'posTendered',
    'posTenderA11y',
    'posPickSuki',
    'posPickSukiA11y',
    'posPaidCash',
    'posPaidUtang',
    'invTitle',
    'invStockCount',
    'invLow',
    'invOk',
    'invRestock',
    'invRestockA11y',
    'invDeliveryTitle',
    'invDeliveryQty',
    'invConfirm',
    'homeTitle',
    'homeTodaySales',
    'homeItemsSold',
    'homeUtangOut',
    'homeSukiTitle',
    'homeBalance',
    'homeRecordPayment',
    'homePaid',
  ];

  it('defines every key the day walkthrough references', () => {
    const copyKeys = Object.values(BEAT_COPY).flatMap((c) =>
      [c.clockKey, c.sceneKey, c.outcomeKey, c.nudgeKey].filter(
        (k): k is string => k !== null,
      ),
    );
    const nameKeys = [
      ...Object.values(SEED_PRODUCTS).map((p) => p.nameKey),
      ...Object.values(SUKI_NAME_KEY),
    ];
    for (const key of [...copyKeys, ...nameKeys, ...DAY_UI_KEYS]) {
      expect(`${key}:${key in en}`).toBe(`${key}:true`);
      expect(`${key}:${key in tl}`).toBe(`${key}:true`);
    }
  });
});
