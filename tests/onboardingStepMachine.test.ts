import {
  indexOf,
  stepAt,
  next,
  back,
  jumpTo,
  PROFILE_INDEX,
  READY_INDEX,
} from '@/lib/onboardingStepMachine';

describe('onboardingStepMachine', () => {
  it('correctly maps profile step', () => {
    const step = stepAt(PROFILE_INDEX);
    expect(step).toEqual({ kind: 'profile' });
    expect(indexOf(step)).toBe(PROFILE_INDEX);
  });

  it('correctly maps tour steps', () => {
    const step = stepAt(1);
    expect(step).toEqual({ kind: 'tour', tab: 'home' });
    expect(indexOf(step)).toBe(1);
  });

  it('correctly maps ready step', () => {
    const step = stepAt(READY_INDEX);
    expect(step).toEqual({ kind: 'ready' });
    expect(indexOf(step)).toBe(READY_INDEX);
  });

  it('navigates next and back', () => {
    const start = stepAt(0);
    const nextStep = next(start);
    expect(nextStep).toEqual({ kind: 'tour', tab: 'home' });

    const backStep = back(nextStep);
    expect(backStep).toEqual({ kind: 'profile' });
  });

  it('respects maxReachableIndex when jumping', () => {
    const jumped = jumpTo(4, 2);
    expect(indexOf(jumped)).toBe(2);
  });
});
