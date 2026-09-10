import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Workouts } from './pages/Workouts';
import { WorkoutEditor } from './pages/WorkoutEditor';
import { SessionExecution } from './pages/SessionExecution';
import { History } from './pages/History';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { Progress } from './pages/Progress';
import { BodyStats } from './pages/BodyStats';
import { Cardio } from './pages/Cardio';
import { Auth } from './pages/Auth';
import { useAuth } from './hooks/useAuth';
import { store } from './lib/storage';
import { applyProgramTemplate } from './lib/seedPrograms';
import type { ProgramTemplateId } from './lib/seedPrograms';
import { takePendingTemplate } from './lib/pendingTemplate';

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

  useEffect(() => {
    if (!session) {
      store.clear();
      setDataReady(false);
      return;
    }
    let cancelled = false;
    setDataReady(false);
    store.loadForUser(session.user.id).then(() => {
      if (cancelled) return;
      const snapshot = store.getSnapshot();
      const isEmpty = snapshot.workouts.length === 0 && Object.keys(snapshot.weeklySchedule).length === 0;
      // Preferimos o valor em memória (cadastro sem confirmação de e-mail); se não tiver
      // (fluxo com confirmação de e-mail passou por um reload da página no meio do caminho),
      // caímos pro template salvo nos metadados do usuário no momento do cadastro.
      const metaTemplate = session.user.user_metadata?.template as ProgramTemplateId | undefined;
      const pendingTemplate = takePendingTemplate() ?? metaTemplate ?? null;
      if (isEmpty && pendingTemplate && pendingTemplate !== 'blank') {
        applyProgramTemplate(pendingTemplate);
      }
      setDataReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  if (authLoading) return <Splash />;
  if (!session) return <Auth />;
  if (!dataReady) return <Splash />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/treinos" element={<Workouts />} />
          <Route path="/treinos/:workoutId" element={<WorkoutEditor />} />
          <Route path="/historico" element={<History />} />
          <Route path="/exercicio/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/evolucao" element={<Progress />} />
          <Route path="/medidas" element={<BodyStats />} />
          <Route path="/cardio" element={<Cardio />} />
        </Route>
        <Route path="/sessao/:sessionId" element={<SessionExecution />} />
      </Routes>
    </BrowserRouter>
  );
}
