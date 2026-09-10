import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ProfileInfo {
  name: string;
  emoji: string | null;
}

/** Busca o nome/emoji do usuário logado (tabela `profiles`), pra exibir no cabeçalho. */
export function useProfile(userId: string | undefined): ProfileInfo | null {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('name, emoji')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Falha ao carregar perfil:', error);
          return;
        }
        if (data) setProfile({ name: data.name, emoji: data.emoji });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return profile;
}
