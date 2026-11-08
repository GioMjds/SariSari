import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';

export type HomeDestination =
  | 'addProduct'
  | 'inventory'
  | 'utang'
  | 'newSale'
  | 'reports';

export type HomeGoalKind =
  | 'setupCatalog'
  | 'outOfStock'
  | 'lowStock'
  | 'overdueCredits'
  | 'firstSale'
  | 'continueSelling'
  | 'reviewReports';

export interface HomeRecommendation {
  kind: HomeGoalKind;
  destination: HomeDestination;
  count?: number;
}

export interface HomeStateInput {
  productQuantities: number[];
  hasAnySales: boolean;
  overdueCount: number;
  hour: number;
}

export interface HomeState {
  goal: HomeRecommendation;
  suggestions: HomeRecommendation[];
  outOfStockCount: number;
  lowStockCount: number;
}

export function resolveHomeState(input: HomeStateInput): HomeState {
  const outOfStockCount = input.productQuantities.filter((q) => q === 0).length;
  const lowStockCount = input.productQuantities.filter(
    (q) => q > 0 && q < LOW_STOCK_THRESHOLD,
  ).length;

  let goal: HomeRecommendation;

  if (input.productQuantities.length === 0) {
    goal = { kind: 'setupCatalog', destination: 'addProduct' };
  } else if (outOfStockCount > 0) {
    goal = {
      kind: 'outOfStock',
      destination: 'inventory',
      count: outOfStockCount,
    };
  } else if (lowStockCount > 0) {
    goal = { kind: 'lowStock', destination: 'inventory', count: lowStockCount };
  } else if (input.overdueCount > 0) {
    goal = {
      kind: 'overdueCredits',
      destination: 'utang',
      count: input.overdueCount,
    };
  } else if (!input.hasAnySales) {
    goal = { kind: 'firstSale', destination: 'newSale' };
  } else {
    goal = { kind: 'continueSelling', destination: 'newSale' };
  }

  // Time-of-day suggestions (05:00-11:59: Inventory, 12:00-17:59: New Sale, 18:00-04:59: Reports)
  const suggestions: HomeRecommendation[] = [];
  let timeSuggestion: HomeRecommendation | null = null;

  if (input.hour >= 5 && input.hour < 12) {
    timeSuggestion = { kind: 'lowStock', destination: 'inventory' };
  } else if (input.hour >= 12 && input.hour < 18) {
    timeSuggestion = { kind: 'continueSelling', destination: 'newSale' };
  } else {
    timeSuggestion = { kind: 'reviewReports', destination: 'reports' };
  }

  // Omit suggestion if its destination matches the primary goal destination
  if (timeSuggestion && timeSuggestion.destination !== goal.destination) {
    suggestions.push(timeSuggestion);
  }

  return {
    goal,
    suggestions,
    outOfStockCount,
    lowStockCount,
  };
}
