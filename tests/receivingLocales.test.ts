import en from '../locales/en/receiving.json';
import tl from '../locales/tl/receiving.json';

const flatten = (obj: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? flatten(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

describe('receiving locales', () => {
  it('en and tl have identical keys', () => {
    expect(flatten(tl).sort()).toEqual(flatten(en).sort());
  });
  it('has no empty strings', () => {
    for (const bundle of [en, tl]) {
      for (const key of flatten(bundle)) {
        const value = key
          .split('.')
          .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], bundle);
        expect(typeof value === 'string' && value.trim().length > 0).toBe(true);
      }
    }
  });
});
