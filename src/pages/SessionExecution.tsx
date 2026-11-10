import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, Check, Trash2, Clock, Bot, Calculator, TimerReset, Eye, Pause, Play, Volume2, MapPin, ArrowUp, ArrowDown } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import {
  addExerciseToSession,
  addSetToSessionExercise,
  appendAmrapRound,
  addUpcomingCircuitStation,
  moveUpcomingCircuitStation,
  updateStationResult,
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
import { ExerciseThumbnail, ExerciseGuide } from '../components/ExerciseVisual';
import { SessionSetRow } from '../components/SessionSetRow';
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
type CircuitClockState = { startedAt: number | null; pausedAt: number | null; pausedMs: number };
function readCircuitClock(sessionId: string | undefined): CircuitClockState | null {
  if (!sessionId) return null;
  try {
    const raw = localStorage.getItem('fitbox-circuit-clock:'+sessionId);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const state = parsed as Partial<CircuitClockState>;
    if ((state.startedAt != null && (typeof state.startedAt !== 'number' || !Number.isFinite(state.startedAt))) ||
      (state.pausedAt != null && (typeof state.pausedAt !== 'number' || !Number.isFinite(state.pausedAt))) ||
      typeof state.pausedMs !== 'number' || !Number.isFinite(state.pausedMs)) return null;
    return { startedAt: state.startedAt ?? null, pausedAt: state.pausedAt ?? null, pausedMs: state.pausedMs ?? 0 };
  } catch { return null; }
}
function writeCircuitClock(sessionId: string | undefined, value: CircuitClockState) {
  if (!sessionId) return;
  try { localStorage.setItem('fitbox-circuit-clock:'+sessionId,JSON.stringify(value)); }
  catch { /* sem armazenamento: o relógio permanece disponível nesta sessão */ }
}

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
  const [stationPickerOpen,setStationPickerOpen] = useState(false);
  const [stationGoal,setStationGoal] = useState('10 reps');
  const [stationNextRoundOnly,setStationNextRoundOnly] = useState(false);
  const [stationError,setStationError] = useState<string|null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [discardError, setDiscardError] = useState<string | null>(null);
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
  // Prazo absoluto: evita atrasos quando o navegador limita timers em segundo plano.
  const restDeadlineRef = useRef<number | null>(null);

  const [plateSheetExerciseId, setPlateSheetExerciseId] = useState<string | null>(null);
  const [exerciseGuideId, setExerciseGuideId] = useState<string | null>(null);
  const [setInputError, setSetInputError] = useState<{ entryId: string; message: string } | null>(null);
  const [plateWeight, setPlateWeight] = useState('');
  const [barWeight, setBarWeight] = useState<number>(loadBarWeight);

  const session = sessions.find((s) => s.id === sessionId);
  const elapsed = useElapsed(session?.startedAt ?? new Date().toISOString());
  const [clockTick,setClockTick] = useState(Date.now);
  const [clockData,setClockData] = useState<{sessionId:string;state:CircuitClockState}|null>(()=>{
    const saved = readCircuitClock(sessionId);
    return sessionId && saved ? {sessionId,state:saved} : null;
  });
  const [emomSound,setEmomSound]=useState(false);
  const emomLastMinute=useRef<number|null>(null);
  const circuitEntry = session?.exercises.find(se => se.circuitFormat);
  const circuitFormat = circuitEntry?.circuitFormat;
  const hasPreparation = session?.exercises.some(se => se.blockType && se.blockType !== 'circuit') ?? false;
  const storedClock = clockData && clockData.sessionId === sessionId ? clockData.state : null;
  const clock: CircuitClockState = storedClock ?? {
    startedAt: hasPreparation ? null : Date.parse(session?.startedAt ?? new Date().toISOString()),
    pausedAt:null,pausedMs:0,
  };
  const circuitSeconds = clock.startedAt == null ? 0 : Math.max(0,Math.floor(((clock.pausedAt ?? clockTick)-clock.startedAt-clock.pausedMs)/1000));
  const durationSeconds = (circuitEntry?.circuitDurationMinutes ?? 20) * 60;
  const remainingSeconds = Math.max(0, durationSeconds - circuitSeconds);
  const activeEmomMinute = Math.max(1, Math.min(circuitEntry?.circuitDurationMinutes ?? 20, Math.floor(circuitSeconds / 60) + 1));
  useEffect(() => {
    const saved=readCircuitClock(sessionId);
    setClockData(sessionId && saved ? {sessionId,state:saved} : null);
  },[sessionId]);
  useEffect(() => {
    if (!circuitFormat || clock.pausedAt != null || clock.startedAt == null || session?.finishedAt) return;
    const tick = () => setClockTick(Date.now());
    tick();
    const interval=setInterval(tick,250);
    document.addEventListener('visibilitychange',tick);
    return ()=>{clearInterval(interval);document.removeEventListener('visibilitychange',tick);};
  },[circuitFormat,clock.startedAt,clock.pausedAt,session?.finishedAt]);
  useEffect(() => {
    if(circuitFormat!=='emom' || clock.startedAt == null) {
      emomLastMinute.current=null;
      return;
    }
    if (emomLastMinute.current !== null && activeEmomMinute > emomLastMinute.current && emomSound && clock.pausedAt == null) playRestBeep();
    emomLastMinute.current=activeEmomMinute;
  },[activeEmomMinute,circuitFormat,emomSound,clock.pausedAt,clock.startedAt]);
  function setCircuitClock(next:CircuitClockState) {
    setClockData(sessionId ? {sessionId,state:next} : null);
    writeCircuitClock(sessionId,next);
    setClockTick(Date.now());
  }
  function toggleCircuitPause() {
    if (clock.startedAt == null) {
      primeRestBeep();
      setCircuitClock({startedAt:Date.now(),pausedAt:null,pausedMs:0});
    } else if (clock.pausedAt != null) {
      primeRestBeep();
      setCircuitClock({...clock,pausedAt:null,pausedMs:clock.pausedMs+Date.now()-clock.pausedAt});
    } else {
      setCircuitClock({...clock,pausedAt:Date.now()});
    }
  }
  const elapsedSeconds = circuitSeconds;
  const currentAmrapRound = Math.max(0,...(session?.exercises ?? []).map(se=>se.circuitRound ?? 0));
  const lastAmrapStations = (session?.exercises ?? []).filter(se=>se.circuitFormat === 'amrap' && se.circuitRound === currentAmrapRound);
  const canAddAmrapRound = circuitFormat === 'amrap' && remainingSeconds > 0 && currentAmrapRound < 99 && lastAmrapStations.length > 0 && lastAmrapStations.every(se=>se.sets.every(st=>st.completed));

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
    const tick = () => {
      const deadline = restDeadlineRef.current;
      if (deadline === null) return;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRestRemaining((previous) => previous === remaining ? previous : remaining);
    };
    const timer = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [restRemaining]);

  function startRestTimer(seconds: number) {
    restBeepedRef.current = false;
    restDeadlineRef.current = Date.now() + seconds * 1000;
    setRestDone(false);
    setRestTotal(seconds);
    setRestRemaining(seconds);
  }

  function adjustRest(deltaSeconds: number) {
    if (restDeadlineRef.current === null) return;
    const remaining = Math.max(0, Math.ceil((restDeadlineRef.current - Date.now()) / 1000));
    const adjusted = Math.max(0, remaining + deltaSeconds);
    restDeadlineRef.current = Date.now() + adjusted * 1000;
    setRestRemaining(adjusted);
  }

  function skipRest() {
    restDeadlineRef.current = null;
    setRestRemaining(null);
    setRestTotal(null);
    setRestDone(false);
  }

  function toggleSetCompleted(sessionExerciseId: string, setId: string, currentlyCompleted: boolean) {
    const entry = session?.exercises.find(e => e.id === sessionExerciseId);
    const currentSet = entry?.sets.find(st => st.id === setId);
    if (!entry || !currentSet) return;
    // Série de força precisa de reps informadas. Distância/tempo podem
    // ser marcados após concluir o alvo; peso zero é legítimo no peso corporal.
    const distanceOrTime = /\d+\s*(?:km|min|seg|m|s)\b/i.test(entry.targetReps ?? '');
    if (!currentlyCompleted && currentSet.reps <= 0 && !distanceOrTime) {
      setSetInputError({ entryId: sessionExerciseId, message: `Informe as repetições da série ${currentSet.setNumber} antes de concluí-la.` });
      return;
    }
    setSetInputError(null);
    const done = !currentlyCompleted;
    updateSet(session!.id, sessionExerciseId, setId, { completed: done });
    if (done && entry.sets.some(st => st.id !== setId && !st.completed)) {
      primeRestBeep();
      startRestTimer(entry.restSeconds ?? DEFAULT_REST_SECONDS);
    } else if (!done) {
      skipRest();
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
  function handleAddUpcomingStation(ex:Exercise) {
    const result=addUpcomingCircuitStation(session!.id,ex.id,stationGoal,stationNextRoundOnly);
    if(!result.ok) {setStationError(result.error);return;}
    setStationPickerOpen(false);
    setStationError(null);
  }
  function handleMoveUpcoming(entryId:string,direction:-1|1) {
    const result=moveUpcomingCircuitStation(session!.id,entryId,direction);
    setStationError(result.ok ? null : result.error);
  }

  const anySetLogged = session.exercises.some((se) => se.sets.some((st) => st.completed || st.reps > 0));
  const completedSets = session.exercises.reduce((sum,se)=>
    sum + se.sets.filter(st=>st.completed).length,0);
  const plannedSets = session.exercises.reduce((sum,se)=>sum + se.sets.length,0);
  const progressPercent = plannedSets > 0 ? Math.round(completedSets/plannedSets*100) : 0;

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

      {circuitFormat && circuitFormat !== 'rounds' && (
        <div className="mx-4 mt-3 p-3 rounded-xl flex flex-col gap-2"
          style={{background:'var(--brand-dim)',color:'var(--brand)'}} role="timer" aria-label="Relógio do circuito">
          <div className="flex justify-between items-center gap-3">
            <div>
              <p className="text-xs font-semibold">{circuitFormat === 'amrap' ? 'AMRAP' : circuitFormat === 'emom' ? 'EMOM' : 'FOR TIME'}</p>
              <p className="text-xs mt-1">
                {clock.startedAt == null ? 'Aquecimento livre; inicie o relógio ao começar o circuito.' :
                 clock.pausedAt != null ? 'Cronômetro pausado' :
                 circuitFormat === 'emom' ? `Minuto ${activeEmomMinute} de ${circuitEntry?.circuitDurationMinutes}` :
                 circuitFormat === 'amrap' ? (remainingSeconds === 0 ? 'Tempo-alvo atingido. Você pode finalizar o treino.' : 'Máximo de voltas dentro do tempo') :
                 'Conclua a sequência; o tempo continua após o limite.'}
              </p>
            </div>
            <p className="text-xl font-bold tabular-nums" aria-live="off">
              {formatMMSS(circuitFormat === 'for_time' ? elapsedSeconds : remainingSeconds)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={toggleCircuitPause} className="rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1"
              style={{background:'var(--brand)',color:'white'}}>
              {clock.startedAt == null ? <Play size={13}/> : clock.pausedAt == null ? <Pause size={13}/> : <Play size={13}/>}
              {clock.startedAt == null ? 'Iniciar circuito' : clock.pausedAt == null ? 'Pausar relógio' : 'Retomar relógio'}
            </button>
            {circuitFormat === 'emom' && <button type="button"
              onClick={()=>{primeRestBeep();setEmomSound(v=>!v);}}
              aria-pressed={emomSound}
              className="rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1"
              style={{background:'var(--surface)',color:'var(--text)'}}>
              <Volume2 size={13}/> Avisos {emomSound ? 'ligados' : 'desligados'}
            </button>}
          </div>
          <p className="text-[10px]" style={{color:'var(--text-dim)'}}>
            Pausa registrada neste aparelho; ao trocar de dispositivo, o relógio pode não acompanhar a pausa.
            {circuitFormat === 'emom' ? ' A estação do minuto atual fica destacada abaixo. Ative os avisos após interagir com a tela.' : ''}
          </p>
        </div>
      )}
      {circuitFormat === 'emom' && clock.startedAt != null && <button type="button"
        className="mx-4 mt-2 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-2"
        onClick={()=>document.getElementById('emom-station-'+activeEmomMinute)?.scrollIntoView({behavior:'smooth',block:'center'})}
        style={{background:'var(--surface-2)',color:'var(--brand)'}}><MapPin size={14}/> Ver estação do minuto {activeEmomMinute}</button>}
      <div className="px-4 py-2 flex items-center gap-3" role="status"
        aria-label={circuitFormat === 'amrap' ? completedSets+' estações registradas' : completedSets+' séries concluídas de '+plannedSets}>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'var(--surface-3)'}}>
          <div className="h-full rounded-full transition-all" style={{
            background:'var(--brand)',width:progressPercent+'%'}}/>
        </div>
        <span className="text-xs font-medium tabular-nums shrink-0" style={{color:'var(--text-dim)'}}>
          {completedSets}/{plannedSets} séries
        </span>
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
                disabled={discarding}
                onClick={async () => {
                  if (discarding) return;
                  setDiscarding(true);
                  setDiscardError(null);
                  const result = await discardSession(session.id);
                  setDiscarding(false);
                  if (result.ok) navigate('/');
                  else setDiscardError(result.error);
                }}
              >
                {discarding ? 'Descartando...' : 'Descartar sessão'}
              </Button>
              {discardError && <p role="alert" className="text-xs" style={{color:'var(--danger)'}}>{discardError}</p>}
              <Button full variant="secondary" disabled={discarding} onClick={() => setConfirmDiscard(false)}>
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
        {session.exercises.map((se, stationIndex) => {
          const ex = exerciseById.get(se.exerciseId);
          const history = getExerciseHistory(sessions, se.exerciseId);
          const lastSession = history[history.length - 1];
          const lastSets = getLastCompletedSets(sessions, se.exerciseId);
          const coach = getCoachSuggestion(sessions, se.exerciseId);
          const coachColor =
            coach.action === 'increase' ? 'var(--success)' : coach.action === 'deload' ? 'var(--warn)' : 'var(--text-faint)';
          return (
            <div key={se.id} id={se.circuitMinute ? 'emom-station-'+se.circuitMinute : undefined}
              className="rounded-2xl border p-3.5"
              style={{ background: 'var(--surface)', borderColor: se.circuitMinute === activeEmomMinute && circuitFormat === 'emom' && clock.startedAt != null ? 'var(--brand)' : 'var(--border)' }}>
              {se.circuitRound != null && <div className="flex items-center justify-between mb-3 rounded-lg px-3 py-2 text-xs font-semibold" style={{background:'var(--brand-dim)',color:'var(--brand)'}}>
                <span>{se.circuitFormat === 'emom' ? `Minuto ${se.circuitMinute ?? stationIndex + 1}` : se.circuitFormat === 'amrap' ? `Volta ${se.circuitRound}` : `Volta ${se.circuitRound} de ${se.circuitRounds}`}</span>
                <span>Estação {se.circuitStation} · {stationIndex + 1}/{session.exercises.length}</span>
              </div>}
              {se.blockType && se.blockType !== 'circuit' && <p className="text-xs font-semibold mb-2" style={{color:'var(--brand)'}}>
                {se.blockType === 'warmup' ? 'Aquecimento' : se.blockType === 'strength' ? 'Força' : se.blockType === 'technique' ? 'Técnica' : 'Desaquecimento'}
              </p>}
              {se.circuitRound != null && se.circuitFormat !== 'emom' && <div className="flex justify-end gap-2 mb-2">
                <button type="button" onClick={()=>handleMoveUpcoming(se.id,-1)} className="p-1.5 rounded-lg text-xs flex items-center gap-1"
                  style={{background:'var(--surface-2)',color:'var(--text-dim)'}} aria-label="Mover estação para cima nas voltas pendentes"><ArrowUp size={14}/> Subir</button>
                <button type="button" onClick={()=>handleMoveUpcoming(se.id,1)} className="p-1.5 rounded-lg text-xs flex items-center gap-1"
                  style={{background:'var(--surface-2)',color:'var(--text-dim)'}} aria-label="Mover estação para baixo nas voltas pendentes"><ArrowDown size={14}/> Descer</button>
              </div>}
              <div className="flex items-center gap-2 mb-2">
                <button type="button" aria-label="Ver demonstração do exercício"
                  onClick={() => setExerciseGuideId(exerciseGuideId === se.id ? null : se.id)}>
                  <ExerciseThumbnail exercise={ex} size={57}/>
                </button>
                <p className="font-semibold text-sm flex-1 min-w-0">{ex?.name ?? 'Exercício'}</p>
              </div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <button type="button" onClick={() => setExerciseGuideId(exerciseGuideId === se.id ? null : se.id)}
                  className="flex items-center gap-1 text-xs underline" style={{color:'var(--brand)'}}>
                  <Eye size={12}/> {exerciseGuideId === se.id ? 'Ocultar execução' : 'Ver execução'}
                </button>
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
              {exerciseGuideId === se.id && <div className="mb-3"><ExerciseGuide exercise={ex}/></div>}
              {(se.targetReps || se.notes) && (
                <div className="text-xs mb-2 rounded-lg px-2.5 py-2" style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}>
                  {se.targetReps && <p><strong>Alvo:</strong> {se.targetReps}{se.restSeconds != null ? ` · pausa ${se.restSeconds}s` : ''}</p>}
                  {se.notes && <p className="mt-1">{se.notes}</p>}
                  {se.targetReps && /[a-z]/i.test(se.targetReps) && <p className="mt-1" style={{ color: 'var(--text-faint)' }}>Para metas de tempo/distância, marque a série como concluída ao finalizar; registre repetições quando se aplicar.</p>}
                </div>
              )}
              {coach.action !== 'no-data' && (
                <p className="text-xs mb-2 flex items-start gap-1" style={{ color: coachColor }}>
                  <Bot size={13} className="shrink-0 mt-[1px]" />
                  <span>{coach.message}</span>
                </p>
              )}

              {se.circuitRound != null && (
                <label className="block mb-3 text-xs" style={{color:'var(--text-dim)'}}>
                  Resultado real (opcional): distância, tempo ou repetições
                  <input key={se.id} type="text" defaultValue={se.actualResult ?? ''}
                    onBlur={e => updateStationResult(session.id,se.id,e.target.value.trim())}
                    placeholder="Ex.: 485 m, 1min20s, 18 reps"
                    className="block w-full mt-1 p-2.5 rounded-lg text-sm"
                    style={{background:'var(--surface-2)',color:'var(--text)'}} />
                </label>
              )}
              <div className="flex items-center justify-between gap-2 mb-3 mt-3">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>{se.circuitRound ? 'Registrar estação desta volta' : 'Registro individual de séries'}</p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  {se.sets.filter(st => st.completed).length}/{se.sets.length} concluídas
                </p>
              </div>
              {setInputError?.entryId === se.id && (
                <p role="alert" className="mb-2 text-xs rounded-lg p-2"
                  style={{ background: 'var(--danger)' + '20', color: 'var(--danger)' }}>
                  {setInputError.message}
                </p>
              )}
              {se.sets.map((set, setIndex) => (
                <SessionSetRow
                  key={set.id}
                  series={set}
                  previous={lastSets?.[setIndex]}
                  onUpdate={patch => {
                    setSetInputError(null);
                    updateSet(session.id, se.id, set.id, patch);
                  }}
                  onToggle={() => toggleSetCompleted(se.id, set.id, set.completed)}
                  onRemove={() => {
                    setSetInputError(null);
                    removeSetFromSessionExercise(session.id, se.id, set.id);
                  }}
                  onRepeat={() => {
                    const last = lastSets?.[setIndex];
                    if (last) updateSet(session.id, se.id, set.id, { weight: last.weight, reps: last.reps });
                  }}
                />
              ))}

              {!se.circuitRound && <button
                onClick={() => addSetToSessionExercise(session.id, se.id)}
                className="w-full text-xs font-medium rounded-lg py-2 mt-1"
                style={{ background: 'var(--surface-2)', color: 'var(--brand)' }}
              >
                + Adicionar série
              </button>}
            </div>
          );
        })}

        {stationError && <p role="alert" className="text-xs p-3 rounded-lg" style={{color:'var(--danger)',background:'var(--surface-2)'}}>{stationError}</p>}
        {session.exercises.some(se=>se.circuitRound!=null) && circuitFormat !== 'emom' && (
          <div className="rounded-xl p-3 flex flex-col gap-2" style={{background:'var(--surface-2)'}}>
            <p className="text-sm font-semibold">Professor alterou o circuito?</p>
            <p className="text-xs" style={{color:'var(--text-dim)'}}>Inclua uma estação nova nas voltas ainda pendentes. As voltas concluídas e os resultados ficam preservados.</p>
            <label className="text-xs" style={{color:'var(--text-dim)'}}>Meta para a nova estação
              <input value={stationGoal} onChange={e=>setStationGoal(e.target.value)} maxLength={80}
                className="block w-full rounded-lg p-2 mt-1 text-sm" style={{background:'var(--surface)'}} placeholder="Ex.: 500 m / 15 reps / 45 seg"/>
            </label>
            {circuitFormat !== 'amrap' && <label className="text-xs flex items-center gap-2" style={{color:'var(--text-dim)'}}>
              <input type="checkbox" checked={stationNextRoundOnly} onChange={e=>setStationNextRoundOnly(e.target.checked)}/>
              Adicionar apenas a partir da próxima volta
            </label>}
            <button type="button" onClick={()=>{setStationError(null);setStationPickerOpen(true);}}
              className="rounded-lg p-2.5 text-xs font-semibold" style={{background:'var(--brand)',color:'white'}}>
              + Escolher nova estação
            </button>
          </div>
        )}
        {canAddAmrapRound && (
          <button type="button" onClick={() => appendAmrapRound(session.id)}
            className="w-full rounded-xl p-3 text-sm font-semibold"
            style={{background:'var(--brand-dim)',color:'var(--brand)'}}>
            + Iniciar volta {currentAmrapRound + 1} do AMRAP
          </button>
        )}
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium border-2 border-dashed"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
        >
          <Plus size={16} /> Adicionar exercício
        </button>
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleAddExercise} />
      <ExercisePicker open={stationPickerOpen} onClose={()=>setStationPickerOpen(false)}
        onSelect={handleAddUpcomingStation} title="Nova estação do circuito" />

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
