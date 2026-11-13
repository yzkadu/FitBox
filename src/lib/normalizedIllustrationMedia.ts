/**
 * 319 imagens individuais extraídas dos 11 atlas, sem faixas ou títulos.
 * O pipeline visual gera public/exercise-guide/clean/<grupo>/<id>.webp.
 * A prioridade entre origens é explícita e estável: a primeira ocorrência
 * vence colisões (não sobrescrever com a última imagem sem verificação).
 */
import { CHEST_GUIDE_IDS } from './chestIllustrationMedia';
import { BACK_GUIDE_IDS, SHOULDER_GUIDE_IDS } from './backShoulderIllustrationMedia';
import { BICEPS_GUIDE_IDS } from './bicepsIllustrationMedia';
import { TRICEPS_GUIDE_IDS } from './tricepsIllustrationMedia';
import { LEG_GUIDE_IDS, GLUTE_GUIDE_IDS, CALF_GUIDE_IDS } from './lowerBodyIllustrationMedia';
import { ABDOMEN_GUIDE_IDS } from './abdomenIllustrationMedia';
import { CONDITIONING_GUIDE_IDS } from './conditioningIllustrationMedia';
import { SUPPLEMENT_22_GUIDE_IDS } from './supplementIllustrationMedia';

const atlasGroups: readonly [string, readonly string[]][] = [
  ['chest', CHEST_GUIDE_IDS],
  ['back', BACK_GUIDE_IDS],
  ['shoulders', SHOULDER_GUIDE_IDS],
  ['biceps', BICEPS_GUIDE_IDS],
  ['triceps', TRICEPS_GUIDE_IDS],
  ['legs', LEG_GUIDE_IDS],
  ['glutes', GLUTE_GUIDE_IDS],
  ['calves', CALF_GUIDE_IDS],
  ['abdomen', ABDOMEN_GUIDE_IDS],
  ['conditioning', CONDITIONING_GUIDE_IDS],
  ['supplement-22', SUPPLEMENT_22_GUIDE_IDS],
];
const pathByExercise = new Map<string, string>();
for (const [group, ids] of atlasGroups) {
  for (const id of ids) {
    if (!pathByExercise.has(id)) {
      pathByExercise.set(id, '/exercise-guide/clean/' + group + '/' + id + '.webp');
    }
  }
}
// Exercício de salto livre e a variante de agachamento com salto compartilham
// exatamente o mesmo movimento; preserva ambos os IDs, sem alterar o catálogo.
const jump = pathByExercise.get('ex-new-agachamentocomsalto');
if (jump) pathByExercise.set('ex-fedb-freehand-jump-squat', jump);

export function getNormalizedIllustration(exerciseId: string): string | null {
  return pathByExercise.get(exerciseId) ?? null;
}
export function getNormalizedIllustrationCoverage() {
  return pathByExercise.size;
}
