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

import { createWorkout, addExerciseToWorkout, replaceWeeklySchedule } from './actions';
import { EXTRA_WEIGHT_LOSS_PROGRAMS } from './weightLossPrograms';
import { WEEKDAY_ORDER } from '../types';
import type { Workout, WeeklySchedule } from '../types';

export type ProgramGoal = 'hipertrofia' | 'emagrecimento' | 'calistenia' | 'core' | 'hibrido' | 'corrida' | 'funcional' | 'mobilidade';

export const GOAL_LABELS: Record<ProgramGoal, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  calistenia: 'Calistenia',
  core: 'Core',
  hibrido: 'Híbrido / HYROX',
  corrida: 'Corrida',
  funcional: 'Condicionamento',
  mobilidade: 'Mobilidade',
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
  notes?: string;
  restSeconds?: number;
}

interface ReadyProgramDay {
  name: string;
  emoji: string;
  focus?: string;
  exercises: ExerciseSpec[];
}

export type ProgramPlace = 'academia' | 'casa_equipamento' | 'peso_corporal' | 'misto' | 'ar_livre';
export type ProgramLevel = 'iniciante' | 'intermediario' | 'avancado';
export type ProgramModality = 'corrida' | 'forca' | 'hibrido' | 'casa' | 'funcional';
export type WeekStep = { kind: 'workout'; index: number } | { kind: 'cardio'; label: string; distanceKm?: number } | { kind: 'combo'; index: number; label: string; durationMin?: number; distanceKm?: number } | { kind: 'rest' };

export interface ReadyProgram {
  id: string;
  title: string;
  goal: ProgramGoal;
  split: SplitLength;
  description: string;
  days: ReadyProgramDay[];
  /** Modalidade principal, independente da categoria de objetivo. */
  modality?: ProgramModality;
  /** Protocolo intervalado de cardio, apresentado em vez de uma ficha de séries. */
  cardioPresetId?: string;
  place?: ProgramPlace;
  level?: ProgramLevel;
  sessionMinutes?: number;
  progression?: string;
  recoveryNote?: string;
  /** Sete posições, de segunda a domingo, para um plano de semana explícito. */
  weekPlan?: WeekStep[];
}

export const PLACE_LABELS: Record<ProgramPlace, string> = {
  academia: 'Academia',
  casa_equipamento: 'Casa com equipamentos',
  peso_corporal: 'Casa sem equipamentos',
  misto: 'Academia + corrida',
  ar_livre: 'Corrida / ar livre',
};
export const MODALITY_LABELS: Record<ProgramModality, string> = {
  corrida: 'Corrida / esteira',
  forca: 'Musculação',
  hibrido: 'Híbrido',
  casa: 'Casa / baixo impacto',
  funcional: 'Funcional',
};
export function programModality(program: ReadyProgram): ProgramModality {
  if (program.modality) return program.modality;
  if (program.goal === 'hibrido') return 'hibrido';
  if (program.goal === 'corrida') return 'corrida';
  if (program.goal === 'funcional') return 'funcional';
  if (program.goal === 'calistenia' || program.goal === 'core' || program.goal === 'mobilidade') return 'casa';
  return 'forca';
}

export const LEVEL_LABELS: Record<ProgramLevel, string> = {
  iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado',
};
export function programPlace(program: ReadyProgram): ProgramPlace {
  if (program.place) return program.place;
  if (program.goal === 'calistenia') return 'casa_equipamento'; // os antigos exigem barra fixa
  if (program.goal === 'core') return 'peso_corporal';
  return 'academia';
}

