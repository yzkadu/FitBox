// Vercel Edge Function — proxy seguro para o Personal Trainer virtual v2 (IA
// generativa). A chave da Anthropic (ANTHROPIC_API_KEY) fica só aqui, como
// variável de ambiente do Vercel — nunca é exposta no código do navegador.
//
// Protegido por autenticação: só responde se o header Authorization trouxer
// um access token válido de uma conta logada no Supabase do FitBox (mesmo
// projeto usado pelo resto do app). Isso evita que alguém de fora, achando a
// URL, fique consumindo os créditos da chave da Anthropic.

export const config = { runtime: 'edge' };

// Mesmas chaves públicas usadas em src/lib/supabaseClient.ts — a "publishable
// key" do Supabase é segura para expor, a proteção real é a validação do
// token de sessão abaixo.
const SUPABASE_URL = 'https://jeeqklhckuwcgqygadpu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vc9GJoZnx8Em3Ou_8k-1Rg_V63uIt8F';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1000;
const MAX_QUESTION_LEN = 1500;
const MAX_CONTEXT_LEN = 12000;
const MAX_HISTORY_MESSAGES = 12;

const SYSTEM_PREFIX = `Você é o Personal Trainer virtual do app FitBox. Responda sempre em
português do Brasil, em tom direto, cordial e prático — como um personal
trainer de verdade conversando com o aluno pelo WhatsApp, sem embromação.

Regras importantes:
- Use APENAS os dados fornecidos abaixo (histórico de treino, séries, cargas,
  peso, meta, agenda, treinos cadastrados). Nunca invente números, datas ou
  ids que não estejam nos dados.
- Se faltar dado pra responder algo com confiança, diga isso claramente em vez
  de supor.
- Seja específico: cite cargas, exercícios e datas reais quando fizer uma
  recomendação, em vez de conselhos genéricos.
- Você não é médico nem nutricionista — se a pergunta for sobre saúde, lesão,
  dor ou alimentação além do básico de treino, responda com cautela e sugira
  procurar um profissional.
- Respostas curtas e diretas (poucos parágrafos ou uma lista curta), nunca um
  ensaio.
- Você tem três ferramentas pra propor mudanças concretas nos dados — em
  TODAS elas, nada é aplicado de verdade até a pessoa confirmar na tela; você
  nunca aplica nada sozinho, só propõe.
  1) propose_schedule_changes — pra mudar a AGENDA SEMANAL (trocar um dia
     entre treino/cardio/descanso, incluir natação/corrida/bike num dia, dar
     folga). Use sempre o id exato de um treino existente (fornecido nos
     dados) quando kind for "treino". Nunca invente um workoutId.
  2) propose_new_workout — quando a pessoa pedir pra CRIAR UM TREINO NOVO do
     zero (ex: "monta um treino de perna", "cria um push de 45 minutos").
     Sugira entre 6 e 9 exercícios pra uma sessão completa (menos se ela
     pedir algo mais curto ou específico), com séries e reps plausíveis,
     cobrindo bem os grupos musculares pedidos — nem repetitivo demais, nem
     genérico demais. Para cada exercício, informe só o NOME em português,
     com terminologia comum de academia (ex: "Agachamento livre", "Supino
     reto com barra", "Puxada frente", "Rosca direta") — nunca invente um id,
     o app resolve o nome pro exercício certo do catálogo (ou cria um novo
     personalizado se não achar equivalente).
  3) propose_workout_edit — quando a pessoa pedir pra MUDAR EXERCÍCIOS DENTRO
     DE UM TREINO JÁ CADASTRADO (tirar, adicionar, trocar um exercício, ou
     mudar séries/reps de um que já está lá). Sempre com o workoutId exato do
     treino (fornecido nos dados) e, pra remover/trocar/ajustar um exercício
     que já existe no treino, o entryId exato dele (também fornecido nos
     dados — é o id da LINHA do exercício dentro do treino, não o id do
     exercício em si). Pra adicionar um exercício novo, informe só o nome
     (mesma regra da ferramenta 2).
- Se o pedido não for nenhuma dessas três coisas (é só uma pergunta, pedido
  de opinião, etc.), responda normalmente em texto, sem usar nenhuma
  ferramenta.`;

