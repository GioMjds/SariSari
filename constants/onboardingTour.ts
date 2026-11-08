import type { SariState } from './onboardingTour.assets';

export type TabKey = 'home' | 'sales' | 'inventory' | 'customers' | 'more';

export const TOUR_ORDER: TabKey[] = [
  'home',
  'sales',
  'inventory',
  'customers',
  'more',
];

/** All text fields are i18n keys in the `onboarding` namespace. */
export type TourStepContent = {
  tab: TabKey;
  pose: SariState; // Sari pose when the step opens
  labelKey: string;
  headlineKey: string;
  whatItDoesKey: string;
  whenToUseItKey: string;
  bubbleKey: string; // Sari's opening speech bubble
};

export const ONBOARDING_TOUR_STEPS: TourStepContent[] = [
  {
    tab: 'home',
    pose: 'default',
    labelKey: 'tourHomeLabel',
    headlineKey: 'tourHomeHeadline',
    whatItDoesKey: 'tourHomeWhatItDoes',
    whenToUseItKey: 'tourHomeWhen',
    bubbleKey: 'tourHomeBubble',
  },
  {
    tab: 'sales',
    pose: 'default',
    labelKey: 'tourSalesLabel',
    headlineKey: 'tourSalesHeadline',
    whatItDoesKey: 'tourSalesWhatItDoes',
    whenToUseItKey: 'tourSalesWhen',
    bubbleKey: 'tourSalesBubble',
  },
  {
    tab: 'inventory',
    pose: 'lowStock',
    labelKey: 'tourInventoryLabel',
    headlineKey: 'tourInventoryHeadline',
    whatItDoesKey: 'tourInventoryWhatItDoes',
    whenToUseItKey: 'tourInventoryWhen',
    bubbleKey: 'tourInventoryBubble',
  },
  {
    tab: 'customers',
    pose: 'utang',
    labelKey: 'tourCustomersLabel',
    headlineKey: 'tourCustomersHeadline',
    whatItDoesKey: 'tourCustomersWhatItDoes',
    whenToUseItKey: 'tourCustomersWhen',
    bubbleKey: 'tourCustomersBubble',
  },
  {
    tab: 'more',
    pose: 'reports',
    labelKey: 'tourMoreLabel',
    headlineKey: 'tourMoreHeadline',
    whatItDoesKey: 'tourMoreWhatItDoes',
    whenToUseItKey: 'tourMoreWhen',
    bubbleKey: 'tourMoreBubble',
  },
];
