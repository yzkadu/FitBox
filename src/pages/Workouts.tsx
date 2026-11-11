import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Dumbbell, ChevronRight, Trash2, CalendarDays, Bot, Check, X as XIcon, Sparkles, LayoutGrid, Wand2, PersonStanding, Search, BookOpen, ArrowRight, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { createWorkout, duplicateWorkout, deleteWorkout, setDaySchedule } from '../lib/actions';
import { applyNewWorkoutProposal } from '../lib/aiProposalApply';
import { buildCoachContext } from '../lib/aiCoachContext';
import { askAiCoach, AiCoachError, type NewWorkoutProposal } from '../lib/aiCoach';
import { Card, Button, EmptyState, AppIcon } from '../components/ui';
import { KaduProgramBanner } from '../components/KaduProgramBanner';
import { ICON_KEYS } from '../lib/workoutIcons';
import { WEEKDAY_ORDER, WEEKDAY_LABELS } from '../types';
import type { ScheduledActivity, Weekday, Workout } from '../types';
import { getActivitiesForDay } from '../lib/nextTraining';

const IA_SUGGESTIONS = [
  'Perna (quadríceps e posterior)',
  'Push (peito, ombro e tríceps)',
  'Pull (costas e bíceps)',
  'Upper body completo',
  'Full body',
  'Core e cardio',
];

