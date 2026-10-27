import type { Exercise } from '../types';

/** Correspondências CONFERIDAS de exercício com fotos de duas fases no
 * projeto livre yuhonas/free-exercise-db. Não inferir URLs apenas pelo nome:
 * certos arquivos não existem ou retratam outro movimento.
 * Fotografias são demonstrativas, não modelos biomecânicos infalíveis.
 */
export const VERIFIED_MEDIA_IDS: Record<string, string> = {
  'ex-supino-reto-halter': 'Dumbbell_Bench_Press',
  'ex-supino-inclinado-halter': 'Incline_Dumbbell_Press',
  'ex-crucifixo-halter': 'Dumbbell_Flyes',
  'ex-flexao': 'Pushups',
  'ex-crossover': 'Cable_Crossover',
  'ex-voador-peck-deck': 'Butterfly',
  'ex-puxada-frente': 'Wide-Grip_Lat_Pulldown',
  'ex-remada-curvada': 'Bent_Over_Barbell_Row',
  'ex-remada-cavalinho': 'T-Bar_Row_with_Handle',
  'ex-remada-baixa': 'Seated_Cable_Rows',
  'ex-remada-unilateral': 'One-Arm_Dumbbell_Row',
  'ex-barra-fixa': 'Pullups',
  'ex-levantamento-terra': 'Barbell_Deadlift',
  'ex-levantamento-terra-romeno': 'Romanian_Deadlift',
  'ex-desenvolvimento-militar': 'Standing_Military_Press',
  'ex-desenvolvimento-halter': 'Dumbbell_Shoulder_Press',
  'ex-desenvolvimento-arnold': 'Arnold_Dumbbell_Press',
  'ex-elevacao-lateral': 'Side_Lateral_Raise',
  'ex-elevacao-frontal': 'Front_Dumbbell_Raise',
  'ex-fedb-face-pull': 'Face_Pull',
  'ex-rosca-direta': 'Barbell_Curl',
  'ex-rosca-martelo': 'Alternate_Hammer_Curl',
  'ex-rosca-scott': 'Preacher_Curl',
  'ex-rosca-concentrada': 'Concentration_Curls',
  'ex-rosca-cabo': 'Standing_Biceps_Cable_Curl',
  'ex-fedb-incline-dumbbell-curl': 'Incline_Dumbbell_Curl',
  'ex-triceps-pulley-barra': 'Triceps_Pushdown',
  'ex-triceps-testa': 'Lying_Triceps_Press',
  'ex-triceps-frances': 'Standing_Dumbbell_Triceps_Extension',
  'ex-triceps-coice': 'Tricep_Dumbbell_Kickback',
  'ex-mergulho-banco': 'Bench_Dips',
  'ex-mergulho-paralelas': 'Dips_-_Triceps_Version',
  'ex-agachamento-livre': 'Barbell_Squat',
  'ex-agachamento-smith': 'Smith_Machine_Squat',
  'ex-agachamento-bulgaro': 'Split_Squat_with_Dumbbells',
  'ex-leg-press': 'Leg_Press',
  'ex-cadeira-extensora': 'Leg_Extensions',
  'ex-mesa-flexora': 'Lying_Leg_Curls',
  'ex-cadeira-flexora': 'Seated_Leg_Curl',
  'ex-stiff-barra': 'Stiff-Legged_Barbell_Deadlift',
  'ex-panturrilha-em-pe': 'Standing_Calf_Raises',
  'ex-panturrilha-sentado': 'Seated_Calf_Raise',
  'ex-elevacao-pelvica': 'Barbell_Hip_Thrust',
  'ex-abdominal-supra': 'Crunches',
  'ex-prancha': 'Plank',
  'ex-abdominal-bicicleta': 'Air_Bike',
  'ex-elevacao-pernas': 'Hanging_Leg_Raise',
  'ex-abdominal-cabo': 'Cable_Crunch',
  'ex-fedb-dead-bug': 'Dead_Bug',
  'ex-fedb-plate-twist': 'Russian_Twist',
  'ex-esteira': 'Running_Treadmill',
  'ex-eliptico': 'Elliptical_Trainer',
  'ex-remo-ergometrico': 'Rowing_Stationary',
  'ex-hyrox-sled-push': 'Sled_Push',
  'ex-hyrox-farmers': 'Farmers_Walk',
  'ex-new-roscamarteloalternada': 'Alternate_Hammer_Curl',
  'ex-new-abwheelajoelhado': 'Ab_Roller',
  'ex-new-roscanobancoinclinado': 'Incline_Dumbbell_Curl',
  'ex-new-extensaodepunhos': 'Seated_Dumbbell_Palms-Down_Wrist_Curl',
  'ex-new-roscapunhoreversa': 'Barbell_Curl',
  'ex-new-pallofpress': 'Pallof_Press',
  'ex-new-deadbugalternado': 'Dead_Bug',
  'ex-new-sledpushtecnico': 'Sled_Push',
  'ex-new-flexaocomtoquenoombro': 'Pushups',
  'ex-new-russiantwistcomanilha': 'Russian_Twist',
  'ex-new-agachamentocomminiband': 'Bodyweight_Squat',
};

