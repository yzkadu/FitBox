// "Estudo" do objetivo de perda de peso — baseado em regras (mesmo espírito do
// personal trainer virtual em coach.ts: nada de IA generativa, só heurísticas
// claras e explicáveis). Isto é uma estimativa geral pra orientação, não
// aconselhamento médico ou nutricional.

import type { BodyMeasurement, CardioLog, Session, WeeklySchedule, WeightGoal } from '../types';

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

export type PaceLabel = 'conservador' | 'saudavel' | 'ambicioso' | 'arriscado';

export function classifyPace(weeklyRateKg: number): { label: PaceLabel; message: string } {
  const r = Math.abs(weeklyRateKg);
  if (r <= 0.25) {
    return { label: 'conservador', message: 'Ritmo bem tranquilo — deve ser fácil de manter.' };
  }
  if (r <= 1.0) {
    return {
      label: 'saudavel',
      message: 'Ritmo dentro da faixa geralmente considerada sustentável (até ~1kg por semana).',
    };
  }
  if (r <= 1.5) {
    return {
      label: 'ambicioso',
      message: 'Ritmo ambicioso — exige bastante disciplina na alimentação e nos treinos pra sustentar.',
    };
  }
  return {
    label: 'arriscado',
    message: 'Ritmo alto (acima de ~1,5kg/semana) costuma ser difícil de sustentar e nem sempre é saudável — considere esticar o prazo em vez de acelerar demais.',
  };
}

export type GoalVerdict = 'sem-dados' | 'cedo' | 'no-caminho' | 'atencao' | 'fora-do-ritmo';

export interface GoalAssessment {
  targetWeeklyRateKg: number;
  pace: { label: PaceLabel; message: string };
  currentWeightKg: number | null;
  baselineWeightKg: number | null;
  progressKg: number | null; // positivo = perdeu peso
  expectedProgressKg: number | null;
  weeksElapsed: number;
  weeksRemaining: number;
  consistencyPct: number | null; // dias ativos/semana reais vs planejados na agenda
  verdict: GoalVerdict;
  verdictMessage: string;
}

/** Dias distintos (ISO yyyy-mm-dd) com treino concluído ou atividade de cardio, nos últimos `days` dias. */
function activeDaysInWindow(sessions: Session[], cardioLogs: CardioLog[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const dates = new Set<string>();
  sessions.forEach((s) => {
    if (s.finishedAt && Date.parse(s.finishedAt) >= cutoff) dates.add(s.finishedAt.slice(0, 10));
  });
  cardioLogs.forEach((c) => {
    if (Date.parse(c.date) >= cutoff) dates.add(c.date);
  });
  return dates.size;
}

export function assessWeightGoal(
  goal: WeightGoal,
  measurements: BodyMeasurement[],
  sessions: Session[],
  cardioLogs: CardioLog[],
  weeklySchedule: WeeklySchedule,
): GoalAssessment {
  const targetWeeklyRateKg = goal.targetWeeks > 0 ? goal.targetLossKg / goal.targetWeeks : 0;
  const pace = classifyPace(targetWeeklyRateKg);

  const sortedWeights = measurements
    .filter((m) => m.weightKg != null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const currentWeightKg = sortedWeights.length ? (sortedWeights[sortedWeights.length - 1].weightKg as number) : null;
  const baseline = sortedWeights.find((m) => m.date >= goal.startDate) ?? sortedWeights[0] ?? null;
  const baselineWeightKg = baseline?.weightKg ?? goal.startWeightKg ?? null;

  const weeksElapsed = Math.max(0, (Date.now() - Date.parse(goal.startDate)) / MS_PER_WEEK);
  const weeksRemaining = Math.max(0, goal.targetWeeks - weeksElapsed);

  const progressKg = baselineWeightKg != null && currentWeightKg != null ? baselineWeightKg - currentWeightKg : null;
  const expectedProgressKg = targetWeeklyRateKg * weeksElapsed;

  const plannedActiveDays = Object.values(weeklySchedule).filter((d) => d && d.kind !== 'descanso').length;
  const actualActiveDaysLast4Weeks = activeDaysInWindow(sessions, cardioLogs, 28);
  const consistencyPct = plannedActiveDays > 0 ? Math.round(((actualActiveDaysLast4Weeks / 4) / plannedActiveDays) * 100) : null;

  let verdict: GoalVerdict;
  let verdictMessage: string;

  if (currentWeightKg == null || baselineWeightKg == null) {
    verdict = 'sem-dados';
    verdictMessage = 'Registre seu peso em "Medidas" pra gente acompanhar sua evolução em relação à meta.';
  } else if (weeksElapsed < 1) {
    verdict = 'cedo';
    verdictMessage = 'Ainda é cedo pra avaliar — continue registrando peso e treinos.';
  } else if (progressKg == null) {
    verdict = 'sem-dados';
    verdictMessage = 'Registre seu peso regularmente pra gente comparar com a meta.';
  } else if (progressKg >= expectedProgressKg * 0.8) {
    verdict = 'no-caminho';
    verdictMessage = `Você está no ritmo certo: perdeu ${progressKg.toFixed(1)}kg até agora, praticamente alinhado com o esperado.`;
  } else if (progressKg >= expectedProgressKg * 0.4) {
    verdict = 'atencao';
    verdictMessage = `Um pouco abaixo do ritmo esperado (perdeu ${progressKg.toFixed(1)}kg, o esperado até agora seria por volta de ${expectedProgressKg.toFixed(1)}kg) — ainda dá pra recuperar.`;
  } else {
    verdict = 'fora-do-ritmo';
    verdictMessage = `Bem abaixo do ritmo esperado (perdeu ${progressKg.toFixed(1)}kg, o esperado seria por volta de ${expectedProgressKg.toFixed(1)}kg). Vale reavaliar o prazo ou a consistência dos treinos/alimentação.`;
  }

  if (consistencyPct != null && consistencyPct < 50 && (verdict === 'atencao' || verdict === 'fora-do-ritmo')) {
    verdictMessage += ` Sua frequência de treino nas últimas semanas está baixa em relação à agenda planejada (${consistencyPct}%) — pode ser parte do motivo.`;
  }

  return {
    targetWeeklyRateKg,
    pace,
    currentWeightKg,
    baselineWeightKg,
    progressKg,
    expectedProgressKg,
    weeksElapsed,
    weeksRemaining,
    consistencyPct,
    verdict,
    verdictMessage,
  };
}
