import { useSyncExternalStore } from 'react';
import { profileStore } from '../lib/profiles';

export function useProfiles() {
  return useSyncExternalStore(profileStore.subscribe, profileStore.getSnapshot, profileStore.getSnapshot);
}
