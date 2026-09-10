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
const MAX_TOKENS = 700;
const MAX_QUESTION_LEN = 1500;
const MAX_CONTEXT_LEN = 8000;
const MAX_HISTORY_MESSAGES = 12;

const SYSTEM_PREFIX = `Você é o Personal Trainer virtual do app FitBox. Responda sempre em
português do Brasil, em tom direto, cordial e prático — como um personal
trainer de verdade conversando com o aluno pelo WhatsApp, sem embromação.

Regras importantes:
- Use APENAS os dados fornecidos abaixo (histórico de treino, séries, cargas,
  peso, meta, agenda). Nunca invente números, exercícios ou datas que não
  estejam nos dados.
- Se faltar dado pra responder algo com confiança, diga isso claramente em vez
  de supor.
- Seja específico: cite cargas, exercícios e datas reais quando fizer uma
  recomendação, em vez de conselhos genéricos.
- Você não é médico nem nutricionista — se a pergunta for sobre saúde, lesão,
  dor ou alimentação além do básico de treino, responda com cautela e sugira
  procurar um profissional.
- Respostas curtas e diretas (poucos parágrafos ou uma lista curta), nunca um
  ensaio.
- Quando a pessoa pedir uma mudança concreta na AGENDA SEMANAL (trocar um dia
  entre treino/cardio/descanso, incluir uma atividade tipo natação/corrida/bike
  em algum dia, dar folga em outro), use a ferramenta
  propose_schedule_changes para propor a mudança formalmente — não basta
  descrever em texto o que a pessoa deveria fazer manualmente. Use sempre o id
  exato de um treino existente (fornecido nos dados) quando kind for "treino".
  Nunca invente um workoutId. A mudança só é aplicada de verdade depois que a
  pessoa confirmar na tela — você nunca aplica nada sozinho.
- Se o pedido não for sobre mudar a agenda (é só uma pergunta, ou é sobre
  editar exercícios dentro de um treino específico), responda normalmente em
  texto, sem usar a ferramenta — editar os exercícios de um treino ainda não é
  suportado por essa ferramenta.`;

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

interface ScheduleChangeRaw {
  weekday?: unknown;
  kind?: unknown;
  workoutId?: unknown;
  suggestedDistanceKm?: unknown;
}

const VALID_WEEKDAYS = new Set(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']);
const VALID_KINDS = new Set(['treino', 'cardio', 'descanso']);

function sanitizeProposal(input: unknown): { summary: string; changes: ScheduleChangeRaw[] } | null {
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
        tools: [SCHEDULE_TOOL],
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

  const toolBlock = blocks.find((block) => block?.type === 'tool_use' && block.name === 'propose_schedule_changes');
  const proposal = toolBlock ? sanitizeProposal(toolBlock.input) : null;

  return json(
    {
      reply: reply || proposal?.summary || 'Não consegui gerar uma resposta agora — tenta de novo em instantes.',
      proposal,
    },
    200,
  );
}
