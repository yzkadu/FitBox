import type { ActivityLog, Session } from '../types';

/** Histórico único de sessões: mistura as duas origens SEM gravar sessões
 * artificiais no Supabase, evitando duplicar tempo, volume e estatísticas.
 */
export type SessionHistoryItem =
  | { kind: 'session'; id: string; timestamp: number; session: Session }
  | { kind: 'activity'; id: string; timestamp: number; activity: ActivityLog };

export function getSessionHistory(
  sessions: Session[],
  activityLogs: ActivityLog[],
): SessionHistoryItem[] {
  const completed = sessions
    .filter(s => !!s.finishedAt)
    .map(s => ({
      kind: 'session' as const, id: s.id,
      timestamp: Date.parse(s.finishedAt as string), session: s,
    }));
  const quick = activityLogs
    .filter(a => a.durationMin > 0)
    .map(a => ({
      kind: 'activity' as const, id: a.id,
      // Date-only representa um dia civil; meio-dia evita erro de fuso.
      timestamp: Date.parse(a.date + 'T12:00:00'), activity: a,
    }));
  return [...completed, ...quick]
    .filter(item => Number.isFinite(item.timestamp))
    .sort((a,b) => b.timestamp - a.timestamp);
}

export function quickActivityName(activity: ActivityLog): string {
  if (activity.label?.trim()) return activity.label;
  const names: Record<ActivityLog['kind'], string> = {
    hyrox: 'HYROX', funcional: 'Funcional', caminhada: 'Caminhada',
    musculacao: 'Musculação livre', cardio: 'Cardio livre',
    esporte: 'Esporte', mobilidade: 'Mobilidade', outro: 'Outra atividade',
  };
  return names[activity.kind] ?? 'Atividade';
}
