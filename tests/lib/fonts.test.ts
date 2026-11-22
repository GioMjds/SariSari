import { withStackSans } from '@/lib/fonts';

describe('withStackSans', () => {
  it('defaults to StackSans Regular when no weight is set', () => {
    expect(withStackSans('text-foreground text-base')).toBe(
      'text-foreground text-base font-stack-sans',
    );
  });

  it('swaps a weight class for its StackSans family', () => {
    expect(withStackSans('text-sm font-medium text-primary')).toBe(
      'text-sm font-stack-sans-medium text-primary',
    );
    expect(withStackSans('font-semibold')).toBe('font-stack-sans-semibold');
    expect(withStackSans('text-4xl font-extrabold')).toBe(
      'text-4xl font-stack-sans-bold',
    );
  });

  it('keeps an explicit family untouched', () => {
    expect(withStackSans('font-stack-sans-light font-bold')).toBe(
      'font-stack-sans-light font-bold',
    );
    expect(withStackSans('font-mono font-semibold')).toBe(
      'font-mono font-semibold',
    );
  });

  it('ignores prefixed weight classes', () => {
    expect(withStackSans('web:font-bold')).toBe('web:font-bold font-stack-sans');
  });
});
