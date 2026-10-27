// Programas de perda de gordura: modalidades variadas, volume sustentável e
// proposta clara. Exercício não substitui equilíbrio energético/alimentação.
import type { ReadyProgram, WeekStep } from './readyPrograms';

const off: WeekStep = {kind:'rest'};
const w = (index:number): WeekStep => ({kind:'workout',index});
const c = (label:string,distanceKm?:number): WeekStep => ({kind:'cardio',label,distanceKm});
const e = (id:string,sets:number,reps:string,notes?:string,restSeconds?:number) =>
  ({id,sets,reps,notes,restSeconds});

export const EXTRA_WEIGHT_LOSS_PROGRAMS: ReadyProgram[] = [
  {
    id: 'emag-esteira-inclinada-20',
    title: 'Esteira inclinada · Caminhada de 20 min',
    goal: 'emagrecimento',
    modality: 'corrida',
    split: 'unico',
    place: 'academia',
    level: 'iniciante',
    sessionMinutes: 20,
    cardioPresetId: 'esteira-inclinada-20-pos-treino',
    description: 'Caminhada na esteira dividida em 5 etapas de 4 minutos, com inclinação e velocidade progressivas. Pode ser feita sozinha ou após a musculação.',
    progression: 'Comece com inclinação e velocidade menores se as etapas estiverem difíceis. Aumente apenas quando conseguir manter o esforço controlado.',
    recoveryNote: 'Os números de inclinação são os da referência e dependem da escala da esteira. Não é preciso correr, nem completar o protocolo a qualquer custo.',
    days: [],
  },
  {
    id: 'emag-caminhada-corrida-base',
    title: 'Caminhada + corrida progressiva · Comece do zero',
    goal: 'emagrecimento', modality:'corrida', split:'ab', place:'ar_livre',
    level:'iniciante', sessionMinutes:30,
    description:'Três dias de caminhada/corrida confortável e duas sessões curtas de força. Boa opção para ganhar constância sem começar com tiros.',
    progression:'Inicie alternando 1 min de corrida leve e 2–3 min caminhando por 20 min, conforme tolerância; aumente o tempo correndo progressivamente.',
    recoveryNote:'O tempo caminhando conta como treino. Faça a parte aeróbica em ritmo que permita conversar.',
    days:[
      {name:'Base A · Força geral',emoji:'dumbbell',focus:'Força sem equipamento e técnica acessível',
       exercises:[e('ex-agachamento-livre',2,'10-12'),e('ex-flexao',2,'6-10','Adapte com apoio elevado, se necessário.'),e('ex-fedb-single-leg-glute-bridge',2,'8 cada lado'),e('ex-fedb-dead-bug',2,'8 cada lado')]},
      {name:'Base B · Estabilidade',emoji:'footprints',focus:'Membros inferiores e tronco',
       exercises:[e('ex-afundo',2,'8 cada perna'),e('ex-agachamento-sumo',2,'10'),e('ex-prancha',2,'20-30s'),e('ex-panturrilha-em-pe',2,'12')]},
    ],
    weekPlan:[c('Caminhada + corrida intercalada · 20 min'),w(0),c('Caminhada rápida · 25 min'),off,w(1),c('Caminhada/corrida leve · 25-30 min'),off],
  },
  {
    id:'emag-maquinas-iniciantes',
    title:'Academia para iniciantes · Máquinas + cardio',
    goal:'emagrecimento',modality:'forca',split:'abc',place:'academia',
    level:'iniciante',sessionMinutes:40,
    description:'Três dias de corpo inteiro em máquinas simples, com caminhada leve opcional. Prioriza aprender os exercícios e manter massa muscular.',
    progression:'Semanas 1–2: 2 séries confortáveis. Depois tente uma repetição a mais antes de aumentar a carga.',
    recoveryNote:'Ajuste máquinas com orientação presencial; evite treinar até falhar em todas as séries.',
    days:[
      {name:'Máquinas A · Corpo inteiro',emoji:'dumbbell',exercises:[
        e('ex-leg-press',2,'10-12'),e('ex-supino-maquina',2,'10-12'),e('ex-puxada-frente',2,'10-12'),e('ex-prancha',2,'20-30s')]},
      {name:'Máquinas B · Corpo inteiro',emoji:'footprints',exercises:[
        e('ex-mesa-flexora',2,'10-12'),e('ex-remada-baixa',2,'10-12'),e('ex-desenvolvimento-halter',2,'10-12'),e('ex-fedb-dead-bug',2,'10 cada lado')]},
      {name:'Máquinas C · Corpo inteiro',emoji:'activity',exercises:[
        e('ex-cadeira-extensora',2,'10-12'),e('ex-supino-maquina',2,'10-12'),e('ex-puxada-frente',2,'10-12'),e('ex-panturrilha-em-pe',2,'12-15')]},
    ],
    weekPlan:[w(0),c('Caminhada confortável · 20 min'),w(1),off,w(2),c('Cardio leve opcional · 20 min'),off],
  },
  {
    id:'emag-casa-sem-equip-20',
    title:'Em casa · 20 minutos e sem equipamentos',
    goal:'emagrecimento',modality:'casa',split:'abc',place:'peso_corporal',
    level:'iniciante',sessionMinutes:20,
    description:'Três sessões rápidas diferentes, sem saltos obrigatórios e sem halteres. Para quem prefere treinar em casa.',
    progression:'Comece com 2 séries e descanso adequado. Quando estiver fácil, avance uma série ou repetições, não a velocidade a qualquer custo.',
    recoveryNote:'Se não conseguir flexões no chão, use apoio elevado seguro. A opção de caminhar é independente.',
    days:[
      {name:'Casa 20 · Força A',emoji:'dumbbell',exercises:[
        e('ex-agachamento-livre',2,'12'),e('ex-flexao',2,'6-10'),e('ex-fedb-single-leg-glute-bridge',2,'8 cada lado'),e('ex-prancha',2,'20s')]},
      {name:'Casa 20 · Core e estabilidade',emoji:'shield',exercises:[
        e('ex-afundo',2,'8 cada lado'),e('ex-fedb-dead-bug',2,'8 cada lado'),e('ex-prancha-lateral',2,'20s cada lado'),e('ex-panturrilha-em-pe',2,'12')]},
      {name:'Casa 20 · Resistência leve',emoji:'activity',exercises:[
        e('ex-agachamento-sumo',2,'12'),e('ex-flexao',2,'6-10'),e('ex-fedb-glute-kickback',2,'10 cada lado'),e('ex-abdominal-bicicleta',2,'12')]},
    ],
    weekPlan:[w(0),c('Caminhada leve opcional · 20 min'),w(1),off,w(2),c('Caminhada leve opcional · 20 min'),off],
  },
  {
    id:'emag-halteres-casa',
    title:'Casa com halteres · Força e condicionamento',
    goal:'emagrecimento',modality:'forca',split:'ab',place:'casa_equipamento',
    level:'intermediario',sessionMinutes:35,
    description:'Dois treinos completos com halteres e dois dias opcionais de caminhada ou corrida fácil.',
    progression:'Priorize completar repetições com boa técnica; aumente gradualmente a carga antes de acrescentar novas sessões.',
    recoveryNote:'Requer halteres. Exercícios de peito no solo substituem a necessidade de banco.',
    days:[
      {name:'Halteres A · Força geral',emoji:'dumbbell',exercises:[
        e('ex-fedb-goblet-squat',3,'8-12'),e('ex-remada-unilateral',3,'10 cada lado'),
        e('ex-flexao',2,'8-12'),e('ex-stiff-halter',2,'10'),e('ex-fedb-dead-bug',2,'10 cada lado')]},
      {name:'Halteres B · Força geral',emoji:'footprints',exercises:[
        e('ex-afundo',3,'8 cada perna'),e('ex-desenvolvimento-halter',3,'8-12'),
        e('ex-remada-unilateral',2,'10 cada lado'),e('ex-agachamento-sumo',2,'12'),e('ex-prancha-lateral',2,'20s')]},
    ],
    weekPlan:[w(0),c('Corrida ou caminhada leve · 20-30 min'),off,w(1),off,c('Cardio fácil · 20 min'),off],
  },
  {
    id:'emag-corrida-forca-hibrida',
    title:'Corrida + musculação · 5 dias equilibrados',
    goal:'emagrecimento',modality:'hibrido',split:'abc',place:'misto',
    level:'intermediario',sessionMinutes:45,
    description:'Três sessões de força, duas corridas leves/moderadas e descanso. Combina desempenho aeróbico e manutenção da força.',
    progression:'Progrida primeiro a constância. Ajuste a corrida pela capacidade de conversar e a musculação pela técnica e recuperação.',
    recoveryNote:'Se estiver começando, use somente 2 sessões de força e 1 de cardio nas primeiras semanas.',
    days:[
      {name:'Híbrido A · Superior',emoji:'dumbbell',exercises:[
        e('ex-supino-reto-halter',3,'8-12'),e('ex-remada-baixa',3,'10-12'),e('ex-desenvolvimento-halter',2,'10'),e('ex-puxada-frente',2,'10-12'),e('ex-prancha',2,'30s')]},
      {name:'Híbrido B · Inferior',emoji:'footprints',exercises:[
        e('ex-leg-press',3,'10'),e('ex-mesa-flexora',3,'10-12'),e('ex-afundo',2,'8 cada perna'),e('ex-panturrilha-em-pe',2,'12-15')]},
      {name:'Híbrido C · Corpo inteiro',emoji:'activity',exercises:[
        e('ex-agachamento-livre',2,'8-10'),e('ex-supino-maquina',2,'10'),e('ex-remada-unilateral',2,'10 cada lado'),e('ex-fedb-dead-bug',2,'10 cada lado')]},
    ],
    weekPlan:[w(0),c('Corrida confortável · 20-30 min'),w(1),off,w(2),c('Corrida fácil · 30-40 min'),off],
  },
  {
    id:'emag-baixo-impacto',
    title:'Baixo impacto · Fortalecimento + caminhada',
    goal:'emagrecimento',modality:'casa',split:'ab',place:'peso_corporal',
    level:'iniciante',sessionMinutes:25,
    description:'Sessões sem saltos e com movimentos controlados, combinadas com caminhada. Para quem prefere reduzir impactos.',
    progression:'Aumente o tempo de caminhada e as repetições aos poucos; use amplitudes confortáveis.',
    recoveryNote:'“Baixo impacto” não significa adequado a toda lesão. Ajuste com profissional em caso de dor ou limitação.',
    days:[
      {name:'Baixo impacto A · Base',emoji:'footprints',exercises:[
        e('ex-agachamento-livre',2,'8-12','Use apoio seguro se precisar.'),
        e('ex-fedb-single-leg-glute-bridge',2,'8 cada lado'),
        e('ex-prancha',2,'15-25s'),e('ex-panturrilha-em-pe',2,'12')]},
      {name:'Baixo impacto B · Controle',emoji:'shield',exercises:[
        e('ex-agachamento-sumo',2,'10'),e('ex-flexao',2,'6-10','Pode usar uma parede para reduzir dificuldade.'),
        e('ex-fedb-dead-bug',2,'8 cada lado'),e('ex-prancha-lateral',2,'15s cada lado')]},
    ],
    weekPlan:[c('Caminhada leve · 15-25 min'),w(0),off,c('Caminhada leve · 20 min'),w(1),c('Passeio ou caminhada fácil opcional'),off],
  },
  {
    id:'emag-quatro-dias-forca-cardio',
    title:'4 dias de musculação + cardio opcional',
    goal:'emagrecimento',modality:'hibrido',split:'abcd',place:'academia',
    level:'intermediario',sessionMinutes:50,
    description:'Divisão superior/inferior repetida duas vezes na semana, com cardio independente. Para quem gosta de musculação tradicional.',
    progression:'Acompanhe cargas nos movimentos principais por 4–6 semanas antes de substituir exercícios. Cardio é complementar, não obrigatório.',
    recoveryNote:'Respeite um intervalo entre treinos pesados de pernas. Não some programas completos de alto volume.',
    days:[
      {name:'Quatro dias A · Superior 1',emoji:'dumbbell',exercises:[
        e('ex-supino-inclinado-halter',3,'8-12'),e('ex-puxada-frente',3,'8-12'),e('ex-desenvolvimento-halter',2,'10'),e('ex-remada-baixa',2,'10-12')]},
      {name:'Quatro dias B · Inferior 1',emoji:'footprints',exercises:[
        e('ex-leg-press',3,'10'),e('ex-mesa-flexora',3,'10'),e('ex-afundo',2,'8 cada perna'),e('ex-panturrilha-em-pe',2,'15')]},
      {name:'Quatro dias C · Superior 2',emoji:'dumbbell',exercises:[
        e('ex-supino-reto-halter',3,'10'),e('ex-remada-unilateral',3,'10 cada lado'),e('ex-elevacao-lateral',2,'12-15'),e('ex-triceps-pulley',2,'10-12')]},
      {name:'Quatro dias D · Inferior 2',emoji:'footprints',exercises:[
        e('ex-agachamento-livre',3,'8-10'),e('ex-stiff-halter',3,'10'),e('ex-cadeira-extensora',2,'12'),e('ex-fedb-dead-bug',2,'10 cada lado')]},
    ],
    weekPlan:[w(0),w(1),c('Esteira/caminhada confortável · 15-20 min (opcional)'),w(2),w(3),off,off],
  },
];
