import type { Exercise } from '../types';
import anatomyData from '../data/anatomy330.json';

/**
 * Camada anatômica independente do catálogo. IDs de exercícios e histórico
 * permanecem intactos. Fonte: pacote FitBox 330 de 10/11/2026.
 * Os dados são estimativas biomecânicas, não medidas de EMG.
 */
export interface AnatomicalExerciseProfile {
  id: string;
  name: string;
  functionalGroup: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  stabilizers: string[];
  regionTags: string[];
  supportTags: string[];
  movementPattern: string;
  movementFamily: string;
  modality: string;
  countsAsStrengthSets: boolean;
  autoSuggestEnabled: boolean;
  confidence: string;
  notes: string;
}

interface SourceAnatomy {
  id: string;
  exercicio: string;
  grupo_funcional: string;
  porcao_regiao_em_enfase: string;
  tags_apoio: string[];
  musculos_principais: string;
  musculos_secundarios: string;
  estabilizadores: string;
  padrao_de_movimento: string;
  familia_biomecanica: string;
  modalidade: string;
  series_hipertrofia: boolean;
  sugerir_automaticamente: boolean;
  confianca: string;
  observacao: string;
}

export const ANATOMY_SOURCE_VERSION = anatomyData.schema_version;
const splitMuscles = (text: string): string[] => text.split(';').map(value=>value.trim()).filter(Boolean);
const toProfile = (entry: SourceAnatomy): AnatomicalExerciseProfile => ({
  id:entry.id,
  name:entry.exercicio,
  functionalGroup:entry.grupo_funcional,
  primaryMuscles:splitMuscles(entry.musculos_principais),
  secondaryMuscles:splitMuscles(entry.musculos_secundarios),
  stabilizers:splitMuscles(entry.estabilizadores),
  regionTags:[entry.porcao_regiao_em_enfase].filter(Boolean),
  supportTags:Array.isArray(entry.tags_apoio)?entry.tags_apoio:[],
  movementPattern:entry.padrao_de_movimento,
  movementFamily:entry.familia_biomecanica,
  modality:entry.modalidade,
  countsAsStrengthSets:entry.series_hipertrofia,
  autoSuggestEnabled:entry.sugerir_automaticamente,
  confidence:entry.confianca,
  notes:entry.observacao,
});

const sourceRows = anatomyData.exercicios as SourceAnatomy[];
export const ANATOMICAL_PROFILES = new Map<string,AnatomicalExerciseProfile>(
  sourceRows.map(row=>[row.id,toProfile(row)]),
);

/** Fallback intencionalmente conservador para exercícios personalizados. */
export function getExerciseAnatomicalProfile(exercise: Exercise | string | undefined): AnatomicalExerciseProfile | null {
  const id=typeof exercise==='string'?exercise:exercise?.id;
  return id ? ANATOMICAL_PROFILES.get(id) ?? null : null;
}

export function canAutoSuggestExercise(exercise:Exercise|string): boolean {
  const profile=getExerciseAnatomicalProfile(exercise);
  // Exercícios novos/customizados continuam no catálogo manual até revisão.
  return Boolean(profile && profile.autoSuggestEnabled);
}

export function getRegionLabel(region:string):string {
  const known:Record<string,string>={
    'peito.clavicular':'Peitoral maior — ênfase clavicular/superior',
    'peito.esternal':'Peitoral maior — ênfase esternocostal',
    'peito.costal':'Peitoral maior — ênfase costal/inferior',
    'biceps.posicao_alongada':'Flexores do cotovelo — braço atrás do tronco',
    'biceps.posicao_encurtada':'Flexores do cotovelo — braço apoiado/à frente',
    'biceps.braquial_braquiorradial':'Flexores do cotovelo — braquial/braquiorradial',
    'triceps.cabeca_longa':'Tríceps — ênfase cabeça longa',
    'ombro.lateral':'Deltoide lateral',
    'ombro.posterior':'Deltoide posterior',
    'ombro.anterior':'Deltoide anterior',
    'posterior.flexao_joelho':'Posterior — flexão de joelho',
    'posterior.extensao_quadril':'Posterior — extensão de quadril',
    'gluteo.maximo':'Glúteo máximo — extensão de quadril',
    'gluteo.medio_minimo':'Glúteos médio/mínimo — abdução',
    'panturrilha.gastrocnemio':'Panturrilha — ênfase gastrocnêmio',
    'panturrilha.soleo':'Panturrilha — ênfase sóleo',
    'core.anti_extensao':'Core — anti-extensão',
    'core.anti_rotacao':'Core — anti-rotação',
    'core.anti_flexao_lateral':'Core — anti-flexão lateral',
    'core.flexao':'Core — flexão do tronco',
  };
  if(known[region])return known[region];
  return region.replace(/[._]/g,' ').replace(/\b\w/g,letter=>letter.toLocaleUpperCase('pt-BR'));
}

export function isStrengthExercise(id:string):boolean {
  const profile=ANATOMICAL_PROFILES.get(id);
  return Boolean(profile && profile.countsAsStrengthSets && profile.modality==='força');
}

export function indexesForAnatomicalCoverage() {
  const byRegion=new Map<string,string[]>();
  const byFamily=new Map<string,string[]>();
  for(const profile of ANATOMICAL_PROFILES.values()){
    for(const region of profile.regionTags) {
      const ids=byRegion.get(region)??[];
      ids.push(profile.id);byRegion.set(region,ids);
    }
    const ids=byFamily.get(profile.movementFamily)??[];
    ids.push(profile.id);byFamily.set(profile.movementFamily,ids);
  }
  return {byRegion,byFamily};
}
