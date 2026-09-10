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
  ensaio.`;

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
      }),
    });
  } catch {
    return json({ error: 'Falha de rede ao consultar a IA.' }, 502);
  }

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text().catch(() => '');
    return json({ error: 'A IA não respondeu corretamente.', detail: detail.slice(0, 300) }, 502);
  }

  const data = (await anthropicRes.json()) as { content?: Array<{ type?: string; text?: string }> };
  const reply = Array.isArray(data.content)
    ? data.content
        .filter((block) => block?.type === 'text' && typeof block.text === 'string')
        .map((block) => block.text)
        .join('\n')
    : '';

  return json({ reply: reply || 'Não consegui gerar uma resposta agora — tenta de novo em instantes.' }, 200);
}
