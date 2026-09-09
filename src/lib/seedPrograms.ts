// Templates prontos de programa de treino, oferecidos na criação de um perfil.
// Cada template popula os treinos (com exercícios do catálogo) e a agenda semanal.

import { createWorkout, addExerciseToWorkout, setDaySchedule } from './actions';

interface ExerciseSpec {
  id: string;
  sets: number;
  reps: string;
}

function build(workoutName: string, emoji: string, specs: ExerciseSpec[]) {
  const workout = createWorkout(workoutName, emoji);
  specs.forEach((s) => addExerciseToWorkout(workout.id, s.id, s.sets, s.reps));
  return workout;
}

/**
 * Programa híbrido: 5 dias de força (seg-sex, divisão Push/Pull/Legs/Upper/Lower)
 * + domingo de cardio (corrida ou bike) + sábado de descanso. Pensado para quem
 * também corre/pedala durante a semana e não quer sobrecarregar as pernas.
 */
export function seedPplHybridProgram() {
  const push = build('Push (Peito, Ombro, Tríceps)', '💪', [
    { id: 'ex-supino-reto-barra', sets: 4, reps: '8-10' },
    { id: 'ex-supino-inclinado-halter', sets: 3, reps: '10-12' },
    { id: 'ex-desenvolvimento-militar', sets: 3, reps: '8-10' },
    { id: 'ex-elevacao-lateral', sets: 3, reps: '12-15' },
    { id: 'ex-triceps-pulley', sets: 3, reps: '12-15' },
    { id: 'ex-triceps-testa', sets: 3, reps: '10-12' },
  ]);

  const pull = build('Pull (Costas, Bíceps, Post. Ombro)', '🎯', [
    { id: 'ex-puxada-frente', sets: 4, reps: '8-10' },
    { id: 'ex-remada-curvada', sets: 3, reps: '8-10' },
    { id: 'ex-remada-baixa', sets: 3, reps: '10-12' },
    { id: 'ex-crucifixo-inverso', sets: 3, reps: '12-15' },
    { id: 'ex-rosca-direta', sets: 3, reps: '10-12' },
    { id: 'ex-rosca-martelo', sets: 3, reps: '12-15' },
  ]);

  const legs = build('Legs (Quadríceps, Post. Coxa, Panturrilha, Glúteo)', '🦵', [
    { id: 'ex-agachamento-livre', sets: 4, reps: '6-8' },
    { id: 'ex-leg-press', sets: 3, reps: '10-12' },
    { id: 'ex-cadeira-extensora', sets: 3, reps: '12-15' },
    { id: 'ex-mesa-flexora', sets: 3, reps: '12-15' },
    { id: 'ex-elevacao-pelvica', sets: 3, reps: '10-12' },
    { id: 'ex-panturrilha-em-pe', sets: 4, reps: '12-15' },
  ]);

  const upper = build('Upper — Treino de Campeão', '👑', [
    { id: 'ex-supino-reto-barra', sets: 3, reps: '8-10' },
    { id: 'ex-puxada-frente', sets: 3, reps: '8-10' },
    { id: 'ex-desenvolvimento-militar', sets: 3, reps: '10-12' },
    { id: 'ex-rosca-direta', sets: 3, reps: '10-12' },
    { id: 'ex-triceps-pulley', sets: 3, reps: '10-12' },
    { id: 'ex-abdominal-supra', sets: 3, reps: '15-20' },
  ]);

  const lower = build('Lower (ênfase posterior/glúteo)', '🔥', [
    { id: 'ex-elevacao-pelvica', sets: 4, reps: '8-10' },
    { id: 'ex-mesa-flexora', sets: 4, reps: '10-12' },
    { id: 'ex-afundo', sets: 3, reps: '10-12' },
    { id: 'ex-cadeira-adutora', sets: 3, reps: '12-15' },
    { id: 'ex-panturrilha-em-pe', sets: 4, reps: '12-15' },
  ]);

  setDaySchedule('seg', { kind: 'treino', workoutId: push.id });
  setDaySchedule('ter', { kind: 'treino', workoutId: pull.id });
  setDaySchedule('qua', { kind: 'treino', workoutId: legs.id });
  setDaySchedule('qui', { kind: 'treino', workoutId: upper.id });
  setDaySchedule('sex', { kind: 'treino', workoutId: lower.id });
  setDaySchedule('sab', { kind: 'descanso' });
  setDaySchedule('dom', { kind: 'cardio' });
}

export type ProgramTemplateId = 'blank' | 'ppl-hybrid';

export const PROGRAM_TEMPLATES: { id: ProgramTemplateId; name: string; description: string }[] = [
  { id: 'blank', name: 'Perfil em branco', description: 'Monte seus próprios treinos do zero.' },
  {
    id: 'ppl-hybrid',
    name: 'Programa híbrido (força + corrida/bike)',
    description: '5 dias de força (Push/Pull/Legs/Upper/Lower), domingo de cardio e sábado de descanso.',
  },
];

export function applyProgramTemplate(templateId: ProgramTemplateId) {
  if (templateId === 'ppl-hybrid') seedPplHybridProgram();
}
