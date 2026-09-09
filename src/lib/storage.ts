import type { AppData } from '../types';
import { BUILTIN_EXERCISES } from './exercises';

const STORAGE_KEY = 'fitbox.data.v1';

function emptyData(): AppData {
  return {
    exercises: [...BUILTIN_EXERCISES],
    workouts: [],
    sessions: [],
    measurements: [],
    photos: [],
    activeSessionId: null,
  };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
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
      activeSessionId: parsed.activeSessionId ?? null,
    };
  } catch (e) {
    console.error('Falha ao carregar dados do FitBox, iniciando vazio.', e);
    return emptyData();
  }
}

function save(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Falha ao salvar dados do FitBox.', e);
  }
}

type Listener = (data: AppData) => void;

class Store {
  private data: AppData;
  private listeners = new Set<Listener>();

  constructor() {
    this.data = load();
  }

  getSnapshot = (): AppData => this.data;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  update(updater: (draft: AppData) => AppData | void) {
    const draft = structuredClone(this.data);
    const result = updater(draft);
    this.data = result ?? draft;
    save(this.data);
    this.listeners.forEach((l) => l(this.data));
  }

  /** Wipe all data (used by settings/export screens if needed later) */
  reset() {
    this.data = emptyData();
    save(this.data);
    this.listeners.forEach((l) => l(this.data));
  }

  exportJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importJson(json: string) {
    const parsed = JSON.parse(json) as AppData;
    this.data = parsed;
    save(this.data);
    this.listeners.forEach((l) => l(this.data));
  }
}

export const store = new Store();

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
