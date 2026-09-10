import type { Exercise } from '../types';

/**
 * Built-in exercise catalog, seeded on first run. Users can add their own on top.
 * IMPORTANTE: nunca mude o `id` de um exercício já existente aqui — treinos
 * salvos guardam só o id, então mudar um id "quebra" o nome exibido nos
 * treinos de quem já usa o app. Só adicione exercícios novos.
 */
export const BUILTIN_EXERCISES: Exercise[] = [
  // Peito
  { id: 'ex-supino-reto-barra', name: 'Supino reto com barra', muscleGroup: 'peito' },
  { id: 'ex-supino-reto-halter', name: 'Supino reto com halteres', muscleGroup: 'peito' },
  { id: 'ex-supino-inclinado-halter', name: 'Supino inclinado com halteres', muscleGroup: 'peito' },
  { id: 'ex-supino-inclinado-barra', name: 'Supino inclinado com barra', muscleGroup: 'peito' },
  { id: 'ex-supino-declinado-barra', name: 'Supino declinado com barra', muscleGroup: 'peito' },
  { id: 'ex-supino-maquina', name: 'Supino máquina', muscleGroup: 'peito' },
  { id: 'ex-supino-inclinado-maquina', name: 'Supino inclinado máquina', muscleGroup: 'peito' },
  { id: 'ex-crucifixo-halter', name: 'Crucifixo com halteres', muscleGroup: 'peito' },
  { id: 'ex-crossover', name: 'Crossover (polia dupla)', muscleGroup: 'peito' },
  { id: 'ex-voador-peck-deck', name: 'Voador / Peck deck', muscleGroup: 'peito' },
  { id: 'ex-flexao', name: 'Flexão de braço', muscleGroup: 'peito' },
  { id: 'ex-pullover-halter', name: 'Pullover com halter', muscleGroup: 'peito' },

  // Costas
  { id: 'ex-puxada-frente', name: 'Puxada frente (pulley)', muscleGroup: 'costas' },
  { id: 'ex-puxada-supinada', name: 'Puxada supinada (pegada inversa)', muscleGroup: 'costas' },
  { id: 'ex-puxada-maquina', name: 'Puxada máquina (articulada)', muscleGroup: 'costas' },
  { id: 'ex-remada-curvada', name: 'Remada curvada com barra', muscleGroup: 'costas' },
  { id: 'ex-remada-cavalinho', name: 'Remada cavalinho (T-bar)', muscleGroup: 'costas' },
  { id: 'ex-remada-baixa', name: 'Remada baixa (cabo)', muscleGroup: 'costas' },
  { id: 'ex-remada-unilateral', name: 'Remada unilateral com halter', muscleGroup: 'costas' },
  { id: 'ex-remada-maquina', name: 'Remada máquina (hammer)', muscleGroup: 'costas' },
  { id: 'ex-barra-fixa', name: 'Barra fixa', muscleGroup: 'costas' },
  { id: 'ex-barra-fixa-assistida', name: 'Barra fixa assistida (máquina)', muscleGroup: 'costas' },
  { id: 'ex-levantamento-terra', name: 'Levantamento terra', muscleGroup: 'costas' },
  { id: 'ex-levantamento-terra-romeno', name: 'Levantamento terra romeno', muscleGroup: 'costas' },
  { id: 'ex-pull-over-maquina', name: 'Pull-over máquina', muscleGroup: 'costas' },

  // Ombro
  { id: 'ex-desenvolvimento-militar', name: 'Desenvolvimento militar (barra)', muscleGroup: 'ombro' },
  { id: 'ex-desenvolvimento-halter', name: 'Desenvolvimento com halteres', muscleGroup: 'ombro' },
  { id: 'ex-desenvolvimento-arnold', name: 'Desenvolvimento Arnold', muscleGroup: 'ombro' },
  { id: 'ex-desenvolvimento-maquina', name: 'Desenvolvimento máquina', muscleGroup: 'ombro' },
  { id: 'ex-elevacao-lateral', name: 'Elevação lateral com halteres', muscleGroup: 'ombro' },
  { id: 'ex-elevacao-lateral-cabo', name: 'Elevação lateral no cabo', muscleGroup: 'ombro' },
  { id: 'ex-elevacao-lateral-maquina', name: 'Elevação lateral máquina', muscleGroup: 'ombro' },
  { id: 'ex-elevacao-frontal', name: 'Elevação frontal com halteres', muscleGroup: 'ombro' },
  { id: 'ex-elevacao-frontal-barra', name: 'Elevação frontal com barra', muscleGroup: 'ombro' },
  { id: 'ex-remada-alta', name: 'Remada alta com barra', muscleGroup: 'ombro' },
  { id: 'ex-remada-alta-cabo', name: 'Remada alta no cabo', muscleGroup: 'ombro' },
  { id: 'ex-crucifixo-inverso', name: 'Crucifixo inverso com halteres', muscleGroup: 'ombro' },
  { id: 'ex-crucifixo-inverso-maquina', name: 'Crucifixo inverso máquina (peck deck invertido)', muscleGroup: 'ombro' },
  { id: 'ex-encolhimento-ombro', name: 'Encolhimento de ombro (trapézio)', muscleGroup: 'ombro' },

  // Bíceps
  { id: 'ex-rosca-direta', name: 'Rosca direta com barra', muscleGroup: 'biceps' },
  { id: 'ex-rosca-direta-w', name: 'Rosca direta com barra W', muscleGroup: 'biceps' },
  { id: 'ex-rosca-alternada', name: 'Rosca alternada com halteres', muscleGroup: 'biceps' },
  { id: 'ex-rosca-martelo', name: 'Rosca martelo', muscleGroup: 'biceps' },
  { id: 'ex-rosca-scott', name: 'Rosca Scott (barra W)', muscleGroup: 'biceps' },
  { id: 'ex-rosca-scott-maquina', name: 'Rosca Scott máquina', muscleGroup: 'biceps' },
  { id: 'ex-rosca-concentrada', name: 'Rosca concentrada', muscleGroup: 'biceps' },
  { id: 'ex-rosca-cabo', name: 'Rosca no cabo', muscleGroup: 'biceps' },

  // Tríceps
  { id: 'ex-triceps-pulley', name: 'Tríceps pulley (corda)', muscleGroup: 'triceps' },
  { id: 'ex-triceps-pulley-barra', name: 'Tríceps pulley (barra reta)', muscleGroup: 'triceps' },
  { id: 'ex-triceps-testa', name: 'Tríceps testa', muscleGroup: 'triceps' },
  { id: 'ex-triceps-frances', name: 'Tríceps francês', muscleGroup: 'triceps' },
  { id: 'ex-triceps-coice', name: 'Tríceps coice com halter', muscleGroup: 'triceps' },
  { id: 'ex-triceps-maquina', name: 'Tríceps máquina', muscleGroup: 'triceps' },
  { id: 'ex-mergulho-banco', name: 'Mergulho no banco', muscleGroup: 'triceps' },
  { id: 'ex-mergulho-paralelas', name: 'Mergulho nas paralelas', muscleGroup: 'triceps' },

  // Perna
  { id: 'ex-agachamento-livre', name: 'Agachamento livre', muscleGroup: 'perna' },
  { id: 'ex-agachamento-smith', name: 'Agachamento no Smith', muscleGroup: 'perna' },
  { id: 'ex-agachamento-frontal', name: 'Agachamento frontal', muscleGroup: 'perna' },
  { id: 'ex-agachamento-hack', name: 'Agachamento hack (hack squat)', muscleGroup: 'perna' },
  { id: 'ex-agachamento-bulgaro', name: 'Agachamento búlgaro', muscleGroup: 'perna' },
  { id: 'ex-leg-press', name: 'Leg press 45°', muscleGroup: 'perna' },
  { id: 'ex-leg-press-horizontal', name: 'Leg press horizontal', muscleGroup: 'perna' },
  { id: 'ex-cadeira-extensora', name: 'Cadeira extensora', muscleGroup: 'perna' },
  { id: 'ex-mesa-flexora', name: 'Mesa flexora', muscleGroup: 'perna' },
  { id: 'ex-cadeira-flexora', name: 'Cadeira flexora (sentada)', muscleGroup: 'perna' },
  { id: 'ex-stiff-barra', name: 'Stiff com barra', muscleGroup: 'perna' },
  { id: 'ex-stiff-halter', name: 'Stiff com halteres', muscleGroup: 'perna' },
  { id: 'ex-afundo', name: 'Afundo (passada)', muscleGroup: 'perna' },
  { id: 'ex-passada-halteres', name: 'Passada com halteres (caminhando)', muscleGroup: 'perna' },
  { id: 'ex-cadeira-adutora', name: 'Cadeira adutora', muscleGroup: 'perna' },
  { id: 'ex-panturrilha-em-pe', name: 'Panturrilha em pé', muscleGroup: 'perna' },
  { id: 'ex-panturrilha-sentado', name: 'Panturrilha sentado', muscleGroup: 'perna' },
  { id: 'ex-panturrilha-leg-press', name: 'Panturrilha no leg press', muscleGroup: 'perna' },

  // Glúteo
  { id: 'ex-elevacao-pelvica', name: 'Elevação pélvica (hip thrust) com barra', muscleGroup: 'gluteo' },
  { id: 'ex-hip-thrust-maquina', name: 'Hip thrust máquina', muscleGroup: 'gluteo' },
  { id: 'ex-gluteo-cabo', name: 'Glúteo no cabo (coice)', muscleGroup: 'gluteo' },
  { id: 'ex-abducao-quadril', name: 'Abdução de quadril (máquina)', muscleGroup: 'gluteo' },
  { id: 'ex-agachamento-sumo', name: 'Agachamento sumô', muscleGroup: 'gluteo' },
  { id: 'ex-stiff-unilateral', name: 'Stiff unilateral com halter', muscleGroup: 'gluteo' },

  // Abdômen
  { id: 'ex-abdominal-supra', name: 'Abdominal supra', muscleGroup: 'abdomen' },
  { id: 'ex-elevacao-pernas', name: 'Elevação de pernas (infra)', muscleGroup: 'abdomen' },
  { id: 'ex-prancha', name: 'Prancha', muscleGroup: 'abdomen' },
  { id: 'ex-prancha-lateral', name: 'Prancha lateral', muscleGroup: 'abdomen' },
  { id: 'ex-abdominal-cabo', name: 'Abdominal na polia alta', muscleGroup: 'abdomen' },
  { id: 'ex-abdominal-maquina', name: 'Abdominal máquina', muscleGroup: 'abdomen' },
  { id: 'ex-abdominal-bicicleta', name: 'Abdominal bicicleta', muscleGroup: 'abdomen' },
  { id: 'ex-rotacao-tronco-cabo', name: 'Rotação de tronco no cabo', muscleGroup: 'abdomen' },

  // Cardio
  { id: 'ex-esteira', name: 'Esteira', muscleGroup: 'cardio' },
  { id: 'ex-bike', name: 'Bicicleta ergométrica', muscleGroup: 'cardio' },
  { id: 'ex-eliptico', name: 'Elíptico', muscleGroup: 'cardio' },
  { id: 'ex-corda', name: 'Pular corda', muscleGroup: 'cardio' },
  { id: 'ex-remo-ergometrico', name: 'Remo ergométrico', muscleGroup: 'cardio' },
  { id: 'ex-escada-stairmaster', name: 'Escada (stairmaster)', muscleGroup: 'cardio' },
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
