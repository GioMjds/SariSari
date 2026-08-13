import { useInfiniteQuery } from '@tanstack/react-query';
import { getCorrectionsReport } from '@/database/corrections';
import type { SaleCorrectionReportRow } from '@/types/corrections.types';

export {
  useVoidSale,
  useRefundSale,
  useCorrectSalePrice,
  useSaleCorrections,
} from './useSales';

export const useCorrectionsReport = (
  opts: {
    limit?: number;
  } = {},
) => {
  const limit = opts.limit ?? 50;
  return useInfiniteQuery<
    { items: SaleCorrectionReportRow[]; nextCursor: number | null },
    Error
  >({
    queryKey: ['sale-corrections', 'report', limit],
    queryFn: ({ pageParam }) =>
      getCorrectionsReport({
        limit,
        cursor: typeof pageParam === 'number' ? pageParam : undefined,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
};
