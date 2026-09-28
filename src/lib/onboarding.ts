// Opções do quiz de cadastro (objetivo, experiência, frequência, equipamento).
// Central aqui pra Auth.tsx (cadastro) e o resto do app (perfil, futuro
// Personal Trainer virtual) usarem sempre os mesmos valores e rótulos.

export type TrainingGoal = 'emagrecer' | 'ganhar_massa' | 'definicao' | 'performance' | 'saude';
export type ExperienceLevel = 'iniciante' | 'intermediario' | 'avancado';
export type WeeklyFrequency = '2-3' | '4-5' | '6-7';
export type Equipment = 'academia' | 'casa_equipamento' | 'peso_corporal';
export type TrainingType =
  | 'aerobico'
  | 'calistenia'
  | 'hirox'
  | 'resistido'
  | 'hipertrofia'
  | 'funcional_crossfit'
  | 'flexibilidade_mobilidade';

interface QuizOption<T extends string> {
  id: T;
  label: string;
  description: string;
}

export const GOAL_OPTIONS: QuizOption<TrainingGoal>[] = [
  { id: 'emagrecer', label: 'Emagrecer', description: 'Perder peso e gordura corporal' },
  { id: 'ganhar_massa', label: 'Ganhar massa muscular', description: 'Aumentar volume e força muscular' },
  { id: 'definicao', label: 'Definição muscular', description: 'Perder gordura mantendo o músculo' },
  { id: 'performance', label: 'Performance e força', description: 'Melhorar desempenho físico e força' },
  { id: 'saude', label: 'Saúde e bem-estar', description: 'Manter a forma e ter mais disposição' },
];

export const EXPERIENCE_OPTIONS: QuizOption<ExperienceLevel>[] = [
  { id: 'iniciante', label: 'Iniciante', description: 'Pouca ou nenhuma experiência com treino' },
  { id: 'intermediario', label: 'Intermediário', description: 'Já treino há alguns meses' },
  { id: 'avancado', label: 'Avançado', description: 'Treino há anos, conheço bem minha rotina' },
];

export const FREQUENCY_OPTIONS: QuizOption<WeeklyFrequency>[] = [
  { id: '2-3', label: '2 a 3 dias por semana', description: 'Rotina mais leve, encaixando entre outros compromissos' },
  { id: '4-5', label: '4 a 5 dias por semana', description: 'Rotina consistente, bom equilíbrio' },
  { id: '6-7', label: '6 a 7 dias por semana', description: 'Treino quase todo dia' },
];

export const EQUIPMENT_OPTIONS: QuizOption<Equipment>[] = [
  { id: 'academia', label: 'Academia completa', description: 'Acesso a aparelhos, máquinas e pesos livres' },
  { id: 'casa_equipamento', label: 'Casa com equipamentos', description: 'Halteres, elásticos, barra, etc.' },
  { id: 'peso_corporal', label: 'Só peso do corpo', description: 'Sem equipamentos — calistenia' },
];

export const TRAINING_TYPE_OPTIONS: QuizOption<TrainingType>[] = [
  { id: 'resistido', label: 'Resistido', description: 'Musculação tradicional com pesos' },
  { id: 'hipertrofia', label: 'Hipertrofia', description: 'Foco em ganho de volume muscular' },
  { id: 'funcional_crossfit', label: 'Funcional / CrossFit', description: 'Movimentos variados, alta intensidade' },
  { id: 'hirox', label: 'Hirox', description: 'Corrida intercalada com estações funcionais' },
  { id: 'calistenia', label: 'Calistenia', description: 'Treino com o peso do próprio corpo' },
  { id: 'aerobico', label: 'Aeróbico', description: 'Corrida, bike, natação e afins' },
  { id: 'flexibilidade_mobilidade', label: 'Flexibilidade e Mobilidade', description: 'Alongamento, mobilidade articular' },
];

function findLabel<T extends string>(options: QuizOption<T>[], id: string | null | undefined): string | null {
  return options.find((o) => o.id === id)?.label ?? null;
}

export const goalLabel = (id: string | null | undefined) => findLabel(GOAL_OPTIONS, id);
export const experienceLabel = (id: string | null | undefined) => findLabel(EXPERIENCE_OPTIONS, id);
export const frequencyLabel = (id: string | null | undefined) => findLabel(FREQUENCY_OPTIONS, id);

/** Objetivo principal também é múltipla escolha (ex: "emagrecer" + "saúde e
 * bem-estar" ao mesmo tempo) — devolve os rótulos de todos os marcados. */
export function goalLabels(ids: readonly string[] | null | undefined): string[] {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => findLabel(GOAL_OPTIONS, id)).filter((l): l is string => !!l);
}

/** Onde treinar agora é múltipla escolha (ex: "academia" + "casa com
 * equipamentos") — devolve os rótulos de todas as opções marcadas. */
export function equipmentLabels(ids: readonly string[] | null | undefined): string[] {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => findLabel(EQUIPMENT_OPTIONS, id)).filter((l): l is string => !!l);
}

/** Tipos de treino pretendidos — também múltipla escolha (ex: "hipertrofia" +
 * "flexibilidade e mobilidade" ao mesmo tempo). */
export function trainingTypeLabels(ids: readonly string[] | null | undefined): string[] {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => findLabel(TRAINING_TYPE_OPTIONS, id)).filter((l): l is string => !!l);
}
