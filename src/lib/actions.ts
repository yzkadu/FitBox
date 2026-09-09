import { store, uid } from './storage';
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
} from '../types';

// ---------- Exercises ----------

export function addCustomExercise(name: string, muscleGroup: MuscleGroup): Exercise {
  const exercise: Exercise = { id: uid(), name, muscleGroup, custom: true };
  store.update((d) => {
    d.exercises.push(exercise);
  });
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
  return workout;
}

export function updateWorkout(workoutId: string, patch: Partial<Pick<Workout, 'name' | 'emoji' | 'archived'>>) {
  store.update((d) => {
    const w = d.workouts.find((w) => w.id === workoutId);
    if (w) Object.assign(w, patch);
  });
}

export function deleteWorkout(workoutId: string) {
  store.update((d) => {
    d.workouts = d.workouts.filter((w) => w.id !== workoutId);
  });
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
}

export function removeExerciseFromWorkout(workoutId: string, entryId: string) {
  store.update((d) => {
    const w = d.workouts.find((w) => w.id === workoutId);
    if (!w) return;
    w.exercises = w.exercises.filter((e) => e.id !== entryId).map((e, i) => ({ ...e, order: i }));
  });
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
}

// ---------- Sessions (workout execution / log) ----------

export function startSession(workout: Workout): Session {
  const session: Session = {
    id: uid(),
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exercises: workout.exercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((we) => ({
        id: uid(),
        exerciseId: we.exerciseId,
        sets: Array.from({ length: we.targetSets }).map((_, i) => ({
          id: uid(),
          setNumber: i + 1,
          weight: 0,
          reps: 0,
          completed: false,
        })),
      })),
  };
  store.update((d) => {
    d.sessions.push(session);
    d.activeSessionId = session.id;
  });
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
}

export function updateSet(sessionId: string, sessionExerciseId: string, setId: string, patch: Partial<SetLog>) {
  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    const se = s?.exercises.find((e) => e.id === sessionExerciseId);
    const set = se?.sets.find((st) => st.id === setId);
    if (set) Object.assign(set, patch);
  });
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
}

export function removeSetFromSessionExercise(sessionId: string, sessionExerciseId: string, setId: string) {
  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    const se = s?.exercises.find((e) => e.id === sessionExerciseId);
    if (!se) return;
    se.sets = se.sets.filter((st) => st.id !== setId).map((st, i) => ({ ...st, setNumber: i + 1 }));
  });
}

export function finishSession(sessionId: string) {
  store.update((d) => {
    const s = d.sessions.find((s) => s.id === sessionId);
    if (!s) return;
    s.finishedAt = new Date().toISOString();
    s.durationSeconds = Math.round((Date.parse(s.finishedAt) - Date.parse(s.startedAt)) / 1000);
    // drop sets never touched (0 reps and not completed) to keep history clean
    s.exercises.forEach((se) => {
      se.sets = se.sets.filter((st) => st.completed || st.reps > 0 || st.weight > 0);
    });
    s.exercises = s.exercises.filter((se) => se.sets.length > 0);
    if (d.activeSessionId === sessionId) d.activeSessionId = null;
  });
}

export function discardSession(sessionId: string) {
  store.update((d) => {
    d.sessions = d.sessions.filter((s) => s.id !== sessionId);
    if (d.activeSessionId === sessionId) d.activeSessionId = null;
  });
}

export function deleteSession(sessionId: string) {
  store.update((d) => {
    d.sessions = d.sessions.filter((s) => s.id !== sessionId);
    if (d.activeSessionId === sessionId) d.activeSessionId = null;
  });
}

// ---------- Body measurements & photos ----------

export function addMeasurement(m: Omit<BodyMeasurement, 'id'>): BodyMeasurement {
  const measurement: BodyMeasurement = { id: uid(), ...m };
  store.update((d) => {
    d.measurements.push(measurement);
    d.measurements.sort((a, b) => a.date.localeCompare(b.date));
  });
  return measurement;
}

export function deleteMeasurement(id: string) {
  store.update((d) => {
    d.measurements = d.measurements.filter((m) => m.id !== id);
  });
}

export function addPhoto(p: Omit<BodyPhoto, 'id'>): BodyPhoto {
  const photo: BodyPhoto = { id: uid(), ...p };
  store.update((d) => {
    d.photos.push(photo);
    d.photos.sort((a, b) => a.date.localeCompare(b.date));
  });
  return photo;
}

export function deletePhoto(id: string) {
  store.update((d) => {
    d.photos = d.photos.filter((p) => p.id !== id);
  });
}
