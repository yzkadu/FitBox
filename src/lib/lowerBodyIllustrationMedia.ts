/** 50 quadros de execução extraídos dos 10 guias enviados pelo usuário.
 * A imagem de cada exercício foi separada do título/cartão azul.
 * A ordem é de leitura em cada página: cima esquerda, cima direita,
 * meio esquerda, meio direita, faixa inferior.
 * Sprites binários WebP versionados em public/exercise-guide.
 * Nunca substituir uma variação por uma imagem de exercício diferente.
 */
export const LEG_GUIDE_IDS = [
  'ex-agachamento-livre',
  'ex-agachamento-smith',
  'ex-agachamento-frontal',
  'ex-leg-press',
  'ex-cadeira-extensora',
  'ex-mesa-flexora',
  'ex-cadeira-flexora',
  'ex-stiff-barra',
  'ex-stiff-halter',
  'ex-passada-halteres',
  'ex-fedb-goblet-squat',
  'ex-fedb-weighted-sissy-squat',
  'ex-fedb-zercher-squats',
  'ex-fedb-narrow-stance-leg-press',
  'ex-fedb-single-leg-leg-extension',
  'ex-fedb-standing-leg-curl',
  'ex-fedb-step-up-with-knee-raise',
  'ex-fedb-plie-dumbbell-squat',
  'ex-new-agachamentocomsalto',
  'ex-fedb-wide-stance-barbell-squat',
  'ex-fedb-narrow-stance-squats',
  'ex-fedb-one-leg-barbell-squat',
  'ex-fedb-kettlebell-pistol-squat',
  'ex-fedb-smith-single-leg-split-squat',
  'ex-fedb-elevated-back-lunge',
  'ex-fedb-dumbbell-rear-lunge',
  'ex-new-agachamentopausa',
  'ex-new-agachamentocaixa',
  'ex-new-agachamentolandmine',
  'ex-new-stepuplateral',
] as const;

export const GLUTE_GUIDE_IDS = [
  'ex-elevacao-pelvica',
  'ex-gluteo-cabo',
  'ex-abducao-quadril',
  'ex-hip-thrust-maquina',
  'ex-agachamento-sumo',
  'ex-fedb-single-leg-glute-bridge',
  'ex-fedb-physioball-hip-bridge',
  'ex-fedb-floor-glute-ham-raise',
  'ex-fedb-monster-walk',
  'ex-fedb-reverse-hyperextension',
  'ex-fedb-glute-kickback',
  'ex-new-glutebridgenosolo',
  'ex-new-hipthrustunilateral',
  'ex-new-abducaolateraldeitada',
  'ex-new-frogpump',
] as const;

export const CALF_GUIDE_IDS = [
  'ex-panturrilha-em-pe',
  'ex-panturrilha-sentado',
  'ex-panturrilha-leg-press',
  'ex-new-panturrilhaempeunilateral',
  'ex-new-panturrilhanostep',
] as const;

type Sprite = { src: string; index: number; rows: number; aspectRatio: string };
const map = new Map<string, Sprite>();
const add = (ids: readonly string[], dir: string, rows: number) => ids.forEach((id,index) =>
  map.set(id,{src:`/exercise-guide/${dir}/sprite.webp`,index,rows,aspectRatio:'260 / 200'}));

add(LEG_GUIDE_IDS,'legs',6);
add(GLUTE_GUIDE_IDS,'glutes',3);
add(CALF_GUIDE_IDS,'calves',1);

// Exercício idêntico, registrado em dois pontos do catálogo.
map.set('ex-fedb-freehand-jump-squat', map.get('ex-new-agachamentocomsalto')!);

export function getLowerBodyIllustration(exerciseId: string): Sprite | null {
  return map.get(exerciseId) ?? null;
}
export function getLowerBodyIllustrationCoverage() {
  return {legs:LEG_GUIDE_IDS.length,glutes:GLUTE_GUIDE_IDS.length,calves:CALF_GUIDE_IDS.length,total:map.size};
}
