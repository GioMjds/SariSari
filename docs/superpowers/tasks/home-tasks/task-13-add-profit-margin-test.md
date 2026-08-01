# Task 13: Add focused test for the profitMargin bug fix

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Lock in the bug fix so `useHomeDashboardData()` no longer hardcodes `profitMargin: 912`. When `useReportKPIs` returns `{ totalProfit: null }` and the rest of the data is empty, `stats.profitMargin` should be `null`.

## Dependencies

- [06-07](./task-06-07-verify-and-commit.md)

## Files

- Create: `tests/hooks/useHomeDashboardData.test.tsx`

## Steps

- [ ] **Step 1: Create the test file**

Create `tests/hooks/useHomeDashboardData.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';

jest.mock('@/hooks/useSales', () => ({
  useSales: () => ({
    getTodayStatsQuery: { data: undefined, isLoading: false, error: null },
  }),
  useRecentSales: () => ({ data: undefined, isLoading: false }),
}));
jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    getAllProductsQuery: { data: [], isLoading: false, error: null },
  }),
}));
jest.mock('@/hooks/useCredits', () => ({
  useCreditKPIs: () => ({ data: undefined, isLoading: false }),
  useCustomers: () => ({ data: [], isLoading: false }),
}));
jest.mock('@/hooks/useCash', () => ({
  useCurrentSession: () => ({ data: null, isLoading: false }),
}));
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: null, loading: false }),
}));
jest.mock('@/hooks/useReports', () => ({
  useReportKPIs: () => ({ data: { totalProfit: null } }),
}));
jest.mock('@/utils', () => {
  const actual = jest.requireActual('@/utils');
  return {
    ...actual,
    getDateRangeFromType: () => ({ startDate: '', endDate: '' }),
    groupSalesByHour: actual.groupSalesByHour,
  };
});

describe('useHomeDashboardData — profitMargin bug fix', () => {
  it('returns profitMargin as null when no report KPIs are available (no longer hardcodes 912)', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useHomeDashboardData(), { wrapper });
    expect(result.current.stats.profitMargin).toBeNull();
    expect(result.current.stats.profitMargin).not.toBe(912);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx jest tests/hooks/useHomeDashboardData.test.tsx`

Expected: PASS. If it fails because the hook reads `useReportKPIs` differently, double-check the mock — the production hook uses `useReportKPIs(todayRange)` from `hooks/useReports.tsx`. The mock above replaces the entire `useReports` module, so `useReportKPIs` becomes a function returning the stubbed data. That is correct.

- [ ] **Step 3: Commit**

```bash
git add tests/hooks/useHomeDashboardData.test.tsx
git commit -m "test(home): verify profitMargin is no longer hardcoded"
```

## Next

Proceed to [Task 14](./task-14-update-dashboard-screen-mocks.md).