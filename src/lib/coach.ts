// Personal Trainer virtual — motor de sugestões baseado em regras.
// Analisa o histórico de cada exercício e sugere progressão de carga,
// identifica evolução/estagnação e recomenda ajustes. Sem IA generativa:
// tudo calculado localmente a partir dos dados já registrados.

import type { Session } from '../types';

export type CoachAction = 'increase' | 'maintain' | 'deload' | 'no-data';

export interface CoachSuggestion {
  exerciseId: string;
  action: CoachAction;
  /** Peso sugerido para a próxima sessão (kg), quando aplicável */
  suggestedWeight?: number;
  /** Reps sugeridas para a próxima sessão, quando aplicável */
  suggestedReps?: number;
  message: string;
  /** true quando há sinal de estagnação (>=3 sessões sem evolução) */
  stagnant?: boolean;
}

function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

/** Arredonda para um incremento de carga "prático" de academia (evita sugerir 61.3kg) */
function roundToPracticalStep(weight: number): number {
  const step = weight >= 40 ? 2.5 : weight >= 15 ? 1.25 : 0.5;
  return Math.round(weight / step) * step;
}

function nextIncrement(weight: number): number {
  if (weight <= 0) return 2.5;
  if (weight < 15) return 1;
  if (weight < 40) return 1.25;
  return 2.5;
}

/**
 * Extrai, para cada sessão finalizada em que o exercício aparece, o "melhor set"
 * (maior peso, desempate por mais reps) e se todas as séries planejadas foram
 * marcadas como concluídas.
 */
function getExerciseOccurrences(sessions: Session[], exerciseId: string) {
  return sessions
    .filter((s) => s.finishedAt)
    .map((s) => {
      const se = s.exercises.find((e) => e.exerciseId === exerciseId);
      if (!se) return null;
      const loggedSets = se.sets.filter((st) => st.reps > 0);
      if (loggedSets.length === 0) return null;
      const topSet = loggedSets.slice().sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0];
      const allCompleted = se.sets.length > 0 && se.sets.every((st) => st.completed);
      return {
        date: s.finishedAt as string,
        topSet,
        allCompleted,
        est1RM: epley1RM(topSet.weight, topSet.reps),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

export function getCoachSuggestion(sessions: Session[], exerciseId: string): CoachSuggestion {
  const occurrences = getExerciseOccurrences(sessions, exerciseId);

  if (occurrences.length === 0) {
    return { exerciseId, action: 'no-data', message: 'Sem histórico ainda. Registre esse exercício para receber sugestões.' };
  }

  const last = occurrences[occurrences.length - 1];
  const prev = occurrences.length >= 2 ? occurrences[occurrences.length - 2] : null;

  // Estagnação: últimas 3 sessões (ou mais) sem ganho relevante de 1RM estimado
  let stagnant = false;
  if (occurrences.length >= 3) {
    const lastThree = occurrences.slice(-3);
    const spread = Math.max(...lastThree.map((o) => o.est1RM)) - Math.min(...lastThree.map((o) => o.est1RM));
    const avg = lastThree.reduce((sum, o) => sum + o.est1RM, 0) / lastThree.length;
    stagnant = avg > 0 && spread / avg < 0.03; // variação menor que 3% em 3 sessões
  }

  if (!prev) {
    return {
      exerciseId,
      action: 'maintain',
      suggestedWeight: last.topSet.weight,
      suggestedReps: last.topSet.reps,
      message: `Continue com ${last.topSet.weight}kg — ainda coletando dados para sugerir progressão.`,
    };
  }

  const improved = last.est1RM > prev.est1RM * 1.01;
  const declined = last.est1RM < prev.est1RM * 0.95;

  if (improved && last.allCompleted) {
    const suggestedWeight = roundToPracticalStep(last.topSet.weight + nextIncrement(last.topSet.weight));
    return {
      exerciseId,
      action: 'increase',
      suggestedWeight,
      suggestedReps: last.topSet.reps,
      stagnant: false,
      message: `Você evoluiu na última sessão! Tente ${suggestedWeight}kg na próxima.`,
    };
  }

  if (declined || stagnant) {
    const suggestedWeight = roundToPracticalStep(last.topSet.weight * 0.9);
    return {
      exerciseId,
      action: 'deload',
      suggestedWeight,
      suggestedReps: last.topSet.reps,
      stagnant: true,
      message: stagnant
        ? `Estagnação nas últimas sessões. Considere reduzir para ${suggestedWeight}kg por uma sessão ou garantir mais descanso/recuperação.`
        : `Queda de desempenho em relação à sessão anterior. Considere ${suggestedWeight}kg ou um descanso extra antes do próximo treino.`,
    };
  }

  if (!last.allCompleted) {
    return {
      exerciseId,
      action: 'maintain',
      suggestedWeight: last.topSet.weight,
      suggestedReps: last.topSet.reps,
      message: `Nem todas as séries foram concluídas na última vez. Mantenha ${last.topSet.weight}kg e foque em completar as repetições.`,
    };
  }

  return {
    exerciseId,
    action: 'maintain',
    suggestedWeight: last.topSet.weight,
    suggestedReps: last.topSet.reps,
    message: `Boa consistência! Mantenha ${last.topSet.weight}kg nesse exercício.`,
  };
}

/** Sugestão de peso/reps para pré-preencher uma nova sessão (sem o texto explicativo) */
export function getSuggestedStartingPoint(sessions: Session[], exerciseId: string): { weight: number; reps: number } | null {
  const s = getCoachSuggestion(sessions, exerciseId);
  if (s.action === 'no-data' || s.suggestedWeight == null) return null;
  return { weight: s.suggestedWeight, reps: s.suggestedReps ?? 0 };
}

/**
 * Escolhe a dica mais relevante entre todos os exercícios já treinados, para
 * exibir um resumo único (ex: na tela Hoje). Prioriza alertas de estagnação/queda,
 * depois oportunidades de evolução, depois uma dica de manutenção qualquer.
 */
export function getTopCoachTip(sessions: Session[]): CoachSuggestion | null {
  const trainedIds = new Set<string>();
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    for (const se of s.exercises) {
      if (se.sets.some((st) => st.reps > 0)) trainedIds.add(se.exerciseId);
    }
  }
  if (trainedIds.size === 0) return null;

  const suggestions = Array.from(trainedIds).map((id) => getCoachSuggestion(sessions, id));
  const priority: Record<CoachAction, number> = { deload: 0, increase: 1, maintain: 2, 'no-data': 3 };
  suggestions.sort((a, b) => priority[a.action] - priority[b.action]);
  return suggestions[0] ?? null;
}

// Mantido por compatibilidade com stats.ts (mesma fórmula, evita import circular)
export { epley1RM as _epley1RM };
