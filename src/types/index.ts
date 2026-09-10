// Domain types for FitBox

export type MuscleGroup =
  | 'peito'
  | 'costas'
  | 'ombro'
  | 'biceps'
  | 'triceps'
  | 'perna'
  | 'gluteo'
  | 'abdomen'
  | 'cardio'
  | 'outro';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  /** true if user-created (not from the built-in catalog) */
  custom?: boolean;
}

/** A single planned exercise entry inside a Workout template */
export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  targetSets: number;
  targetReps: string; // e.g. "8-12" or "10"
  restSeconds?: number;
  notes?: string;
  order: number;
}

/** A workout template the user builds ahead of time (e.g. "Treino A - Peito/Tríceps") */
export interface Workout {
  id: string;
  name: string;
  emoji?: string;
  exercises: WorkoutExercise[];
  createdAt: string; // ISO
  archived?: boolean;
}

/** One logged set during a workout session */
export interface SetLog {
  id: string;
  setNumber: number;
  weight: number; // kg
  reps: number;
  rpe?: number; // 1-10 perceived effort, optional
  completed: boolean;
}

/** Log for one exercise within a session */
export interface SessionExercise {
  id: string;
  exerciseId: string;
  sets: SetLog[];
  notes?: string;
}

/** A completed (or in-progress) workout session, derived from a Workout template */
export interface Session {
  id: string;
  workoutId: string | null; // null if ad-hoc / template deleted
  workoutName: string; // snapshot of name at time of session
  startedAt: string; // ISO
  finishedAt: string | null; // ISO, null while in progress
  exercises: SessionExercise[];
  durationSeconds?: number;
  /** Esforço percebido (0-10) que a pessoa indica ao concluir o treino do dia */
  rpe?: number;
  /** Foto opcional (ex: relógio/tracker mostrando o treino) como prova de constância */
  proofPhotoDataUrl?: string;
}

export interface BodyMeasurement {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  weightKg?: number;
  bodyFatPct?: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  armCm?: number;
  thighCm?: number;
  calfCm?: number;
  notes?: string;
}

export interface BodyPhoto {
  id: string;
  date: string; // ISO date
  dataUrl: string; // base64 image stored locally
  label?: 'frente' | 'lado' | 'costas' | 'outro';
}

export type CardioActivityType = 'corrida' | 'bike';

/** Uma atividade de cardio registrada manualmente (estilo Strava/Apple Fitness) */
export interface CardioLog {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  type: CardioActivityType;
  durationMin: number;
  distanceKm?: number;
  avgHeartRate?: number;
  rpe?: number; // 1-10 sensação de esforço
  notes?: string;
  /** Foto opcional (ex: relógio/tracker mostrando a atividade) como prova de constância */
  proofPhotoDataUrl?: string;
}

export type Weekday = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export const WEEKDAY_ORDER: Weekday[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
  dom: 'Domingo',
};

/** O que fazer em um dia da semana: treinar (um Workout específico), cardio, ou descansar */
export type DaySchedule =
  | { kind: 'treino'; workoutId: string }
  | { kind: 'cardio'; suggestedDistanceKm?: number }
  | { kind: 'descanso' };

export type WeeklySchedule = Partial<Record<Weekday, DaySchedule>>;

/** Meta de perda de peso: quanto perder, em quanto tempo, a partir de quando. */
export interface WeightGoal {
  targetLossKg: number;
  targetWeeks: number;
  startWeightKg: number;
  startDate: string; // ISO date (yyyy-mm-dd)
}

/** Um perfil = uma pessoa usando o app neste dispositivo. Cada perfil tem seus próprios dados. */
export interface Profile {
  id: string;
  name: string;
  emoji?: string;
  createdAt: string; // ISO
}

export interface AppData {
  exercises: Exercise[];
  workouts: Workout[];
  sessions: Session[];
  measurements: BodyMeasurement[];
  photos: BodyPhoto[];
  cardioLogs: CardioLog[];
  weeklySchedule: WeeklySchedule;
  weightGoal: WeightGoal | null;
  activeSessionId: string | null;
}
