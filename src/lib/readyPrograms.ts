// Biblioteca de programas prontos, navegável a qualquer momento dentro do
// app (não só no cadastro, como os templates de `seedPrograms.ts`) — pedido
// da usuária: "opções prontas de treinos dentro do app, tipo abcd, abcde, ab"
// organizadas por objetivo (hipertrofia / emagrecimento / calistenia / core)
// e por divisão (quantos dias diferentes de treino o programa tem).
//
// Cada programa aqui é independente dos templates de cadastro em
// seedPrograms.ts — aplicar um cria treinos novos (nunca mexe na agenda
// semanal automaticamente), então a pessoa pode aplicar quantos quiser e
// só depois decide os dias na "Programação da semana".

import { createWorkout, addExerciseToWorkout } from './actions';
import type { Workout } from '../types';

export type ProgramGoal = 'hipertrofia' | 'emagrecimento' | 'calistenia' | 'core';

export const GOAL_LABELS: Record<ProgramGoal, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  calistenia: 'Calistenia',
  core: 'Core',
};

/** Quantos dias diferentes de treino o programa tem — 'unico' é um treino avulso de 1 dia só. */
export type SplitLength = 'unico' | 'ab' | 'abc' | 'abcd' | 'abcde';

export const SPLIT_LABELS: Record<SplitLength, string> = {
  unico: '1 dia',
  ab: 'AB (2 dias)',
  abc: 'ABC (3 dias)',
  abcd: 'ABCD (4 dias)',
  abcde: 'ABCDE (5 dias)',
};

interface ExerciseSpec {
  id: string;
  sets: number;
  reps: string;
}

interface ReadyProgramDay {
  name: string;
  emoji: string;
  exercises: ExerciseSpec[];
}

export interface ReadyProgram {
  id: string;
  title: string;
  goal: ProgramGoal;
  split: SplitLength;
  description: string;
  days: ReadyProgramDay[];
}

