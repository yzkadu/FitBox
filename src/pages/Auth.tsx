import { useState } from 'react';
import type { FormEvent } from 'react';
import { ChevronLeft, Dumbbell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { setPendingTemplate } from '../lib/pendingTemplate';
import { PROGRAM_TEMPLATES, type ProgramTemplateId } from '../lib/seedPrograms';
import { Button, AppIcon } from '../components/ui';
import { ICON_KEYS } from '../lib/workoutIcons';
import {
  GOAL_OPTIONS,
  EXPERIENCE_OPTIONS,
  FREQUENCY_OPTIONS,
  EQUIPMENT_OPTIONS,
  type TrainingGoal,
  type ExperienceLevel,
  type WeeklyFrequency,
  type Equipment,
} from '../lib/onboarding';

function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/user already registered/i.test(message)) return 'Já existe uma conta com esse e-mail. Tente entrar.';
  if (/password should be at least/i.test(message)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/unable to validate email address/i.test(message)) return 'E-mail inválido.';
  if (/rate limit/i.test(message)) return 'Muitas tentativas seguidas — espera um instante e tenta de novo.';
  return message;
}

/** Card de opção única do quiz de cadastro — mesmo visual da lista de
 * "Programa inicial" que já existia, reaproveitado pra objetivo/experiência/
 * frequência/equipamento. */
function OptionCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-xl p-3.5 border w-full"
      style={{
        background: selected ? 'var(--brand-dim)' : 'var(--surface-2)',
        borderColor: selected ? 'var(--brand)' : 'transparent',
      }}
    >
      <p className="text-sm font-medium" style={{ color: selected ? 'var(--brand)' : 'var(--text)' }}>
        {label}
      </p>
      {description && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
          {description}
        </p>
      )}
    </button>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Passos do quiz de cadastro: objetivo -> experiência -> frequência -> equipamento
// -> dados pro IMC -> identidade -> programa inicial -> login. Cada tela pergunta
// uma coisa só (no estilo dos apps de fitness com onboarding em quiz), pra ficar
// menos cru e já alimentar o Personal Trainer virtual com mais contexto desde o início.
const SIGNUP_STEPS = 8;
const LAST_STEP = SIGNUP_STEPS - 1;