const STEPS: Record<string, readonly [string, string, string]> = {
  'ex-supino-reto-halter': ["Ajuste os pés no chão e estabilize escápulas no banco.","Desça os halteres de forma controlada e empurre sem bater um no outro.","Não force os ombros além da amplitude confortável."],
  'ex-supino-inclinado-halter': ["Ajuste o banco a uma inclinação moderada e mantenha os pés apoiados.","Desça com controle e empurre os halteres, sem compensar com a lombar.","Evite inclinação muito alta, que desloca o foco para os ombros."],
  'ex-flexao': ["Mantenha mãos firmes no solo e tronco alinhado.","Flexione cotovelos com controle, aproximando o peito do chão.","Evite deixar a lombar afundar; adapte a inclinação se necessário."],
  'ex-puxada-frente': ["Ajuste o apoio das pernas e segure a barra com pegada confortável.","Puxe na direção da parte superior do peito e retorne devagar.","Evite puxar a barra atrás da nuca ou inclinar o tronco excessivamente."],
  'ex-remada-unilateral': ["Apoie uma mão e o joelho oposto, mantendo coluna neutra.","Puxe o halter perto da lateral do tronco e retorne com controle.","Evite girar o corpo para levantar mais peso."],
  'ex-barra-fixa': ["Comece com pegada firme e escápulas ativas.","Puxe o corpo sem impulsionar excessivamente; desça controladamente.","Use máquina/elástico de assistência quando necessário."],
  'ex-desenvolvimento-halter': ["Sente com apoio firme e halteres na altura dos ombros.","Empurre para cima dentro da amplitude confortável e retorne devagar.","Evite arquear demais a lombar."],
  'ex-elevacao-lateral': ["Cotovelos ligeiramente flexionados e ombros relaxados.","Eleve os braços lateralmente sem balançar o tronco.","Use carga que permita controlar a descida."],
  'ex-rosca-direta': ["Mantenha os cotovelos próximos ao corpo.","Flexione os cotovelos elevando a barra e desça com controle.","Evite usar o balanço do tronco."],
  'ex-rosca-martelo': ["Mantenha a pegada neutra, palmas voltadas entre si.","Suba sem mover os ombros e desça lentamente.","Evite projetar os cotovelos para frente."],
  'ex-triceps-testa': ["Deite com estabilidade no banco e mantenha braços controlados.","Flexione os cotovelos trazendo a carga com segurança e estenda.","Comece com carga leve e não force cotovelos doloridos."],
  'ex-agachamento-livre': ["Ajuste a base dos pés e apoie a barra de forma estável.","Agache na amplitude que mantém controle de tronco e joelhos.","Use proteção/suporte e técnica supervisionada para cargas altas."],
  'ex-leg-press': ["Ajuste banco e posição dos pés para permitir amplitude confortável.","Empurre a plataforma sem travar os joelhos e desça controladamente.","Não deixe o quadril perder contato com o encosto."],
  'ex-cadeira-extensora': ["Ajuste eixo da máquina na altura do joelho.","Estenda os joelhos com controle e retorne sem bater os pesos.","Evite amplitude que provoque dor no joelho."],
  'ex-mesa-flexora': ["Ajuste os rolos da máquina à altura apropriada.","Flexione os joelhos sem tirar o quadril do apoio e retorne devagar.","Não balance o corpo para vencer a carga."],
  'ex-prancha': ["Apoie os antebraços abaixo dos ombros.","Mantenha quadril e tronco alinhados enquanto respira.","Interrompa se perder a estabilidade ou houver dor."],
  'ex-elevacao-pernas': ["Segure a barra de modo estável e controle o tronco.","Eleve os joelhos ou as pernas sem embalo.","Escolha a variante que permite controle lombar."],
  'ex-hyrox-sled-push': ["Use carga leve para aprender a inclinação e a posição das mãos.","Empurre o trenó com passadas curtas e estáveis.","Confira espaço livre e evite pisos inadequados."],
  'ex-new-abwheelajoelhado': ["Ajoelhe sobre superfície confortável com as mãos na roda.","Role para frente dentro da amplitude que mantém o tronco firme.","Evite arquear a lombar no retorno."],
  'ex-esteira': ["Comece caminhando para encontrar seu ritmo.","Aumente gradualmente a velocidade ou a inclinação, sem necessidade de sprint.","Diminua a velocidade antes de sair da esteira."],
};

export const MOVEMENT_GROUP_LABELS: Record<string,string> = {
  "peito": "Empurrar / aduzir os braços",
  "costas": "Puxar / estabilizar escápulas",
  "ombro": "Elevar / estabilizar ombros",
  "biceps": "Flexionar cotovelos",
  "triceps": "Estender cotovelos",
  "perna": "Movimentos de membros inferiores",
  "gluteo": "Extensão / abdução de quadril",
  "abdomen": "Estabilizar e movimentar tronco",
  "cardio": "Condicionamento cardiorrespiratório",
  "outro": "Mobilidade / exercícios complementares"
};

export function exerciseMedia(exercise?: Exercise | null) {
  const id = exercise?.id ? VERIFIED_MEDIA_IDS[exercise.id] : undefined;
  if (!id) return null;
  const base = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  return { first: base + encodeURIComponent(id) + '/0.jpg', second: base + encodeURIComponent(id) + '/1.jpg', sourceId: id };
}

export function exerciseGuidance(exercise?: Exercise | null): readonly string[] | null {
  return exercise?.id ? STEPS[exercise.id] ?? null : null;
}
