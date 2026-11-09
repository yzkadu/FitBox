/** Segunda rodada de correspondências identificadas no acervo público.
 * Todas as entradas são IDs existentes no catálogo do FitBox e no JSON da
 * biblioteca de imagens, com referências a 0.jpg e 1.jpg. A correspondência
 * ainda exige inspeção visual independente de técnica e equipamento.
 * Fonte: https://github.com/yuhonas/free-exercise-db
 */
export const ROUND_TWO_EXERCISE_MEDIA_IDS: Record<string,string> = {
  'ex-supino-inclinado-maquina': 'Leverage_Incline_Chest_Press',
  'ex-remada-maquina': 'Leverage_Iso_Row',
  'ex-desenvolvimento-maquina': 'Machine_Shoulder_Military_Press',
  'ex-elevacao-frontal-barra': 'Standing_Front_Barbell_Raise_Over_Head',
  'ex-remada-alta': 'Upright_Barbell_Row',
  'ex-remada-alta-cabo': 'Upright_Cable_Row',
  'ex-crucifixo-inverso-maquina': 'Reverse_Machine_Flyes',
  'ex-rosca-direta-w': 'EZ-Bar_Curl',
  'ex-rosca-alternada': 'Dumbbell_Alternate_Bicep_Curl',
  'ex-rosca-scott-maquina': 'Machine_Preacher_Curls',
  'ex-triceps-maquina': 'Machine_Triceps_Extension',
  'ex-afundo': 'Bodyweight_Walking_Lunge',
  'ex-rotacao-tronco-cabo': 'Standing_Cable_Wood_Chop',
  'ex-new-crucifixounilateralnocabo': 'Single-Arm_Cable_Crossover',
  'ex-new-pulldownnapoliacomcorda': 'Rope_Straight-Arm_Pulldown',
  'ex-new-remadaaltaparacostascomcorda': 'Cable_Rope_Rear-Delt_Rows',
  'ex-new-scaptioncomhalteres': 'Dumbbell_Scaption',
  'ex-new-elevacaolateralinclinado': 'One-Arm_Incline_Lateral_Raise',
  'ex-new-elevacaofrontalunilateralnocabo': 'Front_Cable_Raise',
  'ex-new-roscainversanocabo': 'Reverse_Cable_Curl',
  'ex-new-extensaoacimadacabecaunilateral': 'Dumbbell_One-Arm_Triceps_Extension',
  'ex-new-supinofechadocomhalteres': 'Close-Grip_Dumbbell_Press',
  'ex-new-extensaodequadrilemquatroapoios': 'Glute_Kickback',
  'ex-new-hipthrustunilateral': 'Single_Leg_Glute_Bridge',
  'ex-new-elevacaodejoelhosnabarra': 'Hanging_Leg_Raise',
  'ex-new-corridaintervaladanaesteira': 'Jogging_Treadmill',
  'ex-new-tricepsemargolas': 'Ring_Dips',
};
