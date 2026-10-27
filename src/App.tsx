import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Workouts } from './pages/Workouts';
import { WorkoutEditor } from './pages/WorkoutEditor';
import { SessionExecution } from './pages/SessionExecution';
import { SessionEditor } from './pages/SessionEditor';
import { History } from './pages/History';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { Progress } from './pages/Progress';
import { BodyStats } from './pages/BodyStats';
import { MuscleMap } from './pages/MuscleMap';
import { Cardio } from './pages/Cardio';
import { ProgramLibrary } from './pages/ProgramLibrary';
import { AiCoach } from './pages/AiCoach';
import { Auth } from './pages/Auth';
import { useAuth } from './hooks/useAuth';
import { store } from './lib/storage';
import { applyProgramTemplate } from './lib/seedPrograms';
import type { ProgramTemplateId } from './lib/seedPrograms';
import { takePendingTemplate } from './lib/pendingTemplate';
import { applyRecommendedProgram } from './lib/programRecommendation';
import type { Equipment, ExperienceLevel, TrainingGoal, TrainingType, WeeklyFrequency } from './lib/onboarding';

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: 'var(--brand-dim)' }}>
        <Dumbbell size={22} style={{ color: 'var(--brand)' }} />
      </div>
    </div>
  );
}

export default function App() {
  const { session, authLoading } = useAuth();
  const [dataReady, setDataReady] = useState(false);
  const [dataError, setDataError] = useState('');
  const [usingLocalCopy, setUsingLocalCopy] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (!session) {
      store.clear();
      setDataReady(false);
      setDataError('');
      setUsingLocalCopy(false);
      return;
    }
    let cancelled = false;
    setDataReady(false);
    setDataError('');
    setUsingLocalCopy(false);
    store.loadForUser(session.user.id).then(({ fromCache }) => {
      if (cancelled) return;
      setUsingLocalCopy(fromCache);
      if (cancelled) return;
      const snapshot = store.getSnapshot();
      const isEmpty = snapshot.workouts.length === 0 && Object.keys(snapshot.weeklySchedule).length === 0;
      // Preferimos o valor em memória (cadastro sem confirmação de e-mail); se não tiver
      // (fluxo com confirmação de e-mail passou por um reload da página no meio do caminho),
      // caímos pro template salvo nos metadados do usuário no momento do cadastro.
      const metaTemplate = session.user.user_metadata?.template as ProgramTemplateId | undefined;
      const pendingTemplate = takePendingTemplate() ?? metaTemplate ?? null;
      if (!fromCache && isEmpty && pendingTemplate === 'smart') {
        // Plano montado com regras a partir das respostas do quiz (ver
        // lib/programRecommendation.ts) — os dados já foram enviados junto
        // no cadastro (options.data do signUp), então dá pra reconstruir o
        // plano aqui mesmo sem precisar buscar o perfil de novo.
        const meta = session.user.user_metadata ?? {};
        applyRecommendedProgram({
          goal: (meta.trainingGoal as TrainingGoal) || null,
          experience: (meta.experienceLevel as ExperienceLevel) || null,
          frequency: (meta.weeklyFrequency as WeeklyFrequency) || null,
          equipment: (meta.equipment as Equipment[]) ?? [],
          trainingTypes: (meta.trainingTypes as TrainingType[]) ?? [],
        });
      } else if (!fromCache && isEmpty && pendingTemplate && pendingTemplate !== 'blank') {
        applyProgramTemplate(pendingTemplate);
      }
      setDataReady(true);
    }).catch((error: unknown) => {
      if (!cancelled) setDataError(error instanceof Error ? error.message : 'Não foi possível carregar os dados.');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, loadAttempt]);

  if (authLoading) return <Splash />;
  if (!session) return <Auth />;
  if (dataError) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-4 text-center"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Dumbbell size={28} style={{ color: 'var(--brand)' }} />
      <h1 className="font-semibold">Não foi possível carregar seus dados</h1>
      <p className="text-sm" role="alert" style={{ color: 'var(--text-dim)' }}>{dataError}</p>
      <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}
        className="rounded-xl px-5 py-2.5 text-sm font-medium"
        style={{ background: 'var(--brand)', color: 'white' }}>Tentar novamente</button>
    </div>
  );
  if (!dataReady) return <Splash />;

  return (
    <BrowserRouter>
      {usingLocalCopy && (
        <div role="status" className="p-3 text-center text-xs"
          style={{ background: 'var(--surface-2)', color: 'var(--warn)' }}>
          Sem conexão com os dados online. Mostrando a última cópia local (sem fotos).
          <button type="button" className="ml-2 underline" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Reconectar
          </button>
        </div>
      )}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/treinos" element={<Workouts />} />
          <Route path="/treinos/:workoutId" element={<WorkoutEditor />} />
          <Route path="/historico" element={<History />} />
          <Route path="/exercicio/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/evolucao" element={<Progress />} />
          <Route path="/medidas" element={<BodyStats />} />
          <Route path="/musculos" element={<MuscleMap />} />
          <Route path="/cardio" element={<Cardio />} />
          <Route path="/programas" element={<ProgramLibrary />} />
          <Route path="/treinador" element={<AiCoach />} />
          <Route path="/sessao/:sessionId" element={<SessionExecution />} />
        </Route>
        <Route path="/sessao/:sessionId/editar" element={<SessionEditor />} />
      </Routes>
    </BrowserRouter>
  );
}
