export type TabKey = 'home' | 'sales' | 'inventory' | 'customers' | 'more';

export const TOUR_ORDER: TabKey[] = [
  'home',
  'sales',
  'inventory',
  'customers',
  'more',
];

export type TourStepContent = {
  tab: TabKey;
  label: string; // "DASHBOARD" — rendered as an all-caps pill
  headline: string; // large display-weight line
  whatItDoes: string; // 1–2 lines
  whenToUseIt: string; // 1 line, italic in UI
};

export const ONBOARDING_TOUR_STEPS: TourStepContent[] = [
  {
    tab: 'home',
    label: 'HOME',
    headline: 'Your counter at a glance',
    whatItDoes:
      "See today's sales, items sold, and credit totals without opening anything else.",
    whenToUseIt:
      'First thing in the morning, or between rushes, to know where you stand.',
  },
  {
    tab: 'sales',
    label: 'SALES',
    headline: 'Ring up a sale in seconds',
    whatItDoes:
      'Pick items, set quantity, choose cash or utang. Works without internet.',
    whenToUseIt: 'Every time a suki is at the counter.',
  },
  {
    tab: 'inventory',
    label: 'INVENTORY',
    headline: "Know what's on the shelf",
    whatItDoes:
      "Add products, set prices, and restock. Sari flags low stock so you don't run out.",
    whenToUseIt:
      'When new stock arrives or when you notice something running low.',
  },
  {
    tab: 'customers',
    label: 'CUSTOMERS',
    headline: 'Track suki balances',
    whatItDoes:
      'Log credit sales and payments. Balances are computed from each suki’s transactions and always add up.',
    whenToUseIt: 'When a suki says "tabi muna" or comes in to pay.',
  },
  {
    tab: 'more',
    label: 'MORE',
    headline: 'See how the store is doing',
    whatItDoes:
      'Daily, weekly, and monthly totals. Best sellers, slow movers, and credit aging.',
    whenToUseIt:
      "At the end of the day, or when you want to plan tomorrow's stock.",
  },
];
