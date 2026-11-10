import type { Exercise } from '../types';
import { getExerciseAnatomicalProfile, getRegionLabel, isStrengthExercise } from './anatomicalProfiles';

export interface AnatomySelection<T> {
  item: T;
  reason: string;
  changed: boolean;
}

/**
 * Heurística de complementaridade (não é EMG, prescrição clínica nem medida de hipertrofia).
 * Melhora fichas AUTOMÁTICAS, nunca toca em sessões/circuitos editados pelo usuário.
 * Mantém o número de slots e a distribuição de grupos da ficha-base.
 */
export function balanceAnatomicalExercises<T extends {id:string}>(
  planned:T[],
  catalog:Exercise[],
  eligible:(exercise:Exercise)=>boolean,
  priorWeekRegions:ReadonlySet<string>=new Set(),
):AnatomySelection<T>[] {
  const byId=new Map(catalog.map(ex=>[ex.id,ex]));
  const chosen=new Set<string>();
  const sessionRegions=new Set<string>();
  const sessionFamilies=new Set<string>();
  const result:AnatomySelection<T>[]=[];

  for(const original of planned) {
    const seed=byId.get(original.id);
    const seedProfile=getExerciseAnatomicalProfile(original.id);
    // A biblioteca tem modalidades não hipertrofia; preservar posição sem forçar
    // cross-modalidade ou transformar minutos de cardio em séries de força.
    if(!seed || !seedProfile || !isStrengthExercise(original.id)) {
      result.push({item:original,reason:'Modalidade preservada da ficha-base.',changed:false});
      chosen.add(original.id);
      continue;
    }
    const choices=catalog.filter(ex=>ex.muscleGroup===seed.muscleGroup &&
      !chosen.has(ex.id) && eligible(ex) && isStrengthExercise(ex.id) &&
      getExerciseAnatomicalProfile(ex.id)?.autoSuggestEnabled);
    // O seed continua preferido quando traz cobertura comparável à alternativa.
    const score=(id:string)=>{
      const p=getExerciseAnatomicalProfile(id);
      if(!p)return Number.NEGATIVE_INFINITY;
      const region=p.regionTags[0]??'';
      return (id===original.id?8:0)
        +(region && !sessionRegions.has(region)?10:-10)
        +(!sessionFamilies.has(p.movementFamily)?8:-16)
        +(region && !priorWeekRegions.has(region)?3:0)
        +(p.confidence.startsWith('boa')?2:0);
    };
    const ranked=choices.map(ex=>({id:ex.id,score:score(ex.id)}))
      .sort((a,b)=>b.score-a.score || (a.id===original.id?-1:b.id===original.id?1:0));
    const best=ranked[0]?.id ?? original.id;
    const profile=getExerciseAnatomicalProfile(best)!;
    const region=profile.regionTags[0];
    const changed=best!==original.id;
    const reason=(changed?'Substituição sugerida para evitar repetição: ':'Ênfase complementar: ')
      +(region?getRegionLabel(region):profile.functionalGroup)
      +' · '+profile.movementPattern+'.';
    result.push({item:{...original,id:best},reason,changed});
    chosen.add(best);
    if(region)sessionRegions.add(region);
    if(profile.movementFamily)sessionFamilies.add(profile.movementFamily);
  }
  return result;
}

/** Contabiliza apenas a cobertura DIRETA em treinos de força selecionados.
 * Participação secundária não entra como série completa.
 */
export function directAnatomicalCoverage(exerciseIds:Iterable<string>): {
  regions:string[];families:string[];indirectMuscles:string[];
} {
  const regions=new Set<string>(),families=new Set<string>(),indirect=new Set<string>();
  for(const id of exerciseIds){
    const p=getExerciseAnatomicalProfile(id);
    if(!p||!p.countsAsStrengthSets||p.modality!=='força')continue;
    p.regionTags.forEach(region=>regions.add(region));
    if(p.movementFamily)families.add(p.movementFamily);
    p.secondaryMuscles.forEach(muscle=>indirect.add(muscle));
  }
  return {regions:[...regions],families:[...families],indirectMuscles:[...indirect]};
}
