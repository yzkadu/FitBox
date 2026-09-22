import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, Check, Trash2, Clock, Bot, Repeat, Calculator, TimerReset } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import {
  addExerciseToSession,
  addSetToSessionExercise,
  removeSetFromSessionExercise,
  removeExerciseFromSession,
  updateSet,
  finishSession,
  discardSession,
} from '../lib/actions';
import { getExerciseHistory, getLastCompletedSets } from '../lib/stats';
import { getCoachSuggestion } from '../lib/coach';
import { calculatePlates, BAR_WEIGHT_OPTIONS } from '../lib/plateCalculator';
import { primeRestBeep, playRestBeep } from '../lib/restBeep';
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

const DEFAULT_REST_SECONDS = 90;
const BAR_WEIGHT_KEY = 'fitbox-bar-weight';

function loadBarWeight(): number {
  try {
    const saved = Number(localStorage.getItem(BAR_WEIGHT_KEY));
    return BAR_WEIGHT_OPTIONS.includes(saved as (typeof BAR_WEIGHT_OPTIONS)[number]) ? saved : 20;
  } catch {
    return 20;
  }
}

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [confirmRemoveExerciseId, setConfirmRemoveExerciseId] = useState<string | null>(null);

  const [restTotal, setRestTotal] = useState<number | null>(null);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [restDone, setRestDone] = useState(false);
  const restBeepedRef = useRef(false);

  const [plateSheetExerciseId, setPlateSheetExerciseId] = useState<string | null>(null);
  const [plateWeight, setPlateWeight] = useState('');
  const [barWeight, setBarWeight] = useState<number>(loadBarWeight);

  const session = sessions.find((s) => s.id === sessionId);
  const elapsed = useElapsed(session?.startedAt ?? new Date().toISOString());

  // Timer de descanso: começa sozinho quando uma série é marcada como
  // concluída, conta regressivamente, e avisa (som + vibração, quando
  // suportado) quando chega a zero.
  useEffect(() => {
    if (restRemaining === null) return;
    if (restRemaining <= 0) {
      if (!restBeepedRef.current) {
        restBeepedRef.current = true;
        playRestBeep();
        setRestDone(true);
        const t = setTimeout(() => {
          setRestRemaining(null);
          setRestTotal(null);
          setRestDone(false);
        }, 2500);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(() => setRestRemaining((r) => (r !== null ? r - 1 : r)), 1000);
    return () => clearTimeout(t);
  }, [restRemaining]);

  function startRestTimer(seconds: number) {
    restBeepedRef.current = false;
    setRestDone(false);
    setRestTotal(seconds);
    setRestRemaining(seconds);
  }

  function adjustRest(deltaSeconds: number) {
    setRestRemaining((r) => (r !== null ? Math.max(0, r + deltaSeconds) : r));
  }

  function skipRest() {
    setRestRemaining(null);
    setRestTotal(null);
    setRestDone(false);
  }

  function toggleSetCompleted(sessionExerciseId: string, setId: string, currentlyCompleted: boolean) {
    const nowCompleted = !currentlyCompleted;
    updateSet(session!.id, sessionExerciseId, setId, { completed: nowCompleted });
    if (nowCompleted) {
      primeRestBeep();
      startRestTimer(DEFAULT_REST_SECONDS);
    }
  }

  function openPlateCalculator(exerciseId: string, suggestedWeight: number) {
    setPlateWeight(suggestedWeight > 0 ? String(suggestedWeight) : '');
    setPlateSheetExerciseId(exerciseId);
  }

  function chooseBarWeight(w: number) {
    setBarWeight(w);
    try {
      localStorage.setItem(BAR_WEIGHT_KEY, String(w));
    } catch {
      // localStorage indisponível — segue só no estado da sessão
    }
  }

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
    setFinishError(null);
    setRpeSheetOpen(true);
  }

  async function confirmFinish(rpe?: number) {
    setFinishing(true);
    setFinishError(null);
    const result = await finishSession(session!.id, rpe, proofPhoto);
    setFinishing(false);
    if (!result.ok) {
      setFinishError('Não foi possível salvar o treino agora (sem internet ou o servidor recusou). Nada foi perdido — tenta de novo.');
      return;
    }
    setRpeSheetOpen(false);
    navigate(`/`);
  }

  function handleAddExercise(ex: Exercise) {
    addExerciseToSession(session!.id, ex.id);
    setPickerOpen(false);
  }

  const anySetLogged = session.exercises.some((se) => se.sets.some((st) => st.completed || st.reps > 0));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
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

      {confirmRemoveExerciseId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-6">
          <div className="rounded-2xl p-5 w-full max-w-sm" style={{ background: 'var(--surface)' }}>
            <p className="font-medium mb-1">Remover este exercício?</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
              As séries já registradas dele neste treino se perdem. Você pode adicioná-lo de volta depois, se mudar de ideia.
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
          const lastSets = getLastCompletedSets(sessions, se.exerciseId);
          const coach = getCoachSuggestion(sessions, se.exerciseId);
          const coachColor =
            coach.action === 'increase' ? 'var(--success)' : coach.action === 'deload' ? 'var(--warn)' : 'var(--text-faint)';
          return (
            <div key={se.id} className="rounded-2xl border p-3.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="font-medium text-sm flex-1 min-w-0 truncate">{ex?.name ?? 'Exercício'}</p>
                {lastSession && (
                  <p className="text-xs shrink-0" style={{ color: 'var(--text-faint)' }}>
                    último: {lastSession.bestSet?.weight}kg × {lastSession.bestSet?.reps}
                  </p>
                )}
                <button
                  onClick={() => openPlateCalculator(se.exerciseId, lastSession?.bestSet?.weight ?? se.sets[0]?.weight ?? 0)}
                  style={{ color: 'var(--text-faint)' }}
                  className="shrink-0"
                  aria-label="Calculadora de anilhas"
                >
                  <Calculator size={14} />
                </button>
                <button
                  onClick={() => setConfirmRemoveExerciseId(se.id)}
                  style={{ color: 'var(--text-faint)' }}
                  className="shrink-0"
                  aria-label="Remover exercício deste treino"
                >
                  <Trash2 size={14} />
                </button>
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

              {se.sets.map((set, setIndex) => {
                const prevSet = lastSets?.[setIndex];
                return (
                  <div key={set.id} className="mb-1.5">
                    <div className="grid grid-cols-[28px_1fr_1fr_32px_28px] gap-2 items-center">
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
                        onClick={() => toggleSetCompleted(se.id, set.id, set.completed)}
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
                    {prevSet && !set.completed && (
                      <button
                        onClick={() => updateSet(session.id, se.id, set.id, { weight: prevSet.weight, reps: prevSet.reps })}
                        className="flex items-center gap-1 text-[11px] mt-1 pl-1"
                        style={{ color: 'var(--text-faint)' }}
                      >
                        <Repeat size={10} />
                        última vez: {prevSet.weight}kg × {prevSet.reps} — toque pra repetir
                      </button>
                    )}
                  </div>
                );
              })}

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

      {restRemaining !== null && restTotal !== null && (
        <div
          className="fixed inset-x-0 z-20 px-4 pb-3"
          style={{ background: 'linear-gradient(to top, var(--bg) 60%, transparent)', bottom: 'calc(60px + env(safe-area-inset-bottom))' }}
        >
          <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {restDone ? (
              <p className="text-sm font-semibold text-center flex items-center justify-center gap-1.5" style={{ color: 'var(--success)' }}>
                <Check size={16} /> Descanso concluído!
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                    <TimerReset size={14} style={{ color: 'var(--brand)' }} /> Descansando
                  </p>
                  <p className="text-lg font-semibold tabular-nums">{formatMMSS(restRemaining)}</p>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--surface-2)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: 'var(--brand)',
                      width: `${Math.min(100, Math.max(0, (restRemaining / restTotal) * 100))}%`,
                      transition: 'width 1s linear',
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => adjustRest(-15)}
                    className="flex-1 text-xs font-medium rounded-lg py-2"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}
                  >
                    −15s
                  </button>
                  <button
                    onClick={() => adjustRest(15)}
                    className="flex-1 text-xs font-medium rounded-lg py-2"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}
                  >
                    +15s
                  </button>
                  <button onClick={skipRest} className="flex-1 text-xs font-medium rounded-lg py-2 text-white" style={{ background: 'var(--brand)' }}>
                    Pular
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Sheet open={plateSheetExerciseId !== null} onClose={() => setPlateSheetExerciseId(null)} title="Calculadora de anilhas">
        {(() => {
          const ex = plateSheetExerciseId ? exerciseById.get(plateSheetExerciseId) : undefined;
          const target = Number(plateWeight) || 0;
          const breakdown = calculatePlates(target, barWeight);
          return (
            <div className="flex flex-col gap-4">
              {ex && (
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  {ex.name}
                </p>
              )}
              <div>
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
                  Peso total na barra (kg)
                </p>
                <input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  value={plateWeight}
                  onChange={(e) => setPlateWeight(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                  placeholder="Ex: 60"
                />
              </div>
              <div>
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
                  Peso da barra
                </p>
                <div className="flex gap-2">
                  {BAR_WEIGHT_OPTIONS.map((w) => (
                    <button
                      key={w}
                      onClick={() => chooseBarWeight(w)}
                      className="flex-1 text-xs font-medium rounded-lg py-2"
                      style={{
                        background: barWeight === w ? 'var(--brand)' : 'var(--surface-2)',
                        color: barWeight === w ? 'white' : 'var(--text-dim)',
                      }}
                    >
                      {w}kg
                    </button>
                  ))}
                </div>
              </div>

              {target > 0 && (
                <div className="rounded-xl p-3.5" style={{ background: 'var(--surface-2)' }}>
                  {breakdown.perSide.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                      Só a barra ({barWeight}kg) já cobre — sem anilhas.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>
                        De cada lado da barra:
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {breakdown.perSide.map((p, i) => (
                          <span
                            key={i}
                            className="text-sm font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
                          >
                            {p}kg
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {!breakdown.exact && (
                    <p className="text-xs" style={{ color: 'var(--warn)' }}>
                      Não fecha exato com anilhas padrão — mais próximo: {breakdown.totalWeight}kg.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </Sheet>

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

          {finishError && (
            <p className="text-xs rounded-xl px-3.5 py-2.5" style={{ background: '#ef444426', color: 'var(--danger)' }}>
              {finishError}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button full disabled={selectedRpe === null || finishing} onClick={() => confirmFinish(selectedRpe ?? undefined)}>
              {finishing ? 'Salvando...' : 'Salvar treino'}
            </Button>
            <Button full variant="secondary" disabled={finishing} onClick={() => confirmFinish(undefined)}>
              {finishing ? 'Salvando...' : 'Pular'}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
