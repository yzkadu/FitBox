import type { CardioLog, DaySchedule, ScheduledActivity, Session, Weekday, WeeklySchedule, Workout } from '../types';
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

export function isScheduledActivityDone(activity: ScheduledActivity, sessions: Session[], cardioLogs: CardioLog[], date = new Date()): boolean {
  if (activity.kind === 'treino') {
    return sessions.some(s => s.workoutId === activity.workoutId && !!s.finishedAt && onLocalDay(s.finishedAt, date));
  }
  return cardioLogs.some(c => c.date === localIsoDate(date));
}

/** Mantido para usar com agendas legadas que armazenaram kind=combo. */
export function getCombinedTrainingProgress(
  schedule: Extract<DaySchedule, { kind: 'combo' }>,
  sessions: Session[],
  cardioLogs: CardioLog[],
  date = new Date(),
) {
  const activities = getActivitiesForDay(schedule);
  const cardioDone = isScheduledActivityDone(activities[0], sessions, cardioLogs, date);
  const strengthDone = isScheduledActivityDone(activities[1], sessions, cardioLogs, date);
  return { cardioDone, strengthDone, completed: cardioDone && strengthDone };
}

export function hasCompletedScheduledActivityToday(
  schedule: DaySchedule | undefined,
  sessions: Session[],
  cardioLogs: CardioLog[],
  date = new Date(),
): boolean {
  const activities = getActivitiesForDay(schedule);
  return activities.length > 0 && activities.every(a => isScheduledActivityDone(a, sessions, cardioLogs, date));
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
