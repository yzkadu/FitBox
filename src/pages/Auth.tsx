import { useState } from 'react';
import type { FormEvent } from 'react';
import { Dumbbell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { setPendingTemplate } from '../lib/pendingTemplate';
import { PROGRAM_TEMPLATES, type ProgramTemplateId } from '../lib/seedPrograms';
import { Button } from '../components/ui';

const EMOJIS = ['💪', '🏋️', '🏃', '🚴', '🔥', '⚡', '🎯', '🦵'];

function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/user already registered/i.test(message)) return 'Já existe uma conta com esse e-mail. Tente entrar.';
  if (/password should be at least/i.test(message)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/unable to validate email address/i.test(message)) return 'E-mail inválido.';
  if (/rate limit/i.test(message)) return 'Muitas tentativas seguidas — espera um instante e tenta de novo.';
  return message;
}

export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [template, setTemplate] = useState<ProgramTemplateId>('blank');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleLogin() {
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (error) setError(friendlyError(error.message));
  }

  async function handleSignup() {
    setSubmitting(true);
    setError(null);
    setInfo(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // `template` também vai nos metadados do usuário (não só na memória local):
      // se a confirmação de e-mail estiver ligada, o cadastro e o primeiro login
      // acontecem em "sessões" JS completamente separadas (a pessoa fecha o app,
      // abre o e-mail, clica no link, volta e loga de novo) — então o App lê o
      // template daqui na primeira vez que a conta carrega vazia.
      options: { data: { name: name.trim(), emoji, template } },
    });
    setSubmitting(false);
    if (error) {
      setError(friendlyError(error.message));
      return;
    }
    if (!data.session) {
      // "Confirm email" está ligado nas configurações do Supabase.
      setInfo('Conta criada! Confirme seu e-mail (chegou um link na sua caixa de entrada) e depois volte pra entrar.');
      setMode('login');
      return;
    }
    setPendingTemplate(template);
    // O App detecta a sessão nova e carrega os dados; se a conta estiver vazia,
    // aplica o template guardado acima.
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (mode === 'login') handleLogin();
    else handleSignup();
  }

  const canSubmit = mode === 'login' ? email.trim() && password : email.trim() && password.length >= 6 && name.trim();

  return (
    <div className="min-h-screen flex flex-col justify-center px-5 py-10 safe-top safe-bottom" style={{ background: 'var(--bg)' }}>
      <div className="text-center mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'var(--brand-dim)' }}
        >
          <Dumbbell size={22} style={{ color: 'var(--brand)' }} />
        </div>
        <p className="text-2xl font-semibold mb-1">FitBox</p>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === 'signup' && (
          <>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
                Nome
              </p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Kadu"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
                Ícone
              </p>
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map((e) => (
                  <button
                    type="button"
                    key={e}
                    onClick={() => setEmoji(e)}
                    className="w-10 h-10 rounded-xl text-lg flex items-center justify-center"
                    style={{ background: emoji === e ? 'var(--brand)' : 'var(--surface-2)' }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
            E-mail
          </p>
          <input
            type="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
          />
        </div>

        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
            Senha
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Pelo menos 6 caracteres' : '••••••••'}
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
          />
        </div>

        {mode === 'signup' && (
          <div>
            <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
              Programa inicial
            </p>
            <div className="flex flex-col gap-2">
              {PROGRAM_TEMPLATES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className="text-left rounded-xl p-3 border"
                  style={{
                    background: template === t.id ? 'var(--brand-dim)' : 'var(--surface-2)',
                    borderColor: template === t.id ? 'var(--brand)' : 'transparent',
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: template === t.id ? 'var(--brand)' : 'var(--text)' }}>
                    {t.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#f8717126', color: 'var(--danger)' }}>
            {error}
          </p>
        )}
        {info && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
            {info}
          </p>
        )}

        <Button type="submit" full disabled={!canSubmit || submitting} className="mt-1">
          {submitting ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </Button>
      </form>

      <button
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setError(null);
          setInfo(null);
        }}
        className="text-sm mt-5 text-center"
        style={{ color: 'var(--brand)' }}
      >
        {mode === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
      </button>
    </div>
  );
}
