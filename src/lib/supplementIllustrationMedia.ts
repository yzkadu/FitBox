/** 22 quadros específicos enviados em 10/11/2026.
 * O atlas contém 5 colunas × 5 linhas, sendo 3 células finais vazias.
 * Importação opcional: SEM o WebP físico, preserva as demonstrações atuais.
 * Para ativar, adicionar src/assets/exercise-guide/supplement-22/sprite.webp
 * e publicar a alteração (evitar URLs quebradas).
 */
export const SUPPLEMENT_22_GUIDE_IDS = [
  "ex-elevacao-lateral-cabo",
  "ex-elevacao-lateral-maquina",
  "ex-new-facepullnoelastico",
  "ex-new-pushpresscomhalteres",
  "ex-agachamento-bulgaro",
  "ex-leg-press-horizontal",
  "ex-afundo",
  "ex-new-cossacksquat",
  "ex-new-legpressunilateral",
  "ex-new-wallsitisometrico",
  "ex-new-afundoreverso",
  "ex-new-nordiccurlassistido",
  "ex-new-passadalateral",
  "ex-stiff-unilateral",
  "ex-new-pontecomminiband",
  "ex-new-elevacaopelvicanotrx",
  "ex-new-agachamentocomminiband",
  "ex-new-tricepscoicenocabo",
  "ex-new-tricepsbancocompeselevados",
  "ex-new-extensaodetricepscomelastico",
  "ex-new-supinofechadocomhalteres",
  "ex-new-flexaodiamante"
] as const;

const spriteAssets = import.meta.glob('../assets/exercise-guide/supplement-22/*.webp',{
  eager:true,query:'?url',import:'default',
}) as Record<string,string>;
const spriteUrl = spriteAssets['../assets/exercise-guide/supplement-22/sprite.webp'];
const byId = new Map<string,number>(SUPPLEMENT_22_GUIDE_IDS.map((id,index)=>[id,index]));

export function getSupplementIllustration(id:string):
  {src:string;index:number;rows:number;aspectRatio:string}|null {
  if (!spriteUrl) return null;
  const index=byId.get(id);
  return index===undefined ? null : {src:spriteUrl,index,rows:5,aspectRatio:'280 / 220'};
}
export function getSupplementIllustrationCoverage() {
  return {expected:SUPPLEMENT_22_GUIDE_IDS.length,assetsInstalled:Boolean(spriteUrl)};
}
