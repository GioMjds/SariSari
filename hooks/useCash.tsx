import {
  closeSession,
  deleteCashEntry,
  getCashSessionSummary,
  getCurrentSession,
  insertCashEntry,
  listCashEntries,
  listCashSessions,
  openSession,
} from '@/database/cash';
import { NewCashEntry } from '@/types/cash.types';
import { Pesos } from '@/lib/money';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    mutationFn: (openingCash: Pesos) => openSession(openingCash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
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
      actualCash: Pesos;
    }) => closeSession(sessionId, actualCash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
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
