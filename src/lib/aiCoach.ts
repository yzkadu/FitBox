// Cliente do Personal Trainer virtual v2 (IA generativa via /api/coach).
// A chamada de rede vai pro endpoint serverless do próprio FitBox, que é quem
// de fato conversa com a Anthropic — o navegador nunca vê a chave da API.

import { supabase } from './supabaseClient';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class AiCoachError extends Error {}

export async function askAiCoach(question: string, context: string, history: AiChatMessage[]): Promise<string> {
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
  return data.reply as string;
}
