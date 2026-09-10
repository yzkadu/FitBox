import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Flame, CalendarCheck, Plus, ArrowRight, Bot, Bike, BedDouble, ChevronDown } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { startSession } from '../lib/actions';
import { getCurrentStreakDays, getTotalSessionsThisMonth } from '../lib/stats';
import { getTopCoachTip } from '../lib/coach';
import { WEEKDAY_ORDER } from '../types';
import { Card, PageHeader, Button, EmptyState } from '../components/ui';
import { AccountSheet } from '../components/AccountSheet';
import { ImportLocalDataBanner } from '../components/ImportLocalDataBanner';

/** Date.getDay(): 0=domingo...6=sábado → nosso índice seg..dom (0..6) */
function todayWeekdayKey() {
  const jsDay = new Date().getDay();
  return WEEKDAY_ORDER[(jsDay + 6) % 7];
}

export function Home() {
  const { workouts, sessions, exercises, activeSessionId, weeklySchedule, cardioLogs } = useAppData();
  const { user } = useAuth();
  const profile = useProfile(user?.id);
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const active = workouts.filter((w) => !w.archived);
  const streak = getCurrentStreakDays(sessions, cardioLogs, weeklySchedule);
  const monthCount = getTotalSessionsThisMonth(sessions);
  const coachTip = getTopCoachTip(sessions);
  const coachExercise = coachTip ? exercises.find((e) => e.id === coachTip.exerciseId) : null;
  const coachColor = coachTip?.action === 'increase' ? 'var(--success)' : coachTip?.action === 'deload' ? 'var(--warn)' : 'var(--text)';

  const todayKey = todayWeekdayKey();
  const todaySchedule = weeklySchedule[todayKey];
  const todayWorkout = todaySchedule?.kind === 'treino' ? workouts.find((w) => w.id === todaySchedule.workoutId) : null;

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
      <PageHeader
        title="Olá 👋"
        right={
          <button
            onClick={() => setSwitcherOpen(true)}
            className="flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1"
            style={{ background: 'var(--surface-2)' }}
          >
            <span className="text-base">{profile?.emoji ?? '💪'}</span>
            <span className="text-xs font-medium max-w-[80px] truncate">{profile?.name ?? 'Conta'}</span>
            <ChevronDown size={13} style={{ color: 'var(--text-faint)' }} />
          </button>
        }
      />

      {user && active.length === 0 && <ImportLocalDataBanner userId={user.id} />}

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

      {!activeSessionId && todaySchedule?.kind === 'treino' && todayWorkout && (
        <Card className="mb-4 flex items-center gap-3" style={{ borderColor: 'var(--brand)' }}>
          <span className="text-2xl">{todayWorkout.emoji ?? '💪'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--brand)' }}>
              Treino de hoje
            </p>
            <p className="text-sm font-medium truncate">{todayWorkout.name}</p>
          </div>
          <button
            onClick={() => handleStart(todayWorkout.id)}
            disabled={todayWorkout.exercises.length === 0}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            <Play size={17} fill="currentColor" />
          </button>
        </Card>
      )}

      {!activeSessionId && todaySchedule?.kind === 'cardio' && (
        <Card
          className="mb-4 flex items-center gap-3 cursor-pointer"
          style={{ borderColor: 'var(--success)' }}
          onClick={() => navigate('/cardio')}
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--success-dim)' }}>
            <Bike size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--success)' }}>
              Hoje é dia de cardio
            </p>
            <p className="text-sm font-medium">Corrida ou bike — registre sua atividade</p>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--text-faint)' }} />
        </Card>
      )}

      {!activeSessionId && todaySchedule?.kind === 'descanso' && (
        <Card className="mb-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
            <BedDouble size={20} style={{ color: 'var(--text-dim)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-dim)' }}>
              Dia de descanso
            </p>
            <p className="text-sm font-medium">Aproveite para recuperar os músculos.</p>
          </div>
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
            dia{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''}
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
        {todaySchedule ? 'Todos os treinos' : 'Escolha um treino'}
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

      <AccountSheet
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        name={profile?.name ?? 'Conta'}
        emoji={profile?.emoji ?? '💪'}
        email={user?.email}
      />
    </div>
  );
}
