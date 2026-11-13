/** Atlas dos guias enviados: mobilidade (8), antebraço (10), cardio (15), HYROX (10) e funcional (5).
 * Os 48 quadros seguem a ordem visual de cada uma das 10 páginas.
 * As imagens foram recortadas sem as faixas de títulos.
 * Movimentos repetidos no guia (shuttle run e subida de escadas) compartilham o ID original.
 */
export const CONDITIONING_GUIDE_IDS = [
  "ex-new-mobilidadedequadril9090",
  "ex-new-alongamentodeflexordequadril",
  "ex-new-alongamentodeposteriorcomfaixa",
  "ex-new-rotacaotoracicaemquatroapoios",
  "ex-new-mobilidadedetornozelonaparede",
  "ex-new-alongamentodepeitoralnaporta",
  "ex-new-worldsgreateststretch",
  "ex-new-agachamentoprofundosustentado",
  "ex-fedb-wrist-roller",
  "ex-fedb-seated-palm-up-barbell-wrist-curl",
  "ex-fedb-seated-palms-down-barbell-wrist-curl",
  "ex-new-flexaodepunhos",
  "ex-new-extensaodepunhos",
  "ex-new-pronacaoesupinacaodeantebraco",
  "ex-new-supinacaodeantebraco",
  "ex-new-farmercarryunilateral",
  "ex-new-roscapunhoreversa",
  "ex-new-deadhangnabarra",
  "ex-esteira",
  "ex-bike",
  "ex-eliptico",
  "ex-remo-ergometrico",
  "ex-escada-stairmaster",
  "ex-new-corridaleveaoarlivre",
  "ex-new-caminhadaeminclinacao",
  "ex-corda",
  "ex-new-shuttlerun",
  "ex-new-airbikeintervalada",
  "ex-new-assaultbikemoderada",
  "ex-new-corridaintervaladanaesteira",
  "ex-new-remoergometricointervalado",
  "ex-fedb-wind-sprints",
  "ex-new-subidadeescadas",
  "ex-hyrox-ski",
  "ex-hyrox-sled-push",
  "ex-hyrox-sled-pull",
  "ex-hyrox-farmers",
  "ex-hyrox-wall-ball",
  "ex-hyrox-sandbag",
  "ex-fedb-prowler-sprint",
  "ex-new-burpeebroadjump",
  "ex-new-sledpushtecnico",
  "ex-new-skiergintervalado",
  "ex-new-cordanavalemondas",
  "ex-hyrox-burpee",
  "ex-new-kettlebellswing",
  "ex-new-shuttlerun",
  "ex-new-subidadeescadas"
] as const;
// Shuttle run e subida de escadas aparecem duas vezes no atlas.
// Evita que a segunda célula substitua silenciosamente a primeira.
const indexById = new Map<string,number>();
CONDITIONING_GUIDE_IDS.forEach((id,index) => {
  if (!indexById.has(id)) indexById.set(id,index);
});
export function getConditioningIllustration(id:string): {src:string;index:number;rows:number;aspectRatio:string}|null {
  const index=indexById.get(id);
  return index===undefined ? null : {src:'/exercise-guide/conditioning/sprite.webp',index,rows:10,aspectRatio:'260 / 200'};
}
