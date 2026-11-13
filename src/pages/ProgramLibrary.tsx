import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, CalendarDays, Info, Clock, Target, SlidersHorizontal, Search, Sparkles, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import { PageHeader, Card, Button, Pill, AppIcon } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useAppData } from '../hooks/useAppData';
import { WEEKDAY_LABELS } from '../types';
import {
  READY_PROGRAMS, PERSONAL_UPPER_HYROX_PROGRAM_ID, GOAL_LABELS, SPLIT_LABELS, PLACE_LABELS, LEVEL_LABELS,
  applyReadyProgram, programPlace, programModality, MODALITY_LABELS,
  type ProgramGoal, type ProgramPlace, type ProgramLevel, type SplitLength, type ReadyProgram, type ProgramModality,
} from '../lib/readyPrograms';
import { BUILTIN_EXERCISES } from '../lib/exercises';
import { ExerciseThumbnail, ExerciseGuide } from '../components/ExerciseVisual';
import { CARDIO_PRESETS } from '../lib/cardioPresets';
import { CardioPresetCard } from '../components/CardioPresetCard';
import { getActivitiesForDay } from '../lib/nextTraining';
import { setDaySchedule } from '../lib/actions';
import type { Weekday } from '../types';

const GOAL_FILTERS: ProgramGoal[] = [
  'hibrido', 'emagrecimento', 'hipertrofia', 'corrida', 'calistenia', 'funcional', 'core', 'mobilidade',
];
const MODALITY_FILTERS: ProgramModality[] = ['corrida','forca','hibrido','casa','funcional'];
const PLACE_FILTERS: ProgramPlace[] = ['academia', 'misto', 'peso_corporal', 'casa_equipamento', 'ar_livre'];
const LEVEL_FILTERS: ProgramLevel[] = ['iniciante', 'intermediario', 'avancado'];
const SPLIT_FILTERS: SplitLength[] = ['unico', 'ab', 'abc', 'abcd', 'abcde'];
const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
type QuickCategory = 'todos'|'meu-plano'|'emagrecimento'|'hipertrofia'|'hyrox'|'corrida'|'casa';
const QUICK_CATEGORIES: {id:QuickCategory;label:string}[] = [
  {id:'todos',label:'Todos'},
  {id:'meu-plano',label:'Upper / HYROX / Lower'},
  {id:'emagrecimento',label:'Emagrecimento'},
  {id:'hipertrofia',label:'Musculação'},
  {id:'hyrox',label:'HYROX'},
  {id:'corrida',label:'Corrida / esteira'},
  {id:'casa',label:'Em casa'},
];
function matchesQuickCategory(p: ReadyProgram, category: QuickCategory): boolean {
  if(category==='todos') return true;
  if(category==='meu-plano') return p.id===PERSONAL_UPPER_HYROX_PROGRAM_ID;
  if(category==='hyrox') return p.id.toLowerCase().includes('hyrox') || p.title.toLowerCase().includes('hyrox');
  if(category==='corrida') return programModality(p)==='corrida' || p.goal==='corrida';
  if(category==='casa') return ['peso_corporal','casa_equipamento'].includes(programPlace(p));
  if(category==='hipertrofia') return p.goal==='hipertrofia' || (p.goal==='emagrecimento' && programModality(p)==='forca');
  return p.goal==='emagrecimento' || (p.goal==='hibrido' && p.title.toLowerCase().includes('emagrecimento'));
}
function normalizeSearch(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}

