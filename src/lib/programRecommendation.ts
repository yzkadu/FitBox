// Motor de recomendação do "programa inicial" do cadastro. Antes disso a
// pessoa escolhia entre 3 opções fixas (perfil em branco + 2 templates
// híbridos prontos); agora usamos as respostas já coletadas no quiz
// (objetivo, experiência, frequência, equipamento, tipos de treino) pra
// montar um plano sob medida na hora, sem chamar nenhuma IA externa —
// "regras espertas com os dados do cadastro", conforme decidido com a
// usuária. Continua 100% editável depois (criar treino novo, mudar dia,
// trocar exercício etc. — nada aqui é definitivo).
//
// Fica de fora por enquanto (fica pra uma próxima leva, também combinado
// com a usuária): usar hirox/funcional-crossfit/flexibilidade-mobilidade
// pra mudar a estrutura do plano, e gerar o plano com uma IA de verdade
// (isso é a "Fase 9 — FitBox AI real" do roadmap, que precisa de um backend
// seguro antes).

import { createWorkout, addExerciseToWorkout, setDaySchedule } from './actions';
import type { Equipment, ExperienceLevel, TrainingGoal, TrainingType, WeeklyFrequency } from './onboarding';
import type { IconKey } from './workoutIcons';
import { WEEKDAY_ORDER, type Weekday } from '../types';

export interface RecommendationInput {
  goal: TrainingGoal | null;
  experience: ExperienceLevel | null;
  frequency: WeeklyFrequency | null;
  equipment: Equipment[];
  trainingTypes: TrainingType[];
}

interface ExerciseSpec {
  id: string;
  sets: number;
  reps: string;
}

interface WorkoutSpec {
  name: string;
  icon: IconKey;
  exercises: ExerciseSpec[];
}

type ScheduleEntry = { kind: 'treino'; workoutIndex: number } | { kind: 'cardio'; suggestedDistanceKm?: number } | { kind: 'descanso' };

export interface RecommendedProgramPlan {
  /** Rótulo curto da divisão escolhida, ex: "Push / Pull / Legs". */
  splitLabel: string;
  /** Frases curtas explicando o raciocínio, pra mostrar na prévia do cadastro. */
  summaryLines: string[];
  workouts: WorkoutSpec[];
  schedule: Partial<Record<Weekday, ScheduleEntry>>;
}

type Tier = 'gym' | 'home' | 'bodyweight';

function resolveTier(equipment: Equipment[]): Tier {
  if (equipment.includes('academia')) return 'gym';
  if (equipment.includes('casa_equipamento')) return 'home';
  return 'bodyweight';
}

const TIER_LABEL: Record<Tier, string> = {
  gym: 'academia',
  home: 'casa (halteres/barra/elástico)',
  bodyweight: 'peso do corpo',
};

// Pools de exercícios por "bloco" de treino e por nível de equipamento
// disponível — escolhidos à mão a partir do catálogo (o mesmo catálogo usado
// nos templates prontos existentes), pra garantir que quem só tem o peso do
// corpo nunca receba um exercício de barra ou máquina.
const POOLS: Record<Tier, { push: string[]; pull: string[]; legs: string[]; abs: string[]; full: string[] }> = {
  gym: {
    push: ['ex-supino-reto-barra', 'ex-supino-inclinado-halter', 'ex-supino-maquina', 'ex-desenvolvimento-militar', 'ex-elevacao-lateral', 'ex-crucifixo-halter', 'ex-triceps-pulley', 'ex-triceps-testa'],
    pull: ['ex-puxada-frente', 'ex-remada-curvada', 'ex-remada-unilateral', 'ex-remada-baixa', 'ex-crucifixo-inverso', 'ex-rosca-direta', 'ex-rosca-martelo', 'ex-rosca-scott'],
    legs: ['ex-agachamento-livre', 'ex-leg-press', 'ex-cadeira-extensora', 'ex-mesa-flexora', 'ex-stiff-halter', 'ex-elevacao-pelvica', 'ex-agachamento-bulgaro', 'ex-panturrilha-em-pe'],
    abs: ['ex-abdominal-supra', 'ex-prancha', 'ex-elevacao-pernas', 'ex-abdominal-bicicleta'],
    full: ['ex-agachamento-livre', 'ex-supino-maquina', 'ex-puxada-frente', 'ex-desenvolvimento-halter', 'ex-remada-unilateral', 'ex-elevacao-lateral', 'ex-rosca-direta', 'ex-triceps-pulley', 'ex-abdominal-supra'],
  },
  home: {
    push: ['ex-supino-reto-halter', 'ex-supino-inclinado-halter', 'ex-fedb-one-arm-dumbbell-bench-press', 'ex-desenvolvimento-halter', 'ex-elevacao-lateral', 'ex-crucifixo-halter', 'ex-fedb-tate-press', 'ex-flexao'],
    pull: ['ex-remada-curvada', 'ex-remada-unilateral', 'ex-fedb-reverse-grip-bent-over-rows', 'ex-rosca-alternada', 'ex-rosca-martelo', 'ex-fedb-zottman-curl', 'ex-barra-fixa'],
    legs: ['ex-fedb-goblet-squat', 'ex-afundo', 'ex-passada-halteres', 'ex-stiff-halter', 'ex-fedb-dumbbell-rear-lunge', 'ex-agachamento-sumo', 'ex-panturrilha-em-pe'],
    abs: ['ex-prancha', 'ex-abdominal-supra', 'ex-fedb-russian-twist', 'ex-prancha-lateral'],
    full: ['ex-fedb-goblet-squat', 'ex-supino-reto-halter', 'ex-remada-unilateral', 'ex-desenvolvimento-halter', 'ex-rosca-alternada', 'ex-triceps-coice', 'ex-prancha'],
  },
  bodyweight: {
    push: ['ex-flexao', 'ex-fedb-push-up-wide', 'ex-fedb-decline-push-up', 'ex-fedb-push-ups-with-feet-elevated', 'ex-mergulho-paralelas', 'ex-fedb-push-ups-close-triceps-position'],
    pull: ['ex-barra-fixa', 'ex-fedb-inverted-row', 'ex-fedb-scapular-pull-up', 'ex-fedb-wide-grip-rear-pull-up'],
    legs: ['ex-agachamento-livre', 'ex-afundo', 'ex-fedb-freehand-jump-squat', 'ex-fedb-single-leg-glute-bridge', 'ex-fedb-step-up-with-knee-raise', 'ex-panturrilha-em-pe'],
    abs: ['ex-prancha', 'ex-prancha-lateral', 'ex-abdominal-bicicleta', 'ex-fedb-dead-bug', 'ex-fedb-flutter-kicks'],
    full: ['ex-agachamento-livre', 'ex-flexao', 'ex-fedb-inverted-row', 'ex-afundo', 'ex-mergulho-paralelas', 'ex-prancha'],
  },
};