const ex = (id: string, sets: number, reps: string, notes?: string, restSeconds?: number): ExerciseSpec => ({ id, sets, reps, notes, restSeconds });
const workoutDay = (index: number): WeekStep => ({ kind: 'workout', index });
const runDay = (label: string, distanceKm?: number): WeekStep => ({ kind: 'cardio', label, distanceKm });
const comboDay = (index: number, label: string, durationMin = 12): WeekStep => ({ kind: 'combo', index, label, durationMin }); // duas opções livres no dia, sem ordem
const off: WeekStep = { kind: 'rest' };

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
    description: 'Divisão de 4 dias com ênfase em peito e ombro. Ajuste o volume para não negligenciar pernas e costas.',
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
        name: 'Upper · Superior completo',
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
    description: 'Duas sessões de força de corpo inteiro para preservar massa muscular; combine com atividade aeróbica e alimentação compatível com sua meta.',
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
    description: 'Três sessões distribuídas na semana, com dias de descanso entre elas. Combinar com caminhada ou cardio moderado é uma opção.',
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

  ...EXTRA_WEIGHT_LOSS_PROGRAMS,

  // ---------- Calistenia ----------
  {
    id: 'cal-ab',
    title: 'Puxar / Empurrar + Pernas',
    goal: 'calistenia',
    split: 'ab',
    description: 'Dois dias de calistenia com exercícios na barra fixa ou suporte seguro; não indicado para quem não tem nenhum equipamento.',
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
    description: 'Divisão de calistenia com peso do corpo e barra fixa estável para os exercícios de puxar.',
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

  // ---------- Programas orientados por modalidade, local e recuperação ----------
  {
    id: 'hyrox-inicio',
    title: 'HYROX: Comece com base',
    goal: 'hibrido',
    split: 'abc',
    place: 'misto',
    level: 'iniciante',
    sessionMinutes: 45,
    description: 'Preparação HYROX progressiva: corrida leve antes do treino de força/estações, mais uma corrida separada e recuperação suficiente.',
    progression: 'Semanas 1–2: trabalhe em ritmo confortável (RPE 5–6/10). Depois aumente pouco a pouco a distância da corrida ou uma série por estação, não tudo ao mesmo tempo.',
    recoveryNote: 'Mantenha quinta e domingo de descanso. Trenó, SkiErg e wall ball exigem academia equipada; adapte cargas à técnica.',
    days: [
      { name: 'HYROX A · Força total', emoji: 'dumbbell', focus: 'Agachar, empurrar, puxar e estabilizar',
        exercises: [ex('ex-agachamento-livre',3,'8-10',undefined,90),ex('ex-supino-reto-halter',3,'8-12'),
          ex('ex-remada-baixa',3,'10-12'),ex('ex-stiff-halter',2,'8-10'),ex('ex-prancha',2,'30-40s')] },
      { name: 'HYROX B · Estações técnicas', emoji: 'activity', focus: 'Qualidade das transições; não é uma prova',
        exercises: [ex('ex-hyrox-ski',2,'250 m','Ritmo fácil, concentre-se na técnica.'),
          ex('ex-hyrox-sled-push',2,'10-15 m','Carga leve e postura neutra.'),
          ex('ex-remo-ergometrico',2,'250 m','Movimento fluido.'),
          ex('ex-hyrox-wall-ball',2,'10-15','Bola leve e amplitude controlada.')] },
      { name: 'HYROX C · Força e estabilidade', emoji: 'footprints', focus: 'Unilateral, posterior e transporte',
        exercises: [ex('ex-leg-press',3,'10-12'),ex('ex-puxada-frente',3,'10-12'),ex('ex-afundo',2,'8 cada perna'),
          ex('ex-hyrox-farmers',2,'30 m','Use cargas que permitam andar ereto.'),ex('ex-fedb-dead-bug',2,'10 cada lado')] },
    ],
    weekPlan: [comboDay(0,'Corrida/caminhada leve + força total',10),off,
      comboDay(1,'Corrida fácil + técnica HYROX',8),off,workoutDay(2),runDay('Corrida contínua tranquila',3),off],
  },
  {
    id: 'hibrido-emagrecimento',
    title: 'Emagrecimento híbrido · Força + corrida + HYROX',
    goal: 'hibrido',
    split: 'abc',
    place: 'misto',
    level: 'intermediario',
    sessionMinutes: 45,
    description: 'Corrida e musculação disponíveis juntas nos dias combinados, sem ordem obrigatória, com dois dias de força, um de estações HYROX e corrida leve isolada. Volume reduzido para recuperar.',
    progression: 'Aumente primeiro a consistência. Progrida a corrida cerca de 5–10% quando tolerada; na musculação, aumente carga após atingir o topo das repetições com técnica.',
    recoveryNote: 'Emagrecimento depende principalmente do balanço energético. Não é preciso treinar até a exaustão. Ajuste volume e recuperação.',
    days: [
      { name: 'Híbrido A · Força geral', emoji: 'dumbbell', focus: 'Manter força e massa muscular durante a perda de peso',
        exercises: [ex('ex-agachamento-livre',3,'8-10'),ex('ex-supino-reto-halter',3,'8-12'),
          ex('ex-remada-baixa',3,'8-12'),ex('ex-stiff-halter',2,'10-12'),ex('ex-prancha',3,'30s')] },
      { name: 'Híbrido B · HYROX controlado', emoji: 'activity', focus: 'Técnica e condicionamento em intensidade moderada',
        exercises: [ex('ex-hyrox-ski',2,'300 m'),ex('ex-hyrox-sled-push',3,'10 m'),
          ex('ex-hyrox-burpee',2,'6-8'),ex('ex-hyrox-wall-ball',2,'12'),
          ex('ex-remo-ergometrico',2,'300 m')] },
      { name: 'Híbrido C · Força complementar', emoji: 'footprints', focus: 'Pernas, costas e core sem sessões intermináveis',
        exercises: [ex('ex-leg-press',3,'10-12'),ex('ex-puxada-frente',3,'10-12'),
          ex('ex-desenvolvimento-halter',2,'8-12'),ex('ex-hyrox-farmers',2,'40 m'),
          ex('ex-fedb-dead-bug',2,'10 cada lado')] },
    ],
    weekPlan: [comboDay(0,'Corrida leve + força geral',12),off,
      comboDay(1,'Corrida curta + HYROX técnico',8),off,workoutDay(2),runDay('Corrida confortável',3),off],
  },
  {
    id: 'hyrox-intermediario',
    title: 'HYROX · Resistência e estações',
    goal: 'hibrido',
    split: 'abc',
    place: 'misto',
    level: 'intermediario',
    sessionMinutes: 55,
    description: 'Para quem já treina e corre: força de membros superiores, força de pernas e um circuito de estações com carga controlada.',
    progression: 'Nas primeiras semanas priorize técnica; amplie repetições/distâncias gradualmente e inclua simulações maiores somente após consolidar a base.',
    recoveryNote: 'O HYROX completo alterna corrida com oito estações. Este programa é preparatório, não uma simulação de prova.',
    days: [
      { name: 'HYROX · Superior', emoji: 'dumbbell', exercises: [ex('ex-puxada-frente',3,'8-10'),ex('ex-supino-reto-barra',3,'8-10'),
        ex('ex-remada-baixa',3,'10-12'),ex('ex-desenvolvimento-halter',2,'10-12'),ex('ex-prancha',2,'40s')] },
      { name: 'HYROX · Inferior', emoji: 'footprints', exercises: [ex('ex-agachamento-livre',3,'6-8'),
        ex('ex-stiff-halter',3,'8-10'),ex('ex-afundo',2,'10 cada perna'),ex('ex-hyrox-farmers',2,'40 m')] },
      { name: 'HYROX · Estações', emoji: 'activity', exercises: [ex('ex-hyrox-ski',2,'500 m'),
        ex('ex-hyrox-sled-push',3,'15 m'),ex('ex-hyrox-sled-pull',3,'15 m'),
        ex('ex-hyrox-burpee',2,'8-10'),ex('ex-remo-ergometrico',2,'500 m'),
        ex('ex-hyrox-sandbag',2,'12 cada perna'),ex('ex-hyrox-wall-ball',2,'15')] },
    ],
    weekPlan: [comboDay(0,'Corrida leve + superior',15),off,workoutDay(1),off,
      comboDay(2,'Corrida curta + estações HYROX',10),runDay('Corrida aeróbica leve',4),off],
  },

  {
    id: 'hibrido-4dias-run-first',
    title: 'Combo 4 dias de musculação + HYROX · Agenda flexível',
    goal: 'hibrido',
    split: 'abcd',
    place: 'misto',
    level: 'intermediario',
    sessionMinutes: 55,
    description: 'Combina os 4 dias tradicionais de musculação com uma sessão HYROX leve. Em dois dias há corrida e ficha como opções independentes. É possível fazer uma delas, ambas ou alternar conforme recuperação.',
    progression: 'Se combinar as atividades, mantenha a corrida leve (8–15 min), sem tiros; preserve as cargas técnicas dos exercícios. Comece com 2 séries se seu volume atual for baixo. Evolua depois de 2–3 semanas consistentes.',
    recoveryNote: 'São cinco dias ativos com quatro fichas de musculação e uma técnica HYROX. Pode ser excessivo para iniciantes; reduza para 3–4 dias se necessário. Evite empilhar corrida intensa e pernas pesadas na mesma sessão.',
    days: [
      { name: 'Combo A · Peito, ombro e tríceps', emoji: 'dumbbell', focus: 'Força superior depois de corrida curta',
        exercises: [ex('ex-supino-inclinado-halter',3,'8-12'),ex('ex-supino-maquina',2,'10-12'),
          ex('ex-desenvolvimento-halter',2,'8-12'),ex('ex-elevacao-lateral',2,'12-15'),
          ex('ex-triceps-pulley',2,'10-12')] },
      { name: 'Combo B · Costas e bíceps', emoji: 'target', focus: 'Força de puxada e braços',
        exercises: [ex('ex-puxada-frente',3,'8-12'),ex('ex-remada-baixa',3,'10-12'),
          ex('ex-crucifixo-inverso-maquina',2,'12-15'),ex('ex-rosca-martelo',2,'10-12')] },
      { name: 'Combo C · Pernas e core', emoji: 'footprints', focus: 'Força de pernas; evite empilhar corrida intensa nessa sessão',
        exercises: [ex('ex-agachamento-livre',3,'8-10'),ex('ex-mesa-flexora',3,'10-12'),
          ex('ex-leg-press',2,'10-12'),ex('ex-panturrilha-em-pe',2,'12-15'),
          ex('ex-fedb-dead-bug',2,'10 cada lado')] },
      { name: 'Combo D · Superior complementar', emoji: 'activity', focus: 'Volume moderado sem repetir o treino A completo',
        exercises: [ex('ex-remada-unilateral',3,'10 por lado'),ex('ex-supino-maquina',2,'10-12'),
          ex('ex-elevacao-lateral',2,'12-15'),ex('ex-puxada-frente',2,'10-12'),
          ex('ex-triceps-pulley',2,'12')] },
      { name: 'Combo E · Técnica HYROX', emoji: 'flame', focus: 'Corrida leve antes das estações; trabalho técnico, não simulação de prova',
        exercises: [ex('ex-hyrox-ski',2,'250 m'),ex('ex-remo-ergometrico',2,'250 m'),
          ex('ex-hyrox-sled-push',2,'10 m','Carga leve, técnica antes da velocidade.'),
          ex('ex-hyrox-wall-ball',2,'10-12')] },
    ],
    weekPlan: [
      comboDay(0,'Corrida fácil + peito/ombro/tríceps',12),
      workoutDay(1),
      comboDay(4,'Corrida leve + estações HYROX',8),
      off,
      workoutDay(2),
      workoutDay(3),
      off,
    ],
  },

  {
    id: 'corrida-primeiros-5km',
    title: 'Do zero aos 5 km · Corrida + força',
    goal: 'corrida',
    split: 'ab',
    place: 'ar_livre',
    level: 'iniciante',
    sessionMinutes: 35,
    description: 'Três dias de corrida/caminhada intercalados com dois treinos simples de força. Ajuste o ritmo ao seu nível.',
    progression: 'Comece alternando 1–2 minutos correndo e 2 minutos andando por 20–30 minutos. Aumente os períodos de corrida com conforto até correr continuamente.',
    recoveryNote: 'Os 5 km são um objetivo progressivo, não uma distância obrigatória na primeira semana.',
    days: [
      { name: '5 km · Força A', emoji: 'dumbbell', exercises: [ex('ex-agachamento-livre',2,'10-12'),
        ex('ex-flexao',2,'6-12'),ex('ex-afundo',2,'8 cada perna'),ex('ex-prancha',2,'20-30s')] },
      { name: '5 km · Força B', emoji: 'footprints', exercises: [ex('ex-fedb-single-leg-glute-bridge',2,'10 cada lado'),
        ex('ex-agachamento-sumo',2,'12'),ex('ex-panturrilha-em-pe',3,'12-15'),
        ex('ex-fedb-dead-bug',2,'10 cada lado')] },
    ],
    weekPlan: [runDay('Corrida/caminhada intervalada',2),workoutDay(0),runDay('Corrida/caminhada leve',2),
      off,workoutDay(1),runDay('Corrida fácil mais longa conforme evolução',3),off],
  },
  {
    id: 'corrida-10km',
    title: 'Construindo 10 km com força',
    goal: 'corrida',
    split: 'ab',
    place: 'misto',
    level: 'intermediario',
    sessionMinutes: 45,
    description: 'Três estímulos aeróbicos distribuídos na semana com dois dias de fortalecimento e proteção da recuperação.',
    progression: 'Comece apenas se 5 km já forem confortáveis. Amplie gradualmente a corrida longa, alternando semanas de carga mais leve.',
    recoveryNote: 'A sessão de ritmo deve ser controlada; evite tentar recordes em todas as corridas.',
    days: [
      { name: 'Corrida 10 km · Força A', emoji: 'dumbbell', exercises: [ex('ex-agachamento-livre',3,'8'),
        ex('ex-remada-baixa',3,'10'),ex('ex-supino-reto-halter',3,'10'),ex('ex-prancha',2,'40s')] },
      { name: 'Corrida 10 km · Força B', emoji: 'footprints', exercises: [ex('ex-stiff-halter',3,'8-10'),
        ex('ex-afundo',2,'10 cada perna'),ex('ex-panturrilha-em-pe',3,'15'),
        ex('ex-fedb-dead-bug',2,'10 cada lado')] },
    ],
    weekPlan: [runDay('Corrida fácil',5),workoutDay(0),runDay('Treino de ritmo controlado',4),
      off,workoutDay(1),runDay('Corrida longa em ritmo fácil',7),off],
  },
  {
    id: 'casa-zero-equipamento',
    title: 'Em casa · Corpo inteiro sem equipamentos',
    goal: 'calistenia',
    split: 'abc',
    place: 'peso_corporal',
    level: 'iniciante',
    sessionMinutes: 25,
    description: 'Três treinos diferentes usando somente o chão e o próprio corpo, sem barra, halteres, banco ou elásticos.',
    progression: 'Comece com 2 séries e pausas livres. Avance para 3 séries quando o treino ficar confortável; ajuste as flexões para uma variação acessível.',
    recoveryNote: 'Treinos sem equipamento têm limitações para puxadas de costas; adicionar elástico futuramente melhora o equilíbrio.',
    days: [
      { name: 'Casa A · Corpo inteiro', emoji: 'flame', exercises: [ex('ex-agachamento-livre',2,'10-15'),
        ex('ex-flexao',2,'6-10','Adapte com joelhos apoiados, se necessário.'),
        ex('ex-fedb-single-leg-glute-bridge',2,'8 cada perna'),ex('ex-fedb-dead-bug',2,'10 cada lado')] },
      { name: 'Casa B · Estabilidade', emoji: 'footprints', exercises: [ex('ex-afundo',2,'8 cada perna'),
        ex('ex-flexao',2,'6-10'),ex('ex-prancha-lateral',2,'20s cada lado'),
        ex('ex-panturrilha-em-pe',2,'15')] },
      { name: 'Casa C · Resistência leve', emoji: 'activity', exercises: [ex('ex-agachamento-sumo',2,'12-15'),
        ex('ex-hyrox-burpee',2,'4-6','Opcional: substitua por agachamento se o impacto incomodar.'),
        ex('ex-fedb-glute-kickback',2,'12 cada perna'),ex('ex-abdominal-bicicleta',2,'12')] },
    ],
    weekPlan: [workoutDay(0),off,workoutDay(1),off,workoutDay(2),
      runDay('Caminhada ou corrida leve opcional',2),off],
  },
  {
    id: 'casa-20min',
    title: '20 minutos em casa · Rotina corrida',
    goal: 'funcional',
    split: 'ab',
    place: 'peso_corporal',
    level: 'iniciante',
    sessionMinutes: 20,
    description: 'Duas sessões curtas de corpo inteiro para quem tem pouco tempo, além de caminhada ou atividade leve nos outros dias.',
    progression: 'Mantenha 1–2 repetições de reserva; ao ficar fácil, acrescente uma série antes de reduzir os descansos.',
    days: [
      { name: '20 min A · Força', emoji: 'dumbbell', exercises: [ex('ex-agachamento-livre',2,'12'),
        ex('ex-flexao',2,'6-12'),ex('ex-fedb-single-leg-glute-bridge',2,'8 cada lado'),
        ex('ex-prancha',2,'20-30s')] },
      { name: '20 min B · Movimento', emoji: 'activity', exercises: [ex('ex-afundo',2,'8 cada perna'),
        ex('ex-agachamento-sumo',2,'10'),ex('ex-fedb-dead-bug',2,'10 cada lado'),
        ex('ex-abdominal-supra',2,'12')] },
    ],
    weekPlan: [workoutDay(0),off,runDay('Caminhada leve opcional',2),workoutDay(1),off,runDay('Movimento leve opcional',2),off],
  },
  {
    id: 'halteres-em-casa',
    title: 'Casa com halteres · 3 dias de força',
    goal: 'hipertrofia',
    split: 'abc',
    place: 'casa_equipamento',
    level: 'intermediario',
    sessionMinutes: 40,
    description: 'Treinos de corpo inteiro em casa com halteres; estímulos variados e descanso entre os dias.',
    progression: 'Se completar o limite superior de repetições com técnica, suba um pouco a carga ou repetições na sessão seguinte.',
    days: [
      { name: 'Halteres A · Força geral', emoji: 'dumbbell', exercises: [ex('ex-fedb-goblet-squat',3,'8-12'),
        ex('ex-remada-unilateral',3,'10 cada lado'),ex('ex-supino-reto-halter',3,'8-12'),
        ex('ex-prancha',2,'40s')] },
      { name: 'Halteres B · Posterior', emoji: 'footprints', exercises: [ex('ex-stiff-halter',3,'8-12'),
        ex('ex-afundo',3,'10 cada perna'),ex('ex-desenvolvimento-halter',3,'8-12'),
        ex('ex-rosca-martelo',2,'12')] },
      { name: 'Halteres C · Corpo inteiro', emoji: 'activity', exercises: [ex('ex-fedb-goblet-squat',3,'10-12'),
        ex('ex-remada-unilateral',3,'10'),ex('ex-flexao',3,'8-12'),
        ex('ex-panturrilha-em-pe',2,'15'),ex('ex-fedb-dead-bug',2,'10')] },
    ],
    weekPlan: [workoutDay(0),off,workoutDay(1),off,workoutDay(2),runDay('Cardio leve opcional',3),off],
  },
  {
    id: 'academia-comecar',
    title: 'Primeiros passos na academia · Full Body',
    goal: 'hipertrofia',
    split: 'abc',
    place: 'academia',
    level: 'iniciante',
    sessionMinutes: 40,
    description: 'Três sessões de corpo inteiro com máquinas e exercícios simples, respeitando a adaptação e o descanso.',
    progression: 'Comece com 2 séries por exercício e cargas confortáveis por 2 semanas. Depois progrida gradualmente.',
    recoveryNote: 'A técnica vem antes da carga. Peça orientação presencial para regular aparelhos.',
    days: [
      { name: 'Academia A · Adaptação', emoji: 'dumbbell', exercises: [ex('ex-leg-press',2,'10-12'),
        ex('ex-supino-maquina',2,'10-12'),ex('ex-puxada-frente',2,'10-12'),ex('ex-prancha',2,'20-30s')] },
      { name: 'Academia B · Base', emoji: 'footprints', exercises: [ex('ex-mesa-flexora',2,'12'),
        ex('ex-remada-baixa',2,'12'),ex('ex-desenvolvimento-maquina',2,'10-12'),
        ex('ex-abdominal-supra',2,'12')] },
      { name: 'Academia C · Consolidação', emoji: 'activity', exercises: [ex('ex-leg-press',2,'12'),
        ex('ex-supino-maquina',2,'12'),ex('ex-remada-maquina',2,'12'),
        ex('ex-panturrilha-em-pe',2,'15')] },
    ],
    weekPlan: [workoutDay(0),off,workoutDay(1),off,workoutDay(2),runDay('Cardio fácil opcional',2),off],
  },
  {
    id: 'funcional-condicionamento',
    title: 'Condicionamento funcional · Força + cardio',
    goal: 'funcional',
    split: 'abc',
    place: 'academia',
    level: 'intermediario',
    sessionMinutes: 40,
    description: 'Foco em padrões de movimento e condicionamento, alternando força e sessões metabólicas moderadas.',
    progression: 'Priorize execução dos movimentos; mantenha RPE 6–7/10 e aumente trabalho só quando recuperar bem.',
    days: [
      { name: 'Funcional A · Base', emoji: 'dumbbell', exercises: [ex('ex-agachamento-livre',3,'10'),
        ex('ex-remada-baixa',3,'10'),ex('ex-flexao',3,'10'),ex('ex-prancha',2,'30s')] },
      { name: 'Funcional B · Estações', emoji: 'flame', exercises: [ex('ex-remo-ergometrico',3,'250 m'),
        ex('ex-hyrox-farmers',3,'30 m'),ex('ex-hyrox-wall-ball',3,'12'),
        ex('ex-fedb-dead-bug',2,'10')] },
      { name: 'Funcional C · Resistência', emoji: 'activity', exercises: [ex('ex-leg-press',3,'12'),
        ex('ex-puxada-frente',3,'12'),ex('ex-stiff-halter',2,'10'),
        ex('ex-bike',2,'5 min')] },
    ],
    weekPlan: [workoutDay(0),off,workoutDay(1),off,workoutDay(2),runDay('Cardio contínuo leve',3),off],
  },
  {
    id: 'mobilidade-recuperacao',
    title: 'Mobilidade e core · Recuperação ativa',
    goal: 'mobilidade',
    split: 'unico',
    place: 'peso_corporal',
    level: 'iniciante',
    sessionMinutes: 15,
    description: 'Sessão curta de mobilidade suave e controle de tronco para alternar com dias de treino mais intenso.',
    progression: 'Evite forçar amplitudes dolorosas. Busque movimentos lentos e confortáveis.',
    days: [
      { name: 'Mobilidade · Core suave', emoji: 'shield',
        exercises: [ex('ex-fedb-dead-bug',2,'8 cada lado'),ex('ex-fedb-single-leg-glute-bridge',2,'8 cada lado'),
          ex('ex-prancha-lateral',2,'15-20s cada lado'),ex('ex-fedb-reverse-crunch',2,'10')] },
    ],
    weekPlan: [off,off,workoutDay(0),off,off,off,off],
  },

];

