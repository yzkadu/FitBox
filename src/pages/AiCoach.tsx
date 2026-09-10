import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Send, Sparkles } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { buildCoachContext } from '../lib/aiCoachContext';
import { askAiCoach, AiCoachError, type AiChatMessage } from '../lib/aiCoach';

const SUGGESTIONS = [
  'Como está minha evolução esse mês?',
  'O que eu treino hoje e com que carga?',
  'Estou estagnada em algum exercício?',
  'Minha meta de peso está no ritmo certo?',
];

export function AiCoach() {
  const navigate = useNavigate();
  const appData = useAppData();
  const { user } = useAuth();
  const profile = useProfile(user?.id);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setError(null);
    setInput('');
    const nextMessages: AiChatMessage[] = [...messages, { role: 'user', content: q }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const context = buildCoachContext(appData, profile?.name);
      const reply = await askAiCoach(q, context, messages);
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err instanceof AiCoachError ? err.message : 'Não consegui falar com a IA agora. Tenta de novo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 flex flex-col" style={{ minHeight: '100vh' }}>
      <div className="flex items-center gap-2 pt-5 pb-3">
        <button onClick={() => navigate('/')} className="p-1 -ml-1" style={{ color: 'var(--text-dim)' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-dim)' }}>
          <Bot size={16} style={{ color: 'var(--brand)' }} />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">Treinador IA</h1>
          <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
            Usa seus dados reais de treino — não é conselho médico
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 pb-3">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Pergunte qualquer coisa sobre seu treino, sua evolução ou sua meta. Algumas ideias:
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left rounded-xl px-3 py-2.5 text-sm flex items-center gap-2"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                >
                  <Sparkles size={14} style={{ color: 'var(--brand)' }} className="shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap"
              style={
                m.role === 'user'
                  ? { background: 'var(--brand)', color: 'white', borderBottomRightRadius: 4 }
                  : { background: 'var(--surface-2)', color: 'var(--text)', borderBottomLeftRadius: 4 }
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-3.5 py-2.5 text-sm"
              style={{ background: 'var(--surface-2)', color: 'var(--text-faint)', borderBottomLeftRadius: 4 }}
            >
              Pensando…
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl px-3.5 py-2.5 text-sm" style={{ background: '#ef444426', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 flex items-center gap-2 py-3 safe-bottom"
        style={{ background: 'var(--bg)' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte ao treinador..."
          className="flex-1 rounded-xl px-3.5 py-3 text-sm"
          style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30"
          style={{ background: 'var(--brand)', color: 'white' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
