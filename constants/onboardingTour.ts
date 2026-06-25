/**
 * onboardingTour — copy for the 5-tab tour steps inside onboarding.
 * Kept as data (not JSX) so writers can tweak the headlines and
 * "when to use it" lines without touching component code.
 *
 * TabKey intentionally matches the `(tabs)` route group keys so the
 * tour reads like a mirror of the bottom-tab bar. Adding a sixth tab
 * here requires a new route file under `app/(tabs)/` and a matching
 * `sari-emotions/<tab>-state.png` asset.
 *
 * Image `require()` calls live in `onboardingTour.assets.ts` (sibling)
 * to keep this file safe to import from Jest unit tests without pulling
 * in React Native's image-resolver. Pure data only here.
 */

export type TabKey =
	| 'dashboard'
	| 'sell'
	| 'inventory'
	| 'utang'
	| 'reports';

export const TOUR_ORDER: TabKey[] = [
	'dashboard',
	'sell',
	'inventory',
	'utang',
	'reports',
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
		tab: 'dashboard',
		label: 'DASHBOARD',
		headline: 'Your counter at a glance',
		whatItDoes:
			"See today's sales, items sold, and credit totals without opening anything else.",
		whenToUseIt:
			'First thing in the morning, or between rushes, to know where you stand.',
	},
	{
		tab: 'sell',
		label: 'SELL',
		headline: 'Ring up a sale in seconds',
		whatItDoes: 'Pick items, set quantity, choose cash or utang. Works without internet.',
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
		tab: 'utang',
		label: 'UTANG',
		headline: 'Track suki balances',
		whatItDoes:
			'Log credit sales and payments. Balances are always live and add up to the peso.',
		whenToUseIt: 'When a suki says "tabi muna" or comes in to pay.',
	},
	{
		tab: 'reports',
		label: 'REPORTS',
		headline: 'See how the store is doing',
		whatItDoes:
			'Daily, weekly, and monthly totals. Best sellers, slow movers, and credit aging.',
		whenToUseIt:
			"At the end of the day, or when you want to plan tomorrow's stock.",
	},
];
