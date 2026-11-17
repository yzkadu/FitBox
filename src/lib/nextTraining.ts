import type { ActivityLog, CardioLog, DaySchedule, ScheduledActivity, Session, Weekday, WeeklySchedule, Workout } from '../types';
import { WEEKDAY_ORDER } from '../types';

export type NextScheduledTraining =
  | { kind: 'treino'; weekday: Weekday; daysUntil: number; workout: Workout }
  | { kind: 'cardio'; weekday: Weekday; daysUntil: number; label?: string };

export function localIsoDate(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function onLocalDay(iso: string, date: Date): boolean {
  const value = new Date(iso);
  return !Number.isNaN(value.getTime()) && localIsoDate(value) === localIsoDate(date);
}

/** Converte agendas legadas em opções independentes (sem alterar dados antigos). */
export function getActivitiesForDay(schedule: DaySchedule | undefined): ScheduledActivity[] {
  if (!schedule || schedule.kind === 'descanso') return [];
  if (schedule.kind === 'multi') return schedule.activities;
  if (schedule.kind === 'treino') return [{ kind: 'treino', workoutId: schedule.workoutId }];
  if (schedule.kind === 'cardio') return [{ kind: 'cardio', label: schedule.label, suggestedDistanceKm: schedule.suggestedDistanceKm }];
  return [
    { kind: 'cardio', label: schedule.label, suggestedDistanceKm: schedule.suggestedDistanceKm, suggestedDurationMin: schedule.suggestedDurationMin },
    { kind: 'treino', workoutId: schedule.workoutId },
  ];
}

/** Normaliza só para identificação de modalidades, sem confiar em nomes parciais. */
function normalizeLabel(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

/** A categoria HYROX tem ficha variável e pode ser lançada sem exercícios.
 * Para fichas de força, o registro rápido precisa estar explicitamente
 * vinculado ao nome completo da ficha — nunca basta escrever "musculação".
 */
function quickMatchesWorkout(log: ActivityLog, workout: Workout): boolean {
  const title = normalizeLabel(workout.name);
  const linkedName = normalizeLabel(log.label ?? '');
  if (linkedName && linkedName === normalizeLabel(workout.name.slice(0, 80))) {
    return true;
  }
  return log.kind === 'hyrox' && /\bhyrox\b|\bhirox\b/.test(title);
}

/** Cardio genérico pode ser registrado rapidamente; dias especificamente HYROX
 * só são cumpridos por HYROX (não por corrida aleatória no mesmo dia).
 */
function quickMatchesCardio(log: ActivityLog, label?: string): boolean {
  const expected = normalizeLabel(label ?? '');
  const actual = normalizeLabel(log.label ?? '');
  if (actual && expected && actual === expected) return true;
  if (/\bhyrox\b|\bhirox\b/.test(expected)) return log.kind === 'hyrox';
  if (/\bcaminhad/.test(expected)) return log.kind === 'caminhada';
  if (/\bmobilidad|\balongamento/.test(expected)) return log.kind === 'mobilidade';
  return log.kind === 'cardio' || (log.kind === 'caminhada' &&
    (!expected || /\bcardio\b|\baerobico\b/.test(expected)));
}

/** Um registro rápido salvo é uma conclusão real, não precisa criar outra
 * sessão de força para aparecer como realizado na programação.
 */
export function isScheduledActivityDone(
  activity: ScheduledActivity,
  sessions: Session[],
  cardioLogs: CardioLog[],
  date = new Date(),
  activityLogs: ActivityLog[] = [],
  workouts: Workout[] = [],
): boolean {
  const day = localIsoDate(date);
  if (activity.kind === 'treino') {
    if (sessions.some(s => s.workoutId === activity.workoutId && !!s.finishedAt && onLocalDay(s.finishedAt, date))) {
      return true;
    }
    const workout = workouts.find(w => w.id === activity.workoutId && !w.archived);
    return !!workout && activityLogs.some(log =>
      log.date === day && log.durationMin > 0 && quickMatchesWorkout(log, workout));
  }
  // Cardios clássicos mantêm compatibilidade com registros existentes.
  const expected = normalizeLabel(activity.label ?? '');
  const isHyroxPlan = /\bhyrox\b|\bhirox\b/.test(expected);
  if (!isHyroxPlan && cardioLogs.some(c => c.date === day && c.durationMin > 0)) return true;
  return activityLogs.some(log =>
    log.date === day && log.durationMin > 0 && quickMatchesCardio(log, activity.label));
}

/** Mantém os formatos de agenda combo antigos, com atividades independentes. */
export function getCombinedTrainingProgress(
  schedule: Extract<DaySchedule, { kind: 'combo' }>,
  sessions: Session[],
  cardioLogs: CardioLog[],
  date = new Date(),
  activityLogs: ActivityLog[] = [],
  workouts: Workout[] = [],
) {
  const activities = getActivitiesForDay(schedule);
  const cardioDone = isScheduledActivityDone(activities[0], sessions, cardioLogs, date, activityLogs, workouts);
  const strengthDone = isScheduledActivityDone(activities[1], sessions, cardioLogs, date, activityLogs, workouts);
  return { cardioDone, strengthDone, completed: cardioDone && strengthDone };
}

export function hasCompletedScheduledActivityToday(
  schedule: DaySchedule | undefined,
  sessions: Session[],
  cardioLogs: CardioLog[],
  date = new Date(),
  activityLogs: ActivityLog[] = [],
  workouts: Workout[] = [],
): boolean {
  const activities = getActivitiesForDay(schedule);
  return activities.length > 0 && activities.every(a =>
    isScheduledActivityDone(a, sessions, cardioLogs, date, activityLogs, workouts));
}

/** Destaca a próxima atividade programada a partir de amanhã, pulando descanso. */
export function findNextScheduledTraining(
  schedule: WeeklySchedule,
  workouts: Workout[],
  today = new Date(),
): NextScheduledTraining | null {
  for (let daysUntil = 1; daysUntil <= 7; daysUntil++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntil);
    const weekday = WEEKDAY_ORDER[(day.getDay() + 6) % 7];
    for (const activity of getActivitiesForDay(schedule[weekday])) {
      if (activity.kind === 'cardio') return { kind: 'cardio', weekday, daysUntil, label: activity.label };
      const workout = workouts.find(w => w.id === activity.workoutId && !w.archived);
      if (workout) return { kind: 'treino', weekday, daysUntil, workout };
    }
  }
  return null;
}
