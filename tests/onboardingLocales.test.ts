import { FIRST_STEPS } from '@/constants/gettingStarted';
import { ONBOARDING_TOUR_STEPS } from '@/constants/onboardingTour';

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

  it('defines every key the tour constants reference', () => {
    const keys = ONBOARDING_TOUR_STEPS.flatMap((step) => [
      step.labelKey,
      step.headlineKey,
      step.whatItDoesKey,
      step.whenToUseItKey,
      step.bubbleKey,
    ]);
    for (const key of keys) {
      expect(`${key}:${key in en}`).toBe(`${key}:true`);
      expect(`${key}:${key in tl}`).toBe(`${key}:true`);
    }
  });

  it('defines every key the first-step cards reference', () => {
    for (const step of FIRST_STEPS) {
      for (const key of [step.titleKey, step.reasonKey]) {
        expect(`${key}:${key in en}`).toBe(`${key}:true`);
        expect(`${key}:${key in tl}`).toBe(`${key}:true`);
      }
    }
  });
});
