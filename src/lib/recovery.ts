// Motor de recuperação/carga muscular — heatmap de prontidão por grupo (v21).
// Baseado em regras, sem IA generativa — mesmo espírito de coach.ts/goal.ts/
// programRecommendation.ts: tudo calculado localmente a partir do histórico
// de sessões já registrado. Ordem de cálculo combinada com a usuária desde a
// v19 (ver claude/fitbox-status.md): exercise → grupo muscular do catálogo →
// AnatomyGroup (via MUSCLE_GROUP_TO_ANATOMY_GROUPS) → prontidão → região
// visual → heatmap → grupo grande.
//
// Limite de escopo (mesmo já documentado no mapa muscular, v20): o catálogo
// de exercícios só marca o grupo GRANDE de cada exercício (ex. "perna"), não
// uma sub-região fina. Por isso um exercício de perna contribui igualmente
// pra fadiga de TODOS os grupos finos de perna (quadríceps/posterior de
// coxa/panturrilha/adutores) — não dá pra saber, com o dado de hoje, que
// agachamento cansa mais o quadríceps que a panturrilha. Registrado aqui
// como limitação real, não escondida.

import type { Exercise, Session } from '../types';
import type { AnatomyGroup } from './anatomy';
import { MUSCLE_GROUP_TO_ANATOMY_GROUPS } from './anatomy';

export type Readiness = 'ready' | 'moderate' | 'fatigued' | 'high-fatigue';

export const READINESS_ORDER: Readiness[] = ['high-fatigue', 'fatigued', 'moderate', 'ready'];

export const READINESS_LABELS: Record<Readiness, string> = {
  ready: 'Pronto',
  moderate: 'Moderado',
  fatigued: 'Fadigado',
  'high-fatigue': 'Muito fadigado',
};

// Mesmas cores já usadas no CSS do mapa muscular desde a Etapa 2 (index.css,
// seletores [data-readiness]) — não inventamos uma paleta nova aqui.
export const READINESS_COLORS: Record<Readiness, string> = {
  ready: '#78a65a',
  moderate: '#e0b12d',
  fatigued: '#d97835',
  'high-fatigue': '#c34c4c',
};

interface GroupSignal {
  lastTrainedAt: string; // ISO
  setsInLastSession: number;
}

/**
 * Quantos dias de recuperação um grupo "merece" dependendo do volume da
 * última sessão que o treinou — quanto mais séries, mais tempo até "pronto".
 * Faixas de bom senso de treino de força (48h–96h), não uma fórmula
 * fisiológica exata — é uma v1 declaradamente simples, documentada aqui pra
 * dar pra ajustar depois com mais dado real.
 */
function recoveryWindowDays(setsInLastSession: number): number {
  if (setsInLastSession >= 12) return 4;
  if (setsInLastSession >= 6) return 3;
  return 2;
}

function classify(daysSince: number, setsInLastSession: number): Readiness {
  const window = recoveryWindowDays(setsInLastSession);
  const ratio = daysSince / window;
  if (ratio < 0.5) return 'high-fatigue';
  if (ratio < 1) return 'fatigued';
  if (ratio < 1.5) return 'moderate';
  return 'ready';
}

/**
 * Calcula a prontidão de cada AnatomyGroup a partir do histórico de sessões
 * de força concluídas. Um grupo que nunca foi treinado simplesmente não
 * aparece no resultado — não é o mesmo que "pronto" (não tem dado ainda);
 * quem chama decide como tratar visualmente essa ausência (ex: sem cor).
 */
export function computeGroupReadiness(
  sessions: Session[],
  exercises: Exercise[],
  now: Date = new Date(),
): Partial<Record<AnatomyGroup, Readiness>> {
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  const finished = sessions
    .filter((s) => s.finishedAt)
    .slice()
    .sort((a, b) => Date.parse(a.finishedAt as string) - Date.parse(b.finishedAt as string)); // mais antiga -> mais recente

  // Último sinal (data + volume) de cada grupo — sessões mais recentes
  // sobrescrevem, já que percorremos da mais antiga pra mais nova.
  const signals = new Map<AnatomyGroup, GroupSignal>();

  for (const session of finished) {
    const setsByGroup = new Map<AnatomyGroup, number>();
    for (const se of session.exercises) {
      const exercise = exerciseById.get(se.exerciseId);
      if (!exercise) continue;
      const groups = MUSCLE_GROUP_TO_ANATOMY_GROUPS[exercise.muscleGroup];
      if (!groups || groups.length === 0) continue;
      const completedSets = se.sets.filter((st) => st.reps > 0).length;
      if (completedSets === 0) continue;
      for (const group of groups) {
        setsByGroup.set(group, (setsByGroup.get(group) ?? 0) + completedSets);
      }
    }
    setsByGroup.forEach((setsInLastSession, group) => {
      signals.set(group, { lastTrainedAt: session.finishedAt as string, setsInLastSession });
    });
  }

  const result: Partial<Record<AnatomyGroup, Readiness>> = {};
  signals.forEach((signal, group) => {
    const daysSince = Math.max(0, (now.getTime() - Date.parse(signal.lastTrainedAt)) / (1000 * 60 * 60 * 24));
    result[group] = classify(daysSince, signal.setsInLastSession);
  });
  return result;
}
