import { store, uid } from './storage';
import { supabase } from './supabaseClient';
import { getSuggestedStartingPoint } from './coach';
import type {
  Workout,
  WorkoutExercise,
  Exercise,
  Session,
  SessionExercise,
  SetLog,
  BodyMeasurement,
  BodyPhoto,
  MuscleGroup,
  CardioLog,
  Weekday,
  DaySchedule,
} from '../types';

// Toda ação muda o estado local na hora (otimista, pra UI responder instantaneamente)
// e dispara, em segundo plano, a gravação correspondente no Supabase. Erros de rede
// só são logados no console — a gravação é "best effort", como era com localStorage.

function logIfError(label: string) {
  return ({ error }: { error: unknown }) => {
    if (error) console.error(`Falha ao sincronizar (${label}):`, error);
  };
}

function requireUserId(): string | null {
  const userId = store.getUserId();
  if (!userId) console.warn('Tentativa de gravar dados sem usuário logado.');
  return userId;
}

// Como cada ação dispara sua própria chamada de rede, uma escrita "insert" (criar
// treino/sessão) e uma escrita "update" logo em seguida (ex: adicionar exercícios
// num treino recém-criado, como acontece nos templates de programa) podem chegar
// ao servidor fora de ordem. Estes mapas guardam a promise do insert de cada
// linha para as escritas seguintes daquela mesma linha aguardarem antes de rodar.
const pendingWorkoutInserts = new Map<string, PromiseLike<unknown>>();
const pendingSessionInserts = new Map<string, PromiseLike<unknown>>();

/** Reenvia o array de exercícios (jsonb) inteiro de um treino para o Supabase. */
async function syncWorkoutExercises(workoutId: string) {
  const userId = requireUserId();
  if (!userId) return;
  await pendingWorkoutInserts.get(workoutId);
  const workout = store.getSnapshot().workouts.find((w) => w.id === workoutId);
  if (!workout) return;
  supabase.from('workouts').update({ exercises: workout.exercises }).eq('id', workoutId).then(logIfError('workouts.exercises'));
}

/** Reenvia o array de exercícios/séries (jsonb) inteiro de uma sessão para o Supabase. */
async function syncSessionExercises(sessionId: string) {
  const userId = requireUserId();
  if (!userId) return;
  await pendingSessionInserts.get(sessionId);
  const session = store.getSnapshot().sessions.find((s) => s.id === sessionId);
  if (!session) return;
  supabase.from('sessions').update({ exercises: session.exercises }).eq('id', sessionId).then(logIfError('sessions.exercises'));
}

function syncWeeklySchedule() {
  const userId = requireUserId();
  if (!userId) return;
  const schedule = store.getSnapshot().weeklySchedule;
  supabase.from('weekly_schedule').upsert({ user_id: userId, schedule }).then(logIfError('weekly_schedule'));
}

// ---------- Exercises ----------

export function addCustomExercise(name: string, muscleGroup: MuscleGroup): Exercise {
  const exercise: Exercise = { id: uid(), name, muscleGroup, custom: true };
  store.update((d) => {
    d.exercises.push(exercise);
  });
  const userId = requireUserId();
  if (userId) {
    supabase
      .from('custom_exercises')
      .insert({ id: exercise.id, user_id: userId, name, muscle_group: muscleGroup })
      .then(logIfError('custom_exercises.insert'));
  }
  return exercise;
}

// ---------- Workouts (templates) ----------

export function createWorkout(name: string, emoji?: string): Workout {
  const workout: Workout = {
    id: uid(),
    name,
    emoji,
    exercises: [],
    createdAt: new Date().toISOString(),
  };
  store.update((d) => {
    d.workouts.push(workout);
  });
  const userId = requireUserId();
  if (userId) {
    const insertPromise = supabase
      .from('workouts')
      .insert({
        id: workout.id,
        user_id: userId,
        name,
        emoji,
        exercises: [],
        archived: false,
        created_at: workout.createdAt,
      })
      .then(logIfError('workouts.insert'));
    pendingWorkoutInserts.set(workout.id, insertPromise);
  }
  return workout;
}

