import { useNavigate } from 'react-router-dom';
import { Play, Flame, CalendarCheck, Plus, ArrowRight, Bot } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { startSession } from '../lib/actions';
import { getCurrentStreakWeeks, getTotalSessionsThisMonth } from '../lib/stats';
import { getTopCoachTip } from '../lib/coach';
import { Card, PageHeader, Button, EmptyState } from '../components/ui';

export function Home() {
  const { workouts, sessions, exercises, activeSessionId } = useAppData();
  const navigate = useNavigate();

  const active = workouts.filter((w) => !w.archived);
  const streak = getCurrentStreakWeeks(sessions);
  const monthCount = getTotalSessionsThisMonth(sessions);
  const coachTip = getTopCoachTip(sessions);
  const coachExercise = coachTip ? exercises.find((e) => e.id === coachTip.exerciseId) : null;
  const coachColor = coachTip?.action === 'increase' ? 'var(--success)' : coachTip?.action === 'deload' ? 'var(--warn)' : 'var(--text)';

  const lastFinished = sessions
    .filter((s) => s.finishedAt)
    .sort((a, b) => Date.parse(b.finishedAt as string) - Date.parse(a.finishedAt as string))[0];

  function handleStart(workoutId: string) {
    const w = workouts.find((w) => w.id === workoutId);
    if (!w) return;
    const session = startSession(w);
    navigate(`/sessao/${session.id}`);
  }

  return (
    <div className="px-4">
      <PageHeader title="Olá 👋" />

      {activeSessionId && (
        <Card className="mb-4 flex items-center justify-between" style={{ borderColor: 'var(--brand)' }}>
          <div>
            <p className="text-sm font-medium">Treino em andamento</p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Continue de onde parou
            </p>
          </div>
          <Button onClick={() => navigate(`/sessao/${activeSessionId}`)} className="!px-3 !py-2">
            <span className="flex items-center gap-1.5 text-sm">
              Continuar <ArrowRight size={14} />
            </span>
          </Button>
        </Card>
      )}

      {coachTip && coachExercise && (
        <Card
          className="mb-4 flex items-start gap-2.5 cursor-pointer"
          onClick={() => navigate(`/exercicio/${coachTip.exerciseId}`)}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--brand-dim)' }}>
            <Bot size={14} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-dim)' }}>
              Seu treinador · {coachExercise.name}
            </p>
            <p className="text-sm" style={{ color: coachColor }}>
              {coachTip.message}
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card className="flex flex-col items-center py-4">
          <Flame size={20} style={{ color: 'var(--warn)' }} />
          <p className="text-2xl font-semibold mt-1">{streak}</p>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            semana{streak !== 1 ? 's' : ''} seguida{streak !== 1 ? 's' : ''}
          </p>
        </Card>
        <Card className="flex flex-col items-center py-4">
          <CalendarCheck size={20} style={{ color: 'var(--success)' }} />
          <p className="text-2xl font-semibold mt-1">{monthCount}</p>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            treinos este mês
          </p>
        </Card>
      </div>

      <p className="text-sm font-semibold mb-2.5" style={{ color: 'var(--text-dim)' }}>
        Escolha um treino
      </p>

      {active.length === 0 ? (
        <EmptyState
          title="Você ainda não tem treinos"
          subtitle="Crie seu primeiro treino para começar."
          action={
            <Button onClick={() => navigate('/treinos')}>
              <span className="flex items-center gap-2">
                <Plus size={16} /> Criar treino
              </span>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5 pb-4">
          {active.map((w) => (
            <Card key={w.id} className="flex items-center gap-3">
              <span className="text-2xl">{w.emoji ?? '💪'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{w.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  {w.exercises.length} exercício{w.exercises.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => handleStart(w.id)}
                disabled={w.exercises.length === 0 || !!activeSessionId}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30"
                style={{ background: 'var(--brand)', color: 'white' }}
              >
                <Play size={16} fill="currentColor" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {lastFinished && (
        <div className="pb-4">
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Último treino: {lastFinished.workoutName} em{' '}
            {new Date(lastFinished.finishedAt as string).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
}
