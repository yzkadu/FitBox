/** Atlas criado com os seis guias de bíceps enviados pelo usuário.
 * 28 exercícios organizados na ordem das páginas, 5 colunas × 6 linhas.
 * Somente a área ilustrada foi preservada: nenhum título/contorno azul.
 */
export const BICEPS_GUIDE_IDS = [
  "ex-rosca-direta",
  "ex-rosca-direta-w",
  "ex-new-roscadiretacomhalteres",
  "ex-rosca-alternada",
  "ex-rosca-martelo",
  "ex-rosca-scott",
  "ex-rosca-scott-maquina",
  "ex-rosca-concentrada",
  "ex-rosca-cabo",
  "ex-new-rosca21",
  "ex-new-roscabayesiannocabo",
  "ex-new-roscacomtoalha",
  "ex-new-roscaconcentradaembancoinclinado",
  "ex-new-roscapronadacombarraw",
  "ex-new-roscacomelasticoempe",
  "ex-new-roscaspiderunilateral",
  "ex-fedb-cross-body-hammer-curl",
  "ex-fedb-drag-curl",
  "ex-fedb-spider-curl",
  "ex-fedb-zottman-curl",
  "ex-fedb-standing-one-arm-cable-curl",
  "ex-fedb-reverse-barbell-curl",
  "ex-fedb-high-cable-curls",
  "ex-fedb-cable-hammer-curls-rope-attachment",
  "ex-fedb-incline-dumbbell-curl",
  "ex-fedb-preacher-hammer-dumbbell-curl",
  "ex-new-roscainversanocabo",
  "ex-new-roscamarteloalternada"
] as const;
const indexById = new Map<string, number>(BICEPS_GUIDE_IDS.map((id,index)=>[id,index]));
export function getBicepsIllustration(exerciseId: string): {src:string;index:number;rows:number;aspectRatio:string}|null {
  const index=indexById.get(exerciseId);
  return index===undefined?null:{
    src:'/exercise-guide/biceps/sprite.webp',
    index,rows:6,aspectRatio:'320 / 325',
  };
}
