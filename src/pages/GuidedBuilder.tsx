import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronUp, Dumbbell, Info, Minus, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { Button, Card, PageHeader, AppIcon } from '../components/ui';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { BUILTIN_EXERCISES } from '../lib/exercises';
import { WEEKDAY_ORDER, WEEKDAY_LABELS } from '../types';
import type { Weekday } from '../types';
import { PLACE_LABELS, LEVEL_LABELS, GOAL_LABELS } from '../lib/readyPrograms';
import type { ProgramLevel, ProgramPlace } from '../lib/readyPrograms';
import {
  BUILDER_GOALS, BUILDER_MODES, DEFAULT_BUILDER_PREFS,
  findBuilderPrograms, createBuilderDraft, saveBuilderDraft, exerciseMatchesPlace,
  type BuilderDraft, type BuilderPrefs, type BuilderGoal, type BuilderMode,
  type BuilderExercise,
} from '../lib/guidedBuilder';

const GOALS: BuilderGoal[] = ['emagrecimento','hipertrofia','hibrido','corrida','condicionamento'];
const PLACES: ProgramPlace[] = ['academia','casa_equipamento','peso_corporal','ar_livre'];
const LEVELS: ProgramLevel[] = ['iniciante','intermediario','avancado'];
const MODES: BuilderMode[] = ['forca','cardio','hyrox'];

function Chip({onClick,active,children}:{onClick:()=>void;active:boolean;children:ReactNode}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className="rounded-xl px-3 py-2.5 text-xs font-medium text-left"
      style={{border:'1px solid '+(active?'var(--brand)':'var(--border)'),
        background:active?'var(--brand-dim)':'var(--surface-2)',
        color:active?'var(--brand)':'var(--text-dim)'}}>
      {children}
    </button>
  );
}
function FieldTitle({children,hint}:{children:React.ReactNode;hint?:string}) {
  return <div className="mb-2">
    <p className="text-sm font-semibold">{children}</p>
    {hint && <p className="text-xs mt-1" style={{color:'var(--text-faint)'}}>{hint}</p>}
  </div>;
}
function InputNumber({value,onChange,min,max,label}:{value:number;onChange:(value:number)=>void;min:number;max:number;label:string}) {
  return <input type="number" aria-label={label} min={min} max={max} value={value}
    onChange={e=>onChange(Math.min(max,Math.max(min,Number(e.target.value)||min)))}
    className="w-full rounded-lg px-2 py-2 text-sm"
    style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)'}}/>;
}
const MAX_EXERCISES = 8;