// Mesmas 8 chaves de `src/lib/workoutIcons.ts` — duplicadas aqui de propósito
// (não dá pra importar de `src/` nessa Edge Function separada) pra restringir
// o que a IA pode propor como ícone do treino: uma chave, nunca um emoji.
const ICON_KEYS = ['dumbbell', 'flame', 'target', 'footprints', 'zap', 'activity', 'crown', 'shield'];

const SCHEDULE_TOOL = {
  name: 'propose_schedule_changes',
  description:
    'Propõe uma ou mais mudanças concretas na agenda semanal de treino da pessoa (o que fazer em cada dia: treino específico, cardio, ou descanso), para ela revisar e confirmar na tela antes de qualquer coisa ser aplicada de verdade.',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'Frase curta em português resumindo a proposta, para mostrar num card de confirmação.',
      },
      changes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            weekday: {
              type: 'string',
              enum: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
              description: 'Código do dia da semana a alterar.',
            },
            kind: {
              type: 'string',
              enum: ['treino', 'cardio', 'descanso'],
            },
            workoutId: {
              type: 'string',
              description: 'Obrigatório quando kind="treino": o id exato de um treino existente, copiado dos dados fornecidos.',
            },
            suggestedDistanceKm: {
              type: 'number',
              description: 'Opcional, só quando kind="cardio": meta de distância sugerida em km.',
            },
          },
          required: ['weekday', 'kind'],
        },
      },
    },
    required: ['summary', 'changes'],
  },
};

const NEW_WORKOUT_TOOL = {
  name: 'propose_new_workout',
  description:
    'Propõe um treino novo, do zero, com uma lista de exercícios e séries/reps sugeridas, para a pessoa revisar e confirmar antes de salvar como um treino novo cadastrado.',
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Nome curto do treino, ex: "Perna A", "Push (peito/ombro/tríceps)".',
      },
      emoji: {
        type: 'string',
        enum: ICON_KEYS,
        description:
          'Ícone opcional que combine com o treino — uma destas chaves: dumbbell (peso/força geral), flame (intensidade), target (foco/objetivo), footprints (pernas/cardio), zap (explosão/potência), activity (atividade geral), crown (destaque/premium), shield (proteção/core). Nunca um emoji.',
      },
      exercises: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            exerciseName: {
              type: 'string',
              description:
                'Nome do exercício em português, com terminologia comum de academia. Não invente um id — só o nome.',
            },
            targetSets: { type: 'number' },
            targetReps: { type: 'string', description: 'Faixa de repetições, ex: "8-12" ou "10".' },
            notes: { type: 'string' },
          },
          required: ['exerciseName', 'targetSets', 'targetReps'],
        },
      },
    },
    required: ['name', 'exercises'],
  },
};

const WORKOUT_EDIT_TOOL = {
  name: 'propose_workout_edit',
  description:
    'Propõe uma mudança num treino já cadastrado (adicionar, remover, trocar um exercício, ou mudar séries/reps de um exercício existente), para a pessoa revisar e confirmar antes de aplicar de verdade.',
  input_schema: {
    type: 'object',
    properties: {
      workoutId: {
        type: 'string',
        description: 'id exato do treino a editar, copiado dos dados fornecidos.',
      },
      summary: {
        type: 'string',
        description: 'Frase curta em português resumindo a proposta, para mostrar num card de confirmação.',
      },
      changes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['add', 'remove', 'replace', 'update_sets'],
            },
            entryId: {
              type: 'string',
              description:
                'Obrigatório para remove/replace/update_sets: o id exato do exercício DENTRO do treino (fornecido nos dados) — não é o id do exercício em si.',
            },
            exerciseName: {
              type: 'string',
              description: 'Obrigatório para add/replace: nome em português do exercício a incluir.',
            },
            targetSets: { type: 'number' },
            targetReps: { type: 'string' },
          },
          required: ['action'],
        },
      },
    },
    required: ['workoutId', 'summary', 'changes'],
  },
};

