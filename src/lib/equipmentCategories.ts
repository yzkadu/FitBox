import type { Exercise } from '../types';

/** Equipamento é uma dimensão objetiva. Nunca usamos "especialidade" para
 * decidir a execução. Categorias são estimadas pelo texto já existente
 * no catálogo e podem ficar em Outros quando a descrição for ambígua.
 */
export type EquipmentCategory =
  | 'peso_corporal' | 'peso_livre' | 'maquina' | 'cabo'
  | 'elastico' | 'suspensao' | 'cardio_hyrox' | 'outros';

export const EQUIPMENT_LABELS: Record<EquipmentCategory,string> = {
  peso_corporal:'Peso corporal',
  peso_livre:'Peso livre (halteres / barras)',
  maquina:'Máquinas',
  cabo:'Cabo / polia',
  elastico:'Elásticos',
  suspensao:'Barra fixa / TRX / argolas',
  cardio_hyrox:'Cardio / HYROX',
  outros:'Outros / a verificar',
};
export const EQUIPMENT_ORDER: EquipmentCategory[] = [
  'peso_corporal','peso_livre','maquina','cabo','elastico','suspensao','cardio_hyrox','outros',
];

export function classifyEquipment(e: Exercise): EquipmentCategory {
  const explicit=(e.equipment??'').toLocaleLowerCase('pt-BR');
  const name=e.name.toLocaleLowerCase('pt-BR');
  const both=name+' '+explicit;
  if (/cabo|polia|crossover|pulley/.test(both)) return 'cabo';
  if (/elástico|miniband|mini band|resistência elástica/.test(both)) return 'elastico';
  if (/trx|argola|barra fixa|chin-up|pull-up|paralela|suspensão/.test(both)) return 'suspensao';
  if (/máquina|smith|leg press|hack squat|cadeira extensora|cadeira flexora|mesa flexora|peck deck|stairmaster/.test(both)) return 'maquina';
  if (/halter|dumbbell|barra|barbell|kettlebell|anilha|peso livre|landmine|trap bar|peso extra|disco/.test(both)) return 'peso_livre';
  if (/ski.?erg|trenó|sled|corrida|esteira|bicicleta|elíptico|remo ergométrico|air bike|assault bike|ergômetro|sprint|cardio|wall ball|sandbag|corda naval/.test(both)) return 'cardio_hyrox';
  if (explicit.includes('peso corporal') || /flexão|prancha|abdominal|agachamento livre|afundo|lunge|burpee|alongamento|mobilidade|ponte de glúteo|bird dog|mountain climber|polichinelo|wall sit/.test(both)) return 'peso_corporal';
  if (e.muscleGroup==='cardio') return 'cardio_hyrox';
  return 'outros';
}

export function equipmentMatches(ex:Exercise,selected:readonly EquipmentCategory[]):boolean {
  return selected.length===0 || selected.includes(classifyEquipment(ex));
}
