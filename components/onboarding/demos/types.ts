import type { SariState } from '@/constants/onboardingTour.assets';

export type BubbleParams = Record<string, string | number>;

/** What TourCard hands to every demo widget. */
export type DemoProps = {
  setPose: (state: SariState) => void;
  say: (key: string, params?: BubbleParams) => void;
  /** Idempotent: safe to call on every qualifying tap. */
  complete: () => void;
};
