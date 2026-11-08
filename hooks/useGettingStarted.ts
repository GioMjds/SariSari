import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GettingStartedProgress,
  deriveGettingStarted,
  shouldShowGettingStarted,
} from '@/lib/gettingStarted';
import {
  loadGettingStartedDismissed,
  setGettingStartedDismissed,
} from '@/lib/gettingStartedStorage';
import { useCustomers } from './useCredits';
import { useProducts } from './useProducts';
import { useHasSales } from './useSales';

/**
 * useGettingStarted - Home checklist state. Progress is derived from
 * existing product, sale, and customer data. The card stays hidden
 * until every query and the dismiss flag have loaded, so it never
 * flashes for a store that is already set up.
 */
export function useGettingStarted(): {
  visible: boolean;
  progress: GettingStartedProgress;
  dismiss: () => void;
} {
  const { getAllProductsQuery } = useProducts();
  const { data: hasSales, isSuccess: salesLoaded } = useHasSales();
  const { data: customers, isSuccess: customersLoaded } = useCustomers('all');
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    loadGettingStartedDismissed().then((value) => {
      if (active) setDismissed(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const productCount = getAllProductsQuery.data?.length ?? 0;
  const customerCount = customers?.length ?? 0;

  const progress = useMemo(
    () =>
      deriveGettingStarted({
        productCount,
        hasSales: hasSales === true,
        customerCount,
      }),
    [productCount, hasSales, customerCount],
  );

  const loaded =
    getAllProductsQuery.isSuccess &&
    salesLoaded &&
    customersLoaded &&
    dismissed !== null;
  const visible = loaded && shouldShowGettingStarted(progress, dismissed === true);

  const dismiss = useCallback(() => {
    setDismissed(true);
    void setGettingStartedDismissed();
  }, []);

  return { visible, progress, dismiss };
}
