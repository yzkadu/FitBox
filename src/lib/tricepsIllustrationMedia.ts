/** Guia visual de tríceps: 25 quadros individuais extraídos das 5 páginas recebidas.
 * Os IDs seguem o catálogo oficial; nunca substituir o exercício por similar.
 * A imagem usa atlas 5 × 5, cada quadro ocupa 280 × 235 px.
 */
export const TRICEPS_GUIDE_IDS = [
  "ex-triceps-pulley-barra",
  "ex-triceps-pulley",
  "ex-triceps-testa",
  "ex-triceps-frances",
  "ex-mergulho-banco",
  "ex-triceps-coice",
  "ex-triceps-maquina",
  "ex-mergulho-paralelas",
  "ex-fedb-push-ups-close-triceps-position",
  "ex-fedb-close-grip-barbell-bench-press",
  "ex-fedb-cable-rope-overhead-triceps-extension",
  "ex-fedb-tate-press",
  "ex-fedb-jm-press",
  "ex-fedb-one-arm-supinated-dumbbell-triceps-extension",
  "ex-fedb-reverse-grip-triceps-pushdown",
  "ex-fedb-weighted-bench-dip",
  "ex-fedb-ring-dips",
  "ex-fedb-lying-dumbbell-tricep-extension",
  "ex-new-tricepstestacomhalteres",
  "ex-new-tricepsnapoliapegadainvertida",
  "ex-new-extensaoacimadacabecaunilateral",
  "ex-new-tricepsnacordaacimadacabeca",
  "ex-new-tricepsbarravnopulley",
  "ex-new-tricepsemargolas",
  "ex-new-supinocompegadafechada"
] as const;
const indexById = new Map<string,number>(TRICEPS_GUIDE_IDS.map((id,index)=>[id,index]));
export function getTricepsIllustration(id:string): {src:string;index:number;rows:number;aspectRatio:string}|null {
 const index=indexById.get(id);
 return index===undefined ? null : {src:'/exercise-guide/triceps/sprite.webp',index,rows:5,aspectRatio:'280 / 235'};
}
