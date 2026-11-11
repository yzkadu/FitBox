/** Onze ilustrações do guia FitBox, incluindo V sit ups.
 * Cada ID é vinculado ao próprio quadro WebP. Sem substituições por similaridade.
 * Os arquivos são recortes limpos: somente desenhos, sem títulos, barras ou moldura.
 * A ausência de arquivo mantém a demonstração anterior, sem URLs quebradas.
 */
export const USER_PROVIDED_ILLUSTRATIONS = {
  'ex-agachamento-hack': 'agachamento-hack.webp',
  'ex-cadeira-adutora': 'cadeira-adutora.webp',
  'ex-new-caminhadalateralcomminiband': 'caminhada-lateral-com-miniband.webp',
  'ex-new-extensaodequadrilemquatroapoios': 'extensao-quadril-quatro-apoios.webp',
  'ex-new-extensoracompausa': 'extensora-com-pausa.webp',
  'ex-fedb-donkey-calf-raises': 'panturrilha-burro.webp',
  'ex-new-passadaparatrascomhalteres': 'passada-para-tras-com-halteres.webp',
  'ex-new-pullthroughnocabo': 'pull-through-no-cabo.webp',
  'ex-new-roscanobancoinclinado': 'rosca-no-banco-inclinado.webp',
  'ex-new-russiantwistcomanilha': 'russian-twist-com-anilha.webp',
  'ex-new-vsitups': 'v-sit-ups.webp',
} as const;

const files = import.meta.glob('../assets/exercise-guide/user-updates-20261111/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export function getUserProvidedIllustration(exerciseId: string): string | null {
  const file = USER_PROVIDED_ILLUSTRATIONS[exerciseId as keyof typeof USER_PROVIDED_ILLUSTRATIONS];
  if (!file) return null;
  return files[`../assets/exercise-guide/user-updates-20261111/${file}`] ?? null;
}