export async function updateWorkout(workoutId: string, patch: Partial<Pick<Workout, 'name' | 'emoji' | 'archived'>>) {
  store.update((d) => {
    const w = d.workouts.find((w) => w.id === workoutId);
    if (w) Object.assign(w, patch);
  });
  const userId = requireUserId();
  if (userId) {
    await pendingWorkoutInserts.get(workoutId);
    supabase.from('workouts').update(patch).eq('id', workoutId).then(logIfError('workouts.update'));
  }
}

export async function deleteWorkout(workoutId: string) {
  store.update((d) => {
    d.workouts = d.workouts.filter((w) => w.id !== workoutId);
  });
  const userId = requireUserId();
  if (userId) {
    await pendingWorkoutInserts.get(workoutId);
    supabase.from('workouts').delete().eq('id', workoutId).then(logIfError('workouts.delete'));
  }
}

export function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  targetSets = 3,
  targetReps = '10-12',
): void {
  store.update((d) => {
    const w = d.workouts.find((w) => w.id === workoutId);
    if (!w) return;
    const entry: WorkoutExercise = {
      id: uid(),
      exerciseId,
      targetSets,
      targetReps,
      order: w.exercises.length,
    };
    w.exercises.push(entry);
  });
  syncWorkoutExercises(workoutId);
}

export function updateWorkoutExercise(
  workoutId: string,
  entryId: string,
  patch: Partial<Pick<WorkoutExercise, 'targetSets' | 'targetReps' | 'restSeconds' | 'notes'>>,
) {
  store.update((d) => {
    const w = d.workouts.find((w) => w.id === workoutId);
    const entry = w?.exercises.find((e) => e.id === entryId);
    if (entry) Object.assign(entry, patch);
  });
  syncWorkoutExercises(workoutId);
}

export function removeExerciseFromWorkout(workoutId: string, entryId: string) {
  store.update((d) => {
    const w = d.workouts.find((w) => w.id === workoutId);
    if (!w) return;
    w.exercises = w.exercises.filter((e) => e.id !== entryId).map((e, i) => ({ ...e, order: i }));
  });
  syncWorkoutExercises(workoutId);
}

export function reorderWorkoutExercises(workoutId: string, orderedEntryIds: string[]) {
  store.update((d) => {
    const w = d.workouts.find((w) => w.id === workoutId);
    if (!w) return;
    const byId = new Map(w.exercises.map((e) => [e.id, e]));
    w.exercises = orderedEntryIds
      .map((id, i) => {
        const e = byId.get(id);
        return e ? { ...e, order: i } : null;
      })
      .filter((e): e is WorkoutExercise => e !== null);
  });
  syncWorkoutExercises(workoutId);
}

// ---------- Sessions (workout execution / log) ----------

export function startSession(workout: Workout): Session {
  const pastSessions = store.getSnapshot().sessions;
  const session: Session = {
    id: uid(),
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exercises: workout.exercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((we) => {
        // Pré-preenche com a sugestão do treinador virtual (progressão de carga
        // baseada no histórico), quando existir, para agilizar o registro.
        const suggestion = getSuggestedStartingPoint(pastSessions, we.exerciseId);
        return {
          id: uid(),
          exerciseId: we.exerciseId,
          // Só o peso é pré-preenchido (ponto de partida sugerido); as reps ficam
          // em branco até o usuário realmente registrar o que fez na série, para
          // não gravar no histórico uma série que não foi executada.
          sets: Array.from({ length: we.targetSets }).map((_, i) => ({
            id: uid(),
            setNumber: i + 1,
            weight: suggestion?.weight ?? 0,
            reps: 0,
            completed: false,
          })),
        };
      }),
  };
  store.update((d) => {
    d.sessions.push(session);
    d.activeSessionId = session.id;
  });
  const userId = requireUserId();
  if (userId) {
    // Espera o treino de origem já ter sido gravado (caso tenha acabado de ser
    // criado agora mesmo) antes de gravar a sessão, que referencia esse treino.
    const insertPromise = (async () => {
      await pendingWorkoutInserts.get(workout.id);
      return supabase
        .from('sessions')
        .insert({
          id: session.id,
          user_id: userId,
          workout_id: session.workoutId,
          workout_name: session.workoutName,
          started_at: session.startedAt,
          finished_at: null,
          exercises: session.exercises,
        })
        .then(logIfError('sessions.insert'));
    })();
    pendingSessionInserts.set(session.id, insertPromise);
  }
  return session;
}