export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string>(ICON_KEYS[0]);
  const [template, setTemplate] = useState<ProgramTemplateId>('blank');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'masculino' | 'feminino'>('feminino');
  const [initialWeightKg, setInitialWeightKg] = useState('');
  const [trainingGoal, setTrainingGoal] = useState<TrainingGoal | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [weeklyFrequency, setWeeklyFrequency] = useState<WeeklyFrequency | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function switchMode(next: 'login' | 'signup') {
    setMode(next);
    setStep(0);
    setError(null);
    setInfo(null);
  }

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
      // Tudo isso também vai nos metadados do usuário (não só na memória local):
      // se a confirmação de e-mail estiver ligada, o cadastro e o primeiro login
      // acontecem em "sessões" JS completamente separadas (a pessoa fecha o app,
      // abre o e-mail, clica no link, volta e loga de novo) — então o App lê os
      // dados daqui na primeira vez que a conta carrega vazia (via trigger no banco).
      options: {
        data: {
          name: name.trim(),
          emoji,
          template,
          heightCm: heightCm.trim(),
          age: age.trim(),
          gender,
          initialWeightKg: initialWeightKg.trim(),
          trainingGoal: trainingGoal ?? '',
          experienceLevel: experienceLevel ?? '',
          weeklyFrequency: weeklyFrequency ?? '',
          equipment: equipment ?? '',
        },
      },
    });
    setSubmitting(false);
    if (error) {
      setError(friendlyError(error.message));
      return;
    }
    if (!data.session) {
      // "Confirm email" está ligado nas configurações do Supabase.
      setInfo('Conta criada! Confirme seu e-mail (chegou um link na sua caixa de entrada) e depois volte pra entrar.');
      switchMode('login');
      return;
    }
    setPendingTemplate(template);
    // O App detecta a sessão nova e carrega os dados; se a conta estiver vazia,
    // aplica o template guardado acima.
  }

  function canContinue(s: number): boolean {
    switch (s) {
      case 0:
        return !!trainingGoal;
      case 1:
        return !!experienceLevel;
      case 2:
        return !!weeklyFrequency;
      case 3:
        return !!equipment;
      case 4:
        return !!(heightCm.trim() && age.trim());
      case 5:
        return !!name.trim();
      default:
        return true;
    }
  }

  const canSubmitSignup =
    email.trim() && password.length >= 6 && name.trim() && heightCm.trim() && age.trim();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (mode === 'login') {
      handleLogin();
      return;
    }
    if (step < LAST_STEP) {
      if (canContinue(step)) setStep((s) => s + 1);
      return;
    }
    handleSignup();
  }

  function handleBack() {
    setError(null);
    if (step === 0) {
      switchMode('login');
      return;
    }
    setStep((s) => s - 1);
  }

  const canSubmit = mode === 'login' ? email.trim() && password : step < LAST_STEP ? canContinue(step) : canSubmitSignup;

  return (
    <div className="min-h-screen flex flex-col px-5 py-8 safe-top safe-bottom" style={{ background: 'var(--bg)' }}>
      {mode === 'login' ? (
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'var(--brand-dim)' }}
            >
              <Dumbbell size={22} style={{ color: 'var(--brand)' }} />
            </div>
            <p className="text-2xl font-semibold mb-1">FitBox</p>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Entre na sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
                E-mail
              </p>
              <input
                type="email"
                autoFocus
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
                placeholder="••••••••"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
              />
            </div>

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
              {submitting ? 'Aguarde...' : 'Entrar'}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={handleBack}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--surface-2)' }}
              aria-label="Voltar"
            >
              <ChevronLeft size={18} style={{ color: 'var(--text-dim)' }} />
            </button>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${((step + 1) / SIGNUP_STEPS) * 100}%`, background: 'var(--brand)' }}
              />
            </div>
            <p className="text-xs shrink-0" style={{ color: 'var(--text-faint)' }}>
              {step + 1}/{SIGNUP_STEPS}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col gap-2">
              {step === 0 && (
                <>
                  <StepHeading title="Qual é o seu objetivo principal?" subtitle="Isso ajuda o Personal Trainer virtual a te orientar melhor." />
                  {GOAL_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.id}
                      label={o.label}
                      description={o.description}
                      selected={trainingGoal === o.id}
                      onClick={() => setTrainingGoal(o.id)}
                    />
                  ))}
                </>
              )}

              {step === 1 && (
                <>
                  <StepHeading title="Qual é o seu nível de experiência?" />
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.id}
                      label={o.label}
                      description={o.description}
                      selected={experienceLevel === o.id}
                      onClick={() => setExperienceLevel(o.id)}
                    />
                  ))}
                </>
              )}

              {step === 2 && (
                <>
                  <StepHeading title="Com que frequência pretende treinar?" />
                  {FREQUENCY_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.id}
                      label={o.label}
                      description={o.description}
                      selected={weeklyFrequency === o.id}
                      onClick={() => setWeeklyFrequency(o.id)}
                    />
                  ))}
                </>
              )}

              {step === 3 && (
                <>
                  <StepHeading title="Onde você vai treinar?" subtitle="Pra sugerir exercícios compatíveis com o que você tem disponível." />
                  {EQUIPMENT_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.id}
                      label={o.label}
                      description={o.description}
                      selected={equipment === o.id}
                      onClick={() => setEquipment(o.id)}
                    />
                  ))}
                </>
              )}

              {step === 4 && (
                <>
                  <StepHeading title="Seus dados" subtitle="Pra calcular seu IMC automaticamente." />
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="number"
                      inputMode="decimal"
                      autoFocus
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="Altura (cm)"
                      className="w-full rounded-xl px-3 py-2.5 text-sm"
                      style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Idade"
                      className="w-full rounded-xl px-3 py-2.5 text-sm"
                      style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={initialWeightKg}
                      onChange={(e) => setInitialWeightKg(e.target.value)}
                      placeholder="Peso atual (kg)"
                      className="w-full rounded-xl px-3 py-2.5 text-sm"
                      style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                    />
                    <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface-2)' }}>
                      {(['feminino', 'masculino'] as const).map((g) => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setGender(g)}
                          className="flex-1 text-xs rounded-lg font-medium"
                          style={{
                            background: gender === g ? 'var(--brand)' : 'transparent',
                            color: gender === g ? 'white' : 'var(--text-faint)',
                          }}
                        >
                          {g === 'feminino' ? 'Feminino' : 'Masculino'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-faint)' }}>
                    Peso é opcional aqui — dá pra registrar (e atualizar) depois em Medidas.
                  </p>
                </>
              )}

              {step === 5 && (
                <>
                  <StepHeading title="Como podemos te chamar?" />
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
                  <div className="mt-3">
                    <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
                      Ícone
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {ICON_KEYS.map((k) => (
                        <button
                          type="button"
                          key={k}
                          onClick={() => setEmoji(k)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: emoji === k ? 'var(--brand)' : 'var(--surface-2)',
                            color: emoji === k ? 'white' : 'var(--text-dim)',
                          }}
                        >
                          <AppIcon value={k} size={18} />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 6 && (
                <>
                  <StepHeading title="Programa inicial" subtitle="Dá pra mudar tudo depois — isso é só um ponto de partida." />
                  <div className="flex flex-col gap-2">
                    {PROGRAM_TEMPLATES.map((t) => (
                      <OptionCard
                        key={t.id}
                        label={t.name}
                        description={t.description}
                        selected={template === t.id}
                        onClick={() => setTemplate(t.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {step === 7 && (
                <>
                  <StepHeading title="Falta pouco! Crie seu login" />
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
                      E-mail
                    </p>
                    <input
                      type="email"
                      autoFocus
                      autoCapitalize="none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                      className="w-full rounded-xl px-3 py-2.5 text-sm"
                      style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                    />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)' }}>
                      Senha
                    </p>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Pelo menos 6 caracteres"
                      className="w-full rounded-xl px-3 py-2.5 text-sm"
                      style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                    />
                  </div>
                </>
              )}
            </div>

            {error && (
              <p className="text-xs rounded-lg px-3 py-2 mt-3" style={{ background: '#f8717126', color: 'var(--danger)' }}>
                {error}
              </p>
            )}
            {info && (
              <p className="text-xs rounded-lg px-3 py-2 mt-3" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
                {info}
              </p>
            )}

            <Button type="submit" full disabled={!canSubmit || submitting} className="mt-4">
              {step < LAST_STEP ? 'Continuar' : submitting ? 'Aguarde...' : 'Criar conta'}
            </Button>
          </form>
        </div>
      )}

      <button
        onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
        className="text-sm mt-5 text-center"
        style={{ color: 'var(--brand)' }}
      >
        {mode === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
      </button>
    </div>
  );
}
