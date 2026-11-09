/** 40 quadros ilustrados de peito fornecidos pelo usuário; ordem fixa de 5 colunas × 8 linhas.
 * A imagem real foi integrada como arquivo binário em public/exercise-guide/chest/sprite.webp.
 * IDs existentes são preservados e nenhuma foto externa é alterada.
 */
export const CHEST_GUIDE_IDS = [
  "ex-supino-reto-barra",
  "ex-supino-reto-halter",
  "ex-supino-inclinado-halter",
  "ex-supino-inclinado-barra",
  "ex-supino-declinado-barra",
  "ex-supino-maquina",
  "ex-supino-inclinado-maquina",
  "ex-crucifixo-halter",
  "ex-crossover",
  "ex-voador-peck-deck",
  "ex-flexao",
  "ex-pullover-halter",
  "ex-fedb-decline-dumbbell-bench-press",
  "ex-fedb-decline-dumbbell-flyes",
  "ex-fedb-incline-dumbbell-flyes",
  "ex-fedb-incline-cable-flye",
  "ex-fedb-flat-bench-cable-flyes",
  "ex-fedb-one-arm-dumbbell-bench-press",
  "ex-fedb-wide-grip-barbell-bench-press",
  "ex-fedb-svend-press",
  "ex-fedb-smith-machine-bench-press",
  "ex-fedb-smith-machine-incline-bench-press",
  "ex-fedb-smith-machine-decline-press",
  "ex-fedb-dumbbell-bench-press-with-neutral-grip",
  "ex-fedb-cable-chest-press",
  "ex-fedb-push-ups-with-feet-elevated",
  "ex-fedb-incline-dumbbell-bench-with-palms-facing-in",
  "ex-fedb-push-up-wide",
  "ex-fedb-leverage-chest-press",
  "ex-fedb-decline-push-up",
  "ex-new-supinocompegadafechada",
  "ex-new-flexaocommaoselevadas",
  "ex-new-flexaoarqueiro",
  "ex-new-crucifixounilateralnocabo",
  "ex-new-crossoveraltoparabaixo",
  "ex-new-pressdepeitonapoliaempe",
  "ex-new-flexaocomtoquenoombro",
  "ex-new-supinocomkettlebell",
  "ex-new-flexaonotrx",
  "ex-new-flexaocomresistenciaelastica"
] as const;
const SPRITE_PATH = '/exercise-guide/chest/sprite.webp';
const positions = new Map<string, number>(
  CHEST_GUIDE_IDS.map((id, index) => [id, index]),
);

/** URL real do arquivo + índice do quadro na imagem compartilhada. */
export function getChestIllustration(exerciseId: string): { src: string; index: number } | null {
  const index = positions.get(exerciseId);
  return index === undefined ? null : { src: SPRITE_PATH, index };
}

export function getChestIllustrationCoverage() {
  return { mapped: CHEST_GUIDE_IDS.length, installed: CHEST_GUIDE_IDS.length };
}
