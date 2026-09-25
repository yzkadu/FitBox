import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { TrainingGoal, ExperienceLevel, WeeklyFrequency, Equipment } from '../lib/onboarding';

export interface ProfileInfo {
  name: string;
  emoji: string | null;
  heightCm: number | null;
  age: number | null;
  gender: 'masculino' | 'feminino' | null;
  initialWeightKg: number | null;
  trainingGoal: TrainingGoal | null;
  experienceLevel: ExperienceLevel | null;
  weeklyFrequency: WeeklyFrequency | null;
  equipment: Equipment | null;
}

/** Busca os dados do usuário logado (tabela `profiles`): nome/emoji pro cabeçalho,
 * altura/idade/sexo/peso inicial pro cálculo automático de IMC, e objetivo/
 * experiência/frequência/equipamento coletados no cadastro (pro Personal Trainer
 * virtual usar mais pra frente). Devolve também `refetch`, pra recarregar depois
 * de editar esses dados (ex: sheet de conta). */
export function useProfile(userId: string | undefined): [ProfileInfo | null, () => void] {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select(
        'name, emoji, height_cm, age, gender, initial_weight_kg, training_goal, experience_level, weekly_frequency, equipment',
      )
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Falha ao carregar perfil:', error);
          return;
        }
        if (data) {
          setProfile({
            name: data.name,
            emoji: data.emoji,
            heightCm: data.height_cm ?? null,
            age: data.age ?? null,
            gender: (data.gender as ProfileInfo['gender']) ?? null,
            initialWeightKg: data.initial_weight_kg ?? null,
            trainingGoal: (data.training_goal as ProfileInfo['trainingGoal']) ?? null,
            experienceLevel: (data.experience_level as ProfileInfo['experienceLevel']) ?? null,
            weeklyFrequency: (data.weekly_frequency as ProfileInfo['weeklyFrequency']) ?? null,
            equipment: (data.equipment as ProfileInfo['equipment']) ?? null,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return [profile, refetch];
}
