/**
 * 74 imagens do guia visual recebido (8 páginas de costas, 7 de ombros).
 * Os 2 sprites WebP reais foram commitados como binários em public/exercise-guide/.
 * A posição do quadro decorre da ordem de leitura nas páginas: esquerda/direita
 * nas duas primeiras linhas e um quadro largo na terceira.
 */
export const BACK_GUIDE_IDS = [
  "ex-puxada-frente",
  "ex-puxada-supinada",
  "ex-remada-curvada",
  "ex-remada-cavalinho",
  "ex-remada-baixa",
  "ex-remada-unilateral",
  "ex-remada-maquina",
  "ex-barra-fixa",
  "ex-barra-fixa-assistida",
  "ex-new-barrafixaneutra",
  "ex-levantamento-terra",
  "ex-levantamento-terra-romeno",
  "ex-fedb-wide-grip-lat-pulldown",
  "ex-fedb-close-grip-front-lat-pulldown",
  "ex-fedb-one-arm-lat-pulldown",
  "ex-fedb-straight-arm-pulldown",
  "ex-fedb-inverted-row",
  "ex-fedb-smith-machine-bent-over-row",
  "ex-fedb-trap-bar-deadlift",
  "ex-fedb-reverse-grip-bent-over-rows",
  "ex-fedb-wide-grip-rear-pull-up",
  "ex-fedb-barbell-shrug-behind-the-back",
  "ex-fedb-elevated-cable-rows",
  "ex-fedb-lying-t-bar-row",
  "ex-fedb-scapular-pull-up",
  "ex-fedb-seated-one-arm-cable-pulley-rows",
  "ex-fedb-leverage-high-row",
  "ex-fedb-rope-straight-arm-pulldown",
  "ex-fedb-v-bar-pulldown",
  "ex-new-remadacompeitoapoiadonobanco",
  "ex-new-remadaunilateralnapoliabaixa",
  "ex-new-pulldownnapoliacomcorda",
  "ex-new-remadaaustraliananotrx",
  "ex-new-remadaaltaparacostascomcorda",
  "ex-new-extensaolombar45graus",
  "ex-new-remadatbarcomapoiodepeito",
  "ex-pull-over-maquina",
  "ex-puxada-maquina",
  "ex-new-remadapendlay",
  "ex-new-remadarenegade"
] as const;
export const SHOULDER_GUIDE_IDS = [
  "ex-desenvolvimento-militar",
  "ex-desenvolvimento-halter",
  "ex-desenvolvimento-arnold",
  "ex-desenvolvimento-maquina",
  "ex-elevacao-lateral",
  "ex-elevacao-frontal",
  "ex-elevacao-frontal-barra",
  "ex-remada-alta",
  "ex-remada-alta-cabo",
  "ex-crucifixo-inverso",
  "ex-crucifixo-inverso-maquina",
  "ex-encolhimento-ombro",
  "ex-fedb-cable-shoulder-press",
  "ex-fedb-cuban-press",
  "ex-fedb-face-pull",
  "ex-fedb-smith-machine-overhead-shoulder-press",
  "ex-fedb-front-plate-raise",
  "ex-fedb-cable-rear-delt-fly",
  "ex-fedb-seated-side-lateral-raise",
  "ex-fedb-external-rotation-with-band",
  "ex-fedb-internal-rotation-with-band",
  "ex-fedb-leverage-shoulder-press",
  "ex-fedb-kettlebell-arnold-press",
  "ex-fedb-standing-palms-in-dumbbell-press",
  "ex-new-elevacaoynobancoinclinado",
  "ex-new-desenvolvimentomeioajoelhado",
  "ex-new-desenvolvimentolandmineunilatera",
  "ex-new-facepullcomrotacaoexterna",
  "ex-new-elevacaolateralnapoliaempe",
  "ex-new-pikepushup",
  "ex-new-scaptioncomhalteres",
  "ex-new-elevacaofrontalunilateralnocabo",
  "ex-new-elevacaolateralinclinado",
  "ex-new-desenvolvimentopushpress"
] as const;

export type IllustratedSprite = {src:string;index:number;rows:number;aspectRatio:string};
const locations=new Map<string, IllustratedSprite>();
BACK_GUIDE_IDS.forEach((id,index)=>locations.set(id,{
  src:'/exercise-guide/back/sprite.webp',index,rows:8,aspectRatio:'310 / 250',
}));
SHOULDER_GUIDE_IDS.forEach((id,index)=>locations.set(id,{
  src:'/exercise-guide/shoulders/sprite.webp',index,rows:7,aspectRatio:'310 / 250',
}));

export function getBackShoulderIllustration(id:string): IllustratedSprite | null {
  return locations.get(id) ?? null;
}
export function getBackShoulderIllustrationCoverage() {
  return {back:BACK_GUIDE_IDS.length,shoulders:SHOULDER_GUIDE_IDS.length,installed:locations.size};
}
