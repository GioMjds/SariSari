import {
  READY_INDEX,
  TOTAL_STEPS,
  back,
  canJumpBack,
  indexOf,
  jumpTo,
  next,
  skipToReady,
  stepAt,
} from '@/lib/onboardingStepMachine';

describe('onboarding step machine', () => {
  it('has six steps: profile, four beats, ready', () => {
    expect(TOTAL_STEPS).toBe(6);
    expect([0, 1, 2, 3, 4, 5].map(stepAt)).toEqual([
      { kind: 'profile' },
      { kind: 'beat', beat: 'cash' },
      { kind: 'beat', beat: 'utang' },
      { kind: 'beat', beat: 'restock' },
      { kind: 'beat', beat: 'close' },
      { kind: 'ready' },
    ]);
  });

  it('round-trips index and step', () => {
    for (let i = 0; i < TOTAL_STEPS; i++) expect(indexOf(stepAt(i))).toBe(i);
  });

  it('clamps next and back at the ends', () => {
    expect(next({ kind: 'ready' })).toEqual({ kind: 'ready' });
    expect(back({ kind: 'profile' })).toEqual({ kind: 'profile' });
    expect(next({ kind: 'beat', beat: 'close' })).toEqual({ kind: 'ready' });
    expect(back({ kind: 'beat', beat: 'cash' })).toEqual({ kind: 'profile' });
  });

  it('clamps out-of-range indexes and skips to ready', () => {
    expect(stepAt(-3)).toEqual({ kind: 'profile' });
    expect(stepAt(99)).toEqual({ kind: 'ready' });
    expect(indexOf(skipToReady())).toBe(READY_INDEX);
  });

  it('never jumps past the furthest reached step', () => {
    expect(jumpTo(5, 2)).toEqual({ kind: 'beat', beat: 'utang' });
    expect(canJumpBack(1, 3)).toBe(true);
    expect(canJumpBack(3, 3)).toBe(false);
  });
});