/** Cria os treinos, sem alterar a agenda por padrão. */
export function applyReadyProgram(programId: string, options?: { applySchedule?: boolean }): Workout[] {
  const program = READY_PROGRAMS.find((p) => p.id === programId);
  if (!program || program.cardioPresetId) return []; // protocolos cardio usam registro próprio
  const workouts = program.days.map((day) => {
    const workout = createWorkout(day.name, day.emoji);
    day.exercises.forEach((e) => addExerciseToWorkout(workout.id, e.id, e.sets, e.reps, e.notes, e.restSeconds));
    return workout;
  });
  if (options?.applySchedule && program.weekPlan?.length === 7) {
    const schedule: WeeklySchedule = {};
    WEEKDAY_ORDER.forEach((weekday, index) => {
      const step = program.weekPlan![index];
      if (step.kind === 'rest') schedule[weekday] = { kind: 'descanso' };
      else if (step.kind === 'cardio') {
        schedule[weekday] = { kind: 'cardio', suggestedDistanceKm: step.distanceKm, label: step.label };
      } else {
        const workout = workouts[step.index];
        if (workout) {
          schedule[weekday] = step.kind === 'combo'
            ? { kind: 'multi', activities: [
                { kind: 'cardio', label: step.label, suggestedDurationMin: step.durationMin, suggestedDistanceKm: step.distanceKm },
                { kind: 'treino', workoutId: workout.id },
              ] }
            : { kind: 'treino', workoutId: workout.id };
        }
      }
    });
    replaceWeeklySchedule(schedule);
  }
  return workouts;
}
