import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActiveSession,
  getSessionById,
  listCounts,
  listRecentSessions,
  startSession,
  upsertCount,
  commitSession,
  abandonSession,
} from '@/database/stocktake';
import type {
  UpsertCountInput,
  CommitReasonPerLine,
  StocktakeCount,
} from '@/types/stocktake.types';
import { inventoryKeys } from './useInventory';

export const stocktakeKeys = {
  all: ['stocktake'] as const,
  active: () => [...stocktakeKeys.all, 'active'] as const,
  session: (id: string) => [...stocktakeKeys.all, 'session', id] as const,
  counts: (sessionId: string) =>
    [...stocktakeKeys.all, 'counts', sessionId] as const,
  history: () => [...stocktakeKeys.all, 'history'] as const,
};

export function useActiveStocktakeSession() {
  return useQuery({
    queryKey: stocktakeKeys.active(),
    queryFn: () => getActiveSession(),
  });
}

export function useStocktakeSession(id: string | null) {
  return useQuery({
    queryKey: id ? stocktakeKeys.session(id) : ['stocktake', 'none'],
    queryFn: () => (id ? getSessionById(id) : null),
    enabled: Boolean(id),
  });
}

export function useStocktakeCounts(sessionId: string | null) {
  return useQuery({
    queryKey: sessionId
      ? stocktakeKeys.counts(sessionId)
      : ['stocktake', 'counts', 'none'],
    queryFn: () => (sessionId ? listCounts(sessionId) : []),
    enabled: Boolean(sessionId),
  });
}

export function useRecentStocktakeSessions(limit = 20) {
  return useQuery({
    queryKey: stocktakeKeys.history(),
    queryFn: () => listRecentSessions(limit),
  });
}

export function useStartStocktake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => startSession(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.all });
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.history() });
    },
  });
}

export function useUpsertStocktakeCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertCountInput) => upsertCount(input),
    onMutate: async (input) => {
      const key = stocktakeKeys.counts(input.sessionId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<StocktakeCount[]>(key);

      if (previous) {
        const updated = [...previous];
        const idx = updated.findIndex((x) => x.productId === input.productId);
        if (idx >= 0 && updated[idx]) {
          updated[idx] = {
            ...updated[idx],
            countedQty: input.countedQty,
          };
        }
        queryClient.setQueryData(key, updated);
      }

      return { previous };
    },
    onError: (_err, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          stocktakeKeys.counts(input.sessionId),
          context.previous,
        );
      }
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({
        queryKey: stocktakeKeys.counts(input.sessionId),
      });
    },
  });
}

export function useCommitStocktake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      reasonPerLine,
    }: {
      sessionId: string;
      reasonPerLine: CommitReasonPerLine;
    }) => commitSession(sessionId, reasonPerLine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.all });
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.history() });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useAbandonStocktake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => abandonSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.all });
    },
  });
}

export function useStocktakeGuard(): {
  isActive: boolean;
  reason: string | null;
} {
  const { data: activeSession } = useActiveStocktakeSession();
  const isActive = Boolean(activeSession);
  return {
    isActive,
    reason: isActive
      ? 'Stocktake in progress — manual stock changes are paused.'
      : null,
  };
}