export function GuidedBuilder() {
  const navigate = useNavigate();
  const {weeklySchedule} = useAppData();
  const {user} = useAuth();
  const [profile] = useProfile(user?.id);
  const [step,setStep] = useState<1|2|3>(1);
  const [prefs,setPrefs] = useState<BuilderPrefs>(DEFAULT_BUILDER_PREFS);
  const [chosen,setChosen] = useState<string|null>(null);
  const [secondary,setSecondary] = useState('');
  const [search,setSearch] = useState('');
  const [showAll,setShowAll] = useState(false);
  const [draft,setDraft] = useState<BuilderDraft|null>(null);
  const [opened,setOpened] = useState<number|null>(0);
  const [addExerciseId,setAddExerciseId] = useState('');
  const [error,setError] = useState('');
  const [confirm,setConfirm] = useState<'fichas'|'agenda'|null>(null);
  const [saving,setSaving] = useState(false);
  const candidates = useMemo(()=>findBuilderPrograms(prefs),[prefs]);
  const selected = candidates.find(p=>p.id===(chosen??candidates[0]?.id));
  const eligible = BUILTIN_EXERCISES.filter(e=>exerciseMatchesPlace(e,prefs.place) && e.muscleGroup!=='cardio');
  const filteredCandidates = candidates.filter(p=>
    !search.trim() || (p.title+' '+p.description+' '+GOAL_LABELS[p.goal])
      .toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR').trim()));
  const visibleCandidates = showAll?filteredCandidates:filteredCandidates.slice(0,6);

  function useMyProfile() {
    if (!profile) return;
    const goals = profile.trainingGoals ?? [];
    const trainingTypes = profile.trainingTypes ?? [];
    const equipment = profile.equipment ?? [];
    const goal: BuilderGoal = goals.includes('emagrecer') ? 'emagrecimento'
      : goals.includes('ganhar_massa') ? 'hipertrofia'
      : goals.includes('performance') ? 'condicionamento'
      : 'emagrecimento';
    const place: ProgramPlace = equipment.includes('academia') ? 'academia'
      : equipment.includes('casa_equipamento') ? 'casa_equipamento'
      : 'peso_corporal';
    const level: ProgramLevel = profile.experienceLevel === 'avancado' ? 'avancado'
      : profile.experienceLevel === 'intermediario' ? 'intermediario' : 'iniciante';
    const weekdays: Weekday[] = profile.weeklyFrequency === '6-7'
      ? ['seg','ter','qua','qui','sex','sab']
      : profile.weeklyFrequency === '2-3'
        ? ['seg','qua','sex'] : ['seg','ter','qui','sex'];
    const modes: BuilderMode[] = [];
    if (trainingTypes.includes('hirox')) modes.push('hyrox');
    if (trainingTypes.includes('aerobico')) modes.push('cardio');
    if (!modes.includes('forca')) modes.unshift('forca');
    patchPrefs({goal,place,level,weekdays,modes});
  }

  function patchPrefs(patch:Partial<BuilderPrefs>) {
    setPrefs(old=>({...old,...patch}));
    setChosen(null);
    setSecondary('');
    setDraft(null);
    setError('');
  }
  function changeWeekday(day:Weekday) {
    patchPrefs({weekdays:prefs.weekdays.includes(day)
      ? prefs.weekdays.filter(x=>x!==day)
      : WEEKDAY_ORDER.filter(x=>x===day||prefs.weekdays.includes(x))});
  }
  function changeMode(mode:BuilderMode) {
    patchPrefs({modes:prefs.modes.includes(mode)
      ? prefs.modes.filter(x=>x!==mode)
      : [...prefs.modes,mode]});
  }
  function nextFromOne() {
    if (!prefs.weekdays.length) {setError('Escolha pelo menos um dia da semana.');return;}
    if (!prefs.modes.length) {setError('Escolha pelo menos uma modalidade de treino.');return;}
    if (!candidates.length) {setError('Não há fichas compatíveis com esses filtros. Experimente outro local ou nível.');return;}
    setError('');
    setStep(2);
  }
  function createPreview() {
    if (!selected) return;
    try {
      const plan=createBuilderDraft(prefs,selected.id,secondary||undefined);
      if (!plan.workouts.length && !plan.slots.some(x=>x.cardio)) {
        setError('Não há exercícios ou atividades compatíveis. Escolha outro programa ou modalidade.');
        return;
      }
      setDraft(plan);
      setError('');
      setConfirm(null);
      setStep(3);
    } catch(e) {
      setError(e instanceof Error?e.message:'Não foi possível montar essa combinação.');
    }
  }
  function updateWorkout(index:number,fn:(workout:BuilderDraft['workouts'][number])=>BuilderDraft['workouts'][number]) {
    setDraft(old=>old?{...old,workouts:old.workouts.map((w,i)=>i===index?fn(w):w)}:null);
  }
  function updateExercise(dayIndex:number,exerciseIndex:number,patch:Partial<BuilderExercise>) {
    updateWorkout(dayIndex,w=>({...w,exercises:w.exercises.map((e,i)=>i===exerciseIndex?{...e,...patch}:e)}));
  }
  function moveExercise(dayIndex:number,exerciseIndex:number,direction:number) {
    updateWorkout(dayIndex,w=>{
      const arr=[...w.exercises],to=exerciseIndex+direction;
      if (to<0||to>=arr.length) return w;
      [arr[exerciseIndex],arr[to]]=[arr[to],arr[exerciseIndex]];
      return {...w,exercises:arr};
    });
  }
  function addExercise(dayIndex:number) {
    const match=eligible.find(x=>x.id===addExerciseId);
    if (!match) return;
    updateWorkout(dayIndex,w=>w.exercises.length>=MAX_EXERCISES||w.exercises.some(e=>e.id===match.id)?w:{
      ...w,exercises:[...w.exercises,{id:match.id,sets:prefs.level==='iniciante'?2:3,reps:'10-12'}],
    });
    setAddExerciseId('');
  }
  function updateSlot(day:Weekday,patch:Partial<BuilderDraft['slots'][number]>) {
    setDraft(old=>old?{...old,slots:old.slots.map(s=>s.weekday===day?{...s,...patch}:s)}:null);
  }
  function submit(mode:'fichas'|'agenda') {
    if (!draft || saving) return;
    setError('');
    setConfirm(null);
    if (draft.workouts.some((w,i)=>draft.slots.some(s=>s.workoutIndex===i) && !w.exercises.length)) {
      setError('Existe uma ficha vazia. Adicione exercícios ou retire essa ficha da semana.');return;
    }
    if (mode==='fichas' && !draft.slots.some(s=>s.workoutIndex!==null)) {
      setError('Não há fichas de força para criar. Use “Salvar na semana” para registrar somente cardio.');return;
    }
    setSaving(true);
    try {
      saveBuilderDraft(draft,weeklySchedule,mode==='agenda');
      navigate('/treinos',{replace:true});
    } catch(e) {
      setError(e instanceof Error?e.message:'Não foi possível criar o plano.');
      setSaving(false);
    }
  }

  return (
    <div className="px-4 lg:px-0 pb-8">
      <button type="button" onClick={()=>step===1?navigate('/treinos'):setStep(step===3?2:1)}
        className="inline-flex items-center gap-2 text-xs mb-4 mt-5 lg:mt-0"
        style={{color:'var(--text-dim)'}}>
        <ArrowLeft size={15}/>{step===1?'Voltar aos treinos':'Etapa anterior'}
      </button>
      <PageHeader title="Montador inteligente"/>
      <p className="text-sm mb-4" style={{color:'var(--text-dim)'}}>
        Monte uma semana de verdade: escolha seu objetivo, combine modalidades e revise tudo antes de salvar.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-5" role="list" aria-label="Etapas do montador">
        {(['Preferências','Programa-base','Minha semana'] as const).map((t,i)=>(
          <div key={t} role="listitem" className="rounded-xl px-2 py-2 text-center"
            style={{background:i+1===step?'var(--brand-dim)':'var(--surface-2)',
              border:'1px solid '+(i+1===step?'var(--brand)':'var(--border)')}}>
            <p className="text-xs font-semibold" style={{color:i+1===step?'var(--brand)':'var(--text-dim)'}}>
              {i+1}. {t}
            </p>
          </div>
        ))}
      </div>

      {step===1 && (
        <div className="flex flex-col gap-4">
          {profile && (
            <button type="button" onClick={useMyProfile}
              className="rounded-xl px-4 py-3 text-left flex items-center gap-3 w-full"
              style={{border:'1px solid var(--brand)',background:'var(--brand-dim)'}}>
              <Sparkles size={19} style={{color:'var(--brand)'}}/>
              <span className="flex-1">
                <span className="text-sm font-semibold block">Preencher com meu perfil</span>
                <span className="text-xs mt-1 block" style={{color:'var(--text-dim)'}}>
                  Aproveitar objetivo, experiência e frequência do cadastro. Você ainda pode mudar tudo.
                </span>
              </span>
              <ArrowRight size={17} style={{color:'var(--brand)'}}/>
            </button>
          )}
          <Card>
            <FieldTitle hint="Qual resultado você quer priorizar?">Objetivo principal</FieldTitle>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map(g=><Chip key={g} active={prefs.goal===g}
                onClick={()=>patchPrefs({goal:g})}>{BUILDER_GOALS[g]}</Chip>)}
            </div>
          </Card>
          <Card>
            <FieldTitle hint="Pode combinar mais de uma opção. Elas não precisam acontecer na mesma ordem.">Modalidades</FieldTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {MODES.map(m=>(
                <Chip key={m} active={prefs.modes.includes(m)} onClick={()=>changeMode(m)}>
                  <span className="flex gap-2 items-center">{prefs.modes.includes(m)?<Check size={14}/>:<Plus size={14}/>}
                    {BUILDER_MODES[m]}</span>
                </Chip>
              ))}
            </div>
            {prefs.modes.includes('hyrox') && !['academia','misto'].includes(prefs.place) && (
              <p className="text-xs mt-3" style={{color:'var(--warn)'}}>
                Para as estações oficiais de HYROX é necessário equipamento específico.
                Em casa, priorizaremos condicionamento e movimentos disponíveis.
              </p>
            )}
          </Card>
          <Card>
            <FieldTitle>Onde você vai treinar?</FieldTitle>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PLACES.map(p=><Chip key={p} active={prefs.place===p}
                onClick={()=>patchPrefs({place:p})}>{PLACE_LABELS[p]}</Chip>)}
            </div>
            <FieldTitle>Experiência</FieldTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {LEVELS.map(l=><Chip key={l} active={prefs.level===l}
                onClick={()=>patchPrefs({level:l})}>{LEVEL_LABELS[l]}</Chip>)}
            </div>
            <FieldTitle hint="Quanto tempo aproximadamente você tem para cada sessão?">Tempo por sessão</FieldTitle>
            <div className="flex flex-wrap gap-2">
              {[20,30,40,50,60,75].map(n=><Chip key={n} active={prefs.minutes===n}
                onClick={()=>patchPrefs({minutes:n})}>{n} minutos</Chip>)}
            </div>
          </Card>
          <Card>
            <FieldTitle hint="Marque apenas os dias em que você tem disponibilidade. Descanso também faz parte do plano.">
              Dias disponíveis
            </FieldTitle>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {WEEKDAY_ORDER.map(d=>(
                <Chip key={d} active={prefs.weekdays.includes(d)} onClick={()=>changeWeekday(d)}>
                  {WEEKDAY_LABELS[d].slice(0,3)}
                </Chip>
              ))}
            </div>
            <p className="text-xs mt-2" style={{color:'var(--text-dim)'}}>
              {prefs.weekdays.length} dia(s) selecionado(s)
            </p>
          </Card>
          {error && <p role="alert" className="text-sm" style={{color:'var(--danger)'}}>{error}</p>}
          <Button full onClick={nextFromOne}>Encontrar programas compatíveis <ArrowRight size={16} className="inline ml-1"/></Button>
        </div>
      )}

      {step===2 && (
        <div className="flex flex-col gap-3">
          <Card>
            <FieldTitle hint="O FitBox recomenda programas existentes que cabem no seu nível e local, evitando equipamentos indisponíveis.">
              Escolha a base do seu plano
            </FieldTitle>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{color:'var(--text-faint)'}}/>
              <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar programa..." aria-label="Pesquisar programa-base"
                className="rounded-xl w-full pl-9 pr-3 py-3 text-sm"
                style={{background:'var(--surface-2)',color:'var(--text)'}}/>
            </div>
          </Card>
          {visibleCandidates.map((p,i)=>{
            const selectedId=chosen??candidates[0]?.id;
            const active=selectedId===p.id;
            return <button type="button" key={p.id} onClick={()=>{setChosen(p.id);if(secondary===p.id)setSecondary('');}}
              aria-pressed={active} className="rounded-2xl p-4 text-left w-full"
              style={{background:active?'var(--brand-dim)':'var(--surface-2)',
                border:'1px solid '+(active?'var(--brand)':'var(--border)')}}>
              <span className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{background:'var(--surface)',color:'var(--brand)'}}>
                  {active?<CheckCircle2 size={20}/>:<Dumbbell size={19}/>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-sm block">
                    {p.title} {i===0 && !search && <span className="text-[10px] ml-1" style={{color:'var(--brand)'}}>Sugestão principal</span>}
                  </span>
                  <span className="text-xs block mt-1" style={{color:'var(--text-dim)'}}>{p.description}</span>
                  <span className="text-xs mt-2 block" style={{color:'var(--brand)'}}>
                    {p.days.length} ficha(s) · {p.sessionMinutes??prefs.minutes} min aprox.
                  </span>
                </span>
              </span>
            </button>;
          })}
          {filteredCandidates.length>6 && (
            <button type="button" className="text-sm text-center py-2" style={{color:'var(--brand)'}}
              onClick={()=>setShowAll(v=>!v)}>
              {showAll?'Ver menos opções':`Ver mais ${filteredCandidates.length-6} programas`}
            </button>
          )}
          {filteredCandidates.length===0 && <p className="text-sm" style={{color:'var(--text-dim)'}}>Nenhum programa com esse nome.</p>}
          <Card>
            <FieldTitle hint="Opcional: em vez de somar dois treinos completos, substituímos uma ficha por uma sessão compatível do segundo programa.">
              Quero combinar com outro programa
            </FieldTitle>
            <select aria-label="Programa secundário" value={secondary}
              onChange={e=>setSecondary(e.target.value)}
              className="w-full rounded-xl px-3 py-3 text-sm"
              style={{background:'var(--surface-2)',color:'var(--text)'}}>
              <option value="">Sem combinação — só a base</option>
              {candidates.filter(p=>p.id!==(chosen??candidates[0]?.id)&&p.days.length).map(p=>(
                <option value={p.id} key={p.id}>{p.title}</option>
              ))}
            </select>
            <p className="text-xs mt-2 flex gap-2" style={{color:'var(--text-dim)'}}>
              <Info size={15} className="shrink-0"/> A combinação evita duplicar séries e não adiciona sessões pesadas automaticamente.
            </p>
          </Card>
          {error && <p role="alert" className="text-sm" style={{color:'var(--danger)'}}>{error}</p>}
          <Button full disabled={!selected} onClick={createPreview}>
            Montar minha semana <ArrowRight size={16} className="inline ml-1"/>
          </Button>
        </div>
      )}

      {step===3 && draft && (
        <div className="flex flex-col gap-4">
          <Card>
            <p className="text-xs uppercase tracking-wide font-semibold" style={{color:'var(--brand)'}}>Prévia editável</p>
            <h2 className="text-lg font-semibold mt-1">Sua semana personalizada</h2>
            <p className="text-xs mt-1 mb-3" style={{color:'var(--text-dim)'}}>
              Você pode fazer musculação, cardio ou os dois, em qualquer ordem.
              Nenhum treino será salvo até sua confirmação.
            </p>
            {draft.slots.map(slot=>(
              <div key={slot.weekday} className="rounded-xl p-3 mb-2 last:mb-0" style={{background:'var(--surface-2)'}}>
                <p className="font-semibold text-sm mb-2">{WEEKDAY_LABELS[slot.weekday]}</p>
                <label className="text-xs block mb-1" style={{color:'var(--text-dim)'}}>Ficha do dia</label>
                <select value={slot.workoutIndex===null?'':String(slot.workoutIndex)}
                  onChange={e=>updateSlot(slot.weekday,{workoutIndex:e.target.value===''?null:Number(e.target.value)})}
                  aria-label={`Treino de ${WEEKDAY_LABELS[slot.weekday]}`}
                  className="w-full rounded-lg px-3 py-2.5 text-sm mb-2"
                  style={{background:'var(--surface)',color:'var(--text)'}}>
                  <option value="">Sem musculação / sessão de força</option>
                  {draft.workouts.map((w,i)=><option key={i} value={i}>{w.title}</option>)}
                </select>
                <label className="flex items-center gap-2 text-xs mb-2" style={{color:'var(--text)'}}>
                  <input type="checkbox" checked={slot.cardio}
                    onChange={e=>updateSlot(slot.weekday,{cardio:e.target.checked})}
                    className="accent-violet-500"/>
                  Incluir cardio opcional neste dia
                </label>
                {slot.cardio && (
                  <div className="grid grid-cols-[minmax(0,1fr)_78px] gap-2">
                    <input value={slot.cardioLabel}
                      onChange={e=>updateSlot(slot.weekday,{cardioLabel:e.target.value})}
                      aria-label={`Tipo de cardio de ${WEEKDAY_LABELS[slot.weekday]}`}
                      className="min-w-0 rounded-lg px-2 py-2 text-xs"
                      style={{background:'var(--surface)',color:'var(--text)'}}/>
                    <InputNumber value={slot.cardioMinutes} min={5} max={90}
                      onChange={v=>updateSlot(slot.weekday,{cardioMinutes:v})}
                      label={`Minutos de cardio em ${WEEKDAY_LABELS[slot.weekday]}`}/>
                  </div>
                )}
              </div>
            ))}
          </Card>

          {draft.workouts.map((workout,dayIndex)=>{
            const used=draft.slots.some(s=>s.workoutIndex===dayIndex);
            return <Card key={dayIndex}>
              <button type="button" onClick={()=>{setOpened(opened===dayIndex?null:dayIndex);setAddExerciseId('');}}
                aria-expanded={opened===dayIndex} className="w-full text-left flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{color:'var(--brand)',background:'var(--brand-dim)'}}>
                  <AppIcon value={workout.emoji} size={18}/>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="text-sm font-semibold block truncate">{workout.title}</span>
                  <span className="text-xs block mt-0.5" style={{color:'var(--text-faint)'}}>
                    {workout.exercises.length} exercícios {used?'· incluído na semana':'· fora da semana'}
                  </span>
                </span>
                {opened===dayIndex?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
              </button>
              {opened===dayIndex && (
                <div className="flex flex-col gap-2 mt-3">
                  <label className="text-xs" style={{color:'var(--text-dim)'}}>Nome da ficha</label>
                  <input value={workout.title}
                    onChange={e=>updateWorkout(dayIndex,w=>({...w,title:e.target.value}))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm mb-2"
                    style={{background:'var(--surface-2)',color:'var(--text)'}}/>
                  {workout.exercises.map((entry,ei)=>{
                    const ex=BUILTIN_EXERCISES.find(e=>e.id===entry.id);
                    const alternatives=eligible.filter(x=>x.muscleGroup===ex?.muscleGroup);
                    return <div key={ei} className="rounded-xl p-3" style={{background:'var(--surface-2)'}}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold flex-1">Exercício {ei+1}</span>
                        <button type="button" disabled={ei===0} onClick={()=>moveExercise(dayIndex,ei,-1)}
                          aria-label="Mover exercício para cima" className="disabled:opacity-30"><ArrowLeft size={16} className="rotate-90"/></button>
                        <button type="button" disabled={ei===workout.exercises.length-1} onClick={()=>moveExercise(dayIndex,ei,1)}
                          aria-label="Mover exercício para baixo" className="disabled:opacity-30"><ArrowRight size={16} className="rotate-90"/></button>
                        <button type="button" onClick={()=>updateWorkout(dayIndex,w=>({...w,exercises:w.exercises.filter((_,i)=>i!==ei)}))}
                          aria-label="Remover exercício" style={{color:'var(--danger)'}}><Trash2 size={16}/></button>
                      </div>
                      <select value={entry.id} aria-label={`Substituir exercício ${ei+1}`}
                        onChange={e=>updateExercise(dayIndex,ei,{id:e.target.value,notes:undefined})}
                        className="w-full rounded-lg px-2 py-2 text-xs mb-2"
                        style={{background:'var(--surface)',color:'var(--text)'}}>
                        {!alternatives.some(x=>x.id===entry.id) && ex && <option value={ex.id}>{ex.name}</option>}
                        {alternatives.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] block mb-1" style={{color:'var(--text-faint)'}}>Séries</label>
                          <InputNumber value={entry.sets} min={1} max={5} label={`Séries ${ei+1}`}
                            onChange={sets=>updateExercise(dayIndex,ei,{sets})}/>
                        </div>
                        <div>
                          <label className="text-[11px] block mb-1" style={{color:'var(--text-faint)'}}>Repetições / tempo</label>
                          <input type="text" value={entry.reps} aria-label={`Repetições ${ei+1}`}
                            onChange={e=>updateExercise(dayIndex,ei,{reps:e.target.value})}
                            className="w-full rounded-lg px-2 py-2 text-sm"
                            style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)'}}/>
                        </div>
                      </div>
                    </div>;
                  })}
                  {workout.exercises.length < MAX_EXERCISES && (
                    <div className="flex gap-2">
                      <select value={addExerciseId} onChange={e=>setAddExerciseId(e.target.value)}
                        aria-label="Escolher exercício para adicionar" className="min-w-0 flex-1 rounded-lg p-2 text-xs"
                        style={{background:'var(--surface-2)',color:'var(--text)'}}>
                        <option value="">+ Adicionar exercício...</option>
                        {eligible.filter(e=>!workout.exercises.some(x=>x.id===e.id)).map(e=>(
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={()=>addExercise(dayIndex)} disabled={!addExerciseId}
                        className="rounded-lg px-3 text-xs font-semibold disabled:opacity-40"
                        style={{background:'var(--brand)',color:'white'}}>Adicionar</button>
                    </div>
                  )}
                </div>
              )}
            </Card>;
          })}

          {draft.warnings.length>0 && (
            <Card>
              <p className="text-sm font-semibold flex gap-2 items-center mb-2">
                <Info size={16} style={{color:'var(--brand)'}}/> Informações sobre o plano
              </p>
              {draft.warnings.map((warning,i)=><p key={i} className="text-xs mb-2 last:mb-0"
                style={{color:'var(--text-dim)'}}>{warning}</p>)}
            </Card>
          )}
          <Card>
            <p className="text-sm font-semibold mb-1">Salvar meu plano</p>
            <p className="text-xs mb-3" style={{color:'var(--text-dim)'}}>
              Suas fichas existentes e todo o histórico serão preservados. Se incluir
              na semana, as novas opções serão somadas aos dias escolhidos, sem apagar as atuais.
            </p>
            {error && <p role="alert" className="text-xs mb-3" style={{color:'var(--danger)'}}>{error}</p>}
            {confirm ? (
              <div className="rounded-xl p-3" style={{background:'var(--brand-dim)',border:'1px solid var(--brand)'}}>
                <p className="text-sm font-semibold mb-2">Confirma a criação?</p>
                <p className="text-xs mb-3" style={{color:'var(--text-dim)'}}>
                  {confirm==='agenda'
                    ? 'As novas fichas e atividades serão adicionadas aos dias selecionados. Nenhum treino antigo será excluído.'
                    : 'As novas fichas aparecerão em Meus treinos, sem modificar a agenda semanal.'}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" full onClick={()=>setConfirm(null)} disabled={saving}>Cancelar</Button>
                  <Button full disabled={saving} onClick={()=>submit(confirm)}>
                    {saving?'Salvando...':'Confirmar e criar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button full onClick={()=>{setError('');setConfirm('agenda');}}>
                  <Check size={15} className="inline mr-1"/> Criar e incluir na minha semana
                </Button>
                <Button full variant="secondary" onClick={()=>{setError('');setConfirm('fichas');}}>
                  Criar somente as fichas
                </Button>
              </div>
            )}
          </Card>
          <button type="button" onClick={()=>{setStep(2);setConfirm(null);}}
            className="text-xs text-center" style={{color:'var(--brand)'}}>
            <Minus size={12} className="inline"/> Alterar o programa-base
          </button>
        </div>
      )}
    </div>
  );
}
