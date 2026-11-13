import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, ArrowUp, ArrowDown, Sparkles, X, Play, Repeat } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  updateWorkoutExercise,
  updateWorkout,
  replaceWorkoutExercise,
  reorderWorkoutExercises,
  setWorkoutCircuit,
} from '../lib/actions';
import { startSession, addActivityLog } from '../lib/actions';
import { localIsoDate } from '../lib/nextTraining';
import { Card, Button, EmptyState } from '../components/ui';
import { ExercisePicker } from '../components/ExercisePicker';
import { MUSCLE_GROUP_LABELS } from '../lib/exercises';
import { ExerciseThumbnail, ExerciseGuide } from '../components/ExerciseVisual';
import type { Exercise } from '../types';

const QUICK_BLOCKS = [
  { title: 'Força · Full body', subtitle: 'Academia · movimentos básicos', entries: [
    ['ex-agachamento-livre', 3, '8-10'], ['ex-supino-reto-halter', 3, '8-12'],
    ['ex-remada-baixa', 3, '10-12'], ['ex-prancha', 2, '30-40s'],
  ] },
  { title: 'Casa · Sem equipamento', subtitle: 'Corpo inteiro · iniciante', entries: [
    ['ex-agachamento-livre', 2, '12-15'], ['ex-flexao', 2, '6-12'],
    ['ex-fedb-single-leg-glute-bridge', 2, '10 cada lado'], ['ex-fedb-dead-bug', 2, '10 cada lado'],
  ] },
  { title: 'HYROX · Técnica', subtitle: 'Academia equipada · intensidade moderada', entries: [
    ['ex-hyrox-ski', 2, '250 m'], ['ex-hyrox-sled-push', 2, '10 m'],
    ['ex-remo-ergometrico', 2, '250 m'], ['ex-hyrox-wall-ball', 2, '12'],
  ] },
  { title: 'Corrida · Complemento de força', subtitle: 'Estabilidade e prevenção de sobrecarga', entries: [
    ['ex-afundo', 2, '10 por perna'], ['ex-stiff-halter', 2, '10-12'],
    ['ex-panturrilha-em-pe', 3, '15'], ['ex-prancha-lateral', 2, '30s'],
  ] },
  { title: 'Core · 15 minutos', subtitle: 'Peso corporal · sem equipamento', entries: [
    ['ex-fedb-dead-bug', 2, '10 por lado'], ['ex-prancha', 2, '30s'],
    ['ex-fedb-reverse-crunch', 2, '12'], ['ex-prancha-lateral', 2, '20s'],
  ] },
] satisfies Array<{ title: string; subtitle: string; entries: [string, number, string][] }>;

