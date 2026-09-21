// Lógica de "aplicar" uma proposta do Treinador IA — compartilhada entre a
// tela de chat (AiCoach.tsx) e qualquer outro lugar do app que também deixe a
// IA propor mudanças (ex: criar treino direto na aba "Meus treinos"). Fica
// tudo num só lugar pra nunca divergir o que cada tela faz ao apertar
// "Aplicar" com o mesmo tipo de proposta.

import {
  setDaySchedule,
  createWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  replaceWorkoutExercise,
  updateWorkoutExercise,
  addCustomExercise,
} from './actions';
import { findExerciseByName } from './exerciseMatch';
import type {
  ScheduleProposal,
  NewWorkoutProposal,
  WorkoutEditProposal,
} from './aiCoach';
import type { DaySchedule, Exercise, Workout } from '../types';

/** Resolve o nome (livre, em português) proposto pela IA pro exercício real
 * do catálogo — ou cria um personalizado na hora, se não achar nada
 * parecido, pra nunca perder silenciosamente o que a pessoa confirmou. */
export function resolveExercise(exercises: Exercise[], name: string): Exercise {
  return findExerciseByName(exercises, name) ?? addCustomExercise(name, 'outro');
}

export function applyScheduleProposal(proposal: ScheduleProposal, workouts: Workout[]) {
  for (const change of proposal.changes) {
    if (change.kind === 'treino') {
      if (!change.workoutId || !workouts.some((w) => w.id === change.workoutId)) continue; // treino inválido, pula essa mudança
      setDaySchedule(change.weekday, { kind: 'treino', workoutId: change.workoutId });
    } else if (change.kind === 'cardio') {
      const schedule: DaySchedule = { kind: 'cardio' };
      if (change.suggestedDistanceKm) schedule.suggestedDistanceKm = change.suggestedDistanceKm;
      setDaySchedule(change.weekday, schedule);
    } else {
      setDaySchedule(change.weekday, { kind: 'descanso' });
    }
  }
}

/** Cria o treino novo proposto pela IA e devolve o id, pra quem chamar poder
 * navegar direto pra ele (ex: "Ver treino"). */
export function applyNewWorkoutProposal(proposal: NewWorkoutProposal, exercises: Exercise[]): string {
  const workout = createWorkout(proposal.name, proposal.emoji);
  for (const item of proposal.exercises) {
    const ex = resolveExercise(exercises, item.exerciseName);
    addExerciseToWorkout(workout.id, ex.id, item.targetSets, item.targetReps);
  }
  return workout.id;
}

export function applyWorkoutEditProposal(proposal: WorkoutEditProposal, exercises: Exercise[]) {
  for (const change of proposal.changes) {
    if (change.action === 'add') {
      if (!change.exerciseName) continue;
      const ex = resolveExercise(exercises, change.exerciseName);
      addExerciseToWorkout(proposal.workoutId, ex.id, change.targetSets ?? 3, change.targetReps ?? '10-12');
    } else if (change.action === 'remove') {
      if (!change.entryId) continue;
      removeExerciseFromWorkout(proposal.workoutId, change.entryId);
    } else if (change.action === 'replace') {
      if (!change.entryId || !change.exerciseName) continue;
      const ex = resolveExercise(exercises, change.exerciseName);
      replaceWorkoutExercise(proposal.workoutId, change.entryId, ex.id);
      const patch: { targetSets?: number; targetReps?: string } = {};
      if (change.targetSets != null) patch.targetSets = change.targetSets;
      if (change.targetReps != null) patch.targetReps = change.targetReps;
      if (Object.keys(patch).length > 0) updateWorkoutExercise(proposal.workoutId, change.entryId, patch);
    } else if (change.action === 'update_sets') {
      if (!change.entryId) continue;
      const patch: { targetSets?: number; targetReps?: string } = {};
      if (change.targetSets != null) patch.targetSets = change.targetSets;
      if (change.targetReps != null) patch.targetReps = change.targetReps;
      if (Object.keys(patch).length > 0) updateWorkoutExercise(proposal.workoutId, change.entryId, patch);
    }
  }
}
