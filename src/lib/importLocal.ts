// Antes do login existir, os dados ficavam salvos no navegador (localStorage),
// em um sistema de "perfis" locais. Este módulo detecta esses dados antigos e
// oferece importá-los para a conta recém-criada no Supabase.

import type { AppData, Profile } from '../types';
import { supabase } from './supabaseClient';

export interface LocalBackup {
  profileId: string;
  profile: Profile;
  data: AppData;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function hasContent(data: AppData): boolean {
  return (
    data.workouts.length > 0 || data.sessions.length > 0 || data.measurements.length > 0 || data.cardioLogs.length > 0
  );
}

export function findLocalBackups(): LocalBackup[] {
  const results: LocalBackup[] = [];

  const registry = safeParse<{ profiles: Profile[] }>(localStorage.getItem('fitbox.profiles.v1'));
  for (const profile of registry?.profiles ?? []) {
    const data = safeParse<AppData>(localStorage.getItem(`fitbox.data.v1.${profile.id}`));
    if (data && hasContent(data)) {
      results.push({ profileId: profile.id, profile, data });
    }
  }

  // Formato bem antigo, de antes do sistema de múltiplos perfis existir.
  const legacy = safeParse<AppData>(localStorage.getItem('fitbox.data.v1'));
  if (legacy && hasContent(legacy)) {
    results.push({
      profileId: 'legacy',
      profile: { id: 'legacy', name: 'Dados salvos neste navegador', createdAt: '' },
      data: legacy,
    });
  }

  return results;
}

export async function importBackupToAccount(userId: string, data: AppData): Promise<void> {
  const customExercises = data.exercises.filter((e) => e.custom);
  if (customExercises.length) {
    const { error } = await supabase
      .from('custom_exercises')
      .insert(customExercises.map((e) => ({ id: e.id, user_id: userId, name: e.name, muscle_group: e.muscleGroup })));
    if (error) throw error;
  }

  if (data.workouts.length) {
    const { error } = await supabase.from('workouts').insert(
      data.workouts.map((w) => ({
        id: w.id,
        user_id: userId,
        name: w.name,
        emoji: w.emoji,
        archived: w.archived ?? false,
        exercises: w.exercises,
        created_at: w.createdAt,
      })),
    );
    if (error) throw error;
  }

  if (data.sessions.length) {
    const { error } = await supabase.from('sessions').insert(
      data.sessions.map((s) => ({
        id: s.id,
        user_id: userId,
        workout_id: s.workoutId,
        workout_name: s.workoutName,
        started_at: s.startedAt,
        finished_at: s.finishedAt,
        duration_seconds: s.durationSeconds ?? null,
        exercises: s.exercises,
      })),
    );
    if (error) throw error;
  }

  if (data.measurements.length) {
    const { error } = await supabase.from('measurements').insert(
      data.measurements.map((m) => ({
        id: m.id,
        user_id: userId,
        date: m.date,
        weight_kg: m.weightKg,
        body_fat_pct: m.bodyFatPct,
        chest_cm: m.chestCm,
        waist_cm: m.waistCm,
        hip_cm: m.hipCm,
        arm_cm: m.armCm,
        thigh_cm: m.thighCm,
        calf_cm: m.calfCm,
        notes: m.notes,
      })),
    );
    if (error) throw error;
  }

  if (data.photos.length) {
    const { error } = await supabase
      .from('photos')
      .insert(data.photos.map((p) => ({ id: p.id, user_id: userId, date: p.date, data_url: p.dataUrl, label: p.label })));
    if (error) throw error;
  }

  if (data.cardioLogs.length) {
    const { error } = await supabase.from('cardio_logs').insert(
      data.cardioLogs.map((c) => ({
        id: c.id,
        user_id: userId,
        date: c.date,
        type: c.type,
        duration_min: c.durationMin,
        distance_km: c.distanceKm,
        avg_heart_rate: c.avgHeartRate,
        rpe: c.rpe,
        notes: c.notes,
      })),
    );
    if (error) throw error;
  }

  if (Object.keys(data.weeklySchedule).length) {
    const { error } = await supabase.from('weekly_schedule').upsert({ user_id: userId, schedule: data.weeklySchedule });
    if (error) throw error;
  }
}