const VALID_WEEKDAYS = new Set(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']);
const VALID_KINDS = new Set(['treino', 'cardio', 'descanso']);
const VALID_EDIT_ACTIONS = new Set(['add', 'remove', 'replace', 'update_sets']);
const MAX_ITEMS_PER_PROPOSAL = 12;

interface ScheduleChangeRaw {
  weekday?: unknown;
  kind?: unknown;
  workoutId?: unknown;
  suggestedDistanceKm?: unknown;
}

function sanitizeScheduleProposal(input: unknown): { summary: string; changes: ScheduleChangeRaw[] } | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as { summary?: unknown; changes?: unknown };
  const summary = typeof obj.summary === 'string' ? obj.summary.slice(0, 300) : '';
  const rawChanges = Array.isArray(obj.changes) ? obj.changes : [];
  const changes = rawChanges
    .filter((c): c is ScheduleChangeRaw => !!c && typeof c === 'object')
    .filter((c) => typeof c.weekday === 'string' && VALID_WEEKDAYS.has(c.weekday))
    .filter((c) => typeof c.kind === 'string' && VALID_KINDS.has(c.kind))
    .map((c) => ({
      weekday: c.weekday,
      kind: c.kind,
      workoutId: typeof c.workoutId === 'string' ? c.workoutId.slice(0, 200) : undefined,
      suggestedDistanceKm: typeof c.suggestedDistanceKm === 'number' ? c.suggestedDistanceKm : undefined,
    }))
    .slice(0, 7);
  if (!summary || changes.length === 0) return null;
  return { summary, changes };
}

interface NewWorkoutExerciseRaw {
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  notes?: string;
}

function sanitizeNewWorkoutProposal(input: unknown): { name: string; emoji?: string; exercises: NewWorkoutExerciseRaw[] } | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as { name?: unknown; emoji?: unknown; exercises?: unknown };
  const name = typeof obj.name === 'string' ? obj.name.slice(0, 60) : '';
  const emoji = typeof obj.emoji === 'string' && ICON_KEYS.includes(obj.emoji) ? obj.emoji : undefined;
  const rawExercises = Array.isArray(obj.exercises) ? obj.exercises : [];
  const exercises = rawExercises
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map((e) => ({
      exerciseName: typeof e.exerciseName === 'string' ? e.exerciseName.slice(0, 100) : '',
      targetSets: typeof e.targetSets === 'number' && e.targetSets > 0 ? Math.min(10, Math.round(e.targetSets)) : 3,
      targetReps: typeof e.targetReps === 'string' && e.targetReps ? e.targetReps.slice(0, 20) : '10-12',
      notes: typeof e.notes === 'string' ? e.notes.slice(0, 200) : undefined,
    }))
    .filter((e) => e.exerciseName)
    .slice(0, MAX_ITEMS_PER_PROPOSAL);
  if (!name || exercises.length === 0) return null;
  return { name, emoji, exercises };
}

interface WorkoutEditChangeRaw {
  action: string;
  entryId?: string;
  exerciseName?: string;
  targetSets?: number;
  targetReps?: string;
}

