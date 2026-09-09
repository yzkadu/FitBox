import type { AppData } from '../types';
import { BUILTIN_EXERCISES } from './exercises';

const LEGACY_STORAGE_KEY = 'fitbox.data.v1'; // pré-perfis, mantido só para migração
export const PROFILES_KEY = 'fitbox.profiles.v1';

export function dataKeyFor(profileId: string): string {
  return `fitbox.data.v1.${profileId}`;
}

export function emptyData(): AppData {
  return {
    exercises: [...BUILTIN_EXERCISES],
    workouts: [],
    sessions: [],
    measurements: [],
    photos: [],
    cardioLogs: [],
    weeklySchedule: {},
    activeSessionId: null,
  };
}

function normalize(parsed: Partial<AppData>): AppData {
  const base = emptyData();
  // Merge built-in exercises with any user additions already saved
  const savedExercises = parsed.exercises ?? [];
  const savedIds = new Set(savedExercises.map((e) => e.id));
  const merged = [...savedExercises, ...base.exercises.filter((e) => !savedIds.has(e.id))];
  return {
    exercises: merged,
    workouts: parsed.workouts ?? [],
    sessions: parsed.sessions ?? [],
    measurements: parsed.measurements ?? [],
    photos: parsed.photos ?? [],
    cardioLogs: parsed.cardioLogs ?? [],
    weeklySchedule: parsed.weeklySchedule ?? {},
    activeSessionId: parsed.activeSessionId ?? null,
  };
}

function load(profileId: string): AppData {
  try {
    const raw = localStorage.getItem(dataKeyFor(profileId));
    if (!raw) return emptyData();
    return normalize(JSON.parse(raw) as Partial<AppData>);
  } catch (e) {
    console.error('Falha ao carregar dados do FitBox, iniciando vazio.', e);
    return emptyData();
  }
}

function save(profileId: string, data: AppData) {
  try {
    localStorage.setItem(dataKeyFor(profileId), JSON.stringify(data));
  } catch (e) {
    console.error('Falha ao salvar dados do FitBox.', e);
  }
}

/** Dados legados (de antes dos perfis existirem), se houver. Usado só para migração. */
export function readLegacyData(): AppData | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw) as Partial<AppData>);
  } catch {
    return null;
  }
}

export function clearLegacyData() {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

type Listener = (data: AppData) => void;

class Store {
  private data: AppData = emptyData();
  private profileId: string | null = null;
  private listeners = new Set<Listener>();

  getSnapshot = (): AppData => this.data;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify() {
    this.listeners.forEach((l) => l(this.data));
  }

  /** Carrega (ou troca para) os dados de um perfil específico. */
  loadProfile(profileId: string) {
    this.profileId = profileId;
    this.data = load(profileId);
    this.notify();
  }

  /** Usa dados já prontos (ex: migração de dados legados) para o perfil ativo. */
  hydrate(data: AppData) {
    if (!this.profileId) return;
    this.data = data;
    save(this.profileId, this.data);
    this.notify();
  }

  update(updater: (draft: AppData) => AppData | void) {
    if (!this.profileId) {
      console.warn('Tentativa de atualizar dados sem um perfil ativo.');
      return;
    }
    const draft = structuredClone(this.data);
    const result = updater(draft);
    this.data = result ?? draft;
    save(this.profileId, this.data);
    this.notify();
  }

  exportJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importJson(json: string) {
    if (!this.profileId) return;
    const parsed = normalize(JSON.parse(json) as Partial<AppData>);
    this.data = parsed;
    save(this.profileId, this.data);
    this.notify();
  }
}

export const store = new Store();

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
