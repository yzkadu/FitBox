/**
 * Status visível das gravações assíncronas. Não afirma que o banco confirmou
 * mudanças apenas porque o estado otimista do React foi atualizado.
 * As falhas permanecem visíveis até uma nova tentativa ou logout.
 */
import { useSyncExternalStore } from 'react';

type Status = {pending: number; failed: number; lastError: string | null};
const waiting = new Set<string>();
const failures = new Map<string, { message: string; retry: () => Promise<void> }>();
const listeners = new Set<() => void>();
let snapshot: Status = {pending: 0, failed: 0, lastError: null};

function publish() {
  snapshot = {
    pending: waiting.size,
    failed: failures.size,
    lastError: [...failures.values()][0]?.message ?? null,
  };
  listeners.forEach(fn => fn());
}

export function beginSync(key: string) {
  waiting.add(key);
  // Não apagar aviso de falha até que uma nova gravação seja confirmada.
  publish();
}
export function syncSucceeded(key: string) {
  waiting.delete(key);
  failures.delete(key);
  publish();
}
export function syncFailed(key: string, message: string, retry: () => Promise<void>) {
  waiting.delete(key);
  failures.set(key, {message, retry});
  publish();
}
export async function retryFailedSync() {
  const jobs = [...failures.values()].map(job => job.retry);
  await Promise.allSettled(jobs.map(retry => retry()));
}
export function clearSyncStatus() {
  waiting.clear();
  failures.clear();
  publish();
}
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
const getSnapshot = () => snapshot;
export function useSyncStatus(): Status {
  return useSyncExternalStore(subscribe,getSnapshot,getSnapshot);
}