function fitScore(p: ReadyProgram, user: {
  experienceLevel?: string | null;
  equipment?: string[] | null;
  trainingGoals?: string[] | null;
  trainingTypes?: string[] | null;
}): number {
  let score = 0;
  const place = programPlace(p);
  const eq = user.equipment ?? [];
  if (place === 'peso_corporal') score += 1;
  if (place === 'academia' && eq.includes('academia')) score += 3;
  if (place === 'misto' && eq.includes('academia')) score += 3;
  if (place === 'casa_equipamento' && eq.includes('casa_equipamento')) score += 3;
  if (place === 'ar_livre' && (user.trainingTypes ?? []).includes('aerobico')) score += 3;
  if (p.level === user.experienceLevel) score += 2;
  if (p.level === 'intermediario' && user.experienceLevel === 'iniciante') score -= 4;
  if ((user.trainingGoals ?? []).includes('emagrecer') && ['emagrecimento', 'hibrido', 'corrida'].includes(p.goal)) score += 3;
  if ((user.trainingGoals ?? []).includes('ganhar_massa') && p.goal === 'hipertrofia') score += 3;
  if ((user.trainingGoals ?? []).includes('performance') && ['hibrido', 'corrida'].includes(p.goal)) score += 2;
  if ((user.trainingTypes ?? []).includes('hirox') && p.id.includes('hyrox')) score += 6;
  if ((user.trainingTypes ?? []).includes('aerobico') && ['corrida', 'hibrido'].includes(p.goal)) score += 2;
  if ((user.trainingTypes ?? []).includes('calistenia') && p.goal === 'calistenia') score += 3;
  return score;
}

