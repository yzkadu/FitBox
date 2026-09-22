// Importação pontual de um programa específico de 4 dias (Peito/Ombro/Tríceps,
// Costas/Bíceps, Pernas/Abdômen, Peito/Ombro) que o Kadu mandou em prints de um
// outro app e pediu pra organizar aqui — dentro da conta atual, só rotulado
// "Kadu" nos nomes dos treinos (decisão explícita dele: sem sistema de perfis
// separados, é só pra identificar de quem é esse programa dentro da conta).
//
// Segue o mesmo padrão do `seedPrograms.ts` (helper `build`), mas não é um
// template oferecido no cadastro — é um import de uma vez só, disparado pelo
// `KaduProgramBanner` na aba Meus treinos, e detecta se já rodou olhando os
// nomes dos treinos já criados (pra nunca duplicar se a pessoa tocar de novo).

import { createWorkout, addExerciseToWorkout, addCustomExercise } from './actions';
import type { Exercise, Workout } from '../types';

export const KADU_PROGRAM_PREFIX = 'Kadu –';

interface ExerciseSpec {
  id: string;
  sets: number;
  reps: string;
}

function build(workoutName: string, emoji: string, specs: ExerciseSpec[]): Workout {
  const workout = createWorkout(`${KADU_PROGRAM_PREFIX} ${workoutName}`, emoji);
  specs.forEach((s) => addExerciseToWorkout(workout.id, s.id, s.sets, s.reps));
  return workout;
}

/** true se o programa do Kadu já foi importado nessa conta (por nome de treino) */
export function kaduProgramAlreadyImported(workouts: Workout[]): boolean {
  return workouts.some((w) => w.name.startsWith(KADU_PROGRAM_PREFIX));
}

/**
 * Cria os 4 treinos exatamente como enviados (mesmos exercícios, séries e
 * reps dos prints) e devolve os treinos criados, na ordem Dia 1 → Dia 4.
 * `exercises` é usado só pra não duplicar o exercício personalizado "V sit
 * ups" se essa função rodar mais de uma vez.
 */
export function importKaduProgram(exercises: Exercise[]): Workout[] {
  const existingVSitUps = exercises.find((e) => e.name.trim().toLowerCase() === 'v sit ups');
  const vSitUpsId = existingVSitUps?.id ?? addCustomExercise('V sit ups', 'abdomen').id;

  const day1 = build('Dia 1: Peito, Ombro e Tríceps', 'dumbbell', [
    { id: 'ex-supino-inclinado-halter', sets: 3, reps: '8' }, // Incline db press
    { id: 'ex-supino-maquina', sets: 3, reps: '10' }, // Chest press machine
    { id: 'ex-voador-peck-deck', sets: 4, reps: '12' }, // Pec deck fly
    { id: 'ex-desenvolvimento-halter', sets: 3, reps: '8' }, // Shoulder press
    { id: 'ex-elevacao-lateral', sets: 4, reps: '12' }, // Lateral raises
    { id: 'ex-triceps-pulley', sets: 4, reps: '15' }, // Rope tricep extensions
  ]);

  const day2 = build('Dia 2: Costas e Bíceps', 'target', [
    { id: 'ex-puxada-frente', sets: 3, reps: '12' }, // Lat pull-down
    { id: 'ex-fedb-lying-t-bar-row', sets: 3, reps: '8' }, // Chest supported row
    { id: 'ex-remada-baixa', sets: 3, reps: '13' }, // Close grip cable row
    { id: 'ex-crucifixo-inverso-maquina', sets: 4, reps: '15' }, // Pec deck reverse fly
    { id: 'ex-fedb-incline-dumbbell-curl', sets: 3, reps: '12' }, // Incline db curls
    { id: 'ex-fedb-spider-curl', sets: 4, reps: '15' }, // Spider curls
  ]);

  const day3 = build('Dia 3: Pernas e Abdômen', 'footprints', [
    { id: 'ex-passada-halteres', sets: 3, reps: '10 (cada perna)' }, // Walking lunges
    { id: 'ex-mesa-flexora', sets: 3, reps: '12' }, // Hamstring curl
    { id: 'ex-cadeira-extensora', sets: 3, reps: '12' }, // Leg extensions
    { id: 'ex-leg-press', sets: 2, reps: '8' }, // Leg press
    { id: 'ex-agachamento-hack', sets: 4, reps: '12' }, // Hack squat
    { id: 'ex-panturrilha-em-pe', sets: 4, reps: '15' }, // Calf raises
    { id: 'ex-elevacao-pernas', sets: 3, reps: '15' }, // Leg raises
    { id: vSitUpsId, sets: 3, reps: '10' }, // V sit ups
  ]);

  const day4 = build('Dia 4: Peito e Ombro', 'flame', [
    { id: 'ex-voador-peck-deck', sets: 3, reps: '15' }, // Pec deck fly
    { id: 'ex-supino-maquina', sets: 3, reps: '8' }, // Chest press machine
    { id: 'ex-crossover', sets: 4, reps: '12' }, // Cable fly
    { id: 'ex-desenvolvimento-halter', sets: 3, reps: '8' }, // Shoulder press
    { id: 'ex-elevacao-lateral', sets: 4, reps: '12' }, // Lateral raises
    { id: 'ex-crucifixo-inverso', sets: 3, reps: '12' }, // Rear deltoid fly
  ]);

  return [day1, day2, day3, day4];
}
