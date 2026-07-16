import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentSession,
  getCashSessionSummary,
  openSession,
  closeSession,
  insertCashEntry,
  deleteCashEntry,
  listCashSessions,
  listCashEntries,
} from '@/database/cash';
import { NewCashEntry } from '@/types/cash.types';

export const cashKeys = {
  all: ['cash'] as const,
  currentSession: () => [...cashKeys.all, 'current-session'] as const,
  summary: (sessionId: string) =>
    [...cashKeys.all, 'summary', sessionId] as const,
  sessions: () => [...cashKeys.all, 'sessions'] as const,
  entries: (sessionId: string) =>
    [...cashKeys.all, 'entries', sessionId] as const,
};

export function useCurrentSession() {
  return useQuery({
    queryKey: cashKeys.currentSession(),
    queryFn: () => getCurrentSession(),
  });
}

export function useCashSessionSummary(sessionId: string | undefined) {
  return useQuery({
    queryKey: cashKeys.summary(sessionId ?? ''),
    queryFn: () => getCashSessionSummary(sessionId!),
    enabled: !!sessionId,
  });
}

export function useOpenSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (openingCash: number) => openSession(openingCash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all });
    },
  });
}

export function useCloseSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      actualCash,
    }: {
      sessionId: string;
      actualCash: number;
    }) => closeSession(sessionId, actualCash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
    },
  });
}

export function useInsertCashEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      entry,
    }: {
      sessionId: string;
      entry: NewCashEntry;
    }) => insertCashEntry(sessionId, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteCashEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => deleteCashEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useCashSessions() {
  return useQuery({
    queryKey: cashKeys.sessions(),
    queryFn: () => listCashSessions(),
  });
}

export function useCashEntries(sessionId: string | undefined) {
  return useQuery({
    queryKey: cashKeys.entries(sessionId ?? ''),
    queryFn: () => listCashEntries(sessionId!),
    enabled: !!sessionId,
  });
}
