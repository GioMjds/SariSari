import enCommon from '../locales/en/common.json';
import en from '../locales/en/pricing.json';
import tlCommon from '../locales/tl/common.json';
import tl from '../locales/tl/pricing.json';

const flatten = (obj: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? flatten(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

describe('pricing locales', () => {
  it('en and tl have identical keys', () => {
    expect(flatten(tl).sort()).toEqual(flatten(en).sort());
  });

  it('has no empty strings', () => {
    for (const bundle of [en, tl]) {
      for (const key of flatten(bundle)) {
        const value = (bundle as Record<string, unknown>)[key];
        expect(
          `${key}:${typeof value === 'string' && value.trim().length > 0}`,
        ).toBe(`${key}:true`);
      }
    }
  });

  it('has a label for every price change source', () => {
    for (const bundle of [en, tl]) {
      const record = bundle as Record<string, unknown>;
      for (const key of [
        'sourceDelivery',
        'sourceRestock',
        'sourceManualEdit',
        'sourceReprice',
      ]) {
        expect(`${key}:${typeof record[key]}`).toBe(`${key}:string`);
      }
    }
  });

  it('has the More-tab row strings in both common bundles', () => {
    for (const bundle of [enCommon, tlCommon]) {
      const record = bundle as Record<string, unknown>;
      for (const key of [
        'moreHomeRepriceLabel',
        'moreHomeRepriceSub',
        'moreHomeRepriceSubCount',
        'moreHomeRepriceHint',
      ]) {
        expect(`${key}:${typeof record[key]}`).toBe(`${key}:string`);
      }
    }
  });
});
