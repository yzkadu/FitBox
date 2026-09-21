// Cliente do Personal Trainer virtual v2 (IA generativa via /api/coach).
// A chamada de rede vai pro endpoint serverless do próprio FitBox, que é quem
// de fato conversa com a Anthropic — o navegador nunca vê a chave da API.

import { supabase } from './supabaseClient';
import type { Weekday } from '../types';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Uma mudança de agenda proposta pela IA, pendente de confirmação da pessoa. */
export interface ScheduleChangeProposal {
  weekday: Weekday;
  kind: 'treino' | 'cardio' | 'descanso';
  workoutId?: string;
  suggestedDistanceKm?: number;
}

export interface ScheduleProposal {
  summary: string;
  changes: ScheduleChangeProposal[];
}

/** Um exercício sugerido pela IA pra um treino novo — referenciado só pelo
 * NOME (em português); o app resolve pro exercício real do catálogo (ou cria
 * um personalizado) na hora de aplicar, nunca antes. */
export interface NewWorkoutExerciseProposal {
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  notes?: string;
}

export interface NewWorkoutProposal {
  name: string;
  emoji?: string;
  exercises: NewWorkoutExerciseProposal[];
}

export type WorkoutEditAction = 'add' | 'remove' | 'replace' | 'update_sets';

/** Uma mudança pontual dentro de um treino já cadastrado. `entryId` é o id da
 * LINHA do exercício dentro do treino (necessário pra remove/replace/
 * update_sets); `exerciseName` é o nome em português do exercício a incluir
 * (necessário pra add/replace) — de novo, nunca um id inventado. */
export interface WorkoutEditChangeProposal {
  action: WorkoutEditAction;
  entryId?: string;
  exerciseName?: string;
  targetSets?: number;
  targetReps?: string;
}

export interface WorkoutEditProposal {
  workoutId: string;
  summary: string;
  changes: WorkoutEditChangeProposal[];
}

export type AiProposal =
  | { kind: 'schedule'; data: ScheduleProposal }
  | { kind: 'newWorkout'; data: NewWorkoutProposal }
  | { kind: 'workoutEdit'; data: WorkoutEditProposal };

export interface AiCoachResponse {
  reply: string;
  proposal: AiProposal | null;
}

export class AiCoachError extends Error {}

export async function askAiCoach(question: string, context: string, history: AiChatMessage[]): Promise<AiCoachResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new AiCoachError('Sessão expirada. Faça login de novo.');

  const res = await fetch('/api/coach', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question, context, history }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AiCoachError(data?.error || 'Não consegui falar com a IA agora.');
  }
  return { reply: data.reply as string, proposal: (data.proposal as AiProposal | null) ?? null };
}
