/** Catálogo curado: fotografias de duas poses do exercício correspondente.
 * Não usar sem correspondência de variação/equipamento. Origem:
 * https://github.com/yuhonas/free-exercise-db
 * O arquivo e a variante foram conferidos por nome; revisão biomecânica visual
 * independente ainda é necessária antes de declarar validação técnica plena.
 */
export const EXPANDED_EXECUTION_MEDIA_IDS: Record<string,string> = {
  'ex-gluteo-cabo': 'One-Legged_Cable_Kickback', // Glúteo no cabo (coice)
  'ex-abducao-quadril': 'Thigh_Abductor', // Abdução de quadril (máquina)
  'ex-fedb-single-leg-glute-bridge': 'Single_Leg_Glute_Bridge', // Ponte de glúteo unilateral
  'ex-fedb-physioball-hip-bridge': 'Physioball_Hip_Bridge', // Ponte de glúteo na bola suíça
  'ex-fedb-floor-glute-ham-raise': 'Floor_Glute-Ham_Raise', // Glute ham raise (posterior + glúteo)
  'ex-fedb-monster-walk': 'Monster_Walk', // Caminhada lateral com elástico (monster walk)
  'ex-fedb-reverse-hyperextension': 'Reverse_Hyperextension', // Hiperextensão reversa (glúteo/lombar)
  'ex-fedb-glute-kickback': 'Glute_Kickback', // Coice de glúteo (sem equipamento)
  'ex-new-pullthroughnocabo': 'Pull_Through', // Pull through no cabo
  'ex-new-passadaparatrascomhalteres': 'Dumbbell_Rear_Lunge', // Passada para trás com halteres
  'ex-agachamento-frontal': 'Front_Barbell_Squat', // Agachamento frontal
  'ex-stiff-halter': 'Stiff-Legged_Dumbbell_Deadlift', // Stiff com halteres
  'ex-cadeira-adutora': 'Thigh_Adductor', // Cadeira adutora
  'ex-panturrilha-leg-press': 'Calf_Press_On_The_Leg_Press_Machine', // Panturrilha no leg press
  'ex-fedb-goblet-squat': 'Goblet_Squat', // Agachamento goblet
  'ex-fedb-weighted-sissy-squat': 'Weighted_Sissy_Squat', // Sissy squat
  'ex-fedb-zercher-squats': 'Zercher_Squats', // Agachamento zercher
  'ex-fedb-narrow-stance-leg-press': 'Narrow_Stance_Leg_Press', // Leg press pés fechados
  'ex-fedb-single-leg-leg-extension': 'Single-Leg_Leg_Extension', // Cadeira extensora unilateral
  'ex-fedb-standing-leg-curl': 'Standing_Leg_Curl', // Flexora em pé
  'ex-fedb-plie-dumbbell-squat': 'Plie_Dumbbell_Squat', // Agachamento plié com halter
  'ex-fedb-donkey-calf-raises': 'Donkey_Calf_Raises', // Panturrilha burro (donkey calf raise)
  'ex-fedb-freehand-jump-squat': 'Freehand_Jump_Squat', // Agachamento com salto (jump squat)
  'ex-fedb-wide-stance-barbell-squat': 'Wide_Stance_Barbell_Squat', // Agachamento pés afastados com barra
  'ex-fedb-narrow-stance-squats': 'Narrow_Stance_Squats', // Agachamento pés fechados com barra
  'ex-fedb-one-leg-barbell-squat': 'One_Leg_Barbell_Squat', // Agachamento unilateral com barra
  'ex-fedb-kettlebell-pistol-squat': 'Kettlebell_Pistol_Squat', // Agachamento pistol com kettlebell
  'ex-fedb-smith-single-leg-split-squat': 'Smith_Single-Leg_Split_Squat', // Afundo búlgaro no Smith
  'ex-fedb-elevated-back-lunge': 'Elevated_Back_Lunge', // Afundo reverso elevado
  'ex-fedb-dumbbell-rear-lunge': 'Dumbbell_Rear_Lunge', // Afundo reverso com halteres
  'ex-new-agachamentocaixa': 'Box_Squat', // Agachamento caixa
  'ex-new-agachamentocomsalto': 'Freehand_Jump_Squat', // Agachamento com salto
  'ex-puxada-supinada': 'Underhand_Cable_Pulldowns', // Puxada supinada (pegada inversa)
  'ex-fedb-wide-grip-lat-pulldown': 'Wide-Grip_Lat_Pulldown', // Puxada aberta
  'ex-fedb-close-grip-front-lat-pulldown': 'Close-Grip_Front_Lat_Pulldown', // Puxada fechada por frente
  'ex-fedb-one-arm-lat-pulldown': 'One_Arm_Lat_Pulldown', // Puxada unilateral
  'ex-fedb-straight-arm-pulldown': 'Straight-Arm_Pulldown', // Puxada com braços estendidos (pull-over no cabo)
  'ex-fedb-inverted-row': 'Inverted_Row', // Remada invertida
  'ex-fedb-smith-machine-bent-over-row': 'Smith_Machine_Bent_Over_Row', // Remada curvada no Smith
  'ex-fedb-trap-bar-deadlift': 'Trap_Bar_Deadlift', // Levantamento terra com trap bar
  'ex-fedb-reverse-grip-bent-over-rows': 'Reverse_Grip_Bent-Over_Rows', // Remada curvada pegada supinada
  'ex-fedb-wide-grip-rear-pull-up': 'Wide-Grip_Rear_Pull-Up', // Barra fixa pegada aberta atrás da nuca
  'ex-fedb-barbell-shrug-behind-the-back': 'Barbell_Shrug_Behind_The_Back', // Encolhimento atrás do corpo com barra
  'ex-fedb-elevated-cable-rows': 'Elevated_Cable_Rows', // Remada elevada no cabo
  'ex-fedb-lying-t-bar-row': 'Lying_T-Bar_Row', // Remada cavalinho deitado
  'ex-fedb-scapular-pull-up': 'Scapular_Pull-Up', // Barra fixa escapular
  'ex-fedb-seated-one-arm-cable-pulley-rows': 'Seated_One-arm_Cable_Pulley_Rows', // Remada unilateral no cabo sentado
  'ex-fedb-leverage-high-row': 'Leverage_High_Row', // Remada alta na máquina articulada
  'ex-fedb-rope-straight-arm-pulldown': 'Rope_Straight-Arm_Pulldown', // Puxada de braços retos na corda
  'ex-fedb-v-bar-pulldown': 'V-Bar_Pulldown', // Puxada triângulo (V-bar)
  'ex-new-remadacompeitoapoiadonobanco': 'Dumbbell_Incline_Row', // Remada com peito apoiado no banco
  'ex-new-remadaaustraliananotrx': 'Inverted_Row_with_Straps', // Remada australiana no TRX
  'ex-new-remadatbarcomapoiodepeito': 'Lying_T-Bar_Row', // Remada T-Bar com apoio de peito
  'ex-new-remadarenegade': 'Alternating_Renegade_Row', // Remada renegade
  'ex-supino-reto-barra': 'Barbell_Bench_Press_-_Medium_Grip', // Supino reto com barra
  'ex-supino-inclinado-barra': 'Barbell_Incline_Bench_Press_-_Medium_Grip', // Supino inclinado com barra
  'ex-supino-declinado-barra': 'Decline_Barbell_Bench_Press', // Supino declinado com barra
  'ex-supino-maquina': 'Machine_Bench_Press', // Supino máquina
  'ex-fedb-decline-dumbbell-bench-press': 'Decline_Dumbbell_Bench_Press', // Supino declinado com halteres
  'ex-fedb-decline-dumbbell-flyes': 'Decline_Dumbbell_Flyes', // Crucifixo declinado com halteres
  'ex-fedb-incline-dumbbell-flyes': 'Incline_Dumbbell_Flyes', // Crucifixo inclinado com halteres
  'ex-fedb-incline-cable-flye': 'Incline_Cable_Flye', // Crucifixo inclinado no cabo
  'ex-fedb-flat-bench-cable-flyes': 'Flat_Bench_Cable_Flyes', // Crucifixo reto no cabo
  'ex-fedb-one-arm-dumbbell-bench-press': 'One_Arm_Dumbbell_Bench_Press', // Supino unilateral com halter
  'ex-fedb-wide-grip-barbell-bench-press': 'Wide-Grip_Barbell_Bench_Press', // Supino reto pegada aberta com barra
  'ex-fedb-svend-press': 'Svend_Press', // Svend press (compressão de anilha)
  'ex-fedb-smith-machine-bench-press': 'Smith_Machine_Bench_Press', // Supino reto no Smith
  'ex-fedb-smith-machine-incline-bench-press': 'Smith_Machine_Incline_Bench_Press', // Supino inclinado no Smith
  'ex-fedb-smith-machine-decline-press': 'Smith_Machine_Decline_Press', // Supino declinado no Smith
  'ex-fedb-dumbbell-bench-press-with-neutral-grip': 'Dumbbell_Bench_Press_with_Neutral_Grip', // Supino com halteres (pegada neutra)
  'ex-fedb-cable-chest-press': 'Cable_Chest_Press', // Supino no cabo
  'ex-fedb-push-ups-with-feet-elevated': 'Push-Ups_With_Feet_Elevated', // Flexão com pés elevados
  'ex-fedb-incline-dumbbell-bench-with-palms-facing-in': 'Incline_Dumbbell_Bench_With_Palms_Facing_In', // Supino inclinado pegada neutra com halteres
  'ex-fedb-push-up-wide': 'Push-Up_Wide', // Flexão aberta
  'ex-fedb-leverage-chest-press': 'Leverage_Chest_Press', // Supino na máquina articulada (leverage)
  'ex-fedb-decline-push-up': 'Decline_Push-Up', // Flexão declinada
  'ex-new-supinocompegadafechada': 'Close-Grip_Barbell_Bench_Press', // Supino com pegada fechada
  'ex-new-flexaocommaoselevadas': 'Incline_Push-Up', // Flexão com mãos elevadas
  'ex-new-crucifixounilateralnocabo': 'Single-Arm_Cable_Crossover', // Crucifixo unilateral no cabo
  'ex-new-pressdepeitonapoliaempe': 'Standing_Cable_Chest_Press', // Press de peito na polia em pé
  'ex-new-flexaonotrx': 'Suspended_Push-Up', // Flexão no TRX
};
