import type { Profile } from '../types';
import { store, uid, PROFILES_KEY, readLegacyData, clearLegacyData } from './storage';
import { applyProgramTemplate, type ProgramTemplateId } from './seedPrograms';

interface ProfilesState {
  profiles: Profile[];
  activeProfileId: string | null;
}

function load(): ProfilesState {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return { profiles: [], activeProfileId: null };
    const parsed = JSON.parse(raw) as Partial<ProfilesState>;
    return { profiles: parsed.profiles ?? [], activeProfileId: parsed.activeProfileId ?? null };
  } catch {
    return { profiles: [], activeProfileId: null };
  }
}

function save(state: ProfilesState) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Falha ao salvar perfis do FitBox.', e);
  }
}

type Listener = (state: ProfilesState) => void;

class ProfileStore {
  private state: ProfilesState;
  private listeners = new Set<Listener>();

  constructor() {
    this.state = load();
    this.migrateLegacyIfNeeded();
    if (this.state.activeProfileId) {
      store.loadProfile(this.state.activeProfileId);
    }
  }

  /** Se existirem dados de antes do sistema de perfis, cria um perfil "Você" com eles. */
  private migrateLegacyIfNeeded() {
    if (this.state.profiles.length > 0) return;
    const legacy = readLegacyData();
    if (!legacy) return;
    const profile: Profile = { id: uid(), name: 'Você', emoji: '💪', createdAt: new Date().toISOString() };
    this.state = { profiles: [profile], activeProfileId: profile.id };
    save(this.state);
    store.loadProfile(profile.id);
    store.hydrate(legacy);
    clearLegacyData();
  }

  getSnapshot = (): ProfilesState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  createProfile(name: string, emoji?: string, template?: ProgramTemplateId): Profile {
    const profile: Profile = { id: uid(), name, emoji, createdAt: new Date().toISOString() };
    this.state = { profiles: [...this.state.profiles, profile], activeProfileId: profile.id };
    save(this.state);
    store.loadProfile(profile.id);
    if (template) applyProgramTemplate(template);
    this.notify();
    return profile;
  }

  switchProfile(profileId: string) {
    if (!this.state.profiles.some((p) => p.id === profileId)) return;
    this.state = { ...this.state, activeProfileId: profileId };
    save(this.state);
    store.loadProfile(profileId);
    this.notify();
  }

  renameProfile(profileId: string, name: string, emoji?: string) {
    this.state = {
      ...this.state,
      profiles: this.state.profiles.map((p) => (p.id === profileId ? { ...p, name, emoji: emoji ?? p.emoji } : p)),
    };
    save(this.state);
    this.notify();
  }

  deleteProfile(profileId: string) {
    const remaining = this.state.profiles.filter((p) => p.id !== profileId);
    const wasActive = this.state.activeProfileId === profileId;
    const nextActive = wasActive ? (remaining[0]?.id ?? null) : this.state.activeProfileId;
    this.state = { profiles: remaining, activeProfileId: nextActive };
    save(this.state);
    localStorage.removeItem(`fitbox.data.v1.${profileId}`);
    if (wasActive && nextActive) store.loadProfile(nextActive);
    this.notify();
  }
}

export const profileStore = new ProfileStore();
