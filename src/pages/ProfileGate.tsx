import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { profileStore } from '../lib/profiles';
import { ProfileForm } from '../components/ProfileForm';
import type { ProgramTemplateId } from '../lib/seedPrograms';

/** Tela cheia mostrada quando não há um perfil ativo: escolher ou criar um. */
export function ProfileGate() {
  const { profiles } = useProfiles();
  const [creating, setCreating] = useState(profiles.length === 0);

  function handleCreate(name: string, emoji: string, template: ProgramTemplateId) {
    profileStore.createProfile(name, emoji, template);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-5 py-10 safe-top safe-bottom" style={{ background: 'var(--bg)' }}>
      <div className="text-center mb-6">
        <p className="text-2xl font-semibold mb-1">FitBox</p>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {profiles.length === 0 ? 'Quem vai treinar?' : creating ? 'Novo perfil' : 'Escolha seu perfil'}
        </p>
      </div>

      {!creating && (
        <div className="flex flex-col gap-2.5 mb-4">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => profileStore.switchProfile(p.id)}
              className="flex items-center gap-3 rounded-2xl p-4 border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <span className="text-2xl">{p.emoji ?? '💪'}</span>
              <span className="font-medium">{p.name}</span>
            </button>
          ))}
          <button
            onClick={() => setCreating(true)}
            className="flex items-center justify-center gap-2 rounded-2xl p-4 text-sm font-medium border-2 border-dashed"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
          >
            <Plus size={16} /> Criar novo perfil
          </button>
        </div>
      )}

      {creating && (
        <ProfileForm
          onSubmit={handleCreate}
          onCancel={profiles.length > 0 ? () => setCreating(false) : undefined}
        />
      )}
    </div>
  );
}