interface GoalProfile {
  sets: number;
  mainReps: string;
  isoReps: string;
  /** Quantos exercícios por bloco (push/pull/legs) num dia de divisão. */
  blockCount: number;
  /** Quantos exercícios num dia de corpo inteiro. */
  fullCount: number;
  note: string;
}

const GOAL_PROFILES: Record<TrainingGoal, GoalProfile> = {
  performance: { sets: 4, mainReps: '5-6', isoReps: '8-10', blockCount: 4, fullCount: 5, note: 'cargas mais altas, menos repetição — foco em força' },
  ganhar_massa: { sets: 4, mainReps: '8-10', isoReps: '10-12', blockCount: 6, fullCount: 7, note: 'volume alto pra hipertrofia' },
  definicao: { sets: 3, mainReps: '10-12', isoReps: '12-15', blockCount: 5, fullCount: 6, note: 'volume moderado com repetição mais alta' },
  emagrecer: { sets: 3, mainReps: '12-15', isoReps: '15-20', blockCount: 5, fullCount: 6, note: 'repetição alta e descanso curto — foco em gasto calórico' },
  saude: { sets: 3, mainReps: '10-12', isoReps: '12-15', blockCount: 4, fullCount: 5, note: 'treino equilibrado e mais curto, fácil de manter' },
};

function experienceAdjust(count: number, experience: ExperienceLevel | null): number {
  if (experience === 'iniciante') return Math.max(3, count - 1);
  if (experience === 'avancado') return count + 1;
  return count;
}

function pick(pool: string[], count: number): string[] {
  // Percorre o pool em ordem (já é curado à mão, então a ordem já é boa) e
  // repete do início se pedirmos mais exercícios do que o pool tem.
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
  return out;
}

function buildBlock(pool: string[], count: number, sets: number, mainReps: string, isoReps: string): ExerciseSpec[] {
  return pick(pool, count).map((id, i) => ({ id, sets: i === 0 ? sets + 1 : sets, reps: i === 0 ? mainReps : isoReps }));
}

/** Quantos dias "ativos" (treino + cardio) por semana, a partir da faixa escolhida no quiz. */
function activeDaysFromFrequency(frequency: WeeklyFrequency | null): number {
  if (frequency === '6-7') return 6;
  if (frequency === '4-5') return 5;
  return 3; // '2-3' ou não informado
}

