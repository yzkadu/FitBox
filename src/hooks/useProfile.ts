import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface ProfileInfo {
  name: string;
  emoji: string | null;
  heightCm: number | null;
  age: number | null;
  gender: 'masculino' | 'feminino' | null;
  initialWeightKg: number | null;
}

/** Busca os dados do usuário logado (tabela `profiles`): nome/emoji pro cabeçalho,
 * e altura/idade/sexo/peso inicial pro cálculo automático de IMC. Devolve também
 * `refetch`, pra recarregar depois de editar esses dados (ex: sheet de conta). */
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
      .select('name, emoji, height_cm, age, gender, initial_weight_kg')
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
