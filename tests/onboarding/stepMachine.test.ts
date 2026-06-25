import {
  PROFILE_INDEX,
  READY_INDEX,
  TOUR_END_INDEX,
  TOUR_START_INDEX,
  Step,
  back,
  canJumpBack,
  indexOf,
  jumpTo,
  next,
  skipToReady,
  stepAt,
} from '../../lib/onboardingStepMachine';
import { TOUR_ORDER as TAB_ORDER } from '../../constants/onboardingTour';

describe('onboardingStepMachine', () => {
  describe('indexOf / stepAt (round-trip)', () => {
    test('profile maps to index 0 and back', () => {
      const step: Step = { kind: 'profile' };
      expect(indexOf(step)).toBe(PROFILE_INDEX);
      expect(stepAt(PROFILE_INDEX)).toEqual(step);
    });

    test('every TOUR_ORDER entry maps to its expected slot', () => {
      TAB_ORDER.forEach((tab, i) => {
        const step: Step = { kind: 'tour', tab };
        const expected = TOUR_START_INDEX + i;
        expect(indexOf(step)).toBe(expected);
        expect(stepAt(expected)).toEqual(step);
      });
    });

    test('ready maps to index 6', () => {
      const step: Step = { kind: 'ready' };
      expect(indexOf(step)).toBe(READY_INDEX);
      expect(stepAt(READY_INDEX)).toEqual(step);
    });

    test('out-of-range indices clamp at the ends', () => {
      expect(stepAt(-5)).toEqual({ kind: 'profile' });
      expect(stepAt(99)).toEqual({ kind: 'ready' });
    });
  });

  describe('next', () => {
    test('initial step is profile', () => {
      // Sanity check on the test fixtures themselves: profile is index 0
      expect(indexOf({ kind: 'profile' })).toBe(0);
    });

    test('next from profile advances to the first tour step', () => {
      const result = next({ kind: 'profile' });
      expect(result).toEqual({ kind: 'tour', tab: TAB_ORDER[0] });
    });

    test('next advances through the tour in TOUR_ORDER', () => {
      let current: Step = { kind: 'tour', tab: TAB_ORDER[0] };
      for (let i = 1; i < TAB_ORDER.length; i++) {
        current = next(current);
        expect(current).toEqual({ kind: 'tour', tab: TAB_ORDER[i] });
      }
    });

    test('next from the last tour step goes to ready', () => {
      const lastTour: Step = {
        kind: 'tour',
        tab: TAB_ORDER[TAB_ORDER.length - 1],
      };
      expect(next(lastTour)).toEqual({ kind: 'ready' });
    });

    test("next can't go past ready", () => {
      expect(next({ kind: 'ready' })).toEqual({ kind: 'ready' });
    });
  });

  describe('back', () => {
    test('back from ready goes to the last tour step', () => {
      const result = back({ kind: 'ready' });
      expect(result).toEqual({
        kind: 'tour',
        tab: TAB_ORDER[TAB_ORDER.length - 1],
      });
    });

    test('back from a middle tour step goes to the previous tab', () => {
      const result = back({ kind: 'tour', tab: TAB_ORDER[2] });
      expect(result).toEqual({ kind: 'tour', tab: TAB_ORDER[1] });
    });

    test("back can't go past profile", () => {
      expect(back({ kind: 'profile' })).toEqual({ kind: 'profile' });
    });
  });

  describe('skipToReady', () => {
    test('skip from any step lands on ready', () => {
      expect(skipToReady()).toEqual({ kind: 'ready' });
    });
  });

  describe('jumpTo', () => {
    test('refuses forward jumps beyond maxReachableIndex', () => {
      // Currently on profile (index 0), max reached is 2 — can't jump to 5
      expect(jumpTo(5, 2)).toEqual(stepAt(2));
    });

    test('allows jumps to visited steps', () => {
      // Currently on index 4, max reached is 4 — can jump back to 2
      expect(jumpTo(2, 4)).toEqual(stepAt(2));
    });

    test('clamps out-of-range indices before applying maxReachable', () => {
      expect(jumpTo(-99, 6)).toEqual({ kind: 'profile' });
      expect(jumpTo(99, 6)).toEqual({ kind: 'ready' });
    });

    test('TOUR_END_INDEX is the last tour slot', () => {
      // The tour covers indices 1..5 — five steps, one per tab
      expect(TOUR_END_INDEX - TOUR_START_INDEX + 1).toBe(TAB_ORDER.length);
    });
  });

  describe('canJumpBack', () => {
    test('returns true only when target is strictly before current', () => {
      expect(canJumpBack(2, 5)).toBe(true);
      expect(canJumpBack(5, 5)).toBe(false);
      expect(canJumpBack(6, 5)).toBe(false);
    });
  });
});
