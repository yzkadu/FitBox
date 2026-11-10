/** 35 illustrations extracted from 7 abdominal exercise pages supplied by the user.
 * The five columns on each row correspond to top-left, top-right,
 * center-left, center-right and bottom full-width on a guide page.
 * The binary WebP atlas lives in public/exercise-guide/abdomen/sprite.webp.
 */
export const ABDOMEN_GUIDE_IDS = [
  'ex-abdominal-supra',
  'ex-prancha',
  'ex-prancha-lateral',
  'ex-abdominal-cabo',
  'ex-abdominal-maquina',
  'ex-abdominal-bicicleta',
  'ex-rotacao-tronco-cabo',
  'ex-fedb-3-4-sit-up',
  'ex-fedb-ab-roller',
  'ex-fedb-hanging-leg-raise',
  'ex-fedb-reverse-crunch',
  'ex-fedb-russian-twist',
  'ex-fedb-weighted-crunches',
  'ex-fedb-dead-bug',
  'ex-fedb-flutter-kicks',
  'ex-fedb-alternate-heel-touchers',
  'ex-fedb-decline-crunch',
  'ex-fedb-exercise-ball-crunch',
  'ex-fedb-plate-twist',
  'ex-fedb-oblique-crunches',
  'ex-fedb-cable-reverse-crunch',
  'ex-fedb-side-jackknife',
  'ex-elevacao-pernas',
  'ex-new-hollowhold',
  'ex-new-pranchacomtoquenoombro',
  'ex-new-pranchacomelevacaodeperna',
  'ex-new-birddog',
  'ex-new-suitcasecarryunilateral',
  'ex-new-pranchacomdeslocamento',
  'ex-new-elevacaodejoelhosnabarra',
  'ex-new-abdominalcanivete',
  'ex-new-deadbugalternado',
  'ex-new-pallofpress',
  'ex-new-abwheelajoelhado',
  'ex-new-pranchafrontalcomapoiodecotovelo',
] as const;
const indexById = new Map<string, number>(ABDOMEN_GUIDE_IDS.map((id, index) => [id, index]));
export function getAbdomenIllustration(exerciseId: string): {src: string; index: number; rows: number; aspectRatio: string} | null {
  const index = indexById.get(exerciseId);
  return index === undefined ? null : {
    src: '/exercise-guide/abdomen/sprite.webp',
    index,
    rows: 7,
    aspectRatio: '280 / 205',
  };
}
