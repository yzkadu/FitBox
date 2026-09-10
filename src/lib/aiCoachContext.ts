// Monta o resumo textual (em português) dos dados reais da pessoa, que vai
// junto de cada pergunta pro Personal Trainer virtual v2 (IA). É a "única
// fonte de verdade" passada pro modelo — assim ele responde com base no que
// a pessoa realmente treinou, não em suposições.

import type { AppData } from '../types';
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from '../types';
import { MUSCLE_GROUP_LABELS } from './exercises';
import { getCoachSuggestion } from './coach';
import { getCurrentStreakDays, getExerciseHistory, getTotalSessionsThisMonth, getTrainedExerciseIds } from './stats';
import { assessWeightGoal } from './goal';

const ACTION_LABELS: Record<string, string> = {
  increase: 'evoluindo, pode aumentar carga',
  maintain: 'mantendo',
  deload: 'estagnado/caiu, considerar reduzir carga',
  'no-data': 'sem dado suficiente',
};

function formatDatePtBr(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
}

export function buildCoachContext(data: AppData, profileName?: string): string {
  const { exercises, workouts, sessions, measurements, cardioLogs, weeklySchedule, weightGoal } = data;
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const lines: string[] = [];

  const now = new Date();
  lines.push(`Pessoa: ${profileName ?? 'usuário(a) do FitBox'}`);
  lines.push(`Hoje: ${now.toLocaleDateString('pt-BR')} (${WEEKDAY_LABELS[WEEKDAY_ORDER[(now.getDay() + 6) % 7]]})`);
  lines.push(`Sequência de dias ativos: ${getCurrentStreakDays(sessions, cardioLogs, weeklySchedule)} dia(s)`);
  lines.push(`Treinos concluídos este mês: ${getTotalSessionsThisMonth(sessions)}`);

  lines.push('');
  lines.push('Agenda semanal planejada:');
  for (const day of WEEKDAY_ORDER) {
    const sched = weeklySchedule[day];
    let desc = 'não definido';
    if (sched?.kind === 'treino') {
      const w = workouts.find((w) => w.id === sched.workoutId);
      desc = w ? `treino "${w.name}"` : 'treino (removido)';
    } else if (sched?.kind === 'cardio') {
      desc = sched.suggestedDistanceKm ? `cardio (meta ${sched.suggestedDistanceKm}km)` : 'cardio';
    } else if (sched?.kind === 'descanso') {
      desc = 'descanso';
    }
    lines.push(`- ${WEEKDAY_LABELS[day]} (código "${day}"): ${desc}`);
  }

  const activeWorkouts = workouts.filter((w) => !w.archived);
  if (activeWorkouts.length > 0) {
    lines.push('');
    lines.push('Treinos cadastrados (use o id exato ao propor uma mudança de agenda):');
    for (const w of activeWorkouts) {
      lines.push(`- id "${w.id}" — "${w.name}" (${w.exercises.length} exercícios)`);
    }
  }

  if (weightGoal) {
    const assessment = assessWeightGoal(weightGoal, measurements, sessions, cardioLogs, weeklySchedule);
    lines.push('');
    lines.push('Meta de peso:');
    lines.push(
      `- Perder ${weightGoal.targetLossKg}kg em ${weightGoal.targetWeeks} semanas, a partir de ${formatDatePtBr(weightGoal.startDate)} (peso inicial ${weightGoal.startWeightKg}kg)`,
    );
    lines.push(`- Ritmo classificado como: ${assessment.pace.label}`);
    if (assessment.currentWeightKg != null) lines.push(`- Peso atual registrado: ${assessment.currentWeightKg}kg`);
    if (assessment.progressKg != null) lines.push(`- Progresso até agora: ${assessment.progressKg.toFixed(1)}kg perdidos`);
    lines.push(`- Veredito do sistema: ${assessment.verdict} — ${assessment.verdictMessage}`);
  } else {
    lines.push('');
    lines.push('Meta de peso: nenhuma meta cadastrada.');
  }

  const recentRpes = sessions
    .filter((s) => s.finishedAt && typeof s.rpe === 'number')
    .sort((a, b) => Date.parse(b.finishedAt as string) - Date.parse(a.finishedAt as string))
    .slice(0, 5)
    .map((s) => s.rpe as number);
  if (recentRpes.length > 0) {
    const avg = recentRpes.reduce((sum, r) => sum + r, 0) / recentRpes.length;
    lines.push('');
    lines.push(`RPE (esforço percebido 0-10) médio das últimas ${recentRpes.length} sessões: ${avg.toFixed(1)}`);
  }

  const trainedIds = getTrainedExerciseIds(sessions);
  const withLastDate = trainedIds
    .map((id) => {
      const history = getExerciseHistory(sessions, id);
      const lastDate = history.length ? history[history.length - 1].date : null;
      return { id, lastDate };
    })
    .filter((x) => x.lastDate)
    .sort((a, b) => Date.parse(b.lastDate as string) - Date.parse(a.lastDate as string))
    .slice(0, 14);

  if (withLastDate.length > 0) {
    lines.push('');
    lines.push('Progressão recente por exercício (sugestão do motor de regras do coach):');
    for (const { id, lastDate } of withLastDate) {
      const ex = exerciseById.get(id);
      const suggestion = getCoachSuggestion(sessions, id);
      const name = ex ? `${ex.name} (${MUSCLE_GROUP_LABELS[ex.muscleGroup] ?? ex.muscleGroup})` : id;
      const actionLabel = ACTION_LABELS[suggestion.action] ?? suggestion.action;
      const weightPart = suggestion.suggestedWeight != null ? `, sugestão ${suggestion.suggestedWeight}kg` : '';
      lines.push(`- ${name} — última vez em ${formatDatePtBr(lastDate as string)}, status: ${actionLabel}${weightPart}`);
    }
  }

  const cutoff = Date.now() - 28 * 24 * 60 * 60 * 1000;
  const recentCardio = cardioLogs.filter((c) => Date.parse(c.date) >= cutoff);
  if (recentCardio.length > 0) {
    const totalKm = recentCardio.reduce((sum, c) => sum + (c.distanceKm ?? 0), 0);
    const totalMin = recentCardio.reduce((sum, c) => sum + c.durationMin, 0);
    lines.push('');
    lines.push(
      `Cardio nas últimas 4 semanas: ${recentCardio.length} atividade(s), ${totalKm.toFixed(1)}km somados, ${totalMin}min somados.`,
    );
  }

  return lines.join('\n');
}
