import { useSyncExternalStore } from 'react';
import { store } from '../lib/storage';
import type { AppData } from '../types';

/** Reactive hook giving read access to the whole app data store. */
export function useAppData(): AppData {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
