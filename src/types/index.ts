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

export interface AppData {
  exercises: Exercise[];
  workouts: Workout[];
  sessions: Session[];
  measurements: BodyMeasurement[];
  photos: BodyPhoto[];
  activeSessionId: string | null;
}
