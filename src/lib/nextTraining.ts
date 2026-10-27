import type { CardioLog, DaySchedule, Session, Weekday, WeeklySchedule, Workout } from '../types';
import { WEEKDAY_ORDER } from '../types';

export type NextScheduledTraining =
  | { kind: 'treino'; weekday: Weekday; daysUntil: number; workout: Workout }
  | { kind: 'cardio'; weekday: Weekday; daysUntil: number; label?: string }
  | { kind: 'combo'; weekday: Weekday; daysUntil: number; label?: string; workout: Workout };

export function localIsoDate(date: Date): string {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}

function onLocalDay(iso: string, date: Date): boolean {
  const parsed = new Date(iso);
  return !Number.isNaN(parsed.getTime()) && localIsoDate(parsed) === localIsoDate(date);
}

export interface CombinedTrainingProgress {
  cardioDone: boolean;
  strengthDone: boolean;
  completed: boolean;
}

/** Combina uma corrida efetivamente registrada e a ficha correta finalizada no
 * dia, em vez de contar um treino alheio como conclusão da agenda.
 */
export function getCombinedTrainingProgress(
  schedule: Extract<DaySchedule, {kind: 'combo'}>,
  sessions: Session[],
  cardioLogs: CardioLog[],
  date = new Date(),
): CombinedTrainingProgress {
  const iso = localIsoDate(date);
  const cardioDone = cardioLogs.some(c => c.date === iso && c.type === 'corrida');
  const strengthDone = sessions.some(s => s.workoutId === schedule.workoutId &&
    s.finishedAt && onLocalDay(s.finishedAt, date));
  return { cardioDone, strengthDone, completed: cardioDone && strengthDone };
}

export function hasCompletedScheduledActivityToday(
  schedule: DaySchedule | undefined,
  sessions: Session[],
  cardioLogs: CardioLog[],
  today = new Date(),
): boolean {
  if (schedule?.kind === 'combo') {
    return getCombinedTrainingProgress(schedule, sessions, cardioLogs, today).completed;
  }
  if (schedule?.kind === 'treino') {
    return sessions.some(s => s.workoutId === schedule.workoutId &&
      s.finishedAt && onLocalDay(s.finishedAt, today));
  }
  if (schedule?.kind === 'cardio') {
    return cardioLogs.some(entry => entry.date === localIsoDate(today));
  }
  return false;
}

export function findNextScheduledTraining(
  schedule: WeeklySchedule,
  workouts: Workout[],
  today = new Date(),
): NextScheduledTraining | null {
  for (let daysUntil = 1; daysUntil <= 7; daysUntil++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntil);
    const weekday = WEEKDAY_ORDER[(day.getDay()+6)%7];
    const planned = schedule[weekday];
    if (planned?.kind === 'cardio') {
      return { kind: 'cardio', weekday, daysUntil, label: planned.label };
    }
    if (planned?.kind === 'treino' || planned?.kind === 'combo') {
      const workout = workouts.find(w => w.id === planned.workoutId && !w.archived);
      if (workout) {
        return planned.kind === 'combo'
          ? { kind: 'combo', weekday, daysUntil, label: planned.label, workout }
          : { kind: 'treino', weekday, daysUntil, workout };
      }
    }
  }
  return null;
}
