// Opções do quiz de cadastro (objetivo, experiência, frequência, equipamento).
// Central aqui pra Auth.tsx (cadastro) e o resto do app (perfil, futuro
// Personal Trainer virtual) usarem sempre os mesmos valores e rótulos.

export type TrainingGoal = 'emagrecer' | 'ganhar_massa' | 'definicao' | 'performance' | 'saude';
export type ExperienceLevel = 'iniciante' | 'intermediario' | 'avancado';
export type WeeklyFrequency = '2-3' | '4-5' | '6-7';
export type Equipment = 'academia' | 'casa_equipamento' | 'peso_corporal';

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

function findLabel<T extends string>(options: QuizOption<T>[], id: string | null | undefined): string | null {
  return options.find((o) => o.id === id)?.label ?? null;
}

export const goalLabel = (id: string | null | undefined) => findLabel(GOAL_OPTIONS, id);
export const experienceLabel = (id: string | null | undefined) => findLabel(EXPERIENCE_OPTIONS, id);
export const frequencyLabel = (id: string | null | undefined) => findLabel(FREQUENCY_OPTIONS, id);
export const equipmentLabel = (id: string | null | undefined) => findLabel(EQUIPMENT_OPTIONS, id);
