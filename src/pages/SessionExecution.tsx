import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, Check, Trash2, Clock, Bot } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import {
  addExerciseToSession,
  addSetToSessionExercise,
  removeSetFromSessionExercise,
  updateSet,
  finishSession,
  discardSession,
} from '../lib/actions';
import { getExerciseHistory } from '../lib/stats';
import { getCoachSuggestion } from '../lib/coach';
import { Button } from '../components/ui';
import { ExercisePicker } from '../components/ExercisePicker';
import { Sheet } from '../components/Sheet';
import { PhotoField } from '../components/PhotoField';
import type { Exercise } from '../types';

const RPE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
function rpeColor(v: number): string {
  if (v <= 3) return 'var(--success)';
  if (v <= 6) return 'var(--brand)';
  if (v <= 8) return 'var(--warn)';
  return 'var(--danger)';
}

function useElapsed(startedAt: string) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - Date.parse(startedAt)) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SessionExecution() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { sessions, exercises } = useAppData();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [rpeSheetOpen, setRpeSheetOpen] = useState(false);
  const [selectedRpe, setSelectedRpe] = useState<number | null>(null);
  const [proofPhoto, setProofPhoto] = useState<string | undefined>(undefined);

  const session = sessions.find((s) => s.id === sessionId);
  const elapsed = useElapsed(session?.startedAt ?? new Date().toISOString());

  if (!session) {
    return (
      <div className="px-4 pt-6 text-center" style={{ color: 'var(--text-dim)' }}>
        <p>Sessão não encontrada.</p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          Voltar para o início
        </Button>
      </div>
    );
  }

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  function handleFinish() {
    setConfirmDiscard(false);
    setSelectedRpe(null);
    setProofPhoto(undefined);
    setRpeSheetOpen(true);
  }

  function confirmFinish(rpe?: number) {
    finishSession(session!.id, rpe, proofPhoto);
    setRpeSheetOpen(false);
    navigate(`/`);
  }

  function handleAddExercise(ex: Exercise) {
    addExerciseToSession(session!.id, ex.id);
    setPickerOpen(false);
  }

  const anySetLogged = session.exercises.some((se) => se.sets.some((st) => st.completed || st.reps > 0));

  return (
    <div className="min-h-screen flex flex-col safe-top" style={{ background: 'var(--bg)' }}>
      <div
        className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <button onClick={() => setConfirmDiscard(true)} style={{ color: 'var(--text-dim)' }}>
          <X size={22} />
        </button>
        <div className="flex flex-col items-center">
          <p className="text-sm font-semibold">{session.workoutName}</p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
            <Clock size={11} /> {elapsed}
          </p>
        </div>
        <Button onClick={handleFinish} className="!px-3 !py-1.5 !text-xs">
          Concluir
        </Button>
      </div>

      {confirmDiscard && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-6">
          <div className="rounded-2xl p-5 w-full max-w-sm" style={{ background: 'var(--surface)' }}>
            <p className="font-medium mb-1">Sair do treino?</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
              {anySetLogged
                ? 'Você pode concluir para salvar o progresso, ou descartar esta sessão.'
                : 'Nenhuma série registrada ainda. Deseja descartar esta sessão?'}
            </p>
            <div className="flex flex-col gap-2">
              {anySetLogged && (
                <Button
                  full
                  onClick={() => {
                    handleFinish();
                  }}
                >
                  Concluir e salvar
                </Button>
              )}
              <Button
                full
                variant="danger"
                onClick={() => {
                  discardSession(session.id);
                  navigate('/');
                }}
              >
                Descartar sessão
              </Button>
              <Button full variant="secondary" onClick={() => setConfirmDiscard(false)}>
                Voltar ao treino
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-4 py-4 flex flex-col gap-4 pb-28">
        {session.exercises.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-faint)' }}>
            Nenhum exercício ainda. Adicione abaixo.
          </p>
        )}
        {session.exercises.map((se) => {
          const ex = exerciseById.get(se.exerciseId);
          const history = getExerciseHistory(sessions, se.exerciseId);
          const lastSession = history[history.length - 1];
          const coach = getCoachSuggestion(sessions, se.exerciseId);
          const coachColor =
            coach.action === 'increase' ? 'var(--success)' : coach.action === 'deload' ? 'var(--warn)' : 'var(--text-faint)';
          return (
            <div key={se.id} className="rounded-2xl border p-3.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-baseline justify-between mb-1">
                <p className="font-medium text-sm">{ex?.name ?? 'Exercício'}</p>
                {lastSession && (
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    último: {lastSession.bestSet?.weight}kg × {lastSession.bestSet?.reps}
                  </p>
                )}
              </div>
              {coach.action !== 'no-data' && (
                <p className="text-xs mb-2 flex items-start gap-1" style={{ color: coachColor }}>
                  <Bot size={13} className="shrink-0 mt-[1px]" />
                  <span>{coach.message}</span>
                </p>
              )}

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
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleAddExercise} />

      <Sheet open={rpeSheetOpen} onClose={() => setRpeSheetOpen(false)} title="Como foi o esforço hoje?">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            De 0 (muito leve) a 10 (esforço máximo), como você sentiu esse treino?
          </p>
          <div className="grid grid-cols-6 gap-2">
            {RPE_OPTIONS.map((v) => {
              const active = selectedRpe === v;
              return (
                <button
                  key={v}
                  onClick={() => setSelectedRpe(v)}
                  className="h-11 rounded-xl text-sm font-semibold flex items-center justify-center"
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

          <PhotoField
            value={proofPhoto}
            onChange={setProofPhoto}
            label="Foto do relógio/tracker (opcional, prova pro seu foguinho)"
          />

          <div className="flex flex-col gap-2">
            <Button full disabled={selectedRpe === null} onClick={() => confirmFinish(selectedRpe ?? undefined)}>
              Salvar treino
            </Button>
            <Button full variant="secondary" onClick={() => confirmFinish(undefined)}>
              Pular
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