export function ProgramLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile] = useProfile(user?.id);
  const { weeklySchedule } = useAppData();
  const [goalFilter, setGoalFilter] = useState<ProgramGoal | null>(null);
  const [quickCategory, setQuickCategory] = useState<QuickCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllPrograms,setShowAllPrograms] = useState(false);
  const [showPlanGuidance,setShowPlanGuidance] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmAgendaReplace, setConfirmAgendaReplace] = useState(false);
  const [modalityFilter, setModalityFilter] = useState<ProgramModality | null>(null);
  const [presetWeekday, setPresetWeekday] = useState<Weekday>('seg');
  const [presetAdded, setPresetAdded] = useState(false);
  const [placeFilter, setPlaceFilter] = useState<ProgramPlace | null>(null);
  const [levelFilter, setLevelFilter] = useState<ProgramLevel | null>(null);
  const [splitFilter, setSplitFilter] = useState<SplitLength | null>(null);
  const [preview, setPreview] = useState<ReadyProgram | null>(null);
  const [appliedMode, setAppliedMode] = useState<'treinos' | 'agenda' | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = normalizeSearch(searchQuery);
    return READY_PROGRAMS
      .filter(p => matchesQuickCategory(p, quickCategory))
      .filter(p => !query || normalizeSearch([
        p.title, p.description, GOAL_LABELS[p.goal], MODALITY_LABELS[programModality(p)],
        PLACE_LABELS[programPlace(p)], ...p.days.map(d => d.name),
      ].join(' ')).includes(query))
      .filter((p) => (!goalFilter || p.goal === goalFilter) &&
        (!modalityFilter || programModality(p) === modalityFilter) &&
        (!placeFilter || programPlace(p) === placeFilter) &&
        (!levelFilter || p.level === levelFilter || (!p.level && levelFilter === 'intermediario')) &&
        (!splitFilter || p.split === splitFilter))
      .map((p, index) => ({ p, index, score: profile ? fitScore(p, profile) : 0 }))
      .sort((a, b) => (a.p.id===PERSONAL_UPPER_HYROX_PROGRAM_ID ? -1 : b.p.id===PERSONAL_UPPER_HYROX_PROGRAM_ID ? 1 : b.score-a.score || a.index-b.index))
      .map((entry) => entry.p);
  }, [goalFilter, modalityFilter, placeFilter, levelFilter, splitFilter, profile, quickCategory, searchQuery]);

  function openPreview(p: ReadyProgram) {
    setAppliedMode(null);
    setError(null);
    setPresetAdded(false);
    setDetailsOpen(false);
    setShowPlanGuidance(false);
    setConfirmAgendaReplace(false);
    setPreview(p);
  }

  function scheduleCardioPreset(p: ReadyProgram) {
    if (!p.cardioPresetId) return;
    const preset = CARDIO_PRESETS.find(x => x.id === p.cardioPresetId);
    if (!preset) return;
    const existing = getActivitiesForDay(weeklySchedule[presetWeekday]);
    const label = preset.title;
    if (!existing.some(x => x.kind === 'cardio' && x.label === label)) {
      setDaySchedule(presetWeekday, { kind: 'multi', activities: [
        ...existing, { kind: 'cardio', label, suggestedDurationMin: preset.durationMin },
      ] });
    }
    setPresetAdded(true);
  }

  function handleApply(withSchedule: boolean) {
    if (!preview || applying || appliedMode) return;
    setApplying(true);
    setError(null);
    try {
      const created = applyReadyProgram(preview.id, { applySchedule: withSchedule });
      if (created.length !== preview.days.length) {
        setError('Não foi possível montar o programa. Tente novamente.');
        return;
      }
      setAppliedMode(withSchedule ? 'agenda' : 'treinos');
    } catch {
      setError('Ocorreu um erro ao criar os treinos. Verifique sua conexão e tente novamente.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="px-4 lg:px-0">
      <PageHeader title="Escolha seu treino" />
      <button type="button" onClick={()=>navigate('/atividades')}
        className="lg:hidden w-full flex items-center gap-3 rounded-xl p-3.5 mb-3 text-left"
        style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
        <span className="rounded-lg p-2" style={{background:'var(--brand-dim)',color:'var(--brand)'}}>
          <PlusCircle size={20}/>
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">Atividades rápidas</span>
          <span className="block text-xs mt-1" style={{color:'var(--text-dim)'}}>
            Registrar HYROX, cardio, funcional ou caminhada por tempo e kcal
          </span>
        </span>
        <ChevronRight size={18} style={{color:'var(--brand)'}}/>
      </button>
      <button type="button" onClick={()=>navigate('/montador')}
        className="flex items-center gap-3 w-full p-3.5 mb-4 rounded-xl text-left"
        style={{background:'var(--brand-dim)',border:'1px solid var(--brand)'}}>
        <span className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
          style={{background:'var(--brand)',color:'white'}}><Sparkles size={17}/></span>
        <span className="flex-1">
          <span className="text-sm font-semibold block">Não sabe qual programa escolher?</span>
          <span className="text-xs block mt-1" style={{color:'var(--text-dim)'}}>
            Monte sua semana em 3 etapas: objetivo, modalidades e dias disponíveis.
          </span>
        </span>
        <ChevronRight size={17} style={{color:'var(--brand)'}}/>
      </button>
      <p className="text-xs mb-4" style={{color:'var(--text-dim)'}}>Escolha um plano, veja a semana e personalize depois. Nenhum treino existente será excluído.</p>

      <div className="relative mb-3">
        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--text-faint)'}}/>
        <input type="search" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
          placeholder="Buscar: corrida, HYROX, 4 dias, casa..." aria-label="Pesquisar programas prontos"
          className="w-full rounded-xl pl-10 pr-3 py-3 text-sm"
          style={{background:'var(--surface-2)',color:'var(--text)'}}/>
      </div>
      <div className="flex flex-wrap gap-2 mb-3" aria-label="Categorias de programas">
        {QUICK_CATEGORIES.map(item=>(
          <button type="button" key={item.id} aria-pressed={quickCategory===item.id}
            onClick={()=>setQuickCategory(item.id)}
            className="rounded-full px-3 py-2 text-xs font-semibold"
            style={{background:quickCategory===item.id?'var(--brand)':'var(--surface-2)',
              color:quickCategory===item.id?'white':'var(--text-dim)',
              border:'1px solid '+(quickCategory===item.id?'var(--brand)':'var(--border)')}}>
            {item.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={()=>setAdvancedOpen(v=>!v)} aria-expanded={advancedOpen}
        className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-xs mb-3"
        style={{background:'var(--surface-2)',color:'var(--text-dim)'}}>
        <span className="flex items-center gap-2"><SlidersHorizontal size={15}/> Mais filtros: objetivo, local, nível, divisão</span>
        {advancedOpen?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
      </button>
      {advancedOpen && <div className="rounded-xl p-3 mb-4" style={{border:'1px solid var(--border)'}}>
      <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--text-dim)' }}>
        <SlidersHorizontal size={15} />
        <span className="text-xs font-semibold">Encontre um programa para você</span>
      </div>

      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>Objetivo / modalidade</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <FilterChip label="Todos" active={goalFilter === null} onClick={() => setGoalFilter(null)} />
        {GOAL_FILTERS.map((g) =>
          <FilterChip key={g} label={GOAL_LABELS[g]} active={goalFilter === g} onClick={() => setGoalFilter(g)} />)}
      </div>

      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>Tipo de treino</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <FilterChip label="Todos" active={modalityFilter === null} onClick={() => setModalityFilter(null)} />
        {MODALITY_FILTERS.map(m =>
          <FilterChip key={m} label={MODALITY_LABELS[m]} active={modalityFilter === m}
            onClick={() => setModalityFilter(m)} />)}
      </div>

      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>Onde você treina?</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <FilterChip label="Qualquer lugar" active={placeFilter === null} onClick={() => setPlaceFilter(null)} />
        {PLACE_FILTERS.map((p) =>
          <FilterChip key={p} label={PLACE_LABELS[p]} active={placeFilter === p} onClick={() => setPlaceFilter(p)} />)}
      </div>

      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>Seu nível</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <FilterChip label="Todos" active={levelFilter === null} onClick={() => setLevelFilter(null)} />
        {LEVEL_FILTERS.map((l) =>
          <FilterChip key={l} label={LEVEL_LABELS[l]} active={levelFilter === l} onClick={() => setLevelFilter(l)} />)}
      </div>

      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>Quantidade de treinos diferentes</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <FilterChip label="Todos" active={splitFilter === null} onClick={() => setSplitFilter(null)} />
        {SPLIT_FILTERS.map((s) =>
          <FilterChip key={s} label={SPLIT_LABELS[s]} active={splitFilter === s} onClick={() => setSplitFilter(s)} />)}
      </div>


        <button type="button" className="text-xs font-semibold underline" style={{color:'var(--brand)'}}
          onClick={()=>{setGoalFilter(null);setModalityFilter(null);setPlaceFilter(null);setLevelFilter(null);setSplitFilter(null);}}>
          Limpar filtros avançados
        </button>
      </div>}

      <p className="text-xs mb-3" style={{color:'var(--text-faint)'}}>{filtered.length} opções disponíveis</p>

      <div className="flex flex-col gap-2.5 pb-6">
        {(showAllPrograms || searchQuery.trim() || quickCategory!=='todos' || advancedOpen ? filtered : filtered.slice(0,5)).map((p,index) => (
          <Card key={p.id} className="!p-0 overflow-hidden"
            style={index===0 && profile ? {borderColor:'var(--brand)'} : undefined}>
            <button type="button" onClick={() => openPreview(p)}
              className="w-full flex items-start gap-3 px-4 py-3.5 text-left">
              <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}>
                <AppIcon value={p.days[0]?.emoji} size={18} />
              </span>
              <div className="flex-1 min-w-0">
                {(p.id===PERSONAL_UPPER_HYROX_PROGRAM_ID || index===0 && profile) && <p className="text-[10px] uppercase tracking-wide font-semibold mb-1 flex items-center gap-1"
                  style={{color:'var(--brand)'}}><Sparkles size={12}/> {p.id===PERSONAL_UPPER_HYROX_PROGRAM_ID ? 'Plano de 5 dias' : 'Sugestão pelo seu perfil'}</p>}
                <p className="font-semibold text-sm">{p.title}</p>
                <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>
                  {p.id===PERSONAL_UPPER_HYROX_PROGRAM_ID ? 'Seg–sex · 3 musculações + 2 aulas HYROX livres' : GOAL_LABELS[p.goal]+' · '+p.days.length+' ficha(s) · '+(p.sessionMinutes??45)+' min aprox.'}
                </p>
                <span className="text-[11px] font-semibold block mt-2" style={{color:'var(--brand)'}}>
                  Ver treinos e escolher <ChevronRight size={12} className="inline"/>
                </span>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-faint)' }} className="shrink-0 mt-1" />
            </button>
          </Card>
        ))}
        {!showAllPrograms && !searchQuery.trim() && quickCategory==='todos' && !advancedOpen && filtered.length>5 && (
          <button type="button" className="w-full py-3 text-sm font-semibold" style={{color:'var(--brand)'}} onClick={()=>setShowAllPrograms(true)}>Ver todas as {filtered.length} opções</button>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm mb-2" style={{ color: 'var(--text-dim)' }}>Nenhum programa com todos esses filtros.</p>
            <button onClick={() => {setSearchQuery('');setQuickCategory('todos');setGoalFilter(null);setModalityFilter(null);setPlaceFilter(null);setLevelFilter(null);setSplitFilter(null);}}
              className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>Limpar filtros</button>
          </div>
        )}
      </div>

      <Sheet open={preview !== null} onClose={() => setPreview(null)} title={preview?.title ?? ''}>
        {preview && (
          <div className="flex flex-col gap-3">
            {preview.cardioPresetId ? (() => {
              const preset = CARDIO_PRESETS.find(p => p.id === preview.cardioPresetId);
              return preset ? (
                <>
                  <div className="flex gap-2 flex-wrap">
                    <Pill tone="brand">Emagrecimento</Pill>
                    <Pill>Corrida / esteira</Pill>
                    <Pill>{preset.durationMin} min</Pill>
                  </div>
                  <p className="text-xs" style={{color:'var(--text-dim)'}}>
                    Caminhada inclinada dividida em cinco etapas. Confira o ritmo,
                    ajuste conforme seu nível e registre somente após realizar.
                  </p>
                  <CardioPresetCard preset={preset}
                    onRegister={p => {setPreview(null);navigate('/cardio?preset='+encodeURIComponent(p.id));}}/>
                  <div className="rounded-xl p-3" style={{background:'var(--surface-2)'}}>
                    <p className="text-xs font-semibold mb-2">Adicionar como opção da semana</p>
                    <div className="flex gap-2 items-center">
                      <select value={presetWeekday}
                        onChange={e => {setPresetWeekday(e.target.value as Weekday);setPresetAdded(false);}}
                        aria-label="Dia da semana" className="min-w-0 flex-1 rounded-xl px-2 py-2 text-xs"
                        style={{background:'var(--surface)'}}>
                        {WEEKDAYS.map(day=><option key={day} value={day}>{WEEKDAY_LABELS[day]}</option>)}
                      </select>
                      <Button onClick={() => scheduleCardioPreset(preview)}
                        disabled={presetAdded}>{presetAdded?'Adicionado':'Adicionar'}</Button>
                    </div>
                    <p className="text-[11px] mt-2" style={{color:'var(--text-faint)'}}>
                      Preserva as outras atividades do dia. Não registra o treino como realizado.
                    </p>
                  </div>
                  {presetAdded && <p className="text-xs" style={{color:'var(--success)'}}>
                    Treino adicionado à sua agenda semanal.
                  </p>}
                </>
              ) : <p className="text-sm">Treino de cardio indisponível.</p>;
            })() : (<>
            <div className="flex flex-wrap gap-1">
              <Pill tone="brand">{GOAL_LABELS[preview.goal]}</Pill>
              <Pill>{PLACE_LABELS[programPlace(preview)]}</Pill>
              {preview.level && <Pill>{LEVEL_LABELS[preview.level]}</Pill>}
              {preview.sessionMinutes && <Pill>{preview.sessionMinutes} min/sessão (aprox.)</Pill>}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{preview.description}</p>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                <CalendarDays size={14} style={{ color: 'var(--brand)' }} /> Organização semanal sugerida
              </p>
              {preview.weekPlan ? WEEKDAYS.map((day, i) => {
                const step = preview.weekPlan![i];
                const description = step.kind === 'rest' ? 'Descanso / recuperação'
                  : step.kind === 'cardio' || step.kind === 'combo' ? step.label
                  : preview.days[step.index]?.name ?? 'Treino';
                return (
                  <div key={day} className="flex items-start gap-2 py-1.5 text-xs"
                    style={{ borderTop: i ? '1px solid var(--border-soft)' : undefined }}>
                    <span className="w-16 shrink-0 font-medium" style={{ color: 'var(--text-dim)' }}>{WEEKDAY_LABELS[day]}</span>
                    <span style={{ color: step.kind === 'rest' ? 'var(--text-faint)' : 'var(--text)' }}>
                      {description}{step.kind === 'cardio' && step.distanceKm ? ' · base ' + step.distanceKm + ' km' : ''}{step.kind === 'combo' && step.durationMin ? ' · ' + step.durationMin + ' min de corrida (opcional)' : ''}
                    </span>
                  </div>
                );
              }) : (
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Programa livre: crie os treinos e organize os dias em Meus treinos.
                </p>
              )}
            </div>

            {appliedMode ? (
              <div className="flex flex-col gap-2 mt-1">
                <div className="rounded-xl px-3 py-2.5 text-xs flex items-center gap-2"
                  style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
                  <Check size={14} />
                  {appliedMode === 'agenda' ? 'Treinos criados e agenda semanal atualizada no app.' : 'Treinos adicionados ao app sem alterar sua agenda.'}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Confira os treinos e a sincronização antes de fechar o aplicativo.</p>
                <Button full onClick={() => {setPreview(null);navigate('/treinos');}}>Ver em Meus treinos</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-1">
                {error && <p className="text-xs" role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
                <Button full onClick={() => handleApply(false)} disabled={applying}>
                  {applying ? 'Criando...' : 'Adicionar treinos sem mudar agenda'}
                </Button>
                {preview.weekPlan && (
                  <>
                    {!confirmAgendaReplace ? (
                      <Button full variant="secondary" onClick={() => setConfirmAgendaReplace(true)} disabled={applying}>
                        Ativar agenda semanal sugerida
                      </Button>
                    ) : (
                      <div className="rounded-xl p-3 flex flex-col gap-2"
                        style={{background:'var(--surface-2)',border:'1px solid var(--brand)'}}>
                        <p className="text-sm font-semibold">Substituir sua agenda semanal?</p>
                        <p className="text-xs" style={{color:'var(--text-dim)'}}>
                          Os sete dias programados serão substituídos. Seus treinos, registros e histórico
                          anteriores não serão apagados. Confira a distribuição acima.
                        </p>
                        <Button full onClick={() => handleApply(true)} disabled={applying}>
                          {applying?'Aplicando...':'Confirmar troca da agenda'}
                        </Button>
                        <Button full variant="secondary" onClick={() => setConfirmAgendaReplace(false)} disabled={applying}>
                          Manter minha agenda
                        </Button>
                      </div>
                    )}
                    <p className="text-xs" style={{color:'var(--text-faint)'}}>
                      Para preservar os dias atuais, use “Adicionar treinos sem mudar agenda”.
                    </p>
                  </>
                )}
              </div>
            )}

            {(preview.progression || preview.recoveryNote) && <button type="button" onClick={()=>setShowPlanGuidance(v=>!v)} aria-expanded={showPlanGuidance}
              className="w-full rounded-xl py-2.5 px-3 text-xs font-medium flex items-center justify-between"
              style={{background:'var(--surface-2)',color:'var(--brand)'}}>Orientações de progressão e recuperação {showPlanGuidance?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>}
            {showPlanGuidance && preview.progression && (
              <p className="text-xs rounded-xl px-3 py-2.5 flex gap-2"
                style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}>
                <Target size={15} className="shrink-0" style={{ color: 'var(--brand)' }} />
                <span><strong>Progressão:</strong> {preview.progression}</span>
              </p>
            )}
            {showPlanGuidance && preview.recoveryNote && (
              <p className="text-xs flex gap-2" style={{ color: 'var(--text-dim)' }}>
                <Info size={15} className="shrink-0" />
                <span>{preview.recoveryNote}</span>
              </p>
            )}

            <button type="button" onClick={() => setDetailsOpen(v=>!v)}
              aria-expanded={detailsOpen}
              className="flex items-center justify-between w-full rounded-xl p-3 text-sm font-semibold"
              style={{background:'var(--surface-2)',color:'var(--text)'}}>
              <span className="flex items-center gap-2"><Clock size={15} style={{color:'var(--brand)'}}/>
                Ver exercícios de cada ficha ({preview.days.length})
              </span>
              {detailsOpen ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}
            </button>
            {detailsOpen && <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Clock size={15} style={{ color: 'var(--text-faint)' }} />
              <p className="text-sm font-semibold">Treinos incluídos ({preview.days.length})</p>
            </div>
            {preview.days.map((day, di) => (
              <div key={di} className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
                <p className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <AppIcon value={day.emoji} size={15} /> {day.name}
                </p>
                {day.focus && <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>{day.focus}</p>}
                <ul className="flex flex-col gap-1.5">
                  {day.exercises.length===0 && <li className="text-xs p-2 rounded-lg" style={{background:'var(--surface)'}}>Aula variável: monte as estações do dia conforme o professor, sem exercícios obrigatórios.</li>}
                  {day.exercises.map((ex, ei) =>
                    <ExerciseSpecRow key={ei} exerciseId={ex.id} sets={ex.sets} reps={ex.reps} notes={ex.notes} />)}
                </ul>
              </div>
            ))}


            </div>}
            </>)}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-full font-medium"
      style={{ background: active ? 'var(--brand)' : 'var(--surface-2)', color: active ? 'white' : 'var(--text-dim)' }}>
      {label}
    </button>
  );
}

function ExerciseSpecRow({ exerciseId, sets, reps, notes }: {
  exerciseId: string; sets: number; reps: string; notes?: string;
}) {
  const [showGuide, setShowGuide] = useState(false);
  const exercise = BUILTIN_EXERCISES.find(ex => ex.id === exerciseId);
  return (
    <li className="text-xs rounded-lg px-2 py-1.5" style={{background:'var(--surface)'}}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setShowGuide(!showGuide)}
          aria-label="Ver execução do exercício">
          <ExerciseThumbnail exercise={exercise} size={45}/>
        </button>
        <div className="flex-1 min-w-0">
          <span className="block font-medium">{exercise?.name ?? 'Exercício não encontrado'}</span>
          <span className="block mt-1" style={{color:'var(--text-faint)'}}>{sets} × {reps}</span>
          {notes && <span className="block mt-0.5" style={{color:'var(--text-faint)'}}>{notes}</span>}
        </div>
        <button type="button" onClick={()=>setShowGuide(!showGuide)}
          aria-expanded={showGuide} className="px-1.5 py-1 text-xs underline"
          style={{color:'var(--brand)'}}>{showGuide?'Fechar':'Ver'}</button>
      </div>
      {showGuide && <div className="pt-2"><ExerciseGuide exercise={exercise}/></div>}
    </li>
  );
}
