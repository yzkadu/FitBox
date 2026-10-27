import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, ArrowUp, ArrowDown, Sparkles, X, Play, Repeat } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  updateWorkoutExercise,
  updateWorkout,
  replaceWorkoutExercise,
  reorderWorkoutExercises,
} from '../lib/actions';
import { startSession } from '../lib/actions';
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
  const { workouts, exercises } = useAppData();
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
    setShowQuickBlocks(false);
  }


  function handleSelectExercise(ex: Exercise) {
    addExerciseToWorkout(workout!.id, ex.id);
    setPickerOpen(false);
  }

  function handleSelectSubstitute(ex: Exercise) {
    if (substitutingEntryId) replaceWorkoutExercise(workout!.id, substitutingEntryId, ex.id);
    setSubstitutingEntryId(null);
  }

  const substitutingExercise = substitutingEntryId
    ? exerciseById.get(workout.exercises.find((e) => e.id === substitutingEntryId)?.exerciseId ?? '')
    : null;

  function handleStart() {
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

      <div className="mb-3">
        <button type="button" onClick={() => setShowQuickBlocks((open) => !open)}
          className="w-full flex items-center justify-between rounded-xl py-3 px-4 text-sm font-semibold"
          style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}>
          <span className="flex items-center gap-2"><Sparkles size={16} /> Sugestões de blocos bem estruturados</span>
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

      {sorted.length === 0 ? (
        <EmptyState
          title="Adicione exercícios a este treino"
          subtitle="Escolha do catálogo ou crie os seus próprios."
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
                    className="w-11 text-center rounded-lg py-1.5 text-sm"
                    style={{ background: 'var(--surface-2)' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    séries ×
                  </span>
                  <input
                    value={we.targetReps}
                    onChange={(e) => updateWorkoutExercise(workout.id, we.id, { targetReps: e.target.value })}
                    className="w-24 text-center rounded-lg py-1.5 text-sm"
                    style={{ background: 'var(--surface-2)' }}
                    placeholder="reps/tempo"
                  />
                </div>
                <div className="pl-7 flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                    Descanso entre séries (seg)
                    <input type="number" min={0} max={600} step={15} value={we.restSeconds ?? 90}
                      onChange={(e) => updateWorkoutExercise(workout.id, we.id, { restSeconds: Number(e.target.value) || 0 })}
                      className="w-20 rounded-lg px-2 py-1.5 text-xs" style={{ background: 'var(--surface-2)' }} />
                  </label>
                  <textarea rows={2} value={we.notes ?? ''}
                    onChange={(e) => updateWorkoutExercise(workout.id, we.id, { notes: e.target.value })}
                    placeholder="Instruções, intensidade, adaptações ou equipamento..."
                    className="w-full rounded-lg px-3 py-2 text-xs resize-y"
                    style={{ background: 'var(--surface-2)' }} />
                </div>
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

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelectExercise} />

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
