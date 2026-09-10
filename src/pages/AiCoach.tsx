import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Send, Sparkles, Check, X as XIcon, CalendarClock } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { setDaySchedule } from '../lib/actions';
import { buildCoachContext } from '../lib/aiCoachContext';
import { askAiCoach, AiCoachError, type AiChatMessage, type ScheduleProposal } from '../lib/aiCoach';
import { WEEKDAY_LABELS } from '../types';
import type { DaySchedule, Weekday, Workout } from '../types';

const SUGGESTIONS = [
  'Como está minha evolução esse mês?',
  'O que eu treino hoje e com que carga?',
  'Estou estagnada em algum exercício?',
  'Inclui natação no sábado no lugar do descanso',
];

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  proposal?: ScheduleProposal;
  proposalStatus?: 'pending' | 'applied' | 'discarded';
}

function describeChange(weekday: Weekday, kind: string, workoutId: string | undefined, suggestedDistanceKm: number | undefined, workouts: Workout[]): string {
  const dayLabel = WEEKDAY_LABELS[weekday];
  if (kind === 'treino') {
    const w = workouts.find((w) => w.id === workoutId);
    return `${dayLabel}: treino "${w?.name ?? '?'}"`;
  }
  if (kind === 'cardio') {
    return `${dayLabel}: cardio${suggestedDistanceKm ? ` (meta ${suggestedDistanceKm}km)` : ''}`;
  }
  return `${dayLabel}: descanso`;
}

export function AiCoach() {
  const navigate = useNavigate();
  const appData = useAppData();
  const { workouts } = appData;
  const { user } = useAuth();
  const profile = useProfile(user?.id);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setError(null);
    setInput('');
    const nextMessages: ChatEntry[] = [...messages, { role: 'user', content: q }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const context = buildCoachContext(appData, profile?.name);
      const history: AiChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
      const { reply, proposal } = await askAiCoach(q, context, history);
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: reply,
          proposal: proposal ?? undefined,
          proposalStatus: proposal ? 'pending' : undefined,
        },
      ]);
    } catch (err) {
      setError(err instanceof AiCoachError ? err.message : 'Não consegui falar com a IA agora. Tenta de novo.');
    } finally {
      setLoading(false);
    }
  }

  function applyProposal(index: number) {
    const entry = messages[index];
    if (!entry.proposal) return;
    for (const change of entry.proposal.changes) {
      if (change.kind === 'treino') {
        if (!change.workoutId || !workouts.some((w) => w.id === change.workoutId)) continue; // treino inválido, pula essa mudança
        setDaySchedule(change.weekday, { kind: 'treino', workoutId: change.workoutId });
      } else if (change.kind === 'cardio') {
        const schedule: DaySchedule = { kind: 'cardio' };
        if (change.suggestedDistanceKm) schedule.suggestedDistanceKm = change.suggestedDistanceKm;
        setDaySchedule(change.weekday, schedule);
      } else {
        setDaySchedule(change.weekday, { kind: 'descanso' });
      }
    }
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, proposalStatus: 'applied' } : m)));
  }

  function discardProposal(index: number) {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, proposalStatus: 'discarded' } : m)));
  }

  return (
    <div className="px-4 flex flex-col" style={{ minHeight: '100vh' }}>
      <div className="flex items-center gap-2 pt-5 pb-3">
        <button onClick={() => navigate('/')} className="p-1 -ml-1" style={{ color: 'var(--text-dim)' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-dim)' }}>
          <Bot size={16} style={{ color: 'var(--brand)' }} />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">Treinador IA</h1>
          <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
            Usa seus dados reais de treino — não é conselho médico
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 pb-3">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Pergunte qualquer coisa sobre seu treino, sua evolução, sua meta — ou peça pra mudar algo na sua agenda.
              Algumas ideias:
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left rounded-xl px-3 py-2.5 text-sm flex items-center gap-2"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                >
                  <Sparkles size={14} style={{ color: 'var(--brand)' }} className="shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap"
              style={
                m.role === 'user'
                  ? { background: 'var(--brand)', color: 'white', borderBottomRightRadius: 4 }
                  : { background: 'var(--surface-2)', color: 'var(--text)', borderBottomLeftRadius: 4 }
              }
            >
              {m.content}
            </div>

            {m.proposal && (
              <div className="max-w-[92%] w-full rounded-2xl px-3.5 py-3 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarClock size={15} style={{ color: 'var(--brand)' }} />
                  <p className="font-semibold text-xs" style={{ color: 'var(--brand)' }}>
                    Proposta de mudança na agenda
                  </p>
                </div>
                <ul className="flex flex-col gap-1 mb-3">
                  {m.proposal.changes.map((c, ci) => (
                    <li key={ci} className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      • {describeChange(c.weekday, c.kind, c.workoutId, c.suggestedDistanceKm, workouts)}
                    </li>
                  ))}
                </ul>
                {m.proposalStatus === 'applied' ? (
                  <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
                    <Check size={14} /> Aplicado na sua agenda
                  </p>
                ) : m.proposalStatus === 'discarded' ? (
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    Descartado
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyProposal(i)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-white"
                      style={{ background: 'var(--brand)' }}
                    >
                      <Check size={13} /> Aplicar
                    </button>
                    <button
                      onClick={() => discardProposal(i)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}
                    >
                      <XIcon size={13} /> Descartar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-3.5 py-2.5 text-sm"
              style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', borderBottomLeftRadius: 4 }}
            >
              Pensando…
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl px-3.5 py-2.5 text-sm" style={{ background: '#ef444426', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 flex items-center gap-2 py-3 safe-bottom"
        style={{ background: 'var(--bg)' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte ao treinador..."
          className="flex-1 rounded-xl px-3.5 py-3 text-sm"
          style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30"
          style={{ background: 'var(--brand)', color: 'white' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
