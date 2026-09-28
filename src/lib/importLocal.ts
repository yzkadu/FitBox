// Antes do login existir, os dados ficavam salvos no navegador (localStorage),
// em um sistema de "perfis" locais. Este módulo detecta esses dados antigos e
// oferece importá-los para a conta recém-criada no Supabase.

import type { AppData, Profile } from '../types';
import { supabase } from './supabaseClient';

export interface BackupCounts {
  workouts: number;
  sessions: number;
  measurements: number;
  photos: number;
  cardioLogs: number;
}

export interface LocalBackup {
  profileId: string;
  profile: Profile;
  data: AppData;
  counts: BackupCounts;
}

const IMPORTED_MARKER_PREFIX = 'fitbox.imported.v1.';

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

function countsFor(data: AppData): BackupCounts {
  return {
    workouts: data.workouts.length,
    sessions: data.sessions.length,
    measurements: data.measurements.length,
    photos: data.photos.length,
    cardioLogs: data.cardioLogs.length,
  };
}

function isAlreadyImported(profileId: string): boolean {
  try {
    return localStorage.getItem(`${IMPORTED_MARKER_PREFIX}${profileId}`) === 'true';
  } catch {
    return false;
  }
}

/** Marca um backup local como já importado, pra não ficar oferecendo de novo no
 * próximo login. O dado local em si nunca é apagado (mantido como cópia de
 * segurança) — só paramos de mostrar o banner de importação pra esse perfil. */
export function markImported(profileId: string): void {
  try {
    localStorage.setItem(`${IMPORTED_MARKER_PREFIX}${profileId}`, 'true');
  } catch {
    // localStorage indisponível (modo privado etc.) — sem problema, a importação
    // em si já foi concluída, só o banner pode reaparecer no próximo login.
  }
}

export function findLocalBackups(): LocalBackup[] {
  const results: LocalBackup[] = [];

  const registry = safeParse<{ profiles: Profile[] }>(localStorage.getItem('fitbox.profiles.v1'));
  for (const profile of registry?.profiles ?? []) {
    if (isAlreadyImported(profile.id)) continue;
    const data = safeParse<AppData>(localStorage.getItem(`fitbox.data.v1.${profile.id}`));
    if (data && hasContent(data)) {
      results.push({ profileId: profile.id, profile, data, counts: countsFor(data) });
    }
  }

  // Formato bem antigo, de antes do sistema de múltiplos perfis existir.
  if (!isAlreadyImported('legacy')) {
    const legacy = safeParse<AppData>(localStorage.getItem('fitbox.data.v1'));
    if (legacy && hasContent(legacy)) {
      results.push({
        profileId: 'legacy',
        profile: { id: 'legacy', name: 'Dados salvos neste navegador', createdAt: '' },
        data: legacy,
        counts: countsFor(legacy),
      });
    }
  }

  return results;
}

/** Baixa o backup local como um arquivo .json — útil como cópia de segurança
 * antes de importar, ou pra quem prefere não importar agora. */
export function exportBackupAsJson(backup: LocalBackup): void {
  const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = backup.profile.name.replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase() || backup.profileId;
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitbox-backup-${safeName}-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importBackupToAccount(userId: string, data: AppData): Promise<void> {
  // onConflict: 'id' + ignoreDuplicates torna a importação idempotente — se o
  // usuário tentar de novo depois de uma falha parcial (ou clicar "Importar"
  // duas vezes), registros já importados não duplicam nem quebram.
  const customExercises = data.exercises.filter((e) => e.custom);
  if (customExercises.length) {
    const { error } = await supabase
      .from('custom_exercises')
      .upsert(
        customExercises.map((e) => ({ id: e.id, user_id: userId, name: e.name, muscle_group: e.muscleGroup })),
        { onConflict: 'id', ignoreDuplicates: true },
      );
    if (error) throw error;
  }

  if (data.workouts.length) {
    const { error } = await supabase.from('workouts').upsert(
      data.workouts.map((w) => ({
        id: w.id,
        user_id: userId,
        name: w.name,
        emoji: w.emoji,
        archived: w.archived ?? false,
        exercises: w.exercises,
        created_at: w.createdAt,
      })),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (error) throw error;
  }

  if (data.sessions.length) {
    const { error } = await supabase.from('sessions').upsert(
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
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (error) throw error;
  }

  if (data.measurements.length) {
    const { error } = await supabase.from('measurements').upsert(
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
        arm_left_cm: m.armLeftCm,
        arm_right_cm: m.armRightCm,
        thigh_left_cm: m.thighLeftCm,
        thigh_right_cm: m.thighRightCm,
        calf_left_cm: m.calfLeftCm,
        calf_right_cm: m.calfRightCm,
        forearm_left_cm: m.forearmLeftCm,
        forearm_right_cm: m.forearmRightCm,
        notes: m.notes,
      })),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (error) throw error;
  }

  if (data.photos.length) {
    const { error } = await supabase
      .from('photos')
      .upsert(
        data.photos.map((p) => ({ id: p.id, user_id: userId, date: p.date, data_url: p.dataUrl, label: p.label })),
        { onConflict: 'id', ignoreDuplicates: true },
      );
    if (error) throw error;
  }

  if (data.cardioLogs.length) {
    const { error } = await supabase.from('cardio_logs').upsert(
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
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (error) throw error;
  }

  if (Object.keys(data.weeklySchedule).length) {
    const { error } = await supabase.from('weekly_schedule').upsert({ user_id: userId, schedule: data.weeklySchedule });
    if (error) throw error;
  }

  if (data.weightGoal) {
    const { error } = await supabase.from('weight_goal').upsert({ user_id: userId, goal: data.weightGoal });
    if (error) throw error;
  }
}
