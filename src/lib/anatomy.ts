// Camada de dados do Mapa Muscular (Stage 2 — ver claude/fitbox-status.md, v19).
//
// Taxonomia em 3 camadas fornecida pela usuária, com os assets SVG oficiais
// (pacote v7.4/"v8"): AnatomyGroup (grupo grande, usado nos chips de filtro e
// na cor do destaque) → região visual (um <g class="semantic-region"> no SVG,
// ex. "front-pectoralis-left") → MuscleEntity (músculo/porção real por trás da
// região, com peso — ex. peitoral maior 90% + deltoide anterior 10%). Nenhuma
// anatomia foi inventada aqui: os pesos e nomes vêm exatamente do pacote de
// assets fornecido, só traduzidos pra estruturas TypeScript.
//
// IMPORTANTE (limite de escopo, registrado no doc do projeto): o catálogo de
// exercícios (`lib/exercises.ts`) só tem `muscleGroup` — um grupo grande
// (ex. "perna"), não uma sub-região específica por exercício. Por isso o
// mapeamento AnatomyGroup → MuscleGroup abaixo é de grupo pra grupo (várias
// regiões finas caem no mesmo grupo grande do catálogo), não região-por-região.
// Mapear cada exercício pra uma sub-região específica exigiria ampliar o
// catálogo (ver v13 no doc do projeto) — não é o que esta etapa (Stage 2:
// integração visual no app) se propôs a resolver.

import type { MuscleGroup } from '../types';

export type AnatomyGender = 'masculino' | 'feminino';
export type AnatomyView = 'front' | 'back';
export type AnatomyModel = 'male' | 'female';

export type AnatomyGroup =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'back'
  | 'glutes'
  | 'quadriceps'
  | 'adductors'
  | 'hamstrings'
  | 'calves';

export const ANATOMY_GROUP_LABELS: Record<AnatomyGroup, string> = {
  chest: 'Peito',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraços',
  core: 'Core / Abdômen',
  back: 'Costas',
  glutes: 'Glúteos',
  quadriceps: 'Quadríceps',
  adductors: 'Adutores',
  hamstrings: 'Posterior de coxa',
  calves: 'Panturrilha',
};

export const ANATOMY_GROUP_ORDER: AnatomyGroup[] = [
  'chest',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'back',
  'glutes',
  'quadriceps',
  'adductors',
  'hamstrings',
  'calves',
];

/** Nome em português de cada músculo/porção interna (usado no inspector de hover). */
export const MUSCLE_ENTITY_LABELS: Record<string, string> = {
  pectoralis_major: 'Peitoral maior',
  anterior_deltoid: 'Deltoide anterior',
  lateral_deltoid: 'Deltoide lateral',
  posterior_deltoid: 'Deltoide posterior',
  biceps_brachii: 'Bíceps braquial',
  brachialis: 'Braquial',
  triceps_lateral_head: 'Tríceps (cabeça lateral)',
  triceps_long_head: 'Tríceps (cabeça longa)',
  triceps_medial_head: 'Tríceps (cabeça medial)',
  brachioradialis: 'Braquiorradial',
  forearm_flexor_compartment: 'Flexores do punho/dedos',
  forearm_extensor_compartment: 'Extensores do punho/dedos',
  pronator_group: 'Pronadores',
  supinator_group: 'Supinador',
  rectus_abdominis: 'Reto abdominal',
  external_oblique: 'Oblíquo externo',
  internal_oblique: 'Oblíquo interno',
  transversus_abdominis: 'Transverso do abdômen',
  latissimus_dorsi: 'Latíssimo do dorso',
  upper_trapezius: 'Trapézio superior',
  middle_trapezius: 'Trapézio médio',
  lower_trapezius: 'Trapézio inferior',
  rhomboid_region: 'Rombóide',
  teres_major: 'Redondo maior',
  infraspinatus_region: 'Infraespinhal',
  erector_spinae: 'Eretor da espinha',
  multifidus_group: 'Multífido',
  gluteus_maximus: 'Glúteo máximo',
  gluteus_medius: 'Glúteo médio',
  gluteus_minimus: 'Glúteo mínimo',
  rectus_femoris: 'Reto femoral',
  vastus_lateralis: 'Vasto lateral',
  vastus_medialis: 'Vasto medial',
  vastus_intermedius: 'Vasto intermédio (profundo)',
  biceps_femoris: 'Bíceps femoral',
  semitendinosus: 'Semitendíneo',
  semimembranosus: 'Semimembranáceo',
  gastrocnemius: 'Gastrocnêmio',
  gastrocnemius_medial_head: 'Gastrocnêmio (cabeça medial)',
  gastrocnemius_lateral_head: 'Gastrocnêmio (cabeça lateral)',
  soleus: 'Sóleo',
  tibialis_anterior: 'Tibial anterior',
  adductor_longus: 'Adutor longo',
  adductor_magnus: 'Adutor magno',
  infraspinatus: 'Infraespinhal',
  pyramidalis: 'Piramidal',
  rectus_abdominis_inferior: 'Reto abdominal (porção inferior)',
  rhomboid_major: 'Rombóide maior',
  rhomboid_minor: 'Rombóide menor',
  sternocleidomastoid: 'Esternocleidomastóideo',
  splenius_capitis: 'Esplênio da cabeça',
  semispinalis_capitis: 'Semiespinhal da cabeça',
  biceps_femoris_long_head: 'Bíceps femoral (cabeça longa)',
  biceps_femoris_short_head: 'Bíceps femoral (cabeça curta)',
};

