import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical, X, Play, Repeat } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  updateWorkoutExercise,
  updateWorkout,
  replaceWorkoutExercise,
} from '../lib/actions';
import { startSession } from '../lib/actions';
import { Card, Button, EmptyState } from '../components/ui';
import { ExercisePicker } from '../components/ExercisePicker';
import { MUSCLE_GROUP_LABELS } from '../lib/exercises';
import type { Exercise } from '../types';

export function WorkoutEditor() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { workouts, exercises } = useAppData();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
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
          {sorted.map((we) => {
            const ex = exerciseById.get(we.exerciseId);
            return (
              <Card key={we.id} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <GripVertical size={16} style={{ color: 'var(--text-faint)' }} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ex?.name ?? 'Exercício removido'}</p>
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
                    className="w-14 text-center rounded-lg py-1.5 text-sm"
                    style={{ background: 'var(--surface-2)' }}
                    placeholder="reps"
                  />
                </div>
              </Card>
            );
          })}
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--brand)' }}
          >
            <Plus size={16} /> Adicionar exercício
          </button>
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
