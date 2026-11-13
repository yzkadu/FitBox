import type {
  AppData,
  Workout,
  Session,
  Exercise,
  BodyMeasurement,
  BodyPhoto,
  CardioLog,
  ActivityLog,
  ActivityKind,
  WeeklySchedule,
  WeightGoal,
  NutritionGoal,
  NutritionEntry,
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
    activityLogs: [],
    weeklySchedule: {},
    weightGoal: null,
    nutritionGoal: null,
    nutritionEntries: [],
    activeSessionId: null,
  };
}

// Cache local por usuário: permite reabrir os últimos dados quando o servidor estiver indisponível.
// Fotos continuam no Supabase; não usamos localStorage para imagens grandes.
const CACHE_PREFIX = 'fitbox:snapshot:v1:';

function readLocalSnapshot(userId: string): AppData | null {
  try {
    const saved = localStorage.getItem(CACHE_PREFIX + userId);
    if (!saved) return null;
    const data = JSON.parse(saved) as AppData;
    if (!Array.isArray(data.workouts) || !Array.isArray(data.sessions) ||
        !Array.isArray(data.measurements) || !Array.isArray(data.cardioLogs) ||
        !data.weeklySchedule || typeof data.weeklySchedule !== 'object') return null;
    // Mesmo usando cache antigo, sempre mesclar o catálogo embutido mais recente.
    // Nunca depender da lista de exercícios que foi gravada na versão anterior.
    const builtInIds = new Set(BUILTIN_EXERCISES.map(ex => ex.id));
    const locallyCreated = Array.isArray(data.exercises)
      ? data.exercises.filter(ex => ex.custom && !builtInIds.has(ex.id))
      : [];
    return { ...emptyData(), ...data, activityLogs: Array.isArray(data.activityLogs) ? data.activityLogs : [], nutritionEntries: Array.isArray(data.nutritionEntries) ? data.nutritionEntries : [], nutritionGoal: data.nutritionGoal ?? null, photos: [], exercises: [...BUILTIN_EXERCISES, ...locallyCreated] };
  } catch {
    return null;
  }
}

function saveLocalSnapshot(userId: string, data: AppData) {
  try {
    // Backup leve para que imagens em base64 não esgotem o armazenamento local.
    const backup: AppData = {
      ...data,
      photos: [],
      sessions: data.sessions.map(({ proofPhotoDataUrl: _photo, ...rest }) => rest),
      cardioLogs: data.cardioLogs.map(({ proofPhotoDataUrl: _photo, ...rest }) => rest),
    };
    localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(backup));
  } catch (error) {
    console.warn('O navegador não permitiu atualizar a cópia local do FitBox:', error);
  }
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
    armLeftCm: (r.arm_left_cm as number) ?? undefined,
    armRightCm: (r.arm_right_cm as number) ?? undefined,
    thighLeftCm: (r.thigh_left_cm as number) ?? undefined,
    thighRightCm: (r.thigh_right_cm as number) ?? undefined,
    calfCm: (r.calf_cm as number) ?? undefined,
    calfLeftCm: (r.calf_left_cm as number) ?? undefined,
    calfRightCm: (r.calf_right_cm as number) ?? undefined,
    forearmLeftCm: (r.forearm_left_cm as number) ?? undefined,
    forearmRightCm: (r.forearm_right_cm as number) ?? undefined,
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

function rowToActivity(r: Record<string, unknown>): ActivityLog {
  return {
    id: String(r.id), date: String(r.date), kind: r.kind as ActivityKind,
    label: r.label == null ? undefined : String(r.label),
    durationMin: Number(r.duration_min),
    caloriesKcal: r.calories_kcal == null ? undefined : Number(r.calories_kcal),
    avgHeartRate: r.avg_heart_rate == null ? undefined : Number(r.avg_heart_rate),
    rpe: r.rpe == null ? undefined : Number(r.rpe),
    notes: r.notes == null ? undefined : String(r.notes),
  };
}