/** viewBox de cada SVG (arte não é quadrada — feminino é um pouco mais estreito). */
export const ANATOMY_VIEWBOX: Record<`${AnatomyModel}-${AnatomyView}`, string> = {
  'male-front': '0 0 505 1025',
  'male-back': '0 0 505 1025',
  'female-front': '0 0 475 1025',
  'female-back': '0 0 495 1025',
};

/** Mapa regionKey (sem prefixo de gênero) → grupo, pra derivar quais grupos
 * estão "ativos" a partir de uma seleção de regiões, sem precisar ler o DOM. */
export const REGION_GROUP: Record<string, AnatomyGroup> = {
  'front-pectoralis-left': 'chest',
  'front-pectoralis-right': 'chest',
  'front-biceps-left': 'biceps',
  'front-biceps-right': 'biceps',
  'front-forearm-left': 'forearms',
  'front-forearm-right': 'forearms',
  'front-oblique-left': 'core',
  'front-oblique-right': 'core',
  'front-rectus-upper-left': 'core',
  'front-rectus-upper-right': 'core',
  'front-rectus-mid-left': 'core',
  'front-rectus-mid-right': 'core',
  'front-rectus-lower-left': 'core',
  'front-rectus-lower-right': 'core',
  'front-tibialis-left': 'calves',
  'front-tibialis-right': 'calves',
  'front-calf-left': 'calves',
  'front-calf-right': 'calves',
  'front-lower-ab-left': 'core',
  'front-lower-ab-right': 'core',
  'front-adductor-longus-left': 'adductors',
  'front-adductor-longus-right': 'adductors',
  'front-deltoid-left': 'shoulders',
  'front-deltoid-right': 'shoulders',
  'front-triceps-visible-left': 'triceps',
  'front-triceps-visible-right': 'triceps',
  'front-quadriceps-left': 'quadriceps',
  'front-quadriceps-right': 'quadriceps',
  'front-trapezius-left': 'back',
  'front-trapezius-right': 'back',
  'back-forearm-left': 'forearms',
  'back-forearm-right': 'forearms',
  'back-erector-left': 'back',
  'back-erector-right': 'back',
  'back-glute-medius-left': 'glutes',
  'back-glute-medius-right': 'glutes',
  'back-glute-max-left': 'glutes',
  'back-glute-max-right': 'glutes',
  'back-hamstrings-left': 'hamstrings',
  'back-hamstrings-right': 'hamstrings',
  'back-calf-left': 'calves',
  'back-calf-right': 'calves',
  'back-deltoid-left': 'shoulders',
  'back-deltoid-right': 'shoulders',
  'back-triceps-left': 'triceps',
  'back-triceps-right': 'triceps',
  'back-infraspinatus-left': 'back',
  'back-infraspinatus-right': 'back',
  'back-latissimus-left': 'back',
  'back-latissimus-right': 'back',
  'back-trapezius-left': 'back',
  'back-trapezius-right': 'back',
  'back-hamstrings-right-lateral': 'hamstrings',
};

/** Grupo grande do catálogo de exercícios (`Exercise.muscleGroup`) que cada
 * AnatomyGroup novo corresponde — usado pra listar exercícios do catálogo na
 * tela /musculos. Vários grupos finos caem no mesmo grupo grande (ex.
 * quadríceps/adutores/posterior de coxa/panturrilha → "perna"), e
 * "Antebraços" não tem equivalente no catálogo hoje (fica sem exercícios
 * listados, com aviso). Cardio/Outro do catálogo não têm região visual —
 * não entram aqui. */
export const ANATOMY_GROUP_TO_MUSCLE_GROUP: Partial<Record<AnatomyGroup, MuscleGroup>> = {
  chest: 'peito',
  back: 'costas',
  shoulders: 'ombro',
  biceps: 'biceps',
  triceps: 'triceps',
  quadriceps: 'perna',
  adductors: 'perna',
  hamstrings: 'perna',
  calves: 'perna',
  glutes: 'gluteo',
  core: 'abdomen',
};

/** Direção oposta: pra destacar automaticamente, no boneco, os grupos do
 * treino do dia (que só sabe o `muscleGroup` grande de cada exercício). */
export const MUSCLE_GROUP_TO_ANATOMY_GROUPS: Partial<Record<MuscleGroup, AnatomyGroup[]>> = {
  peito: ['chest'],
  costas: ['back'],
  ombro: ['shoulders'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  perna: ['quadriceps', 'hamstrings', 'calves', 'adductors'],
  gluteo: ['glutes'],
  abdomen: ['core'],
};

/** Tira o prefixo de gênero do id da região (ex. "male-front-pectoralis-left"
 * → "front-pectoralis-left"), pra seleção sobreviver à troca Masculino/Feminino. */
export function regionKey(id: string): string {
  return id.replace(/^male-|^female-/, '');
}

/** Interpreta o atributo `data-muscles="entity:peso,entity:peso"` de uma região. */
export function parseMuscleWeights(raw: string): Array<{ entity: string; weight: number }> {
  if (!raw) return [];
  return raw
    .split(',')
    .map((pair) => {
      const [entity, w] = pair.split(':');
      return { entity, weight: parseFloat(w) };
    })
    .filter((e) => e.entity && !Number.isNaN(e.weight))
    .sort((a, b) => b.weight - a.weight);
}

export function genderToModel(g: AnatomyGender): AnatomyModel {
  return g === 'masculino' ? 'male' : 'female';
}
