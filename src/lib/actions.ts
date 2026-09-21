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
  WeightGoal,
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

/** Troca o exercício de um item do treino (ex: agachamento livre -> leg press),
 * mantendo séries/reps/notas/posição — só muda a QUAL exercício aponta. */
export function replaceWorkoutExercise(workoutId: string, entryId: string, newExerciseId: string) {
  store.update((d) => {
    const w = d.workouts.find((w) => w.id === workoutId);
    const entry = w?.exercises.find((e) => e.id === entryId);
    if (entry) entry.exerciseId = newExerciseId;
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

/** Remove um exercício inteiro de uma sessão — durante a execução do treino (a
 * pessoa decidiu não fazer aquele exercício hoje) ou ao editar uma sessão já
 * concluída no Histórico. */
export function removeExerciseFromSession(sessionId: string, sessionExerciseId: string) {
  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    if (!s) return;
    s.exercises = s.exercises.filter((se) => se.id !== sessionExerciseId);
  });
  syncSessionExercises(sessionId);
}

/** Conclui a sessão. Diferente do resto do app (que aplica a mudança local
 * primeiro e sincroniza em segundo plano), aqui a gravação no Supabase é
 * aguardada ANTES de marcar a sessão como concluída localmente: se a gravação
 * falhar (sem internet, coluna faltando por migração pendente, etc.), nada é
 * perdido — a sessão continua ativa com todos os dados intactos, e quem chamou
 * (a tela) pode mostrar o erro e deixar a pessoa tentar de novo. */
export async function finishSession(
  sessionId: string,
  rpe?: number,
  proofPhotoDataUrl?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = store.getSnapshot().sessions.find((s) => s.id === sessionId);
  if (!current) return { ok: false, error: 'Sessão não encontrada.' };

  const finishedAt = new Date().toISOString();
  const durationSeconds = Math.round((Date.parse(finishedAt) - Date.parse(current.startedAt)) / 1000);
  // Uma série só conta como realizada se tiver reps registradas (ou estiver
  // marcada como concluída) — peso sozinho pode ser só o valor sugerido pelo
  // treinador virtual, pré-preenchido mas nunca executado.
  const trimmedExercises = current.exercises
    .map((se) => ({ ...se, sets: se.sets.filter((st) => st.completed || st.reps > 0) }))
    .filter((se) => se.sets.length > 0);

  const userId = requireUserId();
  if (userId) {
    await pendingSessionInserts.get(sessionId);
    const { error } = await supabase
      .from('sessions')
      .update({
        finished_at: finishedAt,
        duration_seconds: durationSeconds,
        exercises: trimmedExercises,
        rpe: rpe ?? null,
        proof_photo_data_url: proofPhotoDataUrl ?? null,
      })
      .eq('id', sessionId);
    if (error) {
      console.error('Falha ao sincronizar (sessions.finish):', error);
      return { ok: false, error: error.message };
    }
  }

  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    if (!s) return;
    s.finishedAt = finishedAt;
    s.durationSeconds = durationSeconds;
    if (rpe != null) s.rpe = rpe;
    if (proofPhotoDataUrl) s.proofPhotoDataUrl = proofPhotoDataUrl;
    s.exercises = trimmedExercises;
    if (d.activeSessionId === sessionId) d.activeSessionId = null;
  });

  return { ok: true };
}

/** Edita duração e/ou RPE de uma sessão já concluída (ex: corrigir um tempo
 * errado depois do fato). Os exercícios/séries de uma sessão concluída já são
 * editáveis diretamente pelas ações acima (updateSet, addSetToSessionExercise,
 * removeSetFromSessionExercise, addExerciseToSession, removeExerciseFromSession
 * — nenhuma delas depende do treino estar em andamento). */
export function updateSessionMeta(sessionId: string, patch: { durationSeconds?: number; rpe?: number | null }) {
  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    if (!s) return;
    if (patch.durationSeconds != null) s.durationSeconds = patch.durationSeconds;
    if ('rpe' in patch) s.rpe = patch.rpe ?? undefined;
  });
  const userId = requireUserId();
  if (!userId) return;
  (async () => {
    await pendingSessionInserts.get(sessionId);
    const dbPatch: Record<string, unknown> = {};
    if (patch.durationSeconds != null) dbPatch.duration_seconds = patch.durationSeconds;
    if ('rpe' in patch) dbPatch.rpe = patch.rpe ?? null;
    supabase.from('sessions').update(dbPatch).eq('id', sessionId).then(logIfError('sessions.updateMeta'));
  })();
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

export function updateMeasurement(id: string, patch: Partial<Omit<BodyMeasurement, 'id'>>) {
  store.update((d) => {
    const m = d.measurements.find((m) => m.id === id);
    if (m) Object.assign(m, patch);
    d.measurements.sort((a, b) => a.date.localeCompare(b.date));
  });
  const userId = requireUserId();
  if (userId) {
    const dbPatch: Record<string, unknown> = {};
    if ('date' in patch) dbPatch.date = patch.date;
    if ('weightKg' in patch) dbPatch.weight_kg = patch.weightKg ?? null;
    if ('bodyFatPct' in patch) dbPatch.body_fat_pct = patch.bodyFatPct ?? null;
    if ('chestCm' in patch) dbPatch.chest_cm = patch.chestCm ?? null;
    if ('waistCm' in patch) dbPatch.waist_cm = patch.waistCm ?? null;
    if ('hipCm' in patch) dbPatch.hip_cm = patch.hipCm ?? null;
    if ('armCm' in patch) dbPatch.arm_cm = patch.armCm ?? null;
    if ('thighCm' in patch) dbPatch.thigh_cm = patch.thighCm ?? null;
    if ('calfCm' in patch) dbPatch.calf_cm = patch.calfCm ?? null;
    if ('notes' in patch) dbPatch.notes = patch.notes ?? null;
    supabase.from('measurements').update(dbPatch).eq('id', id).then(logIfError('measurements.update'));
  }
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
        proof_photo_data_url: entry.proofPhotoDataUrl,
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

// ---------- Meta de peso ----------

export function setWeightGoal(goal: WeightGoal | null) {
  store.update((d) => {
    d.weightGoal = goal;
  });
  const userId = requireUserId();
  if (!userId) return;
  if (goal === null) {
    supabase.from('weight_goal').delete().eq('user_id', userId).then(logIfError('weight_goal.delete'));
  } else {
    supabase.from('weight_goal').upsert({ user_id: userId, goal }).then(logIfError('weight_goal.upsert'));
  }
}