function rowToNutritionEntry(r: Record<string,unknown>): NutritionEntry {
  return {
    id: String(r.id), date: String(r.entry_date), label: String(r.label),
    caloriesKcal: Number(r.calories_kcal) || 0,
    proteinG: Number(r.protein_g) || 0,
    carbsG: Number(r.carbs_g) || 0,
    fatG: Number(r.fat_g) || 0,
  };
}
function rowToNutritionGoal(r: Record<string,unknown>): NutritionGoal {
  const kind = String(r.goal_kind);
  return {
    goalKind: kind === 'emagrecer'||kind === 'ganhar_massa' ? kind : 'manter',
    caloriesKcal: r.calories_kcal == null ? null : Number(r.calories_kcal),
    proteinG: Number(r.protein_g) || 0,
    carbsG: Number(r.carbs_g) || 0,
    fatG: Number(r.fat_g) || 0,
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
    if (this.userId) saveLocalSnapshot(this.userId, this.data);
    this.notify();
  }

  /** Limpa os dados em memória (logout). */
  clear() {
    this.userId = null;
    this.data = emptyData();
    this.notify();
  }

  /** Carrega todos os dados do usuário logado a partir do Supabase. */
  async loadForUser(userId: string): Promise<{ fromCache: boolean }> {
    this.userId = userId;
    this.loading = true;
    const cached = readLocalSnapshot(userId);
    // Nunca mantém o snapshot de outra conta durante a troca de usuário.
    this.data = cached ?? emptyData();
    this.notify();

    const [workoutsRes, sessionsRes, customExRes, measurementsRes, photosRes, cardioRes, activityRes, scheduleRes, goalRes, nutritionGoalRes, nutritionEntriesRes] = await Promise.all([
      supabase.from('workouts').select('*').order('created_at', { ascending: true }),
      supabase.from('sessions').select('*').order('started_at', { ascending: true }),
      supabase.from('custom_exercises').select('*'),
      supabase.from('measurements').select('*').order('date', { ascending: true }),
      supabase.from('photos').select('*').order('date', { ascending: true }),
      supabase.from('cardio_logs').select('*').order('date', { ascending: true }),
      supabase.from('activity_logs').select('*').eq('user_id', userId).order('date', { ascending: true }),
      supabase.from('weekly_schedule').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('weight_goal').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('nutrition_goals').select('*').eq('user_id', userId).maybeSingle(),
      // Supabase limita o número de linhas por requisição; buscar em páginas evita
      // ocultar silenciosamente registros antigos de quem registra várias refeições por dia.
      (async () => {
        const allRows: Record<string, unknown>[] = [];
        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
          const page = await supabase.from('nutrition_entries')
            .select('*').eq('user_id', userId)
            .order('entry_date', { ascending: false })
            .order('id', { ascending: false })
            .range(offset, offset + pageSize - 1);
          if (page.error) return { data: null, error: page.error };
          const rows = (page.data ?? []) as Record<string, unknown>[];
          allRows.push(...rows);
          if (rows.length < pageSize) break;
        }
        return { data: allRows, error: null };
      })(),
    ]);

    const responses = [workoutsRes, sessionsRes, customExRes, measurementsRes, photosRes, cardioRes, activityRes, scheduleRes, goalRes, nutritionGoalRes, nutritionEntriesRes];
    const failures = responses.filter((res) => res.error);
    if (failures.length) {
      failures.forEach((res) => console.error('Falha ao carregar dados do FitBox:', res.error));
      this.loading = false;
      this.notify();
      if (cached) return { fromCache: true };
      // Não interprete falhas no banco como "conta vazia" e não crie templates de treino sobre dados desconhecidos.
      throw new Error('Não foi possível carregar seus dados. Verifique a conexão e tente novamente.');
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
      activityLogs: (activityRes.data ?? []).map(rowToActivity),
      weeklySchedule: (scheduleRes.data?.schedule as WeeklySchedule) ?? {},
      weightGoal: (goalRes.data?.goal as WeightGoal) ?? null,
      nutritionGoal: nutritionGoalRes.data ? rowToNutritionGoal(nutritionGoalRes.data) : null,
      nutritionEntries: (nutritionEntriesRes.data ?? []).map(rowToNutritionEntry),
      activeSessionId: (sessionsData.find((s) => !s.finished_at)?.id as string) ?? null,
    };
    saveLocalSnapshot(userId, this.data);
    this.loading = false;
    this.notify();
    return { fromCache: false };
  }
}

export const store = new Store();

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
