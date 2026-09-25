import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Send, Sparkles, Check, X as XIcon, CalendarClock, Dumbbell, ListChecks } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { applyScheduleProposal, applyNewWorkoutProposal, applyWorkoutEditProposal } from '../lib/aiProposalApply';
import { buildCoachContext } from '../lib/aiCoachContext';
import {
  askAiCoach,
  AiCoachError,
  type AiChatMessage,
  type AiProposal,
  type WorkoutEditChangeProposal,
} from '../lib/aiCoach';
import { WEEKDAY_LABELS } from '../types';
import type { Weekday, Workout } from '../types';

const SUGGESTIONS = [
  'Como está minha evolução esse mês?',
  'O que eu treino hoje e com que carga?',
  'Estou estagnada em algum exercício?',
  'Monta um treino de perna de 50 minutos',
];

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  proposal?: AiProposal;
  proposalStatus?: 'pending' | 'applied' | 'discarded';
  /** Preenchido depois de aplicar uma proposta de treino novo, pra oferecer "Ver treino". */
  appliedWorkoutId?: string;
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

const EDIT_ACTION_LABELS: Record<string, string> = {
  add: 'Adicionar',
  remove: 'Remover',
  replace: 'Trocar por',
  update_sets: 'Ajustar',
};

function describeWorkoutEditChange(change: WorkoutEditChangeProposal, workout: Workout | undefined): string {
  const label = EDIT_ACTION_LABELS[change.action] ?? change.action;
  const entryExists = !!(workout && change.entryId && workout.exercises.some((e) => e.id === change.entryId));
  const setsReps = change.targetSets || change.targetReps ? ` (${change.targetSets ?? '?'}x${change.targetReps ?? '?'})` : '';
  if (change.action === 'add') return `${label}: ${change.exerciseName ?? '?'}${setsReps}`;
  if (change.action === 'replace') return `${label} "${change.exerciseName ?? '?'}"${setsReps}`;
  if (change.action === 'remove') return `${label} exercício${entryExists ? '' : ' (não encontrado no treino)'}`;
  return `${label} exercício${setsReps}`;
}

export function AiCoach() {
  const navigate = useNavigate();
  const appData = useAppData();
  const { workouts, exercises } = appData;
  const { user } = useAuth();
  const [profile] = useProfile(user?.id);
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
    let appliedWorkoutId: string | undefined;
    if (entry.proposal.kind === 'schedule') {
      applyScheduleProposal(entry.proposal.data, workouts);
    } else if (entry.proposal.kind === 'newWorkout') {
      appliedWorkoutId = applyNewWorkoutProposal(entry.proposal.data, exercises);
    } else if (entry.proposal.kind === 'workoutEdit') {
      applyWorkoutEditProposal(entry.proposal.data, exercises);
    }
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, proposalStatus: 'applied', appliedWorkoutId } : m)));
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
              Pergunte qualquer coisa sobre seu treino, sua evolução, sua meta — ou peça pra criar ou mudar um treino.
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

        {messages.map((m, i) => {
          const proposal = m.proposal;
          const workoutForEdit = proposal?.kind === 'workoutEdit' ? workouts.find((w) => w.id === proposal.data.workoutId) : undefined;

          return (
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
                    {m.proposal.kind === 'schedule' && <CalendarClock size={15} style={{ color: 'var(--brand)' }} />}
                    {m.proposal.kind === 'newWorkout' && <Dumbbell size={15} style={{ color: 'var(--brand)' }} />}
                    {m.proposal.kind === 'workoutEdit' && <ListChecks size={15} style={{ color: 'var(--brand)' }} />}
                    <p className="font-semibold text-xs" style={{ color: 'var(--brand)' }}>
                      {m.proposal.kind === 'schedule' && 'Proposta de mudança na agenda'}
                      {m.proposal.kind === 'newWorkout' && `Proposta de treino novo: ${m.proposal.data.name}`}
                      {m.proposal.kind === 'workoutEdit' && `Proposta de edição${workoutForEdit ? `: "${workoutForEdit.name}"` : ''}`}
                    </p>
                  </div>

                  {m.proposal.kind === 'schedule' && (
                    <ul className="flex flex-col gap-1 mb-3">
                      {m.proposal.data.changes.map((c, ci) => (
                        <li key={ci} className="text-xs" style={{ color: 'var(--text-dim)' }}>
                          • {describeChange(c.weekday, c.kind, c.workoutId, c.suggestedDistanceKm, workouts)}
                        </li>
                      ))}
                    </ul>
                  )}

                  {m.proposal.kind === 'newWorkout' && (
                    <ul className="flex flex-col gap-1 mb-3">
                      {m.proposal.data.exercises.map((ex, ei) => (
                        <li key={ei} className="text-xs" style={{ color: 'var(--text-dim)' }}>
                          • {ex.exerciseName} — {ex.targetSets}x{ex.targetReps}
                        </li>
                      ))}
                    </ul>
                  )}

                  {m.proposal.kind === 'workoutEdit' && (
                    <ul className="flex flex-col gap-1 mb-3">
                      <li className="text-xs mb-0.5" style={{ color: 'var(--text-faint)' }}>
                        {m.proposal.data.summary}
                      </li>
                      {m.proposal.data.changes.map((c, ci) => (
                        <li key={ci} className="text-xs" style={{ color: 'var(--text-dim)' }}>
                          • {describeWorkoutEditChange(c, workoutForEdit)}
                        </li>
                      ))}
                    </ul>
                  )}

                  {m.proposalStatus === 'applied' ? (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
                        <Check size={14} />{' '}
                        {m.proposal.kind === 'schedule' ? 'Aplicado na sua agenda' : m.proposal.kind === 'newWorkout' ? 'Treino criado' : 'Alterações aplicadas'}
                      </p>
                      {m.appliedWorkoutId && (
                        <button
                          onClick={() => navigate(`/treinos/${m.appliedWorkoutId}`)}
                          className="text-xs font-medium"
                          style={{ color: 'var(--brand)' }}
                        >
                          Ver treino
                        </button>
                      )}
                    </div>
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
          );
        })}

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