export function WorkoutEditor() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [circuitDraft,setCircuitDraft] = useState(() => params.get('circuit') === '1');
  const [draftRounds,setDraftRounds] = useState(3);
  const [draftRest,setDraftRest] = useState(60);
  const [draftFormat,setDraftFormat] = useState<'rounds'|'amrap'|'emom'|'for_time'>('rounds');
  const [draftDuration,setDraftDuration] = useState(20);
  const [hyroxDate,setHyroxDate] = useState(() => localIsoDate(new Date()));
  const [hyroxMinutes,setHyroxMinutes] = useState('');
  const [hyroxKcal,setHyroxKcal] = useState('');
  const [hyroxSaving,setHyroxSaving] = useState(false);
  const [hyroxError,setHyroxError] = useState('');
  const [hyroxSuccess,setHyroxSuccess] = useState('');
  const [bulkStations,setBulkStations] = useState('');
  const [bulkError,setBulkError] = useState('');
  const [boardPhoto,setBoardPhoto] = useState<string|null>(null);
  const boardPhotoRef=useRef<string|null>(null);
  useEffect(()=>()=>{ if(boardPhotoRef.current) URL.revokeObjectURL(boardPhotoRef.current); },[]);
  function attachBoardPhoto(file:File|undefined) {
    if(!file) return;
    if(!file.type.startsWith('image/') || file.size>10_000_000) {
      setBulkError('Escolha uma imagem com até 10 MB.');
      return;
    }
    const previous=boardPhotoRef.current;
    const url=URL.createObjectURL(file);
    boardPhotoRef.current=url;
    setBoardPhoto(url);
    setBulkError('');
    if(previous) URL.revokeObjectURL(previous);
  }
  const { workouts, exercises, activityLogs, sessions } = useAppData();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [showQuickBlocks, setShowQuickBlocks] = useState(false);
  const [guideEntryId, setGuideEntryId] = useState<string | null>(null);
  const [substitutingEntryId, setSubstitutingEntryId] = useState<string | null>(null);

  const workout = workouts.find((w) => w.id === workoutId);

  if (!workout) {
    return (
      <div className="px-4 pt-6">
        <EmptyState title="Treino não encontrado" action={<Button onClick={() => navigate('/treinos')}>Voltar</Button>} />
      </div>
    );
  }

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const sorted = workout.exercises.slice().sort((a, b) => a.order - b.order);
  const circuit = sorted.length ? Boolean(sorted[0].circuitMode) : (circuitDraft || /^HYROX · Aula livre/.test(workout.name));
  const rounds = sorted.length ? (sorted[0].circuitRounds ?? 3) : draftRounds;
  const circuitRest = sorted.length ? (sorted[0].circuitRestSeconds ?? 60) : draftRest;
  const circuitFormat = sorted.length ? (sorted[0].circuitFormat ?? 'rounds') : draftFormat;
  const circuitDuration = sorted.length ? (sorted[0].circuitDurationMinutes ?? 20) : draftDuration;
  function changeCircuit(enabled: boolean) {
    setCircuitDraft(enabled);
    if (sorted.length) setWorkoutCircuit(workout!.id,enabled,rounds,circuitRest,circuitFormat,circuitDuration);
  }
  function changeRounds(value: number) {
    const next=Math.max(1,Math.min(20,value||1));
    setDraftRounds(next);
    if (sorted.length) setWorkoutCircuit(workout!.id,true,next,circuitRest,circuitFormat,circuitDuration);
  }
  function changeCircuitRest(value: number) {
    const next=Math.max(0,Math.min(900,value||0));
    setDraftRest(next);
    if (sorted.length) setWorkoutCircuit(workout!.id,true,rounds,next,circuitFormat,circuitDuration);
  }
  
  function changeCircuitFormat(value: 'rounds'|'amrap'|'emom'|'for_time') {
    setDraftFormat(value);
    if (sorted.length) setWorkoutCircuit(workout!.id,true,rounds,circuitRest,value,circuitDuration);
  }
  function changeCircuitDuration(value: number) {
    const next = Math.max(1,Math.min(180, value || 1));
    setDraftDuration(next);
    if (sorted.length) setWorkoutCircuit(workout!.id,true,rounds,circuitRest,circuitFormat,next);
  }

  /** Registro simples do que foi feito na aula; não altera estações da ficha. */
  async function registerHyroxResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hyroxSaving || !workout) return;
    setHyroxError('');
    setHyroxSuccess('');
    const minutes = Number(hyroxMinutes);
    const kcal = hyroxKcal.trim() === '' ? undefined : Number(hyroxKcal);
    const parsed = new Date(hyroxDate + 'T12:00:00');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hyroxDate) || Number.isNaN(parsed.getTime()) ||
        localIsoDate(parsed) !== hyroxDate || hyroxDate > localIsoDate(new Date())) {
      setHyroxError('Escolha uma data válida até hoje.');
      return;
    }
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) {
      setHyroxError('Informe o tempo total entre 1 e 1440 minutos.');
      return;
    }
    if (kcal !== undefined && (!Number.isInteger(kcal) || kcal < 0 || kcal > 20000)) {
      setHyroxError('As kcal devem ser um número inteiro de 0 a 20.000.');
      return;
    }
    if (activityLogs.some(log =>
      log.kind === 'hyrox' && log.date === hyroxDate && log.label === workout.name
    )) {
      setHyroxError('Esta aula já foi registrada nessa data. Consulte Atividades rápidas para evitar duplicidade.');
      return;
    }
    if (sessions.some(session =>
      session.workoutId === workout.id && session.finishedAt &&
      localIsoDate(new Date(session.finishedAt)) === hyroxDate
    )) {
      setHyroxError('Esta ficha já foi concluída nesse dia. Confira o Histórico para não somar o tempo duas vezes.');
      return;
    }
    setHyroxSaving(true);
    try {
      const saved = await addActivityLog({
        kind: 'hyrox', label: workout.name, date: hyroxDate,
        durationMin: minutes, caloriesKcal: kcal,
        notes: 'Aula HYROX registrada na configuração do circuito.',
      });
      if (!saved.ok) { setHyroxError(saved.error); return; }
      setHyroxSuccess('Aula registrada! Tempo e kcal no histórico; foguinho atualizado.');
      setHyroxMinutes('');
      setHyroxKcal('');
    } finally {
      setHyroxSaving(false);
    }
  }

  function addStationsFromText() {
    const lines = bulkStations.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    if (!lines.length) return;
    const normalize = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const catalog = new Map(exercises.map(ex=>[normalize(ex.name),ex]));
    const entries = lines.map(line=>{const [name,...goal]=line.split('|');return {name:name.trim(),goal:goal.join('|').trim()||'10 reps',ex:catalog.get(normalize(name))};});
    const missing = entries.filter(item=>!item.ex).map(item=>item.name);
    if (missing.length) {setBulkError('Exercícios não encontrados: '+missing.join(', '));return;}
    entries.forEach(item=>addExerciseToWorkout(workout!.id,item.ex!.id,1,item.goal));
    setWorkoutCircuit(workout!.id,true,rounds,circuitRest,circuitFormat,circuitDuration);
    setBulkStations('');setBulkError('');
  }

  function moveEntry(id: string, direction: -1 | 1) {
    const ids = sorted.map((e) => e.id);
    const index = ids.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderWorkoutExercises(workout!.id, ids);
  }

  function addQuickBlock(entries: [string, number, string][]) {
    const used = new Set(workout!.exercises.map((e) => e.exerciseId));
    entries.forEach(([id, sets, reps]) => {
      if (!used.has(id)) {
        addExerciseToWorkout(workout!.id, id, sets, reps);
        used.add(id);
      }
    });
    if (circuit) setWorkoutCircuit(workout!.id,true,rounds,circuitRest,circuitFormat,circuitDuration);
    setShowQuickBlocks(false);
  }


  function handleSelectExercise(ex: Exercise) {
    addExerciseToWorkout(workout!.id, ex.id, circuit ? 1 : 3, circuit ? '10 reps' : '10-12');
    if (circuit) setWorkoutCircuit(workout!.id,true,rounds,circuitRest,circuitFormat,circuitDuration);
    // Biblioteca fica aberta para seleção em lote.
  }

  function handleSelectSubstitute(ex: Exercise) {
    if (substitutingEntryId) replaceWorkoutExercise(workout!.id, substitutingEntryId, ex.id);
    setSubstitutingEntryId(null);
  }

  const substitutingExercise = substitutingEntryId
    ? exerciseById.get(workout.exercises.find((e) => e.id === substitutingEntryId)?.exerciseId ?? '')
    : null;

  function handleStart() {
    if (!sorted.length) { setBulkError('Adicione as estações que o professor passou nesta aula antes de iniciar.'); return; }
    if (circuit && !sorted.some(we=>(we.blockType ?? 'circuit')==='circuit')) {
      setBulkError('Marque ao menos uma estação no bloco Circuito antes de iniciar.');
      return;
    }
    const session = startSession(workout!);
    navigate(`/sessao/${session.id}`);
  }

  return (
    <div className="px-4">
      <div className="flex items-center gap-2 pt-5 pb-2">
        <button onClick={() => navigate('/treinos')} className="p-1 -ml-1" style={{ color: 'var(--text-dim)' }}>
          <ArrowLeft size={20} />
        </button>
        {editingName ? (
          <input
            autoFocus
            defaultValue={workout.name}
            onBlur={(e) => {
              updateWorkout(workout.id, { name: e.target.value.trim() || workout.name });
              setEditingName(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="flex-1 text-xl font-semibold rounded-lg px-2 py-1"
            style={{ background: 'var(--surface-2)' }}
          />
        ) : (
          <h1 className="text-xl font-semibold flex-1 truncate" onClick={() => setEditingName(true)}>
            {workout.emoji} {workout.name}
          </h1>
        )}
      </div>

      <div className="rounded-xl px-4 py-3 mb-3" style={{background:'var(--surface-2)'}}>
        <div className="flex justify-between items-center gap-3">
          <div><p className="text-sm font-semibold">Formato do treino</p><p className="text-xs mt-1" style={{color:'var(--text-faint)'}}>{circuit ? 'Circuito: sequência da turma em estações' : 'Tradicional: séries por exercício'}</p></div>
          <button type="button" onClick={() => changeCircuit(!circuit)} aria-pressed={circuit}
            className="rounded-lg px-3 py-2 text-xs font-semibold" style={{background:circuit?'var(--brand)':'var(--surface-3)',color:circuit?'white':'var(--text)'}}>{circuit?'Circuito ativo':'Usar circuito'}</button>
        </div>
        <details className="mt-3">
          <summary className="text-xs cursor-pointer font-semibold" style={{color:'var(--brand)'}}>
            {circuit ? 'Configurar estações, voltas e tempo' : 'Mais opções do formato'}
          </summary>
        {circuit && !sorted.length && <p className="rounded-lg p-3 mt-3 text-xs" style={{background:'var(--brand-dim)',color:'var(--text)'}}>
          Aula HYROX livre: não há exercícios obrigatórios. Escolha o circuito, movimentos, metas e número de voltas conforme o quadro do professor. Terça e quinta podem ser completamente diferentes.
        </p>}
        {circuit && <div className="flex flex-wrap gap-3 mt-3">
          <label className="text-xs w-full">Tipo de circuito
            <select aria-label="Formato do circuito" value={circuitFormat} onChange={e => changeCircuitFormat(e.target.value as 'rounds'|'amrap'|'emom'|'for_time')}
              className="block w-full rounded-lg p-2 mt-1" style={{background:'var(--surface-3)'}}>
              <option value="rounds">Por voltas (circuito tradicional)</option>
              <option value="amrap">AMRAP — máximo de voltas no tempo</option>
              <option value="emom">EMOM — uma estação por minuto</option>
              <option value="for_time">For Time — completar as voltas no menor tempo</option>
            </select>
          </label>
          {(circuitFormat === 'rounds' || circuitFormat === 'for_time') && <label className="text-xs">Voltas <input type="number" min={1} max={20} value={rounds} onChange={e => changeRounds(Number(e.target.value))} className="block w-20 rounded-lg p-2 mt-1" style={{background:'var(--surface-3)'}} /></label>}
          {circuitFormat !== 'rounds' && <label className="text-xs">{circuitFormat === 'for_time' ? 'Tempo limite (min)' : 'Duração (min)'}
            <input type="number" min={1} max={180} value={circuitDuration} onChange={e => changeCircuitDuration(Number(e.target.value))} className="block w-24 rounded-lg p-2 mt-1" style={{background:'var(--surface-3)'}} /></label>}
          {circuitFormat !== 'emom' && <label className="text-xs">Pausa entre voltas (seg) <input type="number" min={0} max={900} step={15} value={circuitRest} onChange={e => changeCircuitRest(Number(e.target.value))} className="block w-28 rounded-lg p-2 mt-1" style={{background:'var(--surface-3)'}} /></label>}
          <p className="w-full text-xs" style={{color:'var(--text-faint)'}}>{circuitFormat === 'emom' ? 'Cada minuto é uma estação, repetindo a lista até terminar a duração. Registre a conclusão ao executar.' : circuitFormat === 'amrap' ? 'Complete o máximo de voltas no tempo definido; durante a sessão, conclua as estações e adicione a próxima volta quando precisar.' : circuitFormat === 'for_time' ? 'Complete as voltas na ordem; o tempo limite é uma referência, não encerra seu registro automaticamente.' : 'Adicione as estações na ordem do professor. Em cada uma registre a meta: 500 m, 20 reps, 1 min etc.'}</p>
        </div>}
        {circuit && <p className="text-xs mt-2" style={{color:'var(--text-faint)'}}>Aquecimento, força e técnica uma vez antes das voltas; desaquecimento uma vez depois. Só as estações do Circuito se repetem.</p>}
        {circuit && (
          <form onSubmit={registerHyroxResult} className="rounded-xl border p-3 mt-4 flex flex-col gap-3"
            style={{borderColor:'var(--border)',background:'var(--surface)'}}>
            <div>
              <p className="text-sm font-semibold">Resultado da aula HYROX</p>
              <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>
                Coloque tempo total e kcal sem cadastrar estações ou trocar exercícios.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs col-span-2" style={{color:'var(--text-dim)'}}>
                Data da aula
                <input type="date" required max={localIsoDate(new Date())}
                  aria-label="Data da aula HYROX" value={hyroxDate}
                  onChange={e=>setHyroxDate(e.target.value)}
                  className="block w-full rounded-lg p-2 mt-1 text-sm"
                  style={{background:'var(--surface-3)',color:'var(--text)'}}/>
              </label>
              <label className="text-xs" style={{color:'var(--text-dim)'}}>
                Tempo total (min) *
                <input type="number" required min={1} max={1440} step="any"
                  inputMode="decimal" aria-label="Tempo total em minutos"
                  value={hyroxMinutes} onChange={e=>setHyroxMinutes(e.target.value)}
                  placeholder="Ex: 55" className="block w-full rounded-lg p-2 mt-1 text-sm"
                  style={{background:'var(--surface-3)',color:'var(--text)'}}/>
              </label>
              <label className="text-xs" style={{color:'var(--text-dim)'}}>
                Kcal gastas
                <input type="number" min={0} max={20000} step={1}
                  inputMode="numeric" aria-label="Calorias gastas em kcal"
                  value={hyroxKcal} onChange={e=>setHyroxKcal(e.target.value)}
                  placeholder="Opcional" className="block w-full rounded-lg p-2 mt-1 text-sm"
                  style={{background:'var(--surface-3)',color:'var(--text)'}}/>
              </label>
            </div>
            {hyroxError && <p role="alert" className="text-xs" style={{color:'var(--danger)'}}>{hyroxError}</p>}
            {hyroxSuccess && <p role="status" className="text-xs" style={{color:'var(--success)'}}>{hyroxSuccess}</p>}
            <button type="submit" disabled={hyroxSaving || !hyroxMinutes}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              style={{background:'var(--brand)'}}>
              {hyroxSaving ? 'Salvando aula...' : 'Salvar resultado da aula'}
            </button>
            <p className="text-[11px]" style={{color:'var(--text-faint)'}}>
              Salva como atividade concluída, sem iniciar outra sessão. Não lance novamente uma ficha já finalizada.
            </p>
          </form>
        )}
        {circuit && <div className="mt-3 border-t pt-3" style={{borderColor:'var(--border)'}}>
          <label className="text-xs font-semibold" htmlFor="circuit-stations">Sequência do quadro da aula</label>
          <label className="mt-2 block rounded-lg border p-3 text-xs cursor-pointer" style={{borderColor:'var(--border)',color:'var(--brand)'}}>
            Fotografar ou selecionar foto do quadro
            <input type="file" accept="image/*" capture="environment" className="block w-full mt-2 text-xs"
              onChange={e=>{attachBoardPhoto(e.currentTarget.files?.[0]);e.currentTarget.value='';}}/>
          </label>
          {boardPhoto && <div className="mt-2">
            <img src={boardPhoto} alt="Foto do quadro da aula; referência para transcrever as estações" className="w-full max-h-72 object-contain rounded-lg"
              style={{background:'var(--surface)'}}/>
            <button type="button" className="text-xs underline mt-1" onClick={()=>{
              if(boardPhotoRef.current) URL.revokeObjectURL(boardPhotoRef.current);
              boardPhotoRef.current=null;setBoardPhoto(null);
            }}>Remover foto</button>
          </div>}
          <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>
            A foto fica somente nesta tela, sem upload. Confira o quadro e transcreva cada estação; não há leitura automática da imagem.
          </p>
          <p className="text-xs mt-1 mb-2" style={{color:'var(--text-faint)'}}>Uma estação por linha: nome exato do catálogo | meta. Exemplo: SkiErg | 500 m</p>
          <textarea id="circuit-stations" rows={3} value={bulkStations} onChange={e=>setBulkStations(e.target.value)}
            placeholder={'SkiErg | 500 m\nWall ball | 20 reps'} className="w-full rounded-lg p-3 text-sm" style={{background:'var(--surface-3)'}} />
          {bulkError && <p role="alert" className="text-xs mt-2" style={{color:'var(--danger)'}}>{bulkError}</p>}
          <button type="button" onClick={addStationsFromText} disabled={!bulkStations.trim()}
            className="mt-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-40"
            style={{background:'var(--brand)',color:'white'}}>Adicionar sequência</button>
        </div>}
        </details>
      </div>
      <div className="mb-3">
        <button type="button" onClick={() => setShowQuickBlocks((open) => !open)}
          className="w-full flex items-center justify-between rounded-xl py-3 px-4 text-sm font-semibold"
          style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}>
          <span className="flex items-center gap-2"><Sparkles size={16} /> Treinos prontos para adicionar</span>
          <span>{showQuickBlocks ? 'Fechar' : 'Explorar'}</span>
        </button>
        {showQuickBlocks && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Adiciona exercícios novos sem apagar os existentes. Confira equipamentos, cargas e descanso.
            </p>
            {QUICK_BLOCKS.map((block) => (
              <button key={block.title} type="button" onClick={() => addQuickBlock(block.entries)}
                className="w-full rounded-xl px-4 py-3 text-left"
                style={{ background: 'var(--surface-2)' }}>
                <p className="text-sm font-medium">{block.title}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{block.subtitle} · {block.entries.length} exercícios</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl mb-3 p-3" style={{background:'var(--brand-dim)'}}>
        <p className="text-sm font-semibold">2 · Escolha e organize os exercícios</p>
        <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>
          {sorted.length} selecionado(s) · use a biblioteca e ajuste os detalhes depois.
        </p>
      </div>
      {sorted.length === 0 ? (
        <EmptyState
          title="Seu treino está vazio"
          subtitle="Escolha os exercícios primeiro. Séries e repetições podem ser ajustadas depois."
          action={
            <Button onClick={() => setPickerOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus size={16} /> Adicionar exercício
              </span>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5 pb-40">
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--brand)' }}
          >
            <Plus size={16} /> Adicionar exercício
          </button>
          {sorted.map((we) => {
            const ex = exerciseById.get(we.exerciseId);
            return (
              <Card key={we.id} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col shrink-0 gap-0.5">
                    <button type="button" aria-label="Subir exercício" disabled={sorted[0]?.id === we.id}
                      onClick={() => moveEntry(we.id, -1)} className="disabled:opacity-20"
                      style={{ color: 'var(--text-faint)' }}><ArrowUp size={14}/></button>
                    <button type="button" aria-label="Descer exercício" disabled={sorted[sorted.length - 1]?.id === we.id}
                      onClick={() => moveEntry(we.id, 1)} className="disabled:opacity-20"
                      style={{ color: 'var(--text-faint)' }}><ArrowDown size={14}/></button>
                  </div>
                  <button type="button" aria-label={`Ver execução de ${ex?.name ?? 'exercício'}`}
                    onClick={() => setGuideEntryId(guideEntryId === we.id ? null : we.id)}>
                    <ExerciseThumbnail exercise={ex} size={55}/>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ex?.name ?? 'Exercício removido'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                      {ex ? MUSCLE_GROUP_LABELS[ex.muscleGroup] : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setSubstitutingEntryId(we.id)}
                    style={{ color: 'var(--text-faint)' }}
                    className="shrink-0"
                    aria-label="Trocar exercício"
                  >
                    <Repeat size={16} />
                  </button>
                  <button
                    onClick={() => removeExerciseFromWorkout(workout.id, we.id)}
                    style={{ color: 'var(--text-faint)' }}
                    className="shrink-0"
                    aria-label="Remover exercício"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex justify-start pl-7">
                  <button type="button" onClick={() => setGuideEntryId(guideEntryId === we.id ? null : we.id)}
                    className="text-xs underline" style={{color:'var(--brand)'}}>
                    {guideEntryId === we.id ? 'Ocultar execução' : 'Ver demonstração e execução'}
                  </button>
                </div>
                {guideEntryId === we.id && <ExerciseGuide exercise={ex}/>}
                <div className="flex items-center gap-1.5 pl-7">
                  <input
                    type="number"
                    min={1}
                    value={we.targetSets}
                    onChange={(e) => updateWorkoutExercise(workout.id, we.id, { targetSets: Number(e.target.value) || 1 })}
                    disabled={circuit}
                    className="w-11 text-center rounded-lg py-1.5 text-sm disabled:opacity-40"
                    style={{ background: 'var(--surface-2)' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    {circuit ? 'meta:' : 'séries ×'}
                  </span>
                  <input
                    value={we.targetReps}
                    onChange={(e) => updateWorkoutExercise(workout.id, we.id, { targetReps: e.target.value })}
                    className="w-24 text-center rounded-lg py-1.5 text-sm"
                    style={{ background: 'var(--surface-2)' }}
                    placeholder="reps/tempo"
                  />
                </div>
                <details className="pl-7">
                  <summary className="text-xs cursor-pointer py-2" style={{color:'var(--brand)'}}>Descanso, observações e bloco</summary>
                  <div className="flex flex-col gap-2 pt-2">
                  {circuit && <label className="text-xs" style={{color:'var(--text-dim)'}}>Bloco da aula
                    <select value={we.blockType ?? 'circuit'} onChange={e=>updateWorkoutExercise(workout.id,we.id,{blockType:e.target.value as NonNullable<typeof we.blockType>})}
                      className="block rounded-lg p-2 mt-1 w-full" style={{background:'var(--surface-2)'}}>
                      <option value="warmup">1 · Aquecimento</option>
                      <option value="strength">2 · Força</option>
                      <option value="technique">3 · Técnica</option>
                      <option value="circuit">4 · Circuito (repete)</option>
                      <option value="cooldown">5 · Desaquecimento</option>
                    </select>
                  </label>}
                  {!circuit && <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                    Descanso entre séries (seg)
                    <input type="number" min={0} max={600} step={15} value={we.restSeconds ?? 90}
                      onChange={(e) => updateWorkoutExercise(workout.id, we.id, { restSeconds: Number(e.target.value) || 0 })}
                      className="w-20 rounded-lg px-2 py-1.5 text-xs" style={{ background: 'var(--surface-2)' }} />
                  </label>}
                  <textarea rows={2} value={we.notes ?? ''}
                    onChange={(e) => updateWorkoutExercise(workout.id, we.id, { notes: e.target.value })}
                    placeholder="Instruções, intensidade, adaptações ou equipamento..."
                    className="w-full rounded-lg px-3 py-2 text-xs resize-y"
                    style={{ background: 'var(--surface-2)' }} />
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      )}

      {sorted.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 mx-auto max-w-[560px] px-4">
          <Button full onClick={handleStart}>
            <span className="flex items-center justify-center gap-2">
              <Play size={16} fill="currentColor" /> Iniciar treino
            </span>
          </Button>
        </div>
      )}

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)}
        onSelect={handleSelectExercise} title="Adicionar exercícios"
        multiSelect selectedExerciseIds={sorted.map(entry=>entry.exerciseId)} />

      <ExercisePicker
        open={substitutingEntryId !== null}
        onClose={() => setSubstitutingEntryId(null)}
        onSelect={handleSelectSubstitute}
        title="Trocar exercício"
        defaultMuscleGroup={substitutingExercise?.muscleGroup}
        excludeExerciseId={substitutingExercise?.id}
      />
    </div>
  );
}
