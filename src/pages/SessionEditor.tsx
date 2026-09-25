import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Trash2 } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import {
  addExerciseToSession,
  addSetToSessionExercise,
  removeSetFromSessionExercise,
  removeExerciseFromSession,
  updateSet,
  updateSessionMeta,
} from '../lib/actions';
import { Button } from '../components/ui';
import { ExercisePicker } from '../components/ExercisePicker';
import type { Exercise } from '../types';

const RPE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
function rpeColor(v: number): string {
  if (v <= 3) return 'var(--success)';
  if (v <= 6) return 'var(--brand)';
  if (v <= 8) return 'var(--warn)';
  return 'var(--danger)';
}

/** Editar uma sessão já concluída — corrigir séries/exercícios registrados a
 * mais ou a menos, ou ajustar duração/RPE, depois do treino em si já ter
 * acabado. As mudanças em exercícios/séries são salvas na hora, como no resto
 * do app; duração e RPE salvam ao sair do campo / ao escolher uma nota. */
export function SessionEditor() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { sessions, exercises } = useAppData();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmRemoveExerciseId, setConfirmRemoveExerciseId] = useState<string | null>(null);

  const session = sessions.find((s) => s.id === sessionId);
  const [durationMin, setDurationMin] = useState<string>(() =>
    session?.durationSeconds != null ? String(Math.round(session.durationSeconds / 60)) : '',
  );

  if (!session) {
    return (
      <div className="px-4 pt-6 text-center" style={{ color: 'var(--text-dim)' }}>
        <p>Sessão não encontrada.</p>
        <Button className="mt-4" onClick={() => navigate('/historico')}>
          Voltar ao histórico
        </Button>
      </div>
    );
  }

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  function handleAddExercise(ex: Exercise) {
    addExerciseToSession(session!.id, ex.id);
    setPickerOpen(false);
  }

  function saveDuration() {
    const min = Number(durationMin);
    if (!min || min <= 0) return;
    updateSessionMeta(session!.id, { durationSeconds: Math.round(min * 60) });
  }

  return (
    <div
      className="min-h-screen flex flex-col safe-top mx-auto max-w-[560px] w-full"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 border-b sticky top-0 z-10"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <button onClick={() => navigate('/historico')} className="p-1 -ml-1" style={{ color: 'var(--text-dim)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-sm font-semibold leading-tight">Editar treino</p>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            {session.workoutName}
          </p>
        </div>
      </div>

      {confirmRemoveExerciseId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-6">
          <div className="rounded-2xl p-5 w-full max-w-sm" style={{ background: 'var(--surface)' }}>
            <p className="font-medium mb-1">Remover este exercício?</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
              As séries registradas dele nesta sessão se perdem.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                full
                variant="danger"
                onClick={() => {
                  removeExerciseFromSession(session.id, confirmRemoveExerciseId);
                  setConfirmRemoveExerciseId(null);
                }}
              >
                Remover
              </Button>
              <Button full variant="secondary" onClick={() => setConfirmRemoveExerciseId(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-4 py-4 flex flex-col gap-4 pb-10">
        <div className="rounded-2xl border p-3.5 flex flex-col gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium" htmlFor="duration-min">
              Duração (min)
            </label>
            <input
              id="duration-min"
              type="number"
              inputMode="numeric"
              min={1}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              onBlur={saveDuration}
              className="w-20 text-center rounded-lg py-1.5 text-sm"
              style={{ background: 'var(--surface-2)' }}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Esforço (RPE)</p>
            <div className="grid grid-cols-6 gap-1.5">
              {RPE_OPTIONS.map((v) => {
                const active = session.rpe === v;
                return (
                  <button
                    key={v}
                    onClick={() => updateSessionMeta(session.id, { rpe: v })}
                    className="h-9 rounded-lg text-xs font-semibold flex items-center justify-center"
                    style={{
                      background: active ? rpeColor(v) : 'var(--surface-2)',
                      color: active ? '#0b0b0f' : 'var(--text-dim)',
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {session.exercises.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-faint)' }}>
            Nenhum exercício registrado nesta sessão.
          </p>
        )}

        {session.exercises.map((se) => {
          const ex = exerciseById.get(se.exerciseId);
          return (
            <div key={se.id} className="rounded-2xl border p-3.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-medium text-sm flex-1 min-w-0 truncate">{ex?.name ?? 'Exercício'}</p>
                <button
                  onClick={() => setConfirmRemoveExerciseId(se.id)}
                  style={{ color: 'var(--text-faint)' }}
                  className="shrink-0"
                  aria-label="Remover exercício"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-[28px_1fr_1fr_32px_28px] gap-2 items-center mb-1 px-1">
                <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                  Série
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                  Peso (kg)
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                  Reps
                </span>
                <span />
                <span />
              </div>

              {se.sets.map((set) => (
                <div key={set.id} className="grid grid-cols-[28px_1fr_1fr_32px_28px] gap-2 items-center mb-1.5">
                  <span
                    className="text-xs font-medium text-center rounded-lg py-2"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}
                  >
                    {set.setNumber}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={set.weight || ''}
                    onChange={(e) => updateSet(session.id, se.id, set.id, { weight: Number(e.target.value) || 0 })}
                    className="w-full min-w-0 rounded-lg py-2 text-center text-sm"
                    style={{ background: 'var(--surface-2)' }}
                    placeholder="0"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps || ''}
                    onChange={(e) => updateSet(session.id, se.id, set.id, { reps: Number(e.target.value) || 0 })}
                    className="w-full min-w-0 rounded-lg py-2 text-center text-sm"
                    style={{ background: 'var(--surface-2)' }}
                    placeholder="0"
                  />
                  <button
                    onClick={() => updateSet(session.id, se.id, set.id, { completed: !set.completed })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
                    style={{
                      background: set.completed ? 'var(--success)' : 'var(--surface-2)',
                      color: set.completed ? '#06281d' : 'var(--text-faint)',
                    }}
                  >
                    <Check size={15} strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => removeSetFromSessionExercise(session.id, se.id, set.id)}
                    style={{ color: 'var(--text-faint)' }}
                    className="flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addSetToSessionExercise(session.id, se.id)}
                className="w-full text-xs font-medium rounded-lg py-2 mt-1"
                style={{ background: 'var(--surface-2)', color: 'var(--brand)' }}
              >
                + Adicionar série
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium border-2 border-dashed"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
        >
          <Plus size={16} /> Adicionar exercício
        </button>

        <Button full onClick={() => navigate('/historico')}>
          Concluído
        </Button>
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleAddExercise} />
    </div>
  );
}
