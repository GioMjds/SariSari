import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listReorderRecommendations,
  saveReorderPlan,
  deleteReorderPlan,
} from '@/database/stock-intelligence';
import { SaveReorderPlanInput } from '@/types/stock-intelligence.types';

export const stockIntelligenceKeys = {
  all: ['stock-intelligence'] as const,
  recommendations: () =>
    [...stockIntelligenceKeys.all, 'recommendations'] as const,
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