export function startAdhocSession(name: string): Session {
  const session: Session = {
    id: uid(),
    workoutId: null,
    workoutName: name,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exercises: [],
  };
  store.update((d) => {
    d.sessions.push(session);
    d.activeSessionId = session.id;
  });
  const userId = requireUserId();
  if (userId) {
    const insertPromise = supabase
      .from('sessions')
      .insert({
        id: session.id,
        user_id: userId,
        workout_id: null,
        workout_name: session.workoutName,
        started_at: session.startedAt,
        finished_at: null,
        exercises: [],
      })
      .then(logIfError('sessions.insert'));
    pendingSessionInserts.set(session.id, insertPromise);
  }
  return session;
}

export function addExerciseToSession(sessionId: string, exerciseId: string, targetSets = 3) {
  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    if (!s) return;
    const entry: SessionExercise = {
      id: uid(),
      exerciseId,
      sets: Array.from({ length: targetSets }).map((_, i) => ({
        id: uid(),
        setNumber: i + 1,
        weight: 0,
        reps: 0,
        completed: false,
      })),
    };
    s.exercises.push(entry);
  });
  syncSessionExercises(sessionId);
}

export function updateSet(sessionId: string, sessionExerciseId: string, setId: string, patch: Partial<SetLog>) {
  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    const se = s?.exercises.find((e) => e.id === sessionExerciseId);
    const set = se?.sets.find((st) => st.id === setId);
    if (set) Object.assign(set, patch);
  });
  syncSessionExercises(sessionId);
}

export function addSetToSessionExercise(sessionId: string, sessionExerciseId: string) {
  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    const se = s?.exercises.find((e) => e.id === sessionExerciseId);
    if (!se) return;
    const last = se.sets[se.sets.length - 1];
    const newSet: SetLog = {
      id: uid(),
      setNumber: se.sets.length + 1,
      weight: last?.weight ?? 0,
      reps: last?.reps ?? 0,
      completed: false,
    };
    se.sets.push(newSet);
  });
  syncSessionExercises(sessionId);
}

export function removeSetFromSessionExercise(sessionId: string, sessionExerciseId: string, setId: string) {
  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    const se = s?.exercises.find((e) => e.id === sessionExerciseId);
    if (!se) return;
    se.sets = se.sets.filter((st) => st.id !== setId).map((st, i) => ({ ...st, setNumber: i + 1 }));
  });
  syncSessionExercises(sessionId);
}

export function finishSession(sessionId: string, rpe?: number) {
  let finishedAt = '';
  let durationSeconds = 0;
  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    if (!s) return;
    s.finishedAt = new Date().toISOString();
    s.durationSeconds = Math.round((Date.parse(s.finishedAt) - Date.parse(s.startedAt)) / 1000);
    if (rpe != null) s.rpe = rpe;
    // Uma série só conta como realizada se tiver reps registradas (ou estiver
    // marcada como concluída) — peso sozinho pode ser só o valor sugerido pelo
    // treinador virtual, pré-preenchido mas nunca executado.
    s.exercises.forEach((se) => {
      se.sets = se.sets.filter((st) => st.completed || st.reps > 0);
    });
    s.exercises = s.exercises.filter((se) => se.sets.length > 0);
    if (d.activeSessionId === sessionId) d.activeSessionId = null;
    finishedAt = s.finishedAt;
    durationSeconds = s.durationSeconds;
  });
  const userId = requireUserId();
  if (userId) {
    (async () => {
      await pendingSessionInserts.get(sessionId);
      const session = store.getSnapshot().sessions.find((s) => s.id === sessionId);
      supabase
        .from('sessions')
        .update({
          finished_at: finishedAt,
          duration_seconds: durationSeconds,
          exercises: session?.exercises ?? [],
          rpe: session?.rpe ?? null,
        })
        .eq('id', sessionId)
        .then(logIfError('sessions.finish'));
    })();
  }
}

export async function discardSession(sessionId: string) {
  store.update((d) => {
    d.sessions = d.sessions.filter((s) => s.id !== sessionId);
    if (d.activeSessionId === sessionId) d.activeSessionId = null;
  });
  const userId = requireUserId();
  if (userId) {
    await pendingSessionInserts.get(sessionId);
    supabase.from('sessions').delete().eq('id', sessionId).then(logIfError('sessions.delete'));
  }
}

