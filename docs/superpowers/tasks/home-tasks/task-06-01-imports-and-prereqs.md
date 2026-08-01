# Task 06-01: Add useHomeDashboardData imports for new fields

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Extend the import block at the top of `useHomeDashboardData.ts` so the hook can call `resolveHomeState` and `useReportKPIs`.

## Dependencies

- None (independent of earlier tasks)

## Files

- Modify: `hooks/useHomeDashboardData.ts:1-10`

## Steps

- [ ] **Step 1: Replace the import block**

Replace the existing import block (lines 1-10) with:

```ts
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentSession } from './useCash';
import { useCreditKPIs, useCustomers } from './useCredits';
import { useProducts } from './useProducts';
import { useRecentSales, useSales } from './useSales';
import { useProfile } from './useProfile';
import { useReports } from './useReports';
import { getDateRangeFromType } from '@/utils';
import { groupSalesByHour, HourlySalesGroup } from '@/utils';
import { SaleWithItems } from '@/types/sales.types';
import { formatPesos } from '@/lib/money';
import { HomeRecommendation, resolveHomeState } from '@/components/home/home-state';
```

(Keep any additional imports your local copy already has — `useFocusEffect`, etc.)

## Commit

None yet — verification + commit happen in `task-06-07`.