import { centerOffset } from '@/lib/subTabLayout';

describe('centerOffset', () => {
  it('returns null until the viewport is measured', () => {
    expect(centerOffset(300, 80, 0)).toBeNull();
  });

  it('centers a tab in the viewport', () => {
    expect(centerOffset(300, 80, 320)).toBe(180);
  });

  it('never scrolls below zero for tabs near the start', () => {
    expect(centerOffset(4, 70, 320)).toBe(0);
  });
});
