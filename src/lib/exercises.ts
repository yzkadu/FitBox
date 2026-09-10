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

  // --- Catálogo expandido (baseado em free-exercise-db, dados de domínio público) ---
  // Peito (importados)
  { id: 'ex-fedb-decline-dumbbell-bench-press', name: 'Supino declinado com halteres', muscleGroup: 'peito', equipment: 'halteres' },
  { id: 'ex-fedb-decline-dumbbell-flyes', name: 'Crucifixo declinado com halteres', muscleGroup: 'peito', equipment: 'halteres' },
  { id: 'ex-fedb-incline-dumbbell-flyes', name: 'Crucifixo inclinado com halteres', muscleGroup: 'peito', equipment: 'halteres' },
  { id: 'ex-fedb-incline-cable-flye', name: 'Crucifixo inclinado no cabo', muscleGroup: 'peito', equipment: 'cabo' },
  { id: 'ex-fedb-flat-bench-cable-flyes', name: 'Crucifixo reto no cabo', muscleGroup: 'peito', equipment: 'cabo' },
  { id: 'ex-fedb-one-arm-dumbbell-bench-press', name: 'Supino unilateral com halter', muscleGroup: 'peito', equipment: 'halteres' },
  { id: 'ex-fedb-wide-grip-barbell-bench-press', name: 'Supino reto pegada aberta com barra', muscleGroup: 'peito', equipment: 'barra' },
  { id: 'ex-fedb-svend-press', name: 'Svend press (compressão de anilha)', muscleGroup: 'peito' },
  { id: 'ex-fedb-smith-machine-bench-press', name: 'Supino reto no Smith', muscleGroup: 'peito', equipment: 'máquina' },
  { id: 'ex-fedb-smith-machine-incline-bench-press', name: 'Supino inclinado no Smith', muscleGroup: 'peito', equipment: 'máquina' },
  { id: 'ex-fedb-smith-machine-decline-press', name: 'Supino declinado no Smith', muscleGroup: 'peito', equipment: 'máquina' },
  { id: 'ex-fedb-dumbbell-bench-press-with-neutral-grip', name: 'Supino com halteres (pegada neutra)', muscleGroup: 'peito', equipment: 'halteres' },
  { id: 'ex-fedb-cable-chest-press', name: 'Supino no cabo', muscleGroup: 'peito', equipment: 'cabo' },
  { id: 'ex-fedb-push-ups-with-feet-elevated', name: 'Flexão com pés elevados', muscleGroup: 'peito' },
  { id: 'ex-fedb-incline-dumbbell-bench-with-palms-facing-in', name: 'Supino inclinado pegada neutra com halteres', muscleGroup: 'peito', equipment: 'halteres' },
  { id: 'ex-fedb-push-up-wide', name: 'Flexão aberta', muscleGroup: 'peito' },
  { id: 'ex-fedb-leverage-chest-press', name: 'Supino na máquina articulada (leverage)', muscleGroup: 'peito', equipment: 'máquina' },
  { id: 'ex-fedb-decline-push-up', name: 'Flexão declinada', muscleGroup: 'peito' },

  // Costas (importados)
  { id: 'ex-fedb-wide-grip-lat-pulldown', name: 'Puxada aberta', muscleGroup: 'costas', equipment: 'cabo' },
  { id: 'ex-fedb-close-grip-front-lat-pulldown', name: 'Puxada fechada por frente', muscleGroup: 'costas', equipment: 'cabo' },
  { id: 'ex-fedb-one-arm-lat-pulldown', name: 'Puxada unilateral', muscleGroup: 'costas', equipment: 'cabo' },
  { id: 'ex-fedb-straight-arm-pulldown', name: 'Puxada com braços estendidos (pull-over no cabo)', muscleGroup: 'costas', equipment: 'cabo' },
  { id: 'ex-fedb-inverted-row', name: 'Remada invertida', muscleGroup: 'costas' },
  { id: 'ex-fedb-smith-machine-bent-over-row', name: 'Remada curvada no Smith', muscleGroup: 'costas', equipment: 'máquina' },
  { id: 'ex-fedb-trap-bar-deadlift', name: 'Levantamento terra com trap bar', muscleGroup: 'costas', equipment: 'barra' },
  { id: 'ex-fedb-reverse-grip-bent-over-rows', name: 'Remada curvada pegada supinada', muscleGroup: 'costas', equipment: 'barra' },
  { id: 'ex-fedb-wide-grip-rear-pull-up', name: 'Barra fixa pegada aberta atrás da nuca', muscleGroup: 'costas' },
  { id: 'ex-fedb-barbell-shrug-behind-the-back', name: 'Encolhimento atrás do corpo com barra', muscleGroup: 'costas', equipment: 'barra' },
  { id: 'ex-fedb-elevated-cable-rows', name: 'Remada elevada no cabo', muscleGroup: 'costas', equipment: 'cabo' },
  { id: 'ex-fedb-lying-t-bar-row', name: 'Remada cavalinho deitado', muscleGroup: 'costas', equipment: 'máquina' },
  { id: 'ex-fedb-scapular-pull-up', name: 'Barra fixa escapular', muscleGroup: 'costas' },
  { id: 'ex-fedb-seated-one-arm-cable-pulley-rows', name: 'Remada unilateral no cabo sentado', muscleGroup: 'costas', equipment: 'cabo' },
  { id: 'ex-fedb-leverage-high-row', name: 'Remada alta na máquina articulada', muscleGroup: 'costas', equipment: 'máquina' },
  { id: 'ex-fedb-rope-straight-arm-pulldown', name: 'Puxada de braços retos na corda', muscleGroup: 'costas', equipment: 'cabo' },
  { id: 'ex-fedb-v-bar-pulldown', name: 'Puxada triângulo (V-bar)', muscleGroup: 'costas', equipment: 'cabo' },

  // Ombro (importados)
  { id: 'ex-fedb-cable-shoulder-press', name: 'Desenvolvimento no cabo', muscleGroup: 'ombro', equipment: 'cabo' },
  { id: 'ex-fedb-cuban-press', name: 'Cuban press (rotação + desenvolvimento)', muscleGroup: 'ombro', equipment: 'halteres' },
  { id: 'ex-fedb-face-pull', name: 'Face pull (puxada pro rosto)', muscleGroup: 'ombro', equipment: 'cabo' },
  { id: 'ex-fedb-smith-machine-overhead-shoulder-press', name: 'Desenvolvimento militar no Smith', muscleGroup: 'ombro', equipment: 'máquina' },
  { id: 'ex-fedb-front-plate-raise', name: 'Elevação frontal com anilha', muscleGroup: 'ombro' },
  { id: 'ex-fedb-cable-rear-delt-fly', name: 'Crucifixo inverso no cabo', muscleGroup: 'ombro', equipment: 'cabo' },
  { id: 'ex-fedb-seated-side-lateral-raise', name: 'Elevação lateral sentado', muscleGroup: 'ombro', equipment: 'halteres' },
  { id: 'ex-fedb-external-rotation-with-band', name: 'Rotação externa de ombro com elástico', muscleGroup: 'ombro', equipment: 'elástico' },
  { id: 'ex-fedb-internal-rotation-with-band', name: 'Rotação interna de ombro com elástico', muscleGroup: 'ombro', equipment: 'elástico' },
  { id: 'ex-fedb-leverage-shoulder-press', name: 'Desenvolvimento na máquina articulada (leverage)', muscleGroup: 'ombro', equipment: 'máquina' },
  { id: 'ex-fedb-kettlebell-arnold-press', name: 'Desenvolvimento Arnold com kettlebell', muscleGroup: 'ombro', equipment: 'kettlebell' },
  { id: 'ex-fedb-standing-palms-in-dumbbell-press', name: 'Desenvolvimento em pé com halteres (pegada neutra)', muscleGroup: 'ombro', equipment: 'halteres' },

  // Bíceps (importados)
  { id: 'ex-fedb-cross-body-hammer-curl', name: 'Rosca martelo cruzada', muscleGroup: 'biceps', equipment: 'halteres' },
  { id: 'ex-fedb-drag-curl', name: 'Rosca drag (drag curl)', muscleGroup: 'biceps', equipment: 'barra' },
  { id: 'ex-fedb-spider-curl', name: 'Rosca aranha', muscleGroup: 'biceps', equipment: 'barra' },
  { id: 'ex-fedb-zottman-curl', name: 'Rosca Zottman', muscleGroup: 'biceps', equipment: 'halteres' },
  { id: 'ex-fedb-standing-one-arm-cable-curl', name: 'Rosca unilateral no cabo', muscleGroup: 'biceps', equipment: 'cabo' },
  { id: 'ex-fedb-reverse-barbell-curl', name: 'Rosca inversa com barra', muscleGroup: 'biceps', equipment: 'barra' },
  { id: 'ex-fedb-high-cable-curls', name: 'Rosca no cabo alto', muscleGroup: 'biceps', equipment: 'cabo' },
  { id: 'ex-fedb-cable-hammer-curls-rope-attachment', name: 'Rosca martelo na corda', muscleGroup: 'biceps', equipment: 'cabo' },
  { id: 'ex-fedb-incline-dumbbell-curl', name: 'Rosca inclinada no banco com halteres', muscleGroup: 'biceps', equipment: 'halteres' },
  { id: 'ex-fedb-preacher-hammer-dumbbell-curl', name: 'Rosca martelo no banco Scott', muscleGroup: 'biceps', equipment: 'halteres' },

  // Tríceps (importados)
  { id: 'ex-fedb-push-ups-close-triceps-position', name: 'Flexão fechada (foco tríceps)', muscleGroup: 'triceps' },
  { id: 'ex-fedb-close-grip-barbell-bench-press', name: 'Supino fechado (foco tríceps) com barra', muscleGroup: 'triceps', equipment: 'barra' },
  { id: 'ex-fedb-cable-rope-overhead-triceps-extension', name: 'Tríceps francês na corda', muscleGroup: 'triceps', equipment: 'cabo' },
  { id: 'ex-fedb-tate-press', name: 'Tate press', muscleGroup: 'triceps', equipment: 'halteres' },
  { id: 'ex-fedb-jm-press', name: 'JM press', muscleGroup: 'triceps', equipment: 'barra' },
  { id: 'ex-fedb-one-arm-supinated-dumbbell-triceps-extension', name: 'Tríceps francês unilateral com halter', muscleGroup: 'triceps', equipment: 'halteres' },
  { id: 'ex-fedb-reverse-grip-triceps-pushdown', name: 'Tríceps pulley pegada supinada', muscleGroup: 'triceps', equipment: 'cabo' },
  { id: 'ex-fedb-weighted-bench-dip', name: 'Mergulho no banco com peso', muscleGroup: 'triceps' },
  { id: 'ex-fedb-ring-dips', name: 'Mergulho em argolas', muscleGroup: 'triceps' },
  { id: 'ex-fedb-lying-dumbbell-tricep-extension', name: 'Tríceps francês deitado com halteres', muscleGroup: 'triceps', equipment: 'halteres' },

  // Perna (importados)
  { id: 'ex-fedb-goblet-squat', name: 'Agachamento goblet', muscleGroup: 'perna', equipment: 'halteres' },
  { id: 'ex-fedb-weighted-sissy-squat', name: 'Sissy squat', muscleGroup: 'perna' },
  { id: 'ex-fedb-zercher-squats', name: 'Agachamento zercher', muscleGroup: 'perna', equipment: 'barra' },
  { id: 'ex-fedb-narrow-stance-leg-press', name: 'Leg press pés fechados', muscleGroup: 'perna', equipment: 'máquina' },
  { id: 'ex-fedb-single-leg-leg-extension', name: 'Cadeira extensora unilateral', muscleGroup: 'perna', equipment: 'máquina' },
  { id: 'ex-fedb-standing-leg-curl', name: 'Flexora em pé', muscleGroup: 'perna', equipment: 'máquina' },
  { id: 'ex-fedb-step-up-with-knee-raise', name: 'Subida no banco com elevação de joelho', muscleGroup: 'perna' },
  { id: 'ex-fedb-plie-dumbbell-squat', name: 'Agachamento plié com halter', muscleGroup: 'perna', equipment: 'halteres' },
  { id: 'ex-fedb-donkey-calf-raises', name: 'Panturrilha burro (donkey calf raise)', muscleGroup: 'perna' },
  { id: 'ex-fedb-freehand-jump-squat', name: 'Agachamento com salto (jump squat)', muscleGroup: 'perna' },
  { id: 'ex-fedb-wide-stance-barbell-squat', name: 'Agachamento pés afastados com barra', muscleGroup: 'perna', equipment: 'barra' },
  { id: 'ex-fedb-narrow-stance-squats', name: 'Agachamento pés fechados com barra', muscleGroup: 'perna', equipment: 'barra' },
  { id: 'ex-fedb-one-leg-barbell-squat', name: 'Agachamento unilateral com barra', muscleGroup: 'perna', equipment: 'barra' },
  { id: 'ex-fedb-kettlebell-pistol-squat', name: 'Agachamento pistol com kettlebell', muscleGroup: 'perna', equipment: 'kettlebell' },
  { id: 'ex-fedb-smith-single-leg-split-squat', name: 'Afundo búlgaro no Smith', muscleGroup: 'perna', equipment: 'máquina' },
  { id: 'ex-fedb-elevated-back-lunge', name: 'Afundo reverso elevado', muscleGroup: 'perna' },
  { id: 'ex-fedb-dumbbell-rear-lunge', name: 'Afundo reverso com halteres', muscleGroup: 'perna', equipment: 'halteres' },

  // Glúteo (importados)
  { id: 'ex-fedb-single-leg-glute-bridge', name: 'Ponte de glúteo unilateral', muscleGroup: 'gluteo' },
  { id: 'ex-fedb-physioball-hip-bridge', name: 'Ponte de glúteo na bola suíça', muscleGroup: 'gluteo', equipment: 'bola suíça' },
  { id: 'ex-fedb-floor-glute-ham-raise', name: 'Glute ham raise (posterior + glúteo)', muscleGroup: 'gluteo' },
  { id: 'ex-fedb-monster-walk', name: 'Caminhada lateral com elástico (monster walk)', muscleGroup: 'gluteo', equipment: 'elástico' },
  { id: 'ex-fedb-reverse-hyperextension', name: 'Hiperextensão reversa (glúteo/lombar)', muscleGroup: 'gluteo', equipment: 'máquina' },
  { id: 'ex-fedb-glute-kickback', name: 'Coice de glúteo (sem equipamento)', muscleGroup: 'gluteo' },

  // Abdômen (importados)
  { id: 'ex-fedb-3-4-sit-up', name: 'Abdominal 3/4', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-ab-roller', name: 'Roda abdominal', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-hanging-leg-raise', name: 'Elevação de pernas na barra fixa', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-reverse-crunch', name: 'Abdominal reverso', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-russian-twist', name: 'Giro russo (Russian twist)', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-weighted-crunches', name: 'Abdominal com peso', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-dead-bug', name: 'Dead bug (estabilização de core)', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-flutter-kicks', name: 'Tesoura de pernas (flutter kicks)', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-alternate-heel-touchers', name: 'Toque no calcanhar alternado', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-decline-crunch', name: 'Abdominal no banco declinado', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-exercise-ball-crunch', name: 'Abdominal na bola suíça', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-plate-twist', name: 'Rotação de tronco com anilha', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-oblique-crunches', name: 'Abdominal oblíquo', muscleGroup: 'abdomen' },
  { id: 'ex-fedb-cable-reverse-crunch', name: 'Abdominal reverso no cabo', muscleGroup: 'abdomen', equipment: 'cabo' },
  { id: 'ex-fedb-side-jackknife', name: 'Abdominal jackknife lateral', muscleGroup: 'abdomen' },

  // Cardio (importados)
  { id: 'ex-fedb-prowler-sprint', name: 'Prowler (empurrar trenó)', muscleGroup: 'cardio' },
  { id: 'ex-fedb-wind-sprints', name: 'Sprints (tiros de velocidade)', muscleGroup: 'cardio' },

  // Outro (importados)
  { id: 'ex-fedb-wrist-roller', name: 'Rolo de punho (wrist roller)', muscleGroup: 'outro' },
  { id: 'ex-fedb-seated-palm-up-barbell-wrist-curl', name: 'Rosca de punho sentado (pegada supinada) com barra', muscleGroup: 'outro', equipment: 'barra' },
  { id: 'ex-fedb-seated-palms-down-barbell-wrist-curl', name: 'Rosca de punho sentado (pegada pronada) com barra', muscleGroup: 'outro', equipment: 'barra' },
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
