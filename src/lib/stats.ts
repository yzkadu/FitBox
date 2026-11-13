import type { ActivityLog, CardioLog, Session, SetLog, WeeklySchedule } from '../types';

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

/** Séries (na ordem) do último treino finalizado em que esse exercício foi
 * feito — usado durante a execução do treino pra mostrar "como foi da última
 * vez" ao lado de cada série e permitir preencher rápido. Retorna null se o
 * exercício nunca foi registrado antes. */
export function getLastCompletedSets(sessions: Session[], exerciseId: string): SetLog[] | null {
  const finished = sessions
    .filter((s) => s.finishedAt)
    .sort((a, b) => Date.parse(b.finishedAt as string) - Date.parse(a.finishedAt as string));
  for (const s of finished) {
    const se = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!se) continue;
    const completedSets = se.sets.filter((st) => st.reps > 0).sort((a, b) => a.setNumber - b.setNumber);
    if (completedSets.length > 0) return completedSets;
  }
  return null;
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
  weekStart: string; // data local da segunda-feira, AAAA-MM-DD
  count: number; // dias distintos com atividade, não quantidade de sessões
}

/** Dia civil do usuário; nunca usar toISOString().slice(0,10) para registros locais. */
function localDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // domingo = 0
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Cardio, força, HYROX ou a combinação: um único dia ativo por data local.
 * Login sem registro não conta como atividade. Sessões incompletas não contam.
 */
export function getActiveTrainingDays(sessions: Session[], cardioLogs: CardioLog[], activityLogs: ActivityLog[] = []): Set<string> {
  const dates = new Set<string>();
  for (const session of sessions) {
    if (!session.finishedAt) continue;
    const completed = new Date(session.finishedAt);
    if (!Number.isNaN(completed.getTime())) dates.add(localDay(completed));
  }
  for (const log of cardioLogs) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(log.date) && Number.isFinite(log.durationMin) && log.durationMin > 0) {
      dates.add(log.date);
    }
  }
  for(const activity of activityLogs){
    if(/^\d{4}-\d{2}-\d{2}$/.test(activity.date) &&
       Number.isFinite(activity.durationMin) && activity.durationMin>0) dates.add(activity.date);
  }
  return dates;
}

/** Dias com ao menos uma atividade, por semana (segunda a domingo). */
export function getWeeklyFrequency(sessions: Session[], cardioLogs: CardioLog[] = [], weeks = 12, activityLogs: ActivityLog[] = []): WeeklyFrequencyPoint[] {
  const now = new Date();
  const buckets: WeeklyFrequencyPoint[] = [];
  const byWeek = new Map<string, WeeklyFrequencyPoint>();
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i * 7);
    const weekStart = localDay(startOfWeek(date));
    const bucket = { weekStart, count: 0 };
    buckets.push(bucket);
    byWeek.set(weekStart, bucket);
  }
  const today = localDay(now);
  for (const day of getActiveTrainingDays(sessions, cardioLogs, activityLogs)) {
    if (day > today) continue; // lançamento futuro não vira treino realizado
    const weekStart = localDay(startOfWeek(new Date(day + 'T12:00:00')));
    const bucket = byWeek.get(weekStart);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function getCurrentStreakWeeks(sessions: Session[], cardioLogs: CardioLog[] = [], activityLogs: ActivityLog[] = []): number {
  const frequency = getWeeklyFrequency(sessions, cardioLogs, 52, activityLogs);
  let count = 0;
  for (let i = frequency.length - 1; i >= 0; i--) {
    if (frequency[i].count === 0) break;
    count += 1;
  }
  return count;
}

/** Foguinho: sequência de dias consecutivos com atividade de qualquer modalidade.
 * Cada data conta no máximo uma vez. O dia atual fica em aberto até ser concluído:
 * se hoje ainda não houve atividade, uma sequência que terminou ontem continua
 * aparecendo. Dias sem registro no passado quebram a sequência — mesmo que estejam
 * marcados como descanso na agenda. A agenda não cria atividades fictícias.
 */
export function getCurrentStreakDays(
  sessions: Session[], cardioLogs: CardioLog[], _weeklySchedule?: WeeklySchedule, today = new Date(), activityLogs: ActivityLog[] = [],
): number {
  const activeDays = getActiveTrainingDays(sessions, cardioLogs, activityLogs);
  const cursor = new Date(today);
  cursor.setHours(12, 0, 0, 0); // mantém dia civil ao atravessar mudanças de horário
  if (!activeDays.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  for (let guard = 0; guard < 3650; guard++) {
    if (!activeDays.has(localDay(cursor))) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getTrainingDaysThisWeek(sessions: Session[], cardioLogs: CardioLog[], activityLogs: ActivityLog[] = []): number {
  return getWeeklyFrequency(sessions, cardioLogs, 1, activityLogs)[0]?.count ?? 0;
}

export function getTrainingDaysThisMonth(sessions: Session[], cardioLogs: CardioLog[], activityLogs: ActivityLog[] = []): number {
  const currentMonth = localDay(new Date()).slice(0, 7);
  const today = localDay(new Date());
  return [...getActiveTrainingDays(sessions, cardioLogs, activityLogs)]
    .filter(day => day.startsWith(currentMonth) && day <= today).length;
}

/** Início (segunda-feira, 00:00) da semana atual. */
function startOfCurrentWeek(): Date {
  return startOfWeek(new Date());
}

/** Quantos treinos de força foram concluídos na semana atual (seg–dom). */
export function getSessionsThisWeek(sessions: Session[]): number {
  const start = startOfCurrentWeek();
  return sessions.filter((s) => s.finishedAt && new Date(s.finishedAt) >= start).length;
}

/** Volume total (kg × reps, somando todas as séries concluídas) da semana atual. */
export function getVolumeThisWeek(sessions: Session[]): number {
  const start = startOfCurrentWeek();
  let volume = 0;
  for (const s of sessions) {
    if (!s.finishedAt || new Date(s.finishedAt) < start) continue;
    for (const se of s.exercises) {
      for (const st of se.sets) {
        if (st.reps > 0) volume += st.weight * st.reps;
      }
    }
  }
  return Math.round(volume);
}

/** Tempo total treinado (em minutos) na semana atual. */
export function getTrainingMinutesThisWeek(sessions: Session[], cardioLogs: CardioLog[] = [], activityLogs: ActivityLog[] = []): number {
  const start = startOfCurrentWeek();
  const today = localDay(new Date());
  let seconds = 0;
  for (const s of sessions) {
    if (!s.finishedAt || new Date(s.finishedAt) < start) continue;
    seconds += s.durationSeconds ?? 0;
  }
  for (const log of cardioLogs) {
    if (log.date >= localDay(start) && log.date <= today && Number.isFinite(log.durationMin) && log.durationMin > 0) {
      seconds += log.durationMin * 60;
    }
  }
  for(const activity of activityLogs){
    if(activity.date>=localDay(start) && activity.date<=today &&
       Number.isFinite(activity.durationMin) && activity.durationMin>0) seconds+=activity.durationMin*60;
  }
  return Math.round(seconds / 60);
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