export async function deleteSession(sessionId: string) {
  store.update((d) => {
    d.sessions = d.sessions.filter((s) => s.id !== sessionId);
    if (d.activeSessionId === sessionId) d.activeSessionId = null;
  });
  const userId = requireUserId();
  if (userId) {
    await pendingSessionInserts.get(sessionId);
    supabase.from('sessions').delete().eq('id', sessionId).then(logIfError('sessions.delete'));
  }
}

// ---------- Body measurements & photos ----------

export function addMeasurement(m: Omit<BodyMeasurement, 'id'>): BodyMeasurement {
  const measurement: BodyMeasurement = { id: uid(), ...m };
  store.update((d) => {
    d.measurements.push(measurement);
    d.measurements.sort((a, b) => a.date.localeCompare(b.date));
  });
  const userId = requireUserId();
  if (userId) {
    supabase
      .from('measurements')
      .insert({
        id: measurement.id,
        user_id: userId,
        date: measurement.date,
        weight_kg: measurement.weightKg,
        body_fat_pct: measurement.bodyFatPct,
        chest_cm: measurement.chestCm,
        waist_cm: measurement.waistCm,
        hip_cm: measurement.hipCm,
        arm_cm: measurement.armCm,
        thigh_cm: measurement.thighCm,
        calf_cm: measurement.calfCm,
        notes: measurement.notes,
      })
      .then(logIfError('measurements.insert'));
  }
  return measurement;
}

export function deleteMeasurement(id: string) {
  store.update((d) => {
    d.measurements = d.measurements.filter((m) => m.id !== id);
  });
  const userId = requireUserId();
  if (userId) {
    supabase.from('measurements').delete().eq('id', id).then(logIfError('measurements.delete'));
  }
}

export function addPhoto(p: Omit<BodyPhoto, 'id'>): BodyPhoto {
  const photo: BodyPhoto = { id: uid(), ...p };
  store.update((d) => {
    d.photos.push(photo);
    d.photos.sort((a, b) => a.date.localeCompare(b.date));
  });
  const userId = requireUserId();
  if (userId) {
    supabase
      .from('photos')
      .insert({ id: photo.id, user_id: userId, date: photo.date, data_url: photo.dataUrl, label: photo.label })
      .then(logIfError('photos.insert'));
  }
  return photo;
}

export function deletePhoto(id: string) {
  store.update((d) => {
    d.photos = d.photos.filter((p) => p.id !== id);
  });
  const userId = requireUserId();
  if (userId) {
    supabase.from('photos').delete().eq('id', id).then(logIfError('photos.delete'));
  }
}

// ---------- Cardio (treino híbrido: corrida/bike) ----------

export function addCardioLog(log: Omit<CardioLog, 'id'>): CardioLog {
  const entry: CardioLog = { id: uid(), ...log };
  store.update((d) => {
    d.cardioLogs.push(entry);
    d.cardioLogs.sort((a, b) => a.date.localeCompare(b.date));
  });
  const userId = requireUserId();
  if (userId) {
    supabase
      .from('cardio_logs')
      .insert({
        id: entry.id,
        user_id: userId,
        date: entry.date,
        type: entry.type,
        duration_min: entry.durationMin,
        distance_km: entry.distanceKm,
        avg_heart_rate: entry.avgHeartRate,
        rpe: entry.rpe,
        notes: entry.notes,
      })
      .then(logIfError('cardio_logs.insert'));
  }
  return entry;
}

export function deleteCardioLog(id: string) {
  store.update((d) => {
    d.cardioLogs = d.cardioLogs.filter((c) => c.id !== id);
  });
  const userId = requireUserId();
  if (userId) {
    supabase.from('cardio_logs').delete().eq('id', id).then(logIfError('cardio_logs.delete'));
  }
}

// ---------- Programa semanal ----------

export function setDaySchedule(weekday: Weekday, schedule: DaySchedule | null) {
  store.update((d) => {
    if (schedule === null) {
      delete d.weeklySchedule[weekday];
    } else {
      d.weeklySchedule[weekday] = schedule;
    }
  });
  syncWeeklySchedule();
}