/** Cada dia aceita múltiplas atividades, sem ordem ou obrigatoriedade. */
function WeeklyScheduleEditor() {
  const { weeklySchedule, workouts } = useAppData();
  const active = workouts.filter(w => !w.archived);
  const [opened, setOpened] = useState<Weekday | null>(null);

  function save(day: Weekday, activities: ScheduledActivity[]) {
    setDaySchedule(day, activities.length ? { kind: 'multi', activities } : { kind: 'descanso' });
  }

  function add(day: Weekday, value: string) {
    if (!value) return;
    const current = getActivitiesForDay(weeklySchedule[day]);
    if (value === 'cardio') {
      if (current.some(x => x.kind === 'cardio')) return;
      save(day, [...current, { kind: 'cardio', label: 'Corrida / cardio livre' }]);
    } else if (value.startsWith('treino:')) {
      const workoutId = value.slice('treino:'.length);
      if (!active.some(w => w.id === workoutId) || current.some(x => x.kind === 'treino' && x.workoutId === workoutId)) return;
      save(day, [...current, { kind: 'treino', workoutId }]);
    }
  }

  function remove(day: Weekday, index: number) {
    save(day, getActivitiesForDay(weeklySchedule[day]).filter((_, i) => i !== index));
  }

  function updateCardio(day: Weekday, index: number, patch: Partial<Extract<ScheduledActivity, {kind:'cardio'}>>) {
    const activities = getActivitiesForDay(weeklySchedule[day]);
    const activity = activities[index];
    if (activity?.kind !== 'cardio') return;
    save(day, activities.map((a, i) => i === index ? {...activity, ...patch} : a));
  }

  return (
    <Card className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={16} style={{ color: 'var(--brand)' }}/>
        <p className="text-sm font-semibold">Programação livre da semana</p>
      </div>
      <p className="text-xs mb-3" style={{color: 'var(--text-faint)'}}>
        Combine musculação, HYROX, corrida e core no mesmo dia.
        As opções são independentes: faça uma, várias ou nenhuma, na ordem que preferir.
      </p>
      <div className="flex flex-col gap-2">
        {WEEKDAY_ORDER.map(day => {
          const activities = getActivitiesForDay(weeklySchedule[day]);
          const isOpen = opened === day;
          return (
            <div key={day} className="rounded-xl p-2.5" style={{background:'var(--surface-2)'}}>
              <button type="button" onClick={() => setOpened(isOpen ? null : day)}
                className="flex items-center gap-2 w-full text-left">
                <span className="text-xs font-semibold w-16 shrink-0">{WEEKDAY_LABELS[day]}</span>
                <span className="flex-1 min-w-0 text-xs" style={{color:'var(--text-dim)'}}>
                  {activities.length === 0 ? 'Descanso / livre' :
                    activities.map(a => a.kind === 'cardio' ? (a.label || 'Corrida/cardio') :
                      (active.find(w => w.id === a.workoutId)?.name || 'Treino')).join(' + ')}
                </span>
                <span className="text-xs" style={{color:'var(--brand)'}}>{isOpen ? 'Fechar' : 'Editar'}</span>
              </button>
              {isOpen && (
                <div className="mt-3 flex flex-col gap-2">
                  {activities.map((activity, index) => (
                    <div key={activity.kind === 'treino' ? activity.workoutId : 'cardio'}
                      className="rounded-lg p-2.5" style={{background:'var(--surface)'}}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs flex-1">
                          {activity.kind === 'cardio' ? 'Corrida / cardio' :
                            active.find(w => w.id === activity.workoutId)?.name ?? 'Treino não encontrado'}
                        </span>
                        <button type="button" onClick={() => remove(day,index)}
                          aria-label="Remover opção deste dia"
                          className="text-xs" style={{color:'var(--danger)'}}>Remover</button>
                      </div>
                      {activity.kind === 'cardio' && (
                        <div className="grid grid-cols-[1fr_76px] gap-2 mt-2">
                          <input aria-label="Descrição do cardio" value={activity.label ?? ''}
                            onChange={e => updateCardio(day,index,{label:e.target.value})}
                            placeholder="Corrida leve, tiros, caminhada..." className="text-xs p-2 rounded-lg min-w-0"
                            style={{background:'var(--surface-2)'}}/>
                          <input type="number" aria-label="Duração opcional em minutos"
                            min={0} max={180} placeholder="Min"
                            value={activity.suggestedDurationMin ?? ''}
                            onChange={e=>updateCardio(day,index,{suggestedDurationMin:e.target.value ? Math.min(180,Math.max(1,Number(e.target.value))) : undefined})}
                            className="text-xs p-2 rounded-lg w-full" style={{background:'var(--surface-2)'}}/>
                        </div>
                      )}
                    </div>
                  ))}
                  <select value="" aria-label={`Adicionar atividade para ${WEEKDAY_LABELS[day]}`}
                    onChange={e => add(day,e.target.value)}
                    className="rounded-lg p-2.5 text-xs w-full" style={{background:'var(--surface)'}}>
                    <option value="">+ Adicionar outra opção...</option>
                    {!activities.some(a => a.kind === 'cardio') && <option value="cardio">Corrida / cardio</option>}
                    {active.filter(w => !activities.some(a => a.kind === 'treino' && a.workoutId === w.id))
                      .map(w => <option key={w.id} value={'treino:'+w.id}>{w.name}</option>)}
                  </select>
                  {activities.length > 0 && <button type="button" onClick={() => save(day,[])}
                    className="text-xs text-left p-1" style={{color:'var(--text-faint)'}}>Deixar este dia livre</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function formatLastUsed(iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

/** Card de treino — mesmo componente pro destaque (maior, primeiro da lista)
 * e pros secundários (compactos), só muda o tamanho. Evita a "grade de cards
 * idênticos" que o brief visual pede pra não repetir. */
function WorkoutRow({
  w,
  lastUsed,
  featured,
  confirming,
  onOpen,
  onAskDelete,
  onDuplicate,
  onCancelDelete,
  onConfirmDelete,
}: {
  w: Workout;
  lastUsed: string | null;
  featured: boolean;
  confirming: boolean;
  onOpen: () => void;
  onAskDelete: () => void;
  onDuplicate: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  if (confirming) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <p className="text-sm">Excluir "{w.name}"? O histórico de treinos realizados é mantido.</p>
        <div className="flex gap-2 shrink-0">
          <button onClick={onCancelDelete} className="text-xs px-2 py-1.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
            Cancelar
          </button>
          <button
            onClick={onConfirmDelete}
            className="text-xs px-2 py-1.5 rounded-lg text-white flex items-center gap-1"
            style={{ background: 'var(--danger)' }}
          >
            <Trash2 size={12} /> Excluir
          </button>
        </div>
      </Card>
    );
  }

  if (featured) {
    return (
      <Card className="!p-0 overflow-hidden" style={{ borderColor: 'var(--brand)' }}>
        <div className="flex items-stretch">
          <button onClick={onOpen} className="flex-1 flex items-center gap-4 px-5 py-5 text-left min-w-0">
            <span
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
            >
              <AppIcon value={w.emoji} size={26} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--brand-2)' }}>
                {lastUsed ? `treinado ${lastUsed}` : 'ainda não treinado'}
              </p>
              <p className="font-semibold text-lg truncate" style={{ fontFamily: 'var(--font-display)' }}>
                {w.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {w.exercises.length} exercício{w.exercises.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-faint)' }} />
          </button>
          <button type="button" onClick={onDuplicate} aria-label={'Duplicar '+w.name}
            title="Duplicar ficha" className="px-3 self-stretch flex items-center" style={{ color: 'var(--brand)' }}>
            <Copy size={16} />
          </button>
          <button type="button" onClick={onAskDelete} aria-label={'Excluir '+w.name}
            className="px-4 self-stretch flex items-center" style={{ color: 'var(--text-faint)' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center">
        <button onClick={onOpen} className="flex-1 flex items-center gap-3 px-4 py-3 text-left min-w-0">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}
          >
            <AppIcon value={w.emoji} size={15} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{w.name}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
              {w.exercises.length} exercício{w.exercises.length !== 1 ? 's' : ''}
              {lastUsed ? ` · ${lastUsed}` : ''}
            </p>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-faint)' }} />
        </button>
        <button type="button" onClick={onDuplicate} aria-label={'Duplicar '+w.name}
          title="Duplicar ficha" className="px-3 self-stretch flex items-center" style={{ color: 'var(--brand)' }}>
          <Copy size={14} />
        </button>
        <button type="button" onClick={onAskDelete} aria-label={'Excluir '+w.name}
          className="px-3 self-stretch flex items-center" style={{ color: 'var(--text-faint)' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </Card>
  );
}

export function Workouts() {
  const appData = useAppData();
  const { workouts, exercises, sessions } = appData;
  const { user } = useAuth();
  const [profile] = useProfile(user?.id);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<'manual' | 'ia'>('manual');
  const [workoutQuery, setWorkoutQuery] = useState('');
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [chooseIconOpen, setChooseIconOpen] = useState(false);
  const [name, setName] = useState('');
  const [newCircuit, setNewCircuit] = useState(false);
  const [emoji, setEmoji] = useState<string>(ICON_KEYS[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError,setDeleteError] = useState('');
  const [deletingId,setDeletingId] = useState<string | null>(null);

  const [iaPrompt, setIaPrompt] = useState('');
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [iaReply, setIaReply] = useState<string | null>(null);
  const [iaProposal, setIaProposal] = useState<NewWorkoutProposal | null>(null);

  const active = workouts.filter((w) => !w.archived);

  const lastUsedByWorkout = new Map<string, string>();
  for (const s of sessions) {
    if (!s.finishedAt || !s.workoutId) continue;
    const prev = lastUsedByWorkout.get(s.workoutId);
    if (!prev || Date.parse(s.finishedAt) > Date.parse(prev)) lastUsedByWorkout.set(s.workoutId, s.finishedAt);
  }
  const featuredId =
    [...lastUsedByWorkout.entries()].sort((a, b) => Date.parse(b[1]) - Date.parse(a[1]))[0]?.[0] ?? active[0]?.id;
  const matches = active.filter(w => w.name.toLocaleLowerCase('pt-BR').includes(workoutQuery.trim().toLocaleLowerCase('pt-BR')));
  const featuredWorkout = matches.find(w => w.id === featuredId) ?? matches[0] ?? null;
  const secondaryWorkouts = matches.filter(w => w.id !== featuredWorkout?.id);

  function handleDuplicateWorkout(source: Workout) {
    const copy=duplicateWorkout(source);
    navigate('/treinos/'+copy.id);
  }

  async function confirmWorkoutDelete(id:string) {
    if (deletingId) return;
    setDeletingId(id);
    setDeleteError('');
    const result=await deleteWorkout(id);
    setDeletingId(null);
    if (result.ok) setConfirmDeleteId(null);
    else setDeleteError(result.error);
  }

  function resetIaState() {
    setIaPrompt('');
    setIaLoading(false);
    setIaError(null);
    setIaReply(null);
    setIaProposal(null);
  }

  function openCreate() {
    setMode('manual');
    resetIaState();
    setChooseIconOpen(false);
    setCreating(true);
  }

  function closeCreate() {
    setCreating(false);
    setName('');
    setNewCircuit(false);
    resetIaState();
  }

  function handleCreate() {
    if (!name.trim()) return;
    const circuit = newCircuit;
    const w = createWorkout(name.trim(), emoji);
    closeCreate();
    navigate(`/treinos/${w.id}${circuit ? '?circuit=1' : ''}`);
  }

  async function handleAiSubmit() {
    const description = iaPrompt.trim();
    if (!description || iaLoading) return;
    setIaError(null);
    setIaReply(null);
    setIaProposal(null);
    setIaLoading(true);
    try {
      const context = buildCoachContext(appData, profile?.name);
      const question = `Monta um treino novo do zero: ${description}`;
      const { reply, proposal } = await askAiCoach(question, context, []);
      if (proposal?.kind === 'newWorkout') {
        setIaProposal(proposal.data);
      } else {
        setIaReply(reply || 'Não consegui montar um treino a partir disso — tenta descrever de outro jeito.');
      }
    } catch (err) {
      setIaError(err instanceof AiCoachError ? err.message : 'Não consegui falar com a IA agora. Tenta de novo.');
    } finally {
      setIaLoading(false);
    }
  }

  function applyIaProposal() {
    if (!iaProposal) return;
    const workoutId = applyNewWorkoutProposal(iaProposal, exercises);
    closeCreate();
    navigate(`/treinos/${workoutId}`);
  }

  function discardIaProposal() {
    setIaProposal(null);
    setIaReply(null);
  }

  return (
    <div className="px-4 lg:px-0">
      <div className="flex items-start justify-between gap-3 pt-5 pb-4 lg:pt-0 lg:pb-6">
        <h1
          className="text-3xl lg:text-4xl"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.01em' }}
        >
          Meus treinos
        </h1>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              setMode('ia');
              resetIaState();
              setCreating(true);
            }}
            aria-label="Gerar com IA"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface-2)', color: 'var(--brand-2)' }}
          >
            <Wand2 size={17} />
          </button>
          <button
            onClick={openCreate}
            aria-label="Criar treino"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {deleteError && <p role="alert" className="text-xs rounded-xl p-3 mb-3"
        style={{color:'var(--danger)',background:'var(--surface-2)'}}>{deleteError}</p>}
      {deletingId && <p role="status" className="text-xs mb-3" style={{color:'var(--text-dim)'}}>
        Confirmando exclusão no servidor...
      </p>}
      <section className="mb-4" aria-label="Ações principais para treinar">
        <p className="text-xs mb-2" style={{color:'var(--text-dim)'}}>Crie sua ficha ou consulte a biblioteca completa.</p>
        <button type="button" onClick={openCreate}
          className="w-full rounded-xl px-4 py-4 mb-2 text-left flex items-center gap-3"
          style={{background:'var(--brand)',color:'white'}}>
          <Plus size={22} />
          <span className="flex-1"><strong className="block text-base">Criar treino</strong>
            <span className="block mt-1 text-xs" style={{opacity:.85}}>Nome → exercícios → ajustes opcionais</span>
          </span>
          <ChevronRight size={18}/>
        </button>
      <button type="button" onClick={() => navigate('/treinos/catalogo')}
        className="w-full flex items-center gap-3 text-left rounded-xl px-4 py-3 mb-5"
        style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
        <BookOpen size={20} style={{color:'var(--brand)'}}/>
        <span className="flex-1">
          <strong className="text-sm block">Biblioteca de exercícios</strong>
          <span className="text-xs block mt-1" style={{color:'var(--text-dim)'}}>
            Ver todos os {exercises.length} exercícios por músculo, aparelho e execução
          </span>
        </span><ChevronRight size={17} style={{color:'var(--text-faint)'}}/>
      </button>
      </section>
      <details className="mb-4 rounded-xl p-3" style={{background:"var(--surface-2)"}}>
        <summary className="cursor-pointer text-sm font-semibold" style={{color:"var(--brand)"}}>Outras maneiras de montar: IA, programas e semana</summary>
        <section className="pt-4" aria-label="Outras maneiras de criar treinos">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{color:'var(--brand)'}}>Comece por aqui</p>
          <h2 className="text-xl font-semibold mt-1">Como quer montar seu treino?</h2>
          <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>Escolha os exercícios na biblioteca ou comece com uma sugestão.</p>
        </div>
        <button type="button" onClick={() => navigate('/montador')}
          className="w-full text-left rounded-2xl p-4 mb-2 flex items-center gap-3"
          style={{background:'var(--brand)',color:'white',border:'1px solid var(--brand)'}}>
          <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{background:'rgba(255,255,255,.16)'}}><Sparkles size={23}/></span>
          <span className="flex-1 min-w-0">
            <span className="text-base font-semibold block">Montar minha semana</span>
            <span className="text-xs mt-1 block" style={{opacity:.85}}>
              Objetivo, modalidades, equipamentos e dias — tudo em 3 etapas
            </span>
            <span className="text-xs font-semibold mt-2 block">
              Começar montador guiado <ArrowRight size={13} className="inline"/>
            </span>
          </span>
        </button>
        <button type="button" onClick={() => navigate('/programas')}
          className="w-full text-left rounded-2xl p-4 mb-2 flex items-center gap-3"
          style={{background:'linear-gradient(110deg, var(--brand-dim), var(--surface-2))',border:'1px solid var(--brand)'}}>
          <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{background:'var(--brand)',color:'white'}}><LayoutGrid size={23}/></span>
          <span className="flex-1 min-w-0">
            <span className="text-base font-semibold block">Explorar programas prontos</span>
            <span className="text-xs mt-1 block" style={{color:'var(--text-dim)'}}>
              Emagrecimento, HYROX, musculação, corrida e treinos em casa
            </span>
            <span className="text-xs font-semibold mt-2 block" style={{color:'var(--brand)'}}>
              Encontrar meu programa <ArrowRight size={12} className="inline"/>
            </span>
          </span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => {setMode('ia');resetIaState();setCreating(true);}}
            className="rounded-xl p-3 flex items-start gap-2 text-left"
            style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            <Wand2 size={19} className="shrink-0 mt-0.5" style={{color:'var(--brand)'}}/>
            <span><span className="text-sm font-semibold block">Criar com IA</span>
              <span className="text-[11px] block mt-1" style={{color:'var(--text-faint)'}}>Descreva seu objetivo e revise a sugestão</span>
            </span>
          </button>
          <button type="button" onClick={openCreate}
            className="rounded-xl p-3 flex items-start gap-2 text-left"
            style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            <Plus size={19} className="shrink-0 mt-0.5" style={{color:'var(--brand)'}}/>
            <span><span className="text-sm font-semibold block">Criar do zero</span>
              <span className="text-[11px] block mt-1" style={{color:'var(--text-faint)'}}>Escolha exercícios, séries e repetições</span>
            </span>
          </button>
        </div>
        </section>
      </details>

      <KaduProgramBanner workouts={workouts} exercises={exercises} />

      {creating && (
        <Card className="mb-4">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMode('manual')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium"
              style={{
                background: mode === 'manual' ? 'var(--brand)' : 'var(--surface-2)',
                color: mode === 'manual' ? 'white' : 'var(--text-dim)',
              }}
            >
              <Dumbbell size={13} /> Manual
            </button>
            <button
              onClick={() => setMode('ia')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium"
              style={{
                background: mode === 'ia' ? 'var(--brand)' : 'var(--surface-2)',
                color: mode === 'ia' ? 'white' : 'var(--text-dim)',
              }}
            >
              <Bot size={13} /> Pedir para a IA
            </button>
          </div>

          {mode === 'manual' ? (
            <>
              <p className="text-sm font-semibold mb-1">1 · Dê um nome ao treino</p>
              <p className="text-xs mb-3" style={{color:'var(--text-dim)'}}>
                Na próxima tela, escolha os exercícios. Séries, ordem e ajustes ficam disponíveis depois.
              </p>
              <label htmlFor="new-workout-name" className="block text-xs font-medium mb-1.5"
                style={{color:'var(--text-dim)'}}>Nome da ficha</label>
              <input
                id="new-workout-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Ex.: Treino A · Peito e tríceps"
                className="w-full rounded-xl px-3 py-3 text-sm mb-3"
                style={{background:'var(--surface-2)',color:'var(--text)'}}
              />
              <div className="flex gap-1.5 flex-wrap mb-3" aria-label="Sugestões de nomes para ficha">
                {['Superior A','Inferior completo','Full body','HYROX livre'].map(suggestion=>(
                  <button key={suggestion} type="button" onClick={()=>setName(suggestion)}
                    className="rounded-full px-2.5 py-1.5 text-[11px]"
                    style={{background:'var(--surface-2)',color:'var(--text-dim)'}}>
                    {suggestion}
                  </button>
                ))}
              </div>
              <button type="button" aria-pressed={newCircuit} onClick={() => setNewCircuit(v => !v)}
                className="w-full text-left rounded-xl px-3 py-3 mb-3 text-sm"
                style={{background: newCircuit ? 'var(--brand-dim)' : 'var(--surface-2)', color: newCircuit ? 'var(--brand)' : 'var(--text)'}}>
                <strong>{newCircuit ? '✓ ' : ''}Circuito HYROX / funcional</strong>
                <span className="block text-xs mt-1">Estações em sequência e voltas, conforme a aula do professor.</span>
              </button>
              <button type="button" onClick={()=>setChooseIconOpen(v=>!v)}
                aria-expanded={chooseIconOpen}
                className="text-xs mb-3 flex items-center gap-1.5"
                style={{color:'var(--brand)'}}>
                <AppIcon value={emoji} size={15}/> Escolher ícone (opcional)
                {chooseIconOpen?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
              </button>
              {chooseIconOpen && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {ICON_KEYS.map((k) => (
                    <button type="button" key={k}
                      aria-pressed={emoji===k} aria-label={`Ícone ${k}`}
                      onClick={() => setEmoji(k)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: emoji === k ? 'var(--brand)' : 'var(--surface-2)',
                        color: emoji === k ? 'white' : 'var(--text-dim)',
                      }}>
                      <AppIcon value={k} size={17}/>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" full onClick={closeCreate}>
                  Cancelar
                </Button>
                <Button full onClick={handleCreate}>
                  Próximo · escolher exercícios
                </Button>
              </div>
            </>
          ) : iaProposal ? (
            <>
              <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <AppIcon value={iaProposal.emoji} size={15} />
                {iaProposal.name}
              </p>
              <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>
                Revise antes de aplicar — nada é criado até você confirmar.
              </p>
              <ul className="flex flex-col gap-1 mb-3">
                {iaProposal.exercises.map((ex, ei) => (
                  <li key={ei} className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    • {ex.exerciseName} — {ex.targetSets}x{ex.targetReps}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button
                  onClick={discardIaProposal}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}
                >
                  <XIcon size={13} /> Descartar
                </button>
                <button
                  onClick={applyIaProposal}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-white"
                  style={{ background: 'var(--brand)' }}
                >
                  <Check size={13} /> Aplicar e criar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium mb-2">Que tipo de treino você quer?</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {IA_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setIaPrompt(s)}
                    className="text-[11px] px-2.5 py-1.5 rounded-full flex items-center gap-1"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}
                  >
                    <Sparkles size={11} style={{ color: 'var(--brand)' }} />
                    {s}
                  </button>
                ))}
              </div>
              <textarea
                autoFocus
                value={iaPrompt}
                onChange={(e) => setIaPrompt(e.target.value)}
                placeholder="Descreva o treino: grupo muscular, duração, foco..."
                rows={2}
                className="w-full rounded-xl px-3 py-2.5 text-sm mb-3 resize-none"
                style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
              />

              {iaReply && (
                <div className="rounded-xl px-3 py-2.5 text-xs mb-3" style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}>
                  {iaReply}
                </div>
              )}
              {iaError && (
                <div className="rounded-xl px-3 py-2.5 text-xs mb-3" style={{ background: '#ef444426', color: 'var(--danger)' }}>
                  {iaError}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="secondary" full onClick={closeCreate}>
                  Cancelar
                </Button>
                <Button full onClick={handleAiSubmit} disabled={iaLoading || !iaPrompt.trim()}>
                  {iaLoading ? 'Pensando...' : 'Pedir sugestão'}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      <section className="mb-4" aria-label="Suas fichas de treino">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <h2 className="text-lg font-semibold">Suas fichas</h2>
            <p className="text-xs" style={{color:'var(--text-faint)'}}>
              {active.length} treino{active.length === 1 ? '' : 's'} salvo{active.length === 1 ? '' : 's'}
            </p>
          </div>
          <button type="button" onClick={() => navigate('/musculos')}
            className="text-xs flex items-center gap-1" style={{color:'var(--brand)'}}>
            <PersonStanding size={15}/> Mapa muscular
          </button>
        </div>
        {active.length > 3 && (
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{color:'var(--text-faint)'}}/>
            <input type="search" value={workoutQuery} onChange={e=>setWorkoutQuery(e.target.value)}
              placeholder="Encontrar uma ficha pelo nome..." aria-label="Buscar treino salvo"
              className="w-full rounded-xl pl-9 pr-3 py-3 text-sm"
              style={{background:'var(--surface-2)',color:'var(--text)'}}/>
          </div>
        )}
      </section>

      {active.length === 0 && !creating ? (
        <EmptyState
          title="Nenhum treino criado ainda"
          subtitle="Monte seu primeiro treino para começar a registrar seu progresso."
          action={
            <Button onClick={openCreate}>
              <span className="flex items-center gap-2">
                <Plus size={16} /> Criar treino
              </span>
            </Button>
          }
        />
      ) : matches.length === 0 && active.length > 0 ? (
        <p className="text-sm text-center py-8" style={{color:'var(--text-dim)'}}>
          Nenhuma ficha encontrada. Tente outro nome.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5 pb-4">
          {featuredWorkout && (
            <WorkoutRow
              w={featuredWorkout}
              featured
              lastUsed={lastUsedByWorkout.has(featuredWorkout.id) ? formatLastUsed(lastUsedByWorkout.get(featuredWorkout.id)!) : null}
              confirming={confirmDeleteId === featuredWorkout.id}
              onOpen={() => navigate(`/treinos/${featuredWorkout.id}`)}
              onDuplicate={() => handleDuplicateWorkout(featuredWorkout)}
              onAskDelete={() => setConfirmDeleteId(featuredWorkout.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onConfirmDelete={() => {void confirmWorkoutDelete(featuredWorkout.id);}}
            />
          )}

          {secondaryWorkouts.length > 0 && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mt-2 mb-0.5" style={{ color: 'var(--text-faint)' }}>
              Outros treinos
            </p>
          )}

          {secondaryWorkouts.map((w) => (
            <WorkoutRow
              key={w.id}
              w={w}
              featured={false}
              lastUsed={lastUsedByWorkout.has(w.id) ? formatLastUsed(lastUsedByWorkout.get(w.id)!) : null}
              confirming={confirmDeleteId === w.id}
              onOpen={() => navigate(`/treinos/${w.id}`)}
              onDuplicate={() => handleDuplicateWorkout(w)}
              onAskDelete={() => setConfirmDeleteId(w.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onConfirmDelete={() => {void confirmWorkoutDelete(w.id);}}
            />
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="flex items-center gap-2 mt-2 mb-6 text-xs" style={{ color: 'var(--text-faint)' }}>
          <Dumbbell size={14} />
          <span>Toque em um treino para editar os exercícios</span>
        </div>
      )}
      <div className="mb-6 mt-5">
        <button type="button" onClick={() => setPlannerOpen(v => !v)}
          aria-expanded={plannerOpen}
          className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left"
          style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
          <CalendarDays size={20} style={{color:'var(--brand)'}}/>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Organizar minha semana</span>
            <span className="block text-xs mt-1" style={{color:'var(--text-dim)'}}>
              Distribua fichas e cardio livremente pelos dias
            </span>
          </span>
          {plannerOpen ? <ChevronUp size={19}/> : <ChevronDown size={19}/>}
        </button>
        {plannerOpen && <div className="mt-3"><WeeklyScheduleEditor /></div>}
      </div>
    </div>
  );
}