function sanitizeWorkoutEditProposal(input: unknown): { workoutId: string; summary: string; changes: WorkoutEditChangeRaw[] } | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as { workoutId?: unknown; summary?: unknown; changes?: unknown };
  const workoutId = typeof obj.workoutId === 'string' ? obj.workoutId.slice(0, 200) : '';
  const summary = typeof obj.summary === 'string' ? obj.summary.slice(0, 300) : '';
  const rawChanges = Array.isArray(obj.changes) ? obj.changes : [];
  const changes = rawChanges
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .filter((c) => typeof c.action === 'string' && VALID_EDIT_ACTIONS.has(c.action))
    .map((c) => ({
      action: c.action as string,
      entryId: typeof c.entryId === 'string' ? c.entryId.slice(0, 200) : undefined,
      exerciseName: typeof c.exerciseName === 'string' ? c.exerciseName.slice(0, 100) : undefined,
      targetSets: typeof c.targetSets === 'number' && c.targetSets > 0 ? Math.min(10, Math.round(c.targetSets)) : undefined,
      targetReps: typeof c.targetReps === 'string' ? c.targetReps.slice(0, 20) : undefined,
    }))
    .slice(0, MAX_ITEMS_PER_PROPOSAL);
  if (!workoutId || !summary || changes.length === 0) return null;
  return { workoutId, summary, changes };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}

async function isAuthorized(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  if (!(await isAuthorized(req))) {
    return json({ error: 'Não autorizado. Faça login no FitBox e tente de novo.' }, 401);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: 'A chave da IA (ANTHROPIC_API_KEY) ainda não foi configurada no Vercel.' }, 500);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const b = (body ?? {}) as { question?: unknown; context?: unknown; history?: unknown };
  const question = typeof b.question === 'string' ? b.question.trim() : '';
  const context = typeof b.context === 'string' ? b.context.slice(0, MAX_CONTEXT_LEN) : '';
  const rawHistory = Array.isArray(b.history) ? b.history : [];

  if (!question) return json({ error: 'A pergunta não pode estar vazia.' }, 400);
  if (question.length > MAX_QUESTION_LEN) return json({ error: 'Pergunta muito longa.' }, 400);

  const cleanHistory: ChatMessage[] = rawHistory
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string',
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_QUESTION_LEN) }));

  const messages: ChatMessage[] = [...cleanHistory, { role: 'user', content: question }];
  const systemPrompt = `${SYSTEM_PREFIX}\n\nDados atuais da pessoa (única fonte de verdade):\n${
    context || '(sem dados suficientes ainda — a pessoa ainda não registrou treinos)'
  }`;

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
        tools: [SCHEDULE_TOOL, NEW_WORKOUT_TOOL, WORKOUT_EDIT_TOOL],
      }),
    });
  } catch {
    return json({ error: 'Falha de rede ao consultar a IA.' }, 502);
  }

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text().catch(() => '');
    return json({ error: 'A IA não respondeu corretamente.', detail: detail.slice(0, 300) }, 502);
  }

  const data = (await anthropicRes.json()) as {
    content?: Array<{ type?: string; text?: string; name?: string; input?: unknown }>;
  };

  const blocks = Array.isArray(data.content) ? data.content : [];
  const reply = blocks
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n');

  const toolBlock = blocks.find(
    (block) =>
      block?.type === 'tool_use' &&
      (block.name === 'propose_schedule_changes' || block.name === 'propose_new_workout' || block.name === 'propose_workout_edit'),
  );

  let proposal: { kind: string; data: unknown } | null = null;
  let fallbackSummary = '';
  if (toolBlock) {
    if (toolBlock.name === 'propose_schedule_changes') {
      const parsed = sanitizeScheduleProposal(toolBlock.input);
      if (parsed) {
        proposal = { kind: 'schedule', data: parsed };
        fallbackSummary = parsed.summary;
      }
    } else if (toolBlock.name === 'propose_new_workout') {
      const parsed = sanitizeNewWorkoutProposal(toolBlock.input);
      if (parsed) {
        proposal = { kind: 'newWorkout', data: parsed };
        fallbackSummary = `Treino novo: ${parsed.name}`;
      }
    } else if (toolBlock.name === 'propose_workout_edit') {
      const parsed = sanitizeWorkoutEditProposal(toolBlock.input);
      if (parsed) {
        proposal = { kind: 'workoutEdit', data: parsed };
        fallbackSummary = parsed.summary;
      }
    }
  }

  return json(
    {
      reply: reply || fallbackSummary || 'Não consegui gerar uma resposta agora — tenta de novo em instantes.',
      proposal,
    },
    200,
  );
}
