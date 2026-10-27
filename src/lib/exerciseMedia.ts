import type { Exercise } from '../types';
import { HYROX_MEDIA, HYROX_EXPECTED_EXERCISES } from './hyroxMedia';

/** Correspondências selecionadas e verificadas por ID de exercício com duas poses no
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
  'ex-abdominal-cabo': 'Cable_Crunch',
  'ex-fedb-dead-bug': 'Dead_Bug',
  'ex-esteira': 'Running_Treadmill',
  'ex-eliptico': 'Elliptical_Trainer',
  'ex-remo-ergometrico': 'Rowing_Stationary',
  'ex-new-remoergometricointervalado': 'Rowing_Stationary',
  'ex-hyrox-sled-push': 'Sled_Push',
  'ex-hyrox-farmers': 'Farmers_Walk',
  'ex-new-roscamarteloalternada': 'Alternate_Hammer_Curl',
  'ex-new-abwheelajoelhado': 'Ab_Roller',
  'ex-new-roscanobancoinclinado': 'Incline_Dumbbell_Curl',
  'ex-new-pallofpress': 'Pallof_Press',
  'ex-new-deadbugalternado': 'Dead_Bug',
  'ex-new-sledpushtecnico': 'Sled_Push',
  'ex-new-russiantwistcomanilha': 'Russian_Twist',
};

const STEPS: Record<string, readonly [string, string, string]> = {
  'ex-hyrox-ski': ['Fique de frente ao SkiErg, braços altos e tronco alinhado.', 'Puxe as duas alças para baixo, usando o quadril e o tronco, sem se jogar para trás.', 'Retorne de modo controlado; procure uma cadência sustentável.'],
  'ex-new-skiergintervalado': ['Ajuste a resistência para manter técnica e ritmo estáveis.', 'Puxe as alças para baixo coordenando braços, tronco e quadril.', 'Recupere a posição inicial sem elevar os ombros excessivamente.'],
  'ex-hyrox-sled-pull': ['Fique na zona marcada, segure a corda com as duas mãos e posicione os pés com estabilidade.', 'Puxe a corda mão sobre mão, usando tronco e pernas sem perder o controle do corpo.', 'Evite deixar a corda se enrolar nos pés; não avance para fora da zona de puxada.'],
  'ex-hyrox-burpee': ['Apoie as mãos no chão e leve o tronco ao solo em um burpee controlado.', 'Volte à posição de pé e realize um salto horizontal para frente.', 'Aterre com os joelhos flexionados e repita no próprio ritmo; reduza distância quando necessário.'],
  'ex-new-burpeebroadjump': ['Desça ao solo em um burpee com controle.', 'Levante-se e salte à frente com os dois pés.', 'Aterre suavemente e reinicie o próximo burpee sem pressa.'],
  'ex-hyrox-sandbag': ['Apoie o sandbag horizontalmente na parte superior das costas, sem apoiar sobre o pescoço.', 'Dê uma passada e flexione os joelhos em amplitude confortável, mantendo controle do tronco.', 'Avance com a outra perna; não torça o tronco para compensar o peso.'],
  'ex-hyrox-wall-ball': ['Segure a bola perto do peito, com os pés estáveis e o alvo à frente.', 'Agache dentro da sua amplitude segura e levante coordenando a extensão do quadril.', 'Use o impulso das pernas para arremessar ao alvo; receba a bola controladamente.'],
  'ex-hyrox-farmers': ['Segure um kettlebell em cada mão, com as alças firmes.', 'Caminhe ereto, mantendo braços ao lado do corpo e passos estáveis.', 'Evite inclinar o tronco ou deixar as cargas balançarem.'],
  'ex-new-farmercarryunilateral': ['Segure o kettlebell em apenas uma mão, com o braço ao lado do corpo.', 'Caminhe com passos controlados e o tronco alinhado, sem inclinar para o lado.', 'Troque de lado conforme sua prescrição e mantenha distância segura de outras pessoas.'],
  'ex-remo-ergometrico': ['Ajuste os apoios dos pés e segure a barra com a coluna neutra.', 'Inicie empurrando com as pernas, depois abra o quadril e puxe com os braços.', 'Retorne estendendo braços e flexionando pernas progressivamente, sem puxões bruscos.'],
  'ex-new-remoergometricointervalado': ['Fixe os pés e ajuste uma resistência em que controle a técnica.', 'Empurre com pernas, estenda o quadril e complete a puxada com braços.', 'Retorne suavemente antes do próximo ciclo; mantenha o mesmo padrão também nos intervalos fortes.'],
  'ex-new-sledpushtecnico': ['Apoie as mãos nas alças do trenó, mantendo os braços estáveis.', 'Incline o tronco e empurre com passadas curtas e contínuas.', 'Treine primeiro com carga leve e espaço desobstruído.'],

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

export interface ExerciseMediaResult {
  first: string;
  second?: string;
  sourceId: string;
  kind: 'foto';
  credit: string;
  sourceUrl?: string;
}
export function exerciseMedia(exercise?: Exercise | null): ExerciseMediaResult | null {
  const exerciseId = exercise?.id;
  if (!exerciseId) return null;
  const curated = HYROX_MEDIA[exerciseId];
  if (curated) return curated;
  const id = VERIFIED_MEDIA_IDS[exerciseId];
  if (!id) return null;
  const base = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  return {
    first: base + encodeURIComponent(id) + '/0.jpg',
    second: base + encodeURIComponent(id) + '/1.jpg',
    sourceId: id,
    kind: 'foto',
    credit: 'free-exercise-db (fotografias do acervo público)',
  };
}
export function getHyroxMediaCoverage() {
  return HYROX_EXPECTED_EXERCISES.map(id => ({id, photoAvailable: Boolean(HYROX_MEDIA[id] || VERIFIED_MEDIA_IDS[id])}));
}

export function exerciseGuidance(exercise?: Exercise | null): readonly string[] | null {
  return exercise?.id ? STEPS[exercise.id] ?? null : null;
}
