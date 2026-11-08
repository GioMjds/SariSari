import type { ComponentType } from 'react';
import type { TabKey } from '@/constants/onboardingTour';
import { CustomersDemo } from './CustomersDemo';
import { HomeDemo } from './HomeDemo';
import { InventoryDemo } from './InventoryDemo';
import { ReportsDemo } from './ReportsDemo';
import { SalesDemo } from './SalesDemo';
import type { DemoProps } from './types';

export type { BubbleParams, DemoProps } from './types';

export const DEMO_BY_TAB: Record<TabKey, ComponentType<DemoProps>> = {
  home: HomeDemo,
  sales: SalesDemo,
  inventory: InventoryDemo,
  customers: CustomersDemo,
  more: ReportsDemo,
};
