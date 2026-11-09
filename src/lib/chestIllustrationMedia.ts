/**
 * 40 painéis de peito fornecidos pelo usuário (8 páginas × 5 exercícios).
 * Uma imagem por exercício, já separada em `fitbox_peito_40_exercicios.zip`.
 * As imagens devem ser importadas em src/assets/exercise-guide/chest/.
 * O glob permite liberar automaticamente cada ilustração só quando o arquivo
 * existe no build — evita URLs 404 durante uma integração parcial.
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
const sourceAssets = import.meta.glob('../assets/exercise-guide/chest/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const availableImages = new Map<string, string>();
for (const [path, url] of Object.entries(sourceAssets)) {
  const file = path.split('/').pop();
  if (file?.endsWith('.webp')) availableImages.set(file.slice(0, -5), url);
}
const chestIds = new Set<string>(CHEST_GUIDE_IDS);
/** Retorna null para assets ainda não incluídos no deploy. */
export function getChestIllustration(exerciseId: string): string | null {
  if (!chestIds.has(exerciseId)) return null;
  return availableImages.get(exerciseId) ?? null;
}
export function getChestIllustrationCoverage() {
  return { mapped: CHEST_GUIDE_IDS.length, installed: CHEST_GUIDE_IDS.filter(id => availableImages.has(id)).length };
}