export const READY_PROGRAMS: ReadyProgram[] = [
  // ---------- Hipertrofia ----------
  {
    id: 'hip-ab',
    title: 'Superior / Inferior',
    goal: 'hipertrofia',
    split: 'ab',
    description: '2 dias por semana, ideal pra quem treina com menos frequência mas quer volume por sessão.',
    days: [
      {
        name: 'A: Superior',
        emoji: 'dumbbell',
        exercises: [
          { id: 'ex-supino-reto-barra', sets: 4, reps: '8-10' },
          { id: 'ex-puxada-frente', sets: 4, reps: '8-10' },
          { id: 'ex-desenvolvimento-halter', sets: 3, reps: '10-12' },
          { id: 'ex-remada-baixa', sets: 3, reps: '10-12' },
          { id: 'ex-rosca-direta', sets: 3, reps: '10-12' },
          { id: 'ex-triceps-pulley', sets: 3, reps: '10-12' },
        ],
      },
      {
        name: 'B: Inferior',
        emoji: 'footprints',
        exercises: [
          { id: 'ex-agachamento-livre', sets: 4, reps: '6-8' },
          { id: 'ex-leg-press', sets: 4, reps: '10-12' },
          { id: 'ex-mesa-flexora', sets: 3, reps: '12-15' },
          { id: 'ex-stiff-halter', sets: 3, reps: '10-12' },
          { id: 'ex-panturrilha-em-pe', sets: 4, reps: '12-15' },
          { id: 'ex-abdominal-supra', sets: 3, reps: '15-20' },
        ],
      },
    ],
  },
  {
    id: 'hip-abc',
    title: 'Push / Pull / Legs',
    goal: 'hipertrofia',
    split: 'abc',
    description: 'A divisão clássica de 3 dias — empurrar, puxar e pernas, cada grupo com bom volume.',
    days: [
      {
        name: 'A: Push (Peito, Ombro, Tríceps)',
        emoji: 'dumbbell',
        exercises: [
          { id: 'ex-supino-reto-barra', sets: 4, reps: '8-10' },
          { id: 'ex-supino-inclinado-halter', sets: 3, reps: '10-12' },
          { id: 'ex-desenvolvimento-militar', sets: 3, reps: '8-10' },
          { id: 'ex-elevacao-lateral', sets: 3, reps: '12-15' },
          { id: 'ex-triceps-pulley', sets: 3, reps: '10-12' },
          { id: 'ex-triceps-testa', sets: 3, reps: '10-12' },
        ],
      },
      {
        name: 'B: Pull (Costas, Bíceps)',
        emoji: 'target',
        exercises: [
          { id: 'ex-puxada-frente', sets: 4, reps: '8-10' },
          { id: 'ex-remada-curvada', sets: 3, reps: '8-10' },
          { id: 'ex-remada-unilateral', sets: 3, reps: '10-12' },
          { id: 'ex-crucifixo-inverso', sets: 3, reps: '12-15' },
          { id: 'ex-rosca-direta', sets: 3, reps: '10-12' },
          { id: 'ex-rosca-martelo', sets: 3, reps: '12-15' },
        ],
      },
      {
        name: 'C: Legs',
        emoji: 'footprints',
        exercises: [
          { id: 'ex-agachamento-livre', sets: 4, reps: '6-8' },
          { id: 'ex-leg-press', sets: 4, reps: '10-12' },
          { id: 'ex-cadeira-extensora', sets: 3, reps: '12-15' },
          { id: 'ex-mesa-flexora', sets: 3, reps: '12-15' },
          { id: 'ex-panturrilha-em-pe', sets: 4, reps: '12-15' },
          { id: 'ex-abdominal-supra', sets: 3, reps: '15-20' },
        ],
      },
    ],
  },
  {
    id: 'hip-abcd',
    title: '4 dias (Peito/Ombro/Tríceps · Costas/Bíceps · Pernas/Abdômen · Peito/Ombro)',
    goal: 'hipertrofia',
    split: 'abcd',
    description: 'Mesmo programa de 4 dias que o Kadu usa — dois dias de peito/ombro na semana, com foco extra nesses grupos.',
    days: [
      {
        name: 'Dia 1: Peito, Ombro e Tríceps',
        emoji: 'dumbbell',
        exercises: [
          { id: 'ex-supino-inclinado-halter', sets: 3, reps: '8' },
          { id: 'ex-supino-maquina', sets: 3, reps: '10' },
          { id: 'ex-voador-peck-deck', sets: 4, reps: '12' },
          { id: 'ex-desenvolvimento-halter', sets: 3, reps: '8' },
          { id: 'ex-elevacao-lateral', sets: 4, reps: '12' },
          { id: 'ex-triceps-pulley', sets: 4, reps: '15' },
        ],
      },
      {
        name: 'Dia 2: Costas e Bíceps',
        emoji: 'target',
        exercises: [
          { id: 'ex-puxada-frente', sets: 3, reps: '12' },
          { id: 'ex-fedb-lying-t-bar-row', sets: 3, reps: '8' },
          { id: 'ex-remada-baixa', sets: 3, reps: '13' },
          { id: 'ex-crucifixo-inverso-maquina', sets: 4, reps: '15' },
          { id: 'ex-fedb-incline-dumbbell-curl', sets: 3, reps: '12' },
          { id: 'ex-fedb-spider-curl', sets: 4, reps: '15' },
        ],
      },
      {
        name: 'Dia 3: Pernas e Abdômen',
        emoji: 'footprints',
        exercises: [
          { id: 'ex-passada-halteres', sets: 3, reps: '10 (cada perna)' },
          { id: 'ex-mesa-flexora', sets: 3, reps: '12' },
          { id: 'ex-cadeira-extensora', sets: 3, reps: '12' },
          { id: 'ex-leg-press', sets: 2, reps: '8' },
          { id: 'ex-agachamento-hack', sets: 4, reps: '12' },
          { id: 'ex-panturrilha-em-pe', sets: 4, reps: '15' },
          { id: 'ex-elevacao-pernas', sets: 3, reps: '15' },
        ],
      },
      {
        name: 'Dia 4: Peito e Ombro',
        emoji: 'flame',
        exercises: [
          { id: 'ex-voador-peck-deck', sets: 3, reps: '15' },
          { id: 'ex-supino-maquina', sets: 3, reps: '8' },
          { id: 'ex-crossover', sets: 4, reps: '12' },
          { id: 'ex-desenvolvimento-halter', sets: 3, reps: '8' },
          { id: 'ex-elevacao-lateral', sets: 4, reps: '12' },
          { id: 'ex-crucifixo-inverso', sets: 3, reps: '12' },
        ],
      },
    ],
  },
  {
    id: 'hip-abcde',
    title: 'Push / Pull / Legs / Upper / Lower',
    goal: 'hipertrofia',
    split: 'abcde',
    description: '5 dias de força, frequência alta pra quem treina de segunda a sexta.',
    days: [
      {
        name: 'Push (Peito, Ombro, Tríceps)',
        emoji: 'dumbbell',
        exercises: [
          { id: 'ex-supino-reto-barra', sets: 4, reps: '8-10' },
          { id: 'ex-supino-inclinado-halter', sets: 3, reps: '10-12' },
          { id: 'ex-supino-maquina', sets: 3, reps: '10-12' },
          { id: 'ex-desenvolvimento-militar', sets: 3, reps: '8-10' },
          { id: 'ex-elevacao-lateral', sets: 3, reps: '12-15' },
          { id: 'ex-triceps-pulley', sets: 3, reps: '12-15' },
        ],
      },
      {
        name: 'Pull (Costas, Bíceps)',
        emoji: 'target',
        exercises: [
          { id: 'ex-puxada-frente', sets: 4, reps: '8-10' },
          { id: 'ex-remada-curvada', sets: 3, reps: '8-10' },
          { id: 'ex-remada-unilateral', sets: 3, reps: '10-12' },
          { id: 'ex-remada-baixa', sets: 3, reps: '10-12' },
          { id: 'ex-rosca-direta', sets: 3, reps: '10-12' },
          { id: 'ex-rosca-martelo', sets: 3, reps: '12-15' },
        ],
      },
      {
        name: 'Legs',
        emoji: 'footprints',
        exercises: [
          { id: 'ex-agachamento-livre', sets: 4, reps: '6-8' },
          { id: 'ex-leg-press', sets: 4, reps: '10-12' },
          { id: 'ex-cadeira-extensora', sets: 3, reps: '12-15' },
          { id: 'ex-mesa-flexora', sets: 3, reps: '12-15' },
          { id: 'ex-panturrilha-em-pe', sets: 4, reps: '12-15' },
        ],
      },
      {
        name: 'Upper — Treino de Campeão',
        emoji: 'crown',
        exercises: [
          { id: 'ex-supino-reto-barra', sets: 3, reps: '8-10' },
          { id: 'ex-puxada-frente', sets: 3, reps: '8-10' },
          { id: 'ex-desenvolvimento-militar', sets: 3, reps: '10-12' },
          { id: 'ex-remada-baixa', sets: 3, reps: '10-12' },
          { id: 'ex-elevacao-lateral', sets: 3, reps: '12-15' },
          { id: 'ex-triceps-pulley', sets: 3, reps: '10-12' },
        ],
      },
      {
        name: 'Lower (ênfase posterior/glúteo)',
        emoji: 'flame',
        exercises: [
          { id: 'ex-elevacao-pelvica', sets: 4, reps: '8-10' },
          { id: 'ex-mesa-flexora', sets: 4, reps: '10-12' },
          { id: 'ex-stiff-barra', sets: 3, reps: '10-12' },
          { id: 'ex-afundo', sets: 3, reps: '10-12' },
          { id: 'ex-gluteo-cabo', sets: 3, reps: '12-15' },
          { id: 'ex-panturrilha-em-pe', sets: 4, reps: '12-15' },
        ],
      },
    ],
  },

  // ---------- Emagrecimento ----------
  {
    id: 'emag-ab',
    title: 'Full Body A / B',
    goal: 'emagrecimento',
    split: 'ab',
    description: 'Corpo inteiro em cada sessão, repetições mais altas e menos descanso — some cardio à parte (aba Cardio) pra completar.',
    days: [
      {
        name: 'A: Full Body',
        emoji: 'flame',
        exercises: [
          { id: 'ex-agachamento-livre', sets: 3, reps: '15' },
          { id: 'ex-supino-reto-halter', sets: 3, reps: '15' },
          { id: 'ex-remada-baixa', sets: 3, reps: '15' },
          { id: 'ex-desenvolvimento-halter', sets: 3, reps: '15' },
          { id: 'ex-abdominal-bicicleta', sets: 3, reps: '20' },
        ],
      },
      {
        name: 'B: Full Body',
        emoji: 'flame',
        exercises: [
          { id: 'ex-leg-press', sets: 3, reps: '15' },
          { id: 'ex-puxada-frente', sets: 3, reps: '15' },
          { id: 'ex-crossover', sets: 3, reps: '15' },
          { id: 'ex-elevacao-lateral', sets: 3, reps: '15' },
          { id: 'ex-afundo', sets: 3, reps: '12 (cada perna)' },
          { id: 'ex-abdominal-supra', sets: 3, reps: '20' },
        ],
      },
    ],
  },
  {
    id: 'emag-abc',
    title: 'Full Body A / B / C',
    goal: 'emagrecimento',
    split: 'abc',
    description: '3 dias de corpo inteiro, mais frequência ainda — bom pra combinar com os dias de cardio da semana.',
    days: [
      {
        name: 'A: Full Body',
        emoji: 'flame',
        exercises: [
          { id: 'ex-agachamento-livre', sets: 3, reps: '15' },
          { id: 'ex-supino-maquina', sets: 3, reps: '15' },
          { id: 'ex-remada-baixa', sets: 3, reps: '15' },
          { id: 'ex-elevacao-lateral', sets: 3, reps: '15' },
          { id: 'ex-abdominal-bicicleta', sets: 3, reps: '20' },
        ],
      },
      {
        name: 'B: Full Body',
        emoji: 'flame',
        exercises: [
          { id: 'ex-leg-press', sets: 3, reps: '15' },
          { id: 'ex-puxada-frente', sets: 3, reps: '15' },
          { id: 'ex-desenvolvimento-halter', sets: 3, reps: '15' },
          { id: 'ex-triceps-pulley', sets: 3, reps: '15' },
          { id: 'ex-prancha', sets: 3, reps: '45s' },
        ],
      },
      {
        name: 'C: Full Body',
        emoji: 'flame',
        exercises: [
          { id: 'ex-afundo', sets: 3, reps: '12 (cada perna)' },
          { id: 'ex-crossover', sets: 3, reps: '15' },
          { id: 'ex-remada-unilateral', sets: 3, reps: '15' },
          { id: 'ex-rosca-direta', sets: 3, reps: '15' },
          { id: 'ex-elevacao-pernas', sets: 3, reps: '15' },
        ],
      },
    ],
  },

  // ---------- Calistenia ----------
  {
    id: 'cal-ab',
    title: 'Puxar / Empurrar + Pernas',
    goal: 'calistenia',
    split: 'ab',
    description: '2 dias, só peso do corpo — bom ponto de partida pra quem treina em casa ou numa academia ao ar livre.',
    days: [
      {
        name: 'A: Puxar (Costas, Bíceps)',
        emoji: 'target',
        exercises: [
          { id: 'ex-barra-fixa', sets: 4, reps: '6-10' },
          { id: 'ex-fedb-inverted-row', sets: 3, reps: '12' },
          { id: 'ex-fedb-scapular-pull-up', sets: 3, reps: '10' },
          { id: 'ex-fedb-hanging-leg-raise', sets: 3, reps: '12' },
        ],
      },
      {
        name: 'B: Empurrar + Pernas',
        emoji: 'dumbbell',
        exercises: [
          { id: 'ex-flexao', sets: 4, reps: '12-15' },
          { id: 'ex-fedb-decline-push-up', sets: 3, reps: '12' },
          { id: 'ex-mergulho-paralelas', sets: 3, reps: '10' },
          { id: 'ex-agachamento-livre', sets: 4, reps: '15-20' },
          { id: 'ex-afundo', sets: 3, reps: '12 (cada perna)' },
          { id: 'ex-prancha', sets: 3, reps: '45s' },
        ],
      },
    ],
  },
  {
    id: 'cal-abc',
    title: 'Push / Pull / Legs (calistenia)',
    goal: 'calistenia',
    split: 'abc',
    description: 'A mesma divisão clássica, mas 100% com peso do corpo.',
    days: [
      {
        name: 'A: Push',
        emoji: 'dumbbell',
        exercises: [
          { id: 'ex-flexao', sets: 4, reps: '15' },
          { id: 'ex-fedb-push-up-wide', sets: 3, reps: '12' },
          { id: 'ex-fedb-decline-push-up', sets: 3, reps: '12' },
          { id: 'ex-mergulho-paralelas', sets: 3, reps: '10' },
          { id: 'ex-prancha', sets: 3, reps: '45s' },
        ],
      },
      {
        name: 'B: Pull',
        emoji: 'target',
        exercises: [
          { id: 'ex-barra-fixa', sets: 4, reps: '6-10' },
          { id: 'ex-fedb-inverted-row', sets: 3, reps: '12' },
          { id: 'ex-fedb-scapular-pull-up', sets: 3, reps: '10' },
          { id: 'ex-fedb-hanging-leg-raise', sets: 3, reps: '12' },
        ],
      },
      {
        name: 'C: Legs + Core',
        emoji: 'footprints',
        exercises: [
          { id: 'ex-agachamento-livre', sets: 4, reps: '20' },
          { id: 'ex-afundo', sets: 3, reps: '12 (cada perna)' },
          { id: 'ex-fedb-freehand-jump-squat', sets: 3, reps: '12' },
          { id: 'ex-panturrilha-em-pe', sets: 4, reps: '20' },
          { id: 'ex-fedb-russian-twist', sets: 3, reps: '20' },
          { id: 'ex-fedb-dead-bug', sets: 3, reps: '12' },
        ],
      },
    ],
  },
  {
    id: 'cal-abcd',
    title: 'Empurrar / Puxar / Pernas / Core',
    goal: 'calistenia',
    split: 'abcd',
    description: '4 dias pra quem já treina calistenia com frequência e quer separar mais os grupos.',
    days: [
      {
        name: 'Dia 1: Empurrar',
        emoji: 'dumbbell',
        exercises: [
          { id: 'ex-flexao', sets: 4, reps: '15' },
          { id: 'ex-fedb-push-up-wide', sets: 3, reps: '12' },
          { id: 'ex-fedb-push-ups-close-triceps-position', sets: 3, reps: '12' },
          { id: 'ex-mergulho-banco', sets: 3, reps: '12' },
        ],
      },
      {
        name: 'Dia 2: Puxar',
        emoji: 'target',
        exercises: [
          { id: 'ex-barra-fixa', sets: 4, reps: '8' },
          { id: 'ex-fedb-wide-grip-rear-pull-up', sets: 3, reps: '8' },
          { id: 'ex-fedb-inverted-row', sets: 3, reps: '12' },
          { id: 'ex-fedb-scapular-pull-up', sets: 3, reps: '10' },
        ],
      },
      {
        name: 'Dia 3: Pernas',
        emoji: 'footprints',
        exercises: [
          { id: 'ex-agachamento-livre', sets: 4, reps: '20' },
          { id: 'ex-afundo', sets: 3, reps: '12 (cada perna)' },
          { id: 'ex-fedb-freehand-jump-squat', sets: 3, reps: '12' },
          { id: 'ex-panturrilha-em-pe', sets: 4, reps: '20' },
        ],
      },
      {
        name: 'Dia 4: Core + Full Body',
        emoji: 'flame',
        exercises: [
          { id: 'ex-prancha', sets: 3, reps: '45s' },
          { id: 'ex-fedb-russian-twist', sets: 3, reps: '20' },
          { id: 'ex-fedb-dead-bug', sets: 3, reps: '12' },
          { id: 'ex-fedb-hanging-leg-raise', sets: 3, reps: '12' },
          { id: 'ex-fedb-flutter-kicks', sets: 3, reps: '20' },
        ],
      },
    ],
  },

  // ---------- Core (avulso) ----------
  {
    id: 'core-unico',
    title: 'Treino de Core',
    goal: 'core',
    split: 'unico',
    description: 'Um treino avulso de abdômen/core — dá pra encaixar como dia extra em qualquer outro programa.',
    days: [
      {
        name: 'Core',
        emoji: 'shield',
        exercises: [
          { id: 'ex-abdominal-supra', sets: 3, reps: '15-20' },
          { id: 'ex-prancha', sets: 3, reps: '45s' },
          { id: 'ex-prancha-lateral', sets: 3, reps: '30s (cada lado)' },
          { id: 'ex-elevacao-pernas', sets: 3, reps: '15' },
          { id: 'ex-abdominal-bicicleta', sets: 3, reps: '20' },
          { id: 'ex-fedb-russian-twist', sets: 3, reps: '20' },
          { id: 'ex-fedb-dead-bug', sets: 3, reps: '12' },
        ],
      },
    ],
  },
];

/** Cria os treinos de um programa pronto (não mexe na agenda semanal — a
 * pessoa organiza os dias depois em "Programação da semana"). */
export function applyReadyProgram(programId: string): Workout[] {
  const program = READY_PROGRAMS.find((p) => p.id === programId);
  if (!program) return [];
  return program.days.map((day) => {
    const workout = createWorkout(day.name, day.emoji);
    day.exercises.forEach((ex) => addExerciseToWorkout(workout.id, ex.id, ex.sets, ex.reps));
    return workout;
  });
}
