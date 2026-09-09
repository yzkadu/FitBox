import type { Session, SetLog } from '../types';

export interface ExerciseHistoryPoint {
  date: string; // ISO
  sessionId: string;
  maxWeight: number;
  bestSet: SetLog | null;
  volume: number; // sum(weight*reps) for that exercise in that session
  totalReps: number;
}

/** Returns, per session, the performance of a given exercise, sorted oldest -> newest. */
export function getExerciseHistory(sessions: Session[], exerciseId: string): ExerciseHistoryPoint[] {
  const finished = sessions.filter((s) => s.finishedAt);
  const points: ExerciseHistoryPoint[] = [];
  for (const s of finished) {
    for (const se of s.exercises) {
      if (se.exerciseId !== exerciseId) continue;
      const completedSets = se.sets.filter((st) => st.reps > 0);
      if (completedSets.length === 0) continue;
      const maxWeight = Math.max(...completedSets.map((st) => st.weight));
      const bestSet =
        completedSets.slice().sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0] ?? null;
      const volume = completedSets.reduce((sum, st) => sum + st.weight * st.reps, 0);
      const totalReps = completedSets.reduce((sum, st) => sum + st.reps, 0);
      points.push({
        date: s.finishedAt as string,
        sessionId: s.id,
        maxWeight,
        bestSet,
        volume,
        totalReps,
      });
    }
  }
  return points.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

export interface PersonalRecord {
  exerciseId: string;
  maxWeight: number;
  maxWeightReps: number;
  maxWeightDate: string;
  maxVolumeSession: number;
  maxVolumeDate: string;
  estimated1RM: number;
}

/** Epley formula estimated 1-rep max */
function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

export function getPersonalRecord(sessions: Session[], exerciseId: string): PersonalRecord | null {
  const history = getExerciseHistory(sessions, exerciseId);
  if (history.length === 0) return null;

  let best = history[0];
  let bestEst = epley1RM(best.bestSet?.weight ?? 0, best.bestSet?.reps ?? 0);
  let bestVolPoint = history[0];

  for (const p of history) {
    const est = epley1RM(p.bestSet?.weight ?? 0, p.bestSet?.reps ?? 0);
    if (p.maxWeight > best.maxWeight) best = p;
    if (est > bestEst) bestEst = est;
    if (p.volume > bestVolPoint.volume) bestVolPoint = p;
  }

  return {
    exerciseId,
    maxWeight: best.maxWeight,
    maxWeightReps: best.bestSet?.reps ?? 0,
    maxWeightDate: best.date,
    maxVolumeSession: bestVolPoint.volume,
    maxVolumeDate: bestVolPoint.date,
    estimated1RM: Math.round(bestEst * 10) / 10,
  };
}

/** All exercise ids that have at least one completed set across sessions */
export function getTrainedExerciseIds(sessions: Session[]): string[] {
  const ids = new Set<string>();
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    for (const se of s.exercises) {
      if (se.sets.some((st) => st.reps > 0)) ids.add(se.exerciseId);
    }
  }
  return Array.from(ids);
}

export interface WeeklyFrequencyPoint {
  weekStart: string; // ISO date (Monday)
  count: number;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // move to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Number of finished sessions per ISO week, for the last N weeks (oldest first). */
export function getWeeklyFrequency(sessions: Session[], weeks = 12): WeeklyFrequencyPoint[] {
  const finished = sessions.filter((s) => s.finishedAt);
  const now = new Date();
  const buckets: WeeklyFrequencyPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekDate = new Date(now);
    weekDate.setDate(now.getDate() - i * 7);
    const ws = startOfWeek(weekDate);
    buckets.push({ weekStart: ws.toISOString().slice(0, 10), count: 0 });
  }
  for (const s of finished) {
    const ws = startOfWeek(new Date(s.finishedAt as string)).toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.weekStart === ws);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function getCurrentStreakWeeks(sessions: Session[]): number {
  const freq = getWeeklyFrequency(sessions, 52);
  let streak = 0;
  for (let i = freq.length - 1; i >= 0; i--) {
    if (freq[i].count > 0) streak += 1;
    else break;
  }
  return streak;
}

export function getTotalSessionsThisMonth(sessions: Session[]): number {
  const now = new Date();
  return sessions.filter((s) => {
    if (!s.finishedAt) return false;
    const d = new Date(s.finishedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

/**
 * Compares the most recent session for an exercise to the one before it,
 * classifying trend for a simple "evolução ou estagnação" signal.
 */
export type TrendDirection = 'up' | 'down' | 'flat' | 'unknown';

export function getExerciseTrend(sessions: Session[], exerciseId: string): TrendDirection {
  const history = getExerciseHistory(sessions, exerciseId);
  if (history.length < 2) return 'unknown';
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const lastScore = epley1RM(last.bestSet?.weight ?? 0, last.bestSet?.reps ?? 0);
  const prevScore = epley1RM(prev.bestSet?.weight ?? 0, prev.bestSet?.reps ?? 0);
  if (lastScore > prevScore * 1.01) return 'up';
  if (lastScore < prevScore * 0.99) return 'down';
  return 'flat';
}
