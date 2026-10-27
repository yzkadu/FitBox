import type { CardioLog, Session, Weekday, WeeklySchedule, Workout } from '../types';
import { WEEKDAY_ORDER } from '../types';

export type NextScheduledTraining =
  | { kind: 'treino'; weekday: Weekday; daysUntil: number; workout: Workout }
  | { kind: 'cardio'; weekday: Weekday; daysUntil: number; label?: string };

/** Compara datas no horário local do dispositivo, não em UTC. */
function onLocalDay(iso: string, date: Date): boolean {
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) &&
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate();
}

/** Treino só conta depois de concluído; cardio precisa estar registrado. */
export function hasCompletedScheduledActivityToday(
  schedule: WeeklySchedule[Weekday],
  sessions: Session[],
  cardioLogs: CardioLog[],
  today = new Date(),
): boolean {
  if (schedule?.kind === 'treino') {
    return sessions.some((s) => s.finishedAt && onLocalDay(s.finishedAt, today) &&
      (s.workoutId === schedule.workoutId || s.workoutId === null));
  }
  if (schedule?.kind === 'cardio') {
    const iso = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    return cardioLogs.some((entry) => entry.date === iso);
  }
  return false;
}

/** Procura o próximo dia ativo dos próximos sete dias, pulando descanso. */
export function findNextScheduledTraining(
  schedule: WeeklySchedule,
  workouts: Workout[],
  today = new Date(),
): NextScheduledTraining | null {
  for (let daysUntil = 1; daysUntil <= 7; daysUntil++) {
    // Criação de data local evita deslocamentos por mudanças de fuso/DST.
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntil);
    const weekday = WEEKDAY_ORDER[(day.getDay() + 6) % 7];
    const planned = schedule[weekday];
    if (planned?.kind === 'cardio') return { kind: 'cardio', weekday, daysUntil, label: planned.label };
    if (planned?.kind === 'treino') {
      const workout = workouts.find((w) => w.id === planned.workoutId && !w.archived);
      if (workout) return { kind: 'treino', weekday, daysUntil, workout };
    }
  }
  return null;
}
