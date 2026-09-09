import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { ProfileGate } from './pages/ProfileGate';
import { useProfiles } from './hooks/useProfiles';

export default function App() {
  const { activeProfileId } = useProfiles();

  if (!activeProfileId) {
    return <ProfileGate />;
  }

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