export function recommendProgram(input: RecommendationInput): RecommendedProgramPlan {
  const goal = input.goal ?? 'saude';
  const profile = GOAL_PROFILES[goal];
  const tier = resolveTier(input.equipment);
  const pools = POOLS[tier];
  const hasCardio = input.trainingTypes.includes('aerobico');

  const totalActive = activeDaysFromFrequency(input.frequency);
  const strengthDays = hasCardio ? Math.max(2, totalActive - 1) : totalActive;

  const blockCount = experienceAdjust(profile.blockCount, input.experience);
  const fullCount = experienceAdjust(profile.fullCount, input.experience);
  const legsCount = Math.max(3, blockCount - 1);

  const push = () => buildBlock(pools.push, blockCount, profile.sets, profile.mainReps, profile.isoReps);
  const pull = () => buildBlock(pools.pull, blockCount, profile.sets, profile.mainReps, profile.isoReps);
  const legs = () => [...buildBlock(pools.legs, legsCount, profile.sets, profile.mainReps, profile.isoReps), ...buildBlock(pools.abs, 1, profile.sets, profile.isoReps, profile.isoReps)];
  const upperHalf = (from: string[]) => buildBlock(from, Math.max(2, Math.ceil(blockCount / 2)), profile.sets, profile.mainReps, profile.isoReps);
  const full = () => buildBlock(pools.full, fullCount, profile.sets, profile.mainReps, profile.isoReps);

  let workouts: WorkoutSpec[];
  let dayPattern: number[]; // índices em `workouts`, um por dia de treino (em ordem)
  let splitLabel: string;

  if (strengthDays <= 2) {
    workouts = [
      { name: 'Superior', icon: 'flame', exercises: [...upperHalf(pools.push), ...upperHalf(pools.pull)] },
      { name: 'Inferior', icon: 'footprints', exercises: legs() },
    ];
    dayPattern = [0, 1];
    splitLabel = 'Superior / Inferior';
  } else if (strengthDays === 3) {
    if (input.experience === 'iniciante') {
      workouts = [{ name: 'Corpo inteiro', icon: 'target', exercises: full() }];
      dayPattern = [0, 0, 0];
      splitLabel = 'Corpo inteiro (3x na semana)';
    } else {
      workouts = [
        { name: 'Push (Peito, Ombro, Tríceps)', icon: 'flame', exercises: push() },
        { name: 'Pull (Costas, Bíceps)', icon: 'target', exercises: pull() },
        { name: 'Legs (Perna, Glúteo)', icon: 'footprints', exercises: legs() },
      ];
      dayPattern = [0, 1, 2];
      splitLabel = 'Push / Pull / Legs';
    }
  } else if (strengthDays === 4) {
    workouts = [
      { name: 'Superior', icon: 'flame', exercises: [...upperHalf(pools.push), ...upperHalf(pools.pull)] },
      { name: 'Inferior', icon: 'footprints', exercises: legs() },
    ];
    dayPattern = [0, 1, 0, 1];
    splitLabel = 'Superior / Inferior (2x cada)';
  } else if (strengthDays === 5) {
    workouts = [
      { name: 'Push (Peito, Ombro, Tríceps)', icon: 'flame', exercises: push() },
      { name: 'Pull (Costas, Bíceps)', icon: 'target', exercises: pull() },
      { name: 'Legs (Perna, Glúteo)', icon: 'footprints', exercises: legs() },
      { name: 'Superior', icon: 'zap', exercises: [...upperHalf(pools.push), ...upperHalf(pools.pull)] },
      { name: 'Inferior', icon: 'activity', exercises: legs() },
    ];
    dayPattern = [0, 1, 2, 3, 4];
    splitLabel = 'Push / Pull / Legs / Superior / Inferior';
  } else {
    workouts = [
      { name: 'Push (Peito, Ombro, Tríceps)', icon: 'flame', exercises: push() },
      { name: 'Pull (Costas, Bíceps)', icon: 'target', exercises: pull() },
      { name: 'Legs (Perna, Glúteo)', icon: 'footprints', exercises: legs() },
    ];
    dayPattern = [0, 1, 2, 0, 1, 2];
    splitLabel = 'Push / Pull / Legs (2x na semana)';
  }

  const schedule: Partial<Record<Weekday, ScheduleEntry>> = {};
  let dayIdx = 0;
  for (const workoutIndex of dayPattern) {
    schedule[WEEKDAY_ORDER[dayIdx]] = { kind: 'treino', workoutIndex };
    dayIdx++;
  }
  if (hasCardio && dayIdx < 7) {
    schedule[WEEKDAY_ORDER[dayIdx]] = { kind: 'cardio', suggestedDistanceKm: 3 };
    dayIdx++;
  }
  while (dayIdx < 7) {
    schedule[WEEKDAY_ORDER[dayIdx]] = { kind: 'descanso' };
    dayIdx++;
  }

  const summaryLines = [
    `Divisão: ${splitLabel}, ${strengthDays}x de treino${hasCardio ? ' + 1x de cardio' : ''} por semana.`,
    `Exercícios pensados pro que você tem disponível: ${TIER_LABEL[tier]}.`,
    `Intensidade: ${profile.note}.`,
    'Dá pra mudar tudo depois — criar treino novo, editar exercícios ou remontar os dias.',
  ];

  return { splitLabel, summaryLines, workouts, schedule };
}

export function applyRecommendedProgram(input: RecommendationInput): void {
  const plan = recommendProgram(input);
  const createdIds = plan.workouts.map((w) => {
    const workout = createWorkout(w.name, w.icon);
    w.exercises.forEach((ex) => addExerciseToWorkout(workout.id, ex.id, ex.sets, ex.reps));
    return workout.id;
  });
  for (const day of WEEKDAY_ORDER) {
    const entry = plan.schedule[day];
    if (!entry) continue;
    if (entry.kind === 'treino') setDaySchedule(day, { kind: 'treino', workoutId: createdIds[entry.workoutIndex] });
    else setDaySchedule(day, entry);
  }
}
