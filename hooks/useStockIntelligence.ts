import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listReorderRecommendations,
  saveReorderPlan,
  deleteReorderPlan,
  getPalengkeRestockPlan,
} from '@/database/stock-intelligence';
import {
  sharePalengkeSheetPdf,
  sharePalengkeSheetText,
} from '@/lib/pdfGenerator';
import {
  PalengkeRestockFilter,
  PalengkeRestockPlan,
  SaveReorderPlanInput,
} from '@/types/stock-intelligence.types';

export const stockIntelligenceKeys = {
  all: ['stock-intelligence'] as const,
  recommendations: () =>
    [...stockIntelligenceKeys.all, 'recommendations'] as const,
  palengke: (filter: PalengkeRestockFilter) =>
    [...stockIntelligenceKeys.all, 'palengke', filter] as const,
};

export function useStockRecommendations() {
  return useQuery({
    queryKey: stockIntelligenceKeys.recommendations(),
    queryFn: () => listReorderRecommendations(),
  });
}

export function useSaveReorderPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveReorderPlanInput) => saveReorderPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockIntelligenceKeys.all });
    },
  });
}

export function useDeleteReorderPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => deleteReorderPlan(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockIntelligenceKeys.all });
    },
  });
}

export function usePalengkeRestockPlan(filter: PalengkeRestockFilter = {}) {
  return useQuery({
    queryKey: stockIntelligenceKeys.palengke(filter),
    queryFn: () => getPalengkeRestockPlan(filter),
  });
}

export type PalengkeExportFormat = 'pdf' | 'text';

export function useExportPalengkeSheet() {
  return useMutation({
    mutationFn: async (input: {
      plan: PalengkeRestockPlan;
      storeName: string;
      format: PalengkeExportFormat;
    }): Promise<boolean> =>
      input.format === 'pdf'
        ? sharePalengkeSheetPdf(input.plan, input.storeName)
        : sharePalengkeSheetText(input.plan, input.storeName),
  });
}
