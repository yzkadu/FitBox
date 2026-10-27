import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, CalendarDays, Info, Clock, Target, SlidersHorizontal } from 'lucide-react';
import { PageHeader, Card, Button, Pill, AppIcon } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { WEEKDAY_LABELS } from '../types';
import {
  READY_PROGRAMS, GOAL_LABELS, SPLIT_LABELS, PLACE_LABELS, LEVEL_LABELS,
  applyReadyProgram, programPlace,
  type ProgramGoal, type ProgramPlace, type ProgramLevel, type SplitLength, type ReadyProgram,
} from '../lib/readyPrograms';
import { BUILTIN_EXERCISES } from '../lib/exercises';
import { ExerciseThumbnail, ExerciseGuide } from '../components/ExerciseVisual';

const GOAL_FILTERS: ProgramGoal[] = [
  'hibrido', 'emagrecimento', 'hipertrofia', 'corrida', 'calistenia', 'funcional', 'core', 'mobilidade',
];
const PLACE_FILTERS: ProgramPlace[] = ['academia', 'misto', 'peso_corporal', 'casa_equipamento', 'ar_livre'];
const LEVEL_FILTERS: ProgramLevel[] = ['iniciante', 'intermediario', 'avancado'];
const SPLIT_FILTERS: SplitLength[] = ['unico', 'ab', 'abc', 'abcd', 'abcde'];
const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;

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
  const [goalFilter, setGoalFilter] = useState<ProgramGoal | null>(null);
  const [placeFilter, setPlaceFilter] = useState<ProgramPlace | null>(null);
  const [levelFilter, setLevelFilter] = useState<ProgramLevel | null>(null);
  const [splitFilter, setSplitFilter] = useState<SplitLength | null>(null);
  const [preview, setPreview] = useState<ReadyProgram | null>(null);
  const [appliedMode, setAppliedMode] = useState<'treinos' | 'agenda' | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return READY_PROGRAMS
      .filter((p) => (!goalFilter || p.goal === goalFilter) &&
        (!placeFilter || programPlace(p) === placeFilter) &&
        (!levelFilter || p.level === levelFilter || (!p.level && levelFilter === 'intermediario')) &&
        (!splitFilter || p.split === splitFilter))
      .map((p, index) => ({ p, index, score: profile ? fitScore(p, profile) : 0 }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((entry) => entry.p);
  }, [goalFilter, placeFilter, levelFilter, splitFilter, profile]);

  function openPreview(p: ReadyProgram) {
    setAppliedMode(null);
    setError(null);
    setPreview(p);
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
      <PageHeader title="Programas prontos" />
      <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
        Treinos pensados para a vida real: musculação, HYROX, corrida, casa e condicionamento.
        Confira as opções sugeridas, escolha quantas atividades quer fazer no mesmo dia e adapte conforme sua recuperação.
      </p>

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

      <p className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>
        {filtered.length} programa{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}.
        {profile ? ' Ordenados por afinidade com seu perfil.' : ''}
      </p>

      <div className="flex flex-col gap-2.5 pb-6">
        {filtered.map((p) => (
          <Card key={p.id} className="!p-0 overflow-hidden">
            <button type="button" onClick={() => openPreview(p)}
              className="w-full flex items-start gap-3 px-4 py-3.5 text-left">
              <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}>
                <AppIcon value={p.days[0]?.emoji} size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{p.title}</p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>{p.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Pill tone="brand">{GOAL_LABELS[p.goal]}</Pill>
                  <Pill>{PLACE_LABELS[programPlace(p)]}</Pill>
                  {p.level && <Pill>{LEVEL_LABELS[p.level]}</Pill>}
                  {p.sessionMinutes && <Pill>{p.sessionMinutes} min</Pill>}
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-faint)' }} className="shrink-0 mt-1" />
            </button>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm mb-2" style={{ color: 'var(--text-dim)' }}>Nenhum programa com todos esses filtros.</p>
            <button onClick={() => {setGoalFilter(null);setPlaceFilter(null);setLevelFilter(null);setSplitFilter(null);}}
              className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>Limpar filtros</button>
          </div>
        )}
      </div>

      <Sheet open={preview !== null} onClose={() => setPreview(null)} title={preview?.title ?? ''}>
        {preview && (
          <div className="flex flex-col gap-3">
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

            {preview.progression && (
              <p className="text-xs rounded-xl px-3 py-2.5 flex gap-2"
                style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}>
                <Target size={15} className="shrink-0" style={{ color: 'var(--brand)' }} />
                <span><strong>Progressão:</strong> {preview.progression}</span>
              </p>
            )}
            {preview.recoveryNote && (
              <p className="text-xs flex gap-2" style={{ color: 'var(--text-dim)' }}>
                <Info size={15} className="shrink-0" />
                <span>{preview.recoveryNote}</span>
              </p>
            )}

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
                  {day.exercises.map((ex, ei) =>
                    <ExerciseSpecRow key={ei} exerciseId={ex.id} sets={ex.sets} reps={ex.reps} notes={ex.notes} />)}
                </ul>
              </div>
            ))}

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
                    <Button full variant="secondary" onClick={() => handleApply(true)} disabled={applying}>
                      Criar treinos e ativar a agenda sugerida
                    </Button>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                      Atenção: ativar a agenda substitui os sete dias programados atualmente. Seus treinos e histórico antigos não são apagados.
                    </p>
                  </>
                )}
              </div>
            )}
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
