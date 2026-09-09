import type { Exercise } from '../types';

/** Built-in exercise catalog, seeded on first run. Users can add their own on top. */
export const BUILTIN_EXERCISES: Exercise[] = [
  // Peito
  { id: 'ex-supino-reto-barra', name: 'Supino reto com barra', muscleGroup: 'peito' },
  { id: 'ex-supino-inclinado-halter', name: 'Supino inclinado com halteres', muscleGroup: 'peito' },
  { id: 'ex-crucifixo-halter', name: 'Crucifixo com halteres', muscleGroup: 'peito' },
  { id: 'ex-crossover', name: 'Crossover', muscleGroup: 'peito' },
  { id: 'ex-flexao', name: 'Flexão de braço', muscleGroup: 'peito' },
  { id: 'ex-supino-maquina', name: 'Supino máquina', muscleGroup: 'peito' },

  // Costas
  { id: 'ex-puxada-frente', name: 'Puxada frente (pulley)', muscleGroup: 'costas' },
  { id: 'ex-remada-curvada', name: 'Remada curvada com barra', muscleGroup: 'costas' },
  { id: 'ex-remada-baixa', name: 'Remada baixa (cabo)', muscleGroup: 'costas' },
  { id: 'ex-barra-fixa', name: 'Barra fixa', muscleGroup: 'costas' },
  { id: 'ex-levantamento-terra', name: 'Levantamento terra', muscleGroup: 'costas' },
  { id: 'ex-remada-unilateral', name: 'Remada unilateral com halter', muscleGroup: 'costas' },

  // Ombro
  { id: 'ex-desenvolvimento-militar', name: 'Desenvolvimento militar', muscleGroup: 'ombro' },
  { id: 'ex-elevacao-lateral', name: 'Elevação lateral', muscleGroup: 'ombro' },
  { id: 'ex-elevacao-frontal', name: 'Elevação frontal', muscleGroup: 'ombro' },
  { id: 'ex-remada-alta', name: 'Remada alta', muscleGroup: 'ombro' },
  { id: 'ex-crucifixo-inverso', name: 'Crucifixo inverso', muscleGroup: 'ombro' },

  // Bíceps
  { id: 'ex-rosca-direta', name: 'Rosca direta com barra', muscleGroup: 'biceps' },
  { id: 'ex-rosca-alternada', name: 'Rosca alternada com halteres', muscleGroup: 'biceps' },
  { id: 'ex-rosca-martelo', name: 'Rosca martelo', muscleGroup: 'biceps' },
  { id: 'ex-rosca-scott', name: 'Rosca Scott', muscleGroup: 'biceps' },

  // Tríceps
  { id: 'ex-triceps-pulley', name: 'Tríceps pulley (corda)', muscleGroup: 'triceps' },
  { id: 'ex-triceps-testa', name: 'Tríceps testa', muscleGroup: 'triceps' },
  { id: 'ex-triceps-frances', name: 'Tríceps francês', muscleGroup: 'triceps' },
  { id: 'ex-mergulho-banco', name: 'Mergulho no banco', muscleGroup: 'triceps' },

  // Perna
  { id: 'ex-agachamento-livre', name: 'Agachamento livre', muscleGroup: 'perna' },
  { id: 'ex-leg-press', name: 'Leg press', muscleGroup: 'perna' },
  { id: 'ex-cadeira-extensora', name: 'Cadeira extensora', muscleGroup: 'perna' },
  { id: 'ex-mesa-flexora', name: 'Mesa flexora', muscleGroup: 'perna' },
  { id: 'ex-afundo', name: 'Afundo (passada)', muscleGroup: 'perna' },
  { id: 'ex-cadeira-adutora', name: 'Cadeira adutora', muscleGroup: 'perna' },
  { id: 'ex-panturrilha-em-pe', name: 'Panturrilha em pé', muscleGroup: 'perna' },

  // Glúteo
  { id: 'ex-elevacao-pelvica', name: 'Elevação pélvica (hip thrust)', muscleGroup: 'gluteo' },
  { id: 'ex-gluteo-cabo', name: 'Glúteo no cabo (coice)', muscleGroup: 'gluteo' },
  { id: 'ex-abducao-quadril', name: 'Abdução de quadril', muscleGroup: 'gluteo' },

  // Abdômen
  { id: 'ex-abdominal-supra', name: 'Abdominal supra', muscleGroup: 'abdomen' },
  { id: 'ex-prancha', name: 'Prancha', muscleGroup: 'abdomen' },
  { id: 'ex-elevacao-pernas', name: 'Elevação de pernas', muscleGroup: 'abdomen' },
  { id: 'ex-abdominal-cabo', name: 'Abdominal na polia alta', muscleGroup: 'abdomen' },

  // Cardio
  { id: 'ex-esteira', name: 'Esteira', muscleGroup: 'cardio' },
  { id: 'ex-bike', name: 'Bicicleta ergométrica', muscleGroup: 'cardio' },
  { id: 'ex-eliptico', name: 'Elíptico', muscleGroup: 'cardio' },
  { id: 'ex-corda', name: 'Pular corda', muscleGroup: 'cardio' },
];

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombro: 'Ombro',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  perna: 'Perna',
  gluteo: 'Glúteo',
  abdomen: 'Abdômen',
  cardio: 'Cardio',
  outro: 'Outro',
};

export const MUSCLE_GROUP_ORDER = [
  'peito', 'costas', 'ombro', 'biceps', 'triceps', 'perna', 'gluteo', 'abdomen', 'cardio', 'outro',
];
