import type {
  AppData,
  Workout,
  Session,
  Exercise,
  BodyMeasurement,
  BodyPhoto,
  CardioLog,
  WeeklySchedule,
} from '../types';
import { BUILTIN_EXERCISES } from './exercises';
import { supabase } from './supabaseClient';

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

// ---------- Conversores linha do banco (snake_case) <-> objeto do app (camelCase) ----------

function rowToWorkout(r: Record<string, unknown>): Workout {
  return {
    id: r.id as string,
    name: r.name as string,
    emoji: (r.emoji as string) ?? undefined,
    exercises: (r.exercises as Workout['exercises']) ?? [],
    createdAt: r.created_at as string,
    archived: (r.archived as boolean) ?? false,
  };
}

function rowToSession(r: Record<string, unknown>): Session {
  return {
    id: r.id as string,
    workoutId: (r.workout_id as string) ?? null,
    workoutName: r.workout_name as string,
    startedAt: r.started_at as string,
    finishedAt: (r.finished_at as string) ?? null,
    exercises: (r.exercises as Session['exercises']) ?? [],
    durationSeconds: (r.duration_seconds as number) ?? undefined,
    rpe: (r.rpe as number) ?? undefined,
    proofPhotoDataUrl: (r.proof_photo_data_url as string) ?? undefined,
  };
}

function rowToCustomExercise(r: Record<string, unknown>): Exercise {
  return { id: r.id as string, name: r.name as string, muscleGroup: r.muscle_group as Exercise['muscleGroup'], custom: true };
}

function rowToMeasurement(r: Record<string, unknown>): BodyMeasurement {
  return {
    id: r.id as string,
    date: r.date as string,
    weightKg: (r.weight_kg as number) ?? undefined,
    bodyFatPct: (r.body_fat_pct as number) ?? undefined,
    chestCm: (r.chest_cm as number) ?? undefined,
    waistCm: (r.waist_cm as number) ?? undefined,
    hipCm: (r.hip_cm as number) ?? undefined,
    armCm: (r.arm_cm as number) ?? undefined,
    thighCm: (r.thigh_cm as number) ?? undefined,
    calfCm: (r.calf_cm as number) ?? undefined,
    notes: (r.notes as string) ?? undefined,
  };
}

function rowToPhoto(r: Record<string, unknown>): BodyPhoto {
  return { id: r.id as string, date: r.date as string, dataUrl: r.data_url as string, label: (r.label as BodyPhoto['label']) ?? undefined };
}

function rowToCardio(r: Record<string, unknown>): CardioLog {
  return {
    id: r.id as string,
    date: r.date as string,
    type: r.type as CardioLog['type'],
    durationMin: Number(r.duration_min),
    distanceKm: r.distance_km != null ? Number(r.distance_km) : undefined,
    avgHeartRate: r.avg_heart_rate != null ? Number(r.avg_heart_rate) : undefined,
    rpe: r.rpe != null ? Number(r.rpe) : undefined,
    notes: (r.notes as string) ?? undefined,
    proofPhotoDataUrl: (r.proof_photo_data_url as string) ?? undefined,
  };
}

type Listener = (data: AppData) => void;

class Store {
  private data: AppData = emptyData();
  private userId: string | null = null;
  private listeners = new Set<Listener>();
  loading = false;

  getSnapshot = (): AppData => this.data;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify() {
    this.listeners.forEach((l) => l(this.data));
  }

  getUserId(): string | null {
    return this.userId;
  }

  isLoading(): boolean {
    return this.loading;
  }

  /** Mutação local otimista (o componente vê o resultado na hora); quem chama é
   * responsável por também persistir a mudança no Supabase (ver actions.ts). */
  update(mutator: (draft: AppData) => AppData | void) {
    const draft = structuredClone(this.data);
    const result = mutator(draft);
    this.data = result ?? draft;
    this.notify();
  }

  /** Limpa os dados em memória (logout). */
  clear() {
    this.userId = null;
    this.data = emptyData();
    this.notify();
  }

  /** Carrega todos os dados do usuário logado a partir do Supabase. */
  async loadForUser(userId: string) {
    this.userId = userId;
    this.loading = true;
    this.notify();

    const [workoutsRes, sessionsRes, customExRes, measurementsRes, photosRes, cardioRes, scheduleRes] = await Promise.all([
      supabase.from('workouts').select('*').order('created_at', { ascending: true }),
      supabase.from('sessions').select('*').order('started_at', { ascending: true }),
      supabase.from('custom_exercises').select('*'),
      supabase.from('measurements').select('*').order('date', { ascending: true }),
      supabase.from('photos').select('*').order('date', { ascending: true }),
      supabase.from('cardio_logs').select('*').order('date', { ascending: true }),
      supabase.from('weekly_schedule').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    for (const res of [workoutsRes, sessionsRes, customExRes, measurementsRes, photosRes, cardioRes, scheduleRes]) {
      if (res.error) console.error('Falha ao carregar dados do FitBox:', res.error);
    }

    const customExercises = (customExRes.data ?? []).map(rowToCustomExercise);
    const customIds = new Set(customExercises.map((e) => e.id));
    const sessionsData = sessionsRes.data ?? [];

    this.data = {
      exercises: [...customExercises, ...BUILTIN_EXERCISES.filter((e) => !customIds.has(e.id))],
      workouts: (workoutsRes.data ?? []).map(rowToWorkout),
      sessions: sessionsData.map(rowToSession),
      measurements: (measurementsRes.data ?? []).map(rowToMeasurement),
      photos: (photosRes.data ?? []).map(rowToPhoto),
      cardioLogs: (cardioRes.data ?? []).map(rowToCardio),
      weeklySchedule: (scheduleRes.data?.schedule as WeeklySchedule) ?? {},
      activeSessionId: (sessionsData.find((s) => !s.finished_at)?.id as string) ?? null,
    };
    this.loading = false;
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
