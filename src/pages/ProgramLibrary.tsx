import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check } from 'lucide-react';
import { PageHeader, Card, Button, Pill } from '../components/ui';
import { Sheet } from '../components/Sheet';
import {
  READY_PROGRAMS,
  GOAL_LABELS,
  SPLIT_LABELS,
  applyReadyProgram,
  type ProgramGoal,
  type SplitLength,
  type ReadyProgram,
} from '../lib/readyPrograms';
import { BUILTIN_EXERCISES } from '../lib/exercises';

const GOAL_FILTERS: ProgramGoal[] = ['hipertrofia', 'emagrecimento', 'calistenia', 'core'];
const SPLIT_FILTERS: SplitLength[] = ['unico', 'ab', 'abc', 'abcd', 'abcde'];

export function ProgramLibrary() {
  const navigate = useNavigate();
  const [goalFilter, setGoalFilter] = useState<ProgramGoal | null>(null);
  const [splitFilter, setSplitFilter] = useState<SplitLength | null>(null);
  const [preview, setPreview] = useState<ReadyProgram | null>(null);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  const filtered = useMemo(() => {
    return READY_PROGRAMS.filter((p) => (!goalFilter || p.goal === goalFilter) && (!splitFilter || p.split === splitFilter));
  }, [goalFilter, splitFilter]);

  function openPreview(p: ReadyProgram) {
    setApplied(false);
    setPreview(p);
  }

  function handleApply() {
    if (!preview || applying) return;
    setApplying(true);
    try {
      applyReadyProgram(preview.id);
      setApplied(true);
    } finally {
      setApplying(false);
    }
  }

  function goToWorkouts() {
    setPreview(null);
    navigate('/treinos');
  }

  return (
    <div className="px-4">
      <PageHeader title="Programas prontos" />

      <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
        Escolha um objetivo e quantos dias por semana você quer treinar. Aplicar um programa só cria os
        treinos — depois é só encaixar os dias na Programação da semana.
      </p>

      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
        Objetivo
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <FilterChip label="Todos" active={goalFilter === null} onClick={() => setGoalFilter(null)} />
        {GOAL_FILTERS.map((g) => (
          <FilterChip key={g} label={GOAL_LABELS[g]} active={goalFilter === g} onClick={() => setGoalFilter(g)} />
        ))}
      </div>

      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
        Dias por semana
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <FilterChip label="Todos" active={splitFilter === null} onClick={() => setSplitFilter(null)} />
        {SPLIT_FILTERS.map((s) => (
          <FilterChip key={s} label={SPLIT_LABELS[s]} active={splitFilter === s} onClick={() => setSplitFilter(s)} />
        ))}
      </div>

      <div className="flex flex-col gap-2.5 pb-6">
        {filtered.map((p) => (
          <Card key={p.id} className="!p-0 overflow-hidden">
            <button onClick={() => openPreview(p)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <span className="text-2xl">{p.days[0]?.emoji ?? '💪'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{p.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Pill tone="brand">{GOAL_LABELS[p.goal]}</Pill>
                  <Pill>{SPLIT_LABELS[p.split]}</Pill>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-faint)' }} />
            </button>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-faint)' }}>
            Nenhum programa com esse filtro ainda.
          </p>
        )}
      </div>

      <Sheet open={preview !== null} onClose={() => setPreview(null)} title={preview?.title ?? ''}>
        {preview && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              <Pill tone="brand">{GOAL_LABELS[preview.goal]}</Pill>
              <Pill>{SPLIT_LABELS[preview.split]}</Pill>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {preview.description}
            </p>

            {preview.days.map((day, di) => (
              <div key={di}>
                <p className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                  <span>{day.emoji}</span> {day.name}
                </p>
                <ul className="flex flex-col gap-1 mb-1">
                  {day.exercises.map((ex, ei) => (
                    <ExerciseSpecRow key={ei} exerciseId={ex.id} sets={ex.sets} reps={ex.reps} />
                  ))}
                </ul>
              </div>
            ))}

            {applied ? (
              <div className="flex flex-col gap-2 mt-1">
                <div
                  className="rounded-xl px-3 py-2.5 text-xs flex items-center gap-2"
                  style={{ background: 'var(--success-dim)', color: 'var(--success)' }}
                >
                  <Check size={14} /> Treino{preview.days.length > 1 ? 's' : ''} criado{preview.days.length > 1 ? 's' : ''} em Meus treinos.
                </div>
                <Button full onClick={goToWorkouts}>
                  Ver em Meus treinos
                </Button>
              </div>
            ) : (
              <Button full onClick={handleApply} disabled={applying} className="mt-1">
                {applying ? 'Criando...' : 'Aplicar esse programa'}
              </Button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-full font-medium"
      style={{
        background: active ? 'var(--brand)' : 'var(--surface-2)',
        color: active ? 'white' : 'var(--text-dim)',
      }}
    >
      {label}
    </button>
  );
}

function exerciseName(id: string): string {
  return BUILTIN_EXERCISES.find((e) => e.id === id)?.name ?? id;
}

function ExerciseSpecRow({ exerciseId, sets, reps }: { exerciseId: string; sets: number; reps: string }) {
  return (
    <li className="text-xs flex justify-between gap-2" style={{ color: 'var(--text-dim)' }}>
      <span className="truncate">{exerciseName(exerciseId)}</span>
      <span className="shrink-0" style={{ color: 'var(--text-faint)' }}>
        {sets}x{reps}
      </span>
    </li>
  );
}
