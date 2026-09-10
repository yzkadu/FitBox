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

export interface AiCoachResponse {
  reply: string;
  proposal: ScheduleProposal | null;
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
  return { reply: data.reply as string, proposal: (data.proposal as ScheduleProposal | null) ?? null };
}
