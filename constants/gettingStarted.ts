import type { GettingStartedTaskId } from '@/lib/gettingStarted';

export type FirstStepIcon = 'cube-outline' | 'cash-outline' | 'people-outline';

export type FirstStep = {
  id: GettingStartedTaskId;
  icon: FirstStepIcon;
  titleKey: string;
  reasonKey: string;
  /** expo-router path; cast to Href at the call site. */
  href: string;
};

export const FIRST_STEPS: readonly FirstStep[] = [
  {
    id: 'product',
    icon: 'cube-outline',
    titleKey: 'readyStepProductTitle',
    reasonKey: 'readyStepProductReason',
    href: '/(edit-forms)/add-product',
  },
  {
    id: 'sale',
    icon: 'cash-outline',
    titleKey: 'readyStepSaleTitle',
    reasonKey: 'readyStepSaleReason',
    href: '/(tabs)/sales/pos',
  },
  {
    id: 'suki',
    icon: 'people-outline',
    titleKey: 'readyStepSukiTitle',
    reasonKey: 'readyStepSukiReason',
    href: '/(edit-forms)/add-customer',
  },
];
